import * as vscode from 'vscode';
import { FeedbackData } from './feedbackSystem';
import { LearnedPattern } from './patternAdaptationEngine';

// Interface untuk refactoring pattern
export interface RefactoringPattern {
    patternId: string;
    name: string;
    type: RefactoringType;
    language: string;
    trigger: RefactoringTrigger;
    before: CodeStructure;
    after: CodeStructure;
    confidence: number;
    frequency: number;
    userPreference: number; // How much user likes this refactoring (0-1)
    complexity: 'simple' | 'medium' | 'complex';
    benefits: string[];
    examples: RefactoringExample[];
}

export type RefactoringType = 
    | 'extract_method' 
    | 'extract_variable' 
    | 'rename' 
    | 'move_method' 
    | 'inline' 
    | 'change_signature' 
    | 'organize_imports'
    | 'remove_duplication'
    | 'simplify_conditional'
    | 'replace_magic_numbers'
    | 'split_large_class'
    | 'combine_functions';

export interface RefactoringTrigger {
    conditions: string[]; // Code conditions that trigger this refactoring
    codeSmells: string[]; // Code smells that this refactoring fixes
    contextPatterns: string[]; // Context patterns where this is useful
    complexity: number; // Minimum complexity score to trigger
    lineThreshold?: number; // Line count threshold
    parameterThreshold?: number; // Parameter count threshold
}

export interface CodeStructure {
    pattern: string;
    characteristics: string[];
    metrics: {
        lines: number;
        complexity: number;
        parameters?: number;
        nestedLevel?: number;
    };
}

export interface RefactoringExample {
    before: string;
    after: string;
    context: string;
    explanation: string;
    language: string;
}

// Interface untuk refactoring suggestion
export interface RefactoringSuggestion {
    id: string;
    pattern: RefactoringPattern;
    targetCode: string;
    targetRange: vscode.Range;
    priority: 'low' | 'medium' | 'high';
    estimatedBenefit: number;
    reason: string;
    preview: {
        before: string;
        after: string;
    };
}

// Interface untuk user refactoring behavior
export interface RefactoringBehavior {
    userId: string;
    preferences: { [type in RefactoringType]?: number };
    favoritePatterns: string[];
    avoidedPatterns: string[];
    complexity_preference: 'simple' | 'medium' | 'complex';
    frequency: {
        daily: number;
        weekly: number;
        monthly: number;
    };
    contextualPreferences: {
        [context: string]: RefactoringType[];
    };
}

export class RefactoringPatternDetector {
    private context: vscode.ExtensionContext;
    private refactoringPatterns: Map<string, RefactoringPattern> = new Map();
    private userBehavior: RefactoringBehavior;
    private recentRefactorings: RefactoringSuggestion[] = [];
    private readonly STORAGE_KEY_PATTERNS = 'codeWhispererRefactoringPatterns';
    private readonly STORAGE_KEY_BEHAVIOR = 'codeWhispererRefactoringBehavior';

    // Predefined refactoring patterns
    private readonly PREDEFINED_PATTERNS: Partial<RefactoringPattern>[] = [
        {
            name: 'Extract Method - Long Function',
            type: 'extract_method',
            language: 'javascript',
            trigger: {
                conditions: ['function_length > 20', 'multiple_responsibilities'],
                codeSmells: ['long_method', 'duplicate_code'],
                contextPatterns: ['function_declaration', 'method_definition'],
                complexity: 0.7,
                lineThreshold: 20
            },
            complexity: 'medium',
            benefits: ['Improved readability', 'Better testability', 'Reduced complexity'],
            examples: [{
                before: 'function processUser(user) {\n  // validation\n  if (!user.email) throw new Error();\n  // processing\n  user.normalized = user.email.toLowerCase();\n  // saving\n  database.save(user);\n}',
                after: 'function processUser(user) {\n  validateUser(user);\n  const normalizedUser = normalizeUser(user);\n  saveUser(normalizedUser);\n}',
                context: 'Long function with multiple responsibilities',
                explanation: 'Split long function into smaller, focused functions',
                language: 'javascript'
            }]
        },
        {
            name: 'Extract Variable - Complex Expression',
            type: 'extract_variable',
            language: 'javascript',
            trigger: {
                conditions: ['complex_expression', 'repeated_calculation'],
                codeSmells: ['magic_numbers', 'complex_conditional'],
                contextPatterns: ['assignment', 'conditional', 'return_statement'],
                complexity: 0.5
            },
            complexity: 'simple',
            benefits: ['Improved readability', 'Easier debugging', 'Self-documenting code'],
            examples: [{
                before: 'if (user.age >= 18 && user.hasLicense && user.violations < 3) {',
                after: 'const isEligibleDriver = user.age >= 18 && user.hasLicense && user.violations < 3;\nif (isEligibleDriver) {',
                context: 'Complex conditional expression',
                explanation: 'Extract complex condition into a well-named variable',
                language: 'javascript'
            }]
        },
        {
            name: 'Replace Magic Numbers',
            type: 'replace_magic_numbers',
            language: 'javascript',
            trigger: {
                conditions: ['magic_numbers_present', 'hardcoded_values'],
                codeSmells: ['magic_numbers'],
                contextPatterns: ['numeric_literal', 'comparison'],
                complexity: 0.3
            },
            complexity: 'simple',
            benefits: ['Better maintainability', 'Clearer intent', 'Easier configuration'],
            examples: [{
                before: 'if (user.age >= 18) { return "adult"; }',
                after: 'const ADULT_AGE = 18;\nif (user.age >= ADULT_AGE) { return "adult"; }',
                context: 'Magic number in conditional',
                explanation: 'Replace magic number with named constant',
                language: 'javascript'
            }]
        },
        {
            name: 'Simplify Conditional',
            type: 'simplify_conditional',
            language: 'javascript',
            trigger: {
                conditions: ['complex_conditional', 'nested_if'],
                codeSmells: ['complex_conditional', 'long_parameter_list'],
                contextPatterns: ['if_statement', 'ternary_operator'],
                complexity: 0.6
            },
            complexity: 'medium',
            benefits: ['Reduced complexity', 'Better readability', 'Fewer bugs'],
            examples: [{
                before: 'if (user !== null) {\n  if (user.isActive) {\n    if (user.hasPermission) {\n      doSomething();\n    }\n  }\n}',
                after: 'if (user?.isActive && user.hasPermission) {\n  doSomething();\n}',
                context: 'Nested conditional statements',
                explanation: 'Combine conditions and use optional chaining',
                language: 'javascript'
            }]
        },
        {
            name: 'Organize Imports',
            type: 'organize_imports',
            language: 'javascript',
            trigger: {
                conditions: ['many_imports', 'unorganized_imports'],
                codeSmells: ['disorganized_imports'],
                contextPatterns: ['import_statement', 'require_statement'],
                complexity: 0.2
            },
            complexity: 'simple',
            benefits: ['Better organization', 'Easier navigation', 'Reduced conflicts'],
            examples: [{
                before: 'import { z } from "z";\nimport { a } from "a";\nimport React from "react";\nimport fs from "fs";',
                after: '// Built-in modules\nimport fs from "fs";\n\n// External libraries\nimport React from "react";\n\n// Local modules\nimport { a } from "a";\nimport { z } from "z";',
                context: 'Unorganized import statements',
                explanation: 'Group and sort imports by type',
                language: 'javascript'
            }]
        }
    ];

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.userBehavior = this.initializeUserBehavior();
        this.loadData();
        this.initializePredefinedPatterns();
    }

    /**
     * Initialize user behavior tracking
     */
    private initializeUserBehavior(): RefactoringBehavior {
        return {
            userId: 'user',
            preferences: {},
            favoritePatterns: [],
            avoidedPatterns: [],
            complexity_preference: 'medium',
            frequency: {
                daily: 0,
                weekly: 0,
                monthly: 0
            },
            contextualPreferences: {}
        };
    }

    /**
     * Initialize predefined refactoring patterns
     */
    private initializePredefinedPatterns(): void {
        for (const pattern of this.PREDEFINED_PATTERNS) {
            const fullPattern: RefactoringPattern = {
                patternId: `predefined_${pattern.type}_${pattern.language}`,
                name: pattern.name!,
                type: pattern.type!,
                language: pattern.language!,
                trigger: pattern.trigger!,
                before: {
                    pattern: 'before_pattern',
                    characteristics: [],
                    metrics: { lines: 0, complexity: 0 }
                },
                after: {
                    pattern: 'after_pattern',
                    characteristics: [],
                    metrics: { lines: 0, complexity: 0 }
                },
                confidence: 0.8,
                frequency: 0,
                userPreference: 0.5,
                complexity: pattern.complexity!,
                benefits: pattern.benefits!,
                examples: pattern.examples!
            };
            
            this.refactoringPatterns.set(fullPattern.patternId, fullPattern);
        }
    }

    /**
     * Analyze code and detect refactoring opportunities
     */
    public async analyzeCodeForRefactoring(
        document: vscode.TextDocument,
        selection?: vscode.Selection
    ): Promise<RefactoringSuggestion[]> {
        const suggestions: RefactoringSuggestion[] = [];
        const text = document.getText(selection);
        const language = document.languageId;
        
        // Analyze different aspects of the code
        const codeMetrics = this.calculateCodeMetrics(text);
        const codeSmells = this.detectCodeSmells(text, language);
        const context = this.analyzeCodeContext(document, selection);
        
        // Check each refactoring pattern
        for (const pattern of this.refactoringPatterns.values()) {
            if (pattern.language === language || pattern.language === 'any') {
                const suggestion = await this.evaluatePattern(
                    pattern,
                    text,
                    codeMetrics,
                    codeSmells,
                    context,
                    document,
                    selection
                );
                
                if (suggestion) {
                    suggestions.push(suggestion);
                }
            }
        }
        
        // Sort by priority and user preference
        return this.prioritizeSuggestions(suggestions);
    }

    /**
     * Calculate code metrics
     */
    private calculateCodeMetrics(code: string): CodeStructure['metrics'] {
        const lines = code.split('\n').length;
        const complexity = this.calculateCyclomaticComplexity(code);
        const parameters = this.countParameters(code);
        const nestedLevel = this.calculateNestingLevel(code);
        
        return {
            lines,
            complexity,
            parameters,
            nestedLevel
        };
    }

    /**
     * Calculate cyclomatic complexity
     */
    private calculateCyclomaticComplexity(code: string): number {
        let complexity = 1; // Base complexity
        
        // Count decision points
        const patterns = [
            /\bif\b/g,
            /\belse\s+if\b/g,
            /\bwhile\b/g,
            /\bfor\b/g,
            /\bswitch\b/g,
            /\bcase\b/g,
            /\bcatch\b/g,
            /\b\?\s*.*?\s*:/g, // Ternary operator
            /\b&&\b/g,
            /\b\|\|\b/g
        ];
        
        for (const pattern of patterns) {
            const matches = code.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        }
        
        return complexity;
    }

    /**
     * Count function parameters
     */
    private countParameters(code: string): number {
        const functionMatches = code.match(/function\s*\w*\s*\(([^)]*)\)/g) || [];
        const arrowMatches = code.match(/\(([^)]*)\)\s*=>/g) || [];
        const methodMatches = code.match(/\w+\s*\(([^)]*)\)\s*{/g) || [];
        
        let maxParams = 0;
        
        [...functionMatches, ...arrowMatches, ...methodMatches].forEach(match => {
            const params = match.match(/\(([^)]*)\)/)?.[1] || '';
            const paramCount = params.split(',').filter(p => p.trim().length > 0).length;
            maxParams = Math.max(maxParams, paramCount);
        });
        
        return maxParams;
    }

    /**
     * Calculate nesting level
     */
    private calculateNestingLevel(code: string): number {
        let maxNesting = 0;
        let currentNesting = 0;
        
        for (const char of code) {
            if (char === '{') {
                currentNesting++;
                maxNesting = Math.max(maxNesting, currentNesting);
            } else if (char === '}') {
                currentNesting--;
            }
        }
        
        return maxNesting;
    }

    /**
     * Detect code smells
     */
    private detectCodeSmells(code: string, language: string): string[] {
        const smells: string[] = [];
        
        // Long method
        if (code.split('\n').length > 20) {
            smells.push('long_method');
        }
        
        // Magic numbers
        if (/\b\d{2,}\b/.test(code) && !/const\s+\w+\s*=\s*\d+/.test(code)) {
            smells.push('magic_numbers');
        }
        
        // Complex conditional
        if (/\(\s*.*\s*&&\s*.*\s*\|\|\s*.*\s*\)/.test(code)) {
            smells.push('complex_conditional');
        }
        
        // Duplicate code (simple detection)
        const lines = code.split('\n');
        const duplicateLines = lines.filter((line, index) => 
            lines.indexOf(line) !== index && line.trim().length > 10
        );
        if (duplicateLines.length > 0) {
            smells.push('duplicate_code');
        }
        
        // Long parameter list
        if (/\w+\s*\([^)]{50,}\)/.test(code)) {
            smells.push('long_parameter_list');
        }
        
        // Deep nesting
        const nestingLevel = this.calculateNestingLevel(code);
        if (nestingLevel > 3) {
            smells.push('deep_nesting');
        }
        
        return smells;
    }

    /**
     * Analyze code context
     */
    private analyzeCodeContext(
        document: vscode.TextDocument,
        selection?: vscode.Selection
    ): string[] {
        const context: string[] = [];
        const text = selection ? document.getText(selection) : document.getText();
        
        // Function context
        if (/function\s+\w+|const\s+\w+\s*=.*=>/. test(text)) {
            context.push('function_declaration');
        }
        
        // Class context
        if (/class\s+\w+/.test(text)) {
            context.push('class_definition');
        }
        
        // Method context
        if (/\w+\s*\([^)]*\)\s*{/.test(text)) {
            context.push('method_definition');
        }
        
        // Import context
        if (/import\s+.*from|require\s*\(/.test(text)) {
            context.push('import_statement');
        }
        
        // Conditional context
        if (/if\s*\(|switch\s*\(/.test(text)) {
            context.push('conditional_statement');
        }
        
        return context;
    }

    /**
     * Evaluate if a pattern applies to the current code
     */
    private async evaluatePattern(
        pattern: RefactoringPattern,
        code: string,
        metrics: CodeStructure['metrics'],
        codeSmells: string[],
        context: string[],
        document: vscode.TextDocument,
        selection?: vscode.Selection
    ): Promise<RefactoringSuggestion | null> {
        const trigger = pattern.trigger;
        let score = 0;
        
        // Check line threshold
        if (trigger.lineThreshold && metrics.lines >= trigger.lineThreshold) {
            score += 0.3;
        }
        
        // Check parameter threshold
        if (trigger.parameterThreshold && metrics.parameters && metrics.parameters >= trigger.parameterThreshold) {
            score += 0.2;
        }
        
        // Check complexity threshold
        if (metrics.complexity >= trigger.complexity * 10) { // Scale complexity
            score += 0.3;
        }
        
        // Check code smells
        const matchingSmells = trigger.codeSmells.filter(smell => codeSmells.includes(smell));
        if (matchingSmells.length > 0) {
            score += 0.2 * matchingSmells.length;
        }
        
        // Check context patterns
        const matchingContexts = trigger.contextPatterns.filter(ctx => context.includes(ctx));
        if (matchingContexts.length > 0) {
            score += 0.1 * matchingContexts.length;
        }
        
        // Apply user preference
        const userPref = this.userBehavior.preferences[pattern.type] || 0.5;
        score *= userPref;
        
        // Check if score is above threshold
        if (score >= 0.5) {
            const suggestion: RefactoringSuggestion = {
                id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                pattern,
                targetCode: code,
                targetRange: selection ? new vscode.Range(selection.start, selection.end) : new vscode.Range(0, 0, 0, 0),
                priority: score > 0.8 ? 'high' : score > 0.6 ? 'medium' : 'low',
                estimatedBenefit: score,
                reason: this.generateReason(pattern, matchingSmells, matchingContexts, metrics),
                preview: await this.generatePreview(pattern, code)
            };
            
            return suggestion;
        }
        
        return null;
    }

    /**
     * Generate reason for refactoring suggestion
     */
    private generateReason(
        pattern: RefactoringPattern,
        matchingSmells: string[],
        matchingContexts: string[],
        metrics: CodeStructure['metrics']
    ): string {
        let reason = `${pattern.name}: `;
        
        if (matchingSmells.length > 0) {
            reason += `Detected ${matchingSmells.join(', ')}. `;
        }
        
        if (metrics.lines > 20) {
            reason += `Function is ${metrics.lines} lines long. `;
        }
        
        if (metrics.complexity > 10) {
            reason += `High complexity (${metrics.complexity}). `;
        }
        
        reason += pattern.benefits.slice(0, 2).join(' and ') + '.';
        
        return reason;
    }

    /**
     * Generate preview of refactoring
     */
    private async generatePreview(pattern: RefactoringPattern, code: string): Promise<{ before: string; after: string }> {
        // For now, return example or simplified preview
        const example = pattern.examples[0];
        if (example) {
            return {
                before: example.before,
                after: example.after
            };
        }
        
        // Generate basic preview based on pattern type
        return this.generateBasicPreview(pattern.type, code);
    }

    /**
     * Generate basic preview based on refactoring type
     */
    private generateBasicPreview(type: RefactoringType, code: string): { before: string; after: string } {
        const preview = { before: code.substring(0, 100) + '...', after: '' };
        
        switch (type) {
            case 'extract_method':
                preview.after = '// Extracted method\nfunction extractedMethod() {\n  // logic here\n}\n\n// Original code\n// calls extractedMethod()';
                break;
            
            case 'extract_variable':
                preview.after = 'const extractedVariable = /* complex expression */;\n// Use extractedVariable instead of complex expression';
                break;
            
            case 'replace_magic_numbers':
                preview.after = 'const MEANINGFUL_CONSTANT = 42;\n// Use MEANINGFUL_CONSTANT instead of magic number';
                break;
            
            case 'organize_imports':
                preview.after = '// Organized imports\n// Built-in modules first\n// External libraries second\n// Local modules last';
                break;
            
            default:
                preview.after = `// Refactored code using ${type}`;
        }
        
        return preview;
    }

    /**
     * Prioritize suggestions based on user preferences and impact
     */
    private prioritizeSuggestions(suggestions: RefactoringSuggestion[]): RefactoringSuggestion[] {
        return suggestions.sort((a, b) => {
            // Priority order
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            
            if (priorityDiff !== 0) return priorityDiff;
            
            // Then by estimated benefit
            return b.estimatedBenefit - a.estimatedBenefit;
        });
    }

    /**
     * Learn from user's refactoring feedback
     */
    public async learnFromRefactoringFeedback(
        suggestion: RefactoringSuggestion,
        feedback: FeedbackData
    ): Promise<void> {
        const pattern = suggestion.pattern;
        
        // Update pattern statistics
        pattern.frequency++;
        
        if (feedback.action === 'accept') {
            pattern.userPreference = Math.min(1, pattern.userPreference + 0.1);
            pattern.confidence = Math.min(1, pattern.confidence + 0.05);
            
            // Update user behavior
            this.userBehavior.preferences[pattern.type] = Math.min(1, 
                (this.userBehavior.preferences[pattern.type] || 0.5) + 0.1
            );
            
            // Add to favorite patterns if high acceptance
            if (pattern.userPreference > 0.8 && !this.userBehavior.favoritePatterns.includes(pattern.patternId)) {
                this.userBehavior.favoritePatterns.push(pattern.patternId);
            }
            
            // Update frequency
            this.userBehavior.frequency.daily++;
            
        } else if (feedback.action === 'reject') {
            pattern.userPreference = Math.max(0, pattern.userPreference - 0.1);
            pattern.confidence = Math.max(0.1, pattern.confidence - 0.05);
            
            // Update user behavior
            this.userBehavior.preferences[pattern.type] = Math.max(0, 
                (this.userBehavior.preferences[pattern.type] || 0.5) - 0.1
            );
            
            // Add to avoided patterns if frequently rejected
            if (pattern.userPreference < 0.2 && !this.userBehavior.avoidedPatterns.includes(pattern.patternId)) {
                this.userBehavior.avoidedPatterns.push(pattern.patternId);
            }
        }
        
        // Learn contextual preferences
        const context = feedback.context.fileName ? this.getFileContext(feedback.context.fileName) : 'general';
        if (!this.userBehavior.contextualPreferences[context]) {
            this.userBehavior.contextualPreferences[context] = [];
        }
        
        const contextPrefs = this.userBehavior.contextualPreferences[context];
        if (feedback.action === 'accept' && contextPrefs && !contextPrefs.includes(pattern.type)) {
            contextPrefs.push(pattern.type);
        }
        
        await this.saveData();
    }

    /**
     * Get file context for contextual learning
     */
    private getFileContext(fileName: string): string {
        const name = fileName.toLowerCase();
        
        if (name.includes('test') || name.includes('spec')) return 'test';
        if (name.includes('component')) return 'component';
        if (name.includes('service')) return 'service';
        if (name.includes('util') || name.includes('helper')) return 'utility';
        if (name.includes('config')) return 'config';
        
        return 'general';
    }

    /**
     * Get user's refactoring insights
     */
    public getRefactoringInsights(): {
        favoriteRefactorings: RefactoringType[];
        avoidedRefactorings: RefactoringType[];
        mostUsedPatterns: { pattern: string; frequency: number }[];
        contextualPreferences: { [context: string]: RefactoringType[] };
        improvementSuggestions: string[];
    } {
        // Get favorite refactorings
        const favoriteRefactorings = Object.entries(this.userBehavior.preferences)
            .filter(([_, score]) => score > 0.7)
            .map(([type, _]) => type as RefactoringType);
        
        // Get avoided refactorings
        const avoidedRefactorings = Object.entries(this.userBehavior.preferences)
            .filter(([_, score]) => score < 0.3)
            .map(([type, _]) => type as RefactoringType);
        
        // Get most used patterns
        const mostUsedPatterns = Array.from(this.refactoringPatterns.values())
            .filter(p => p.frequency > 0)
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 10)
            .map(p => ({ pattern: p.name, frequency: p.frequency }));
        
        // Generate improvement suggestions
        const improvementSuggestions = this.generateImprovementSuggestions();
        
        return {
            favoriteRefactorings,
            avoidedRefactorings,
            mostUsedPatterns,
            contextualPreferences: this.userBehavior.contextualPreferences,
            improvementSuggestions
        };
    }

    /**
     * Generate improvement suggestions for user
     */
    private generateImprovementSuggestions(): string[] {
        const suggestions: string[] = [];
        
        // Check if user avoids certain beneficial refactorings
        const avoidedButUseful = ['extract_method', 'extract_variable', 'simplify_conditional'];
        for (const refactoring of avoidedButUseful) {
            const preference = this.userBehavior.preferences[refactoring as RefactoringType];
            if (preference !== undefined && preference < 0.3) {
                suggestions.push(`Consider trying ${refactoring} refactorings - they can significantly improve code readability`);
            }
        }
        
        // Check refactoring frequency
        if (this.userBehavior.frequency.weekly < 2) {
            suggestions.push('Regular refactoring can improve code quality - try to refactor at least 2-3 times per week');
        }
        
        // Check complexity preference
        if (this.userBehavior.complexity_preference === 'simple') {
            suggestions.push('Try some medium complexity refactorings to further improve your code structure');
        }
        
        return suggestions;
    }

    /**
     * Create new refactoring pattern from user behavior
     */
    public async createCustomPattern(
        name: string,
        type: RefactoringType,
        language: string,
        example: RefactoringExample
    ): Promise<string> {
        const patternId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const pattern: RefactoringPattern = {
            patternId,
            name,
            type,
            language,
            trigger: {
                conditions: ['user_defined'],
                codeSmells: [],
                contextPatterns: [],
                complexity: 0.5
            },
            before: {
                pattern: example.before,
                characteristics: [],
                metrics: this.calculateCodeMetrics(example.before)
            },
            after: {
                pattern: example.after,
                characteristics: [],
                metrics: this.calculateCodeMetrics(example.after)
            },
            confidence: 0.7,
            frequency: 0,
            userPreference: 0.8, // Start high for user-created patterns
            complexity: 'medium',
            benefits: ['User-defined improvement'],
            examples: [example]
        };
        
        this.refactoringPatterns.set(patternId, pattern);
        await this.saveData();
        
        return patternId;
    }

    /**
     * Load data from storage
     */
    private async loadData(): Promise<void> {
        try {
            const patternsData = this.context.globalState.get<{ [key: string]: RefactoringPattern }>(this.STORAGE_KEY_PATTERNS, {});
            this.refactoringPatterns = new Map(Object.entries(patternsData));
            
            const behaviorData = this.context.globalState.get<RefactoringBehavior>(this.STORAGE_KEY_BEHAVIOR);
            if (behaviorData) {
                this.userBehavior = behaviorData;
            }
            
            console.log(`Loaded ${this.refactoringPatterns.size} refactoring patterns`);
        } catch (error) {
            console.error('Error loading refactoring data:', error);
        }
    }

    /**
     * Save data to storage
     */
    private async saveData(): Promise<void> {
        try {
            const patternsData = Object.fromEntries(this.refactoringPatterns);
            await this.context.globalState.update(this.STORAGE_KEY_PATTERNS, patternsData);
            
            await this.context.globalState.update(this.STORAGE_KEY_BEHAVIOR, this.userBehavior);
        } catch (error) {
            console.error('Error saving refactoring data:', error);
        }
    }
}
