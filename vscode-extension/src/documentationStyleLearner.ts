import * as vscode from 'vscode';
import { FeedbackData } from './feedbackSystem';
import { LearnedPattern } from './patternAdaptationEngine';

// Interface untuk documentation pattern
export interface DocumentationPattern {
    patternId: string;
    name: string;
    type: DocumentationType;
    language: string;
    style: DocumentationStyle;
    context: DocumentationContext;
    template: string;
    examples: DocumentationExample[];
    userPreference: number;
    confidence: number;
    metrics: DocumentationMetrics;
}

export type DocumentationType =
    | 'function_doc'
    | 'class_doc'
    | 'variable_doc'
    | 'module_doc'
    | 'api_doc'
    | 'readme_doc'
    | 'inline_comment'
    | 'todo_comment'
    | 'warning_comment'
    | 'license_header';

export type DocumentationStyle =
    | 'jsdoc'
    | 'sphinx'
    | 'javadoc'
    | 'doxygen'
    | 'markdown'
    | 'plain_text'
    | 'structured'
    | 'minimal'
    | 'verbose'
    | 'conversational';

export type DocumentationContext =
    | 'public_api'
    | 'internal_method'
    | 'helper_function'
    | 'complex_logic'
    | 'business_rule'
    | 'configuration'
    | 'error_handling'
    | 'performance_critical'
    | 'security_related';

export interface DocumentationExample {
    code: string;
    documentation: string;
    context: string;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    explanation: string;
}

export interface DocumentationMetrics {
    averageLength: number;
    detailLevel: 'minimal' | 'moderate' | 'comprehensive';
    includesExamples: boolean;
    includesParameters: boolean;
    includesReturnTypes: boolean;
    includesExceptions: boolean;
    usesFormalTone: boolean;
    consistencyScore: number;
}

// Interface untuk user documentation behavior
export interface DocumentationBehavior {
    userId: string;
    preferredStyles: { [style in DocumentationStyle]?: number };
    contextPreferences: { [context in DocumentationContext]?: DocumentationPreference };
    languageSpecificStyles: { [language: string]: DocumentationStyle };
    writingStyle: WritingStyle;
    comprehensivenessLevel: 'minimal' | 'balanced' | 'comprehensive';
    consistencyPatterns: string[];
    updateFrequency: number;
}

export interface DocumentationPreference {
    priority: number;
    requiredElements: string[];
    optionalElements: string[];
    formatPreference: string;
}

export interface WritingStyle {
    tone: 'formal' | 'casual' | 'technical' | 'conversational';
    perspective: 'first_person' | 'second_person' | 'third_person' | 'imperative';
    verbosity: 'concise' | 'moderate' | 'verbose';
    exampleUsage: 'never' | 'sometimes' | 'frequently' | 'always';
    templateUsage: number; // 0-1
}

// Interface untuk documentation suggestion
export interface DocumentationSuggestion {
    id: string;
    type: 'missing_doc' | 'improve_doc' | 'standardize_doc' | 'add_examples';
    targetCode: string;
    currentDocumentation?: string;
    suggestedDocumentation: string;
    pattern: DocumentationPattern;
    priority: 'low' | 'medium' | 'high';
    reason: string;
    estimatedBenefit: number;
}

export class DocumentationStyleLearner {
    private context: vscode.ExtensionContext;
    private documentationPatterns: Map<string, DocumentationPattern> = new Map();
    private userBehavior: DocumentationBehavior;
    private recentAnalysis: Map<string, any> = new Map();
    private readonly STORAGE_KEY_PATTERNS = 'codeWhispererDocPatterns';
    private readonly STORAGE_KEY_BEHAVIOR = 'codeWhispererDocBehavior';

    // Predefined documentation patterns
    private readonly PREDEFINED_PATTERNS: Partial<DocumentationPattern>[] = [
        {
            name: 'JSDoc Function Documentation',
            type: 'function_doc',
            language: 'javascript',
            style: 'jsdoc',
            context: 'public_api',
            template: '/**\n * ${description}\n * @param {${paramType}} ${paramName} - ${paramDescription}\n * @returns {${returnType}} ${returnDescription}\n * @throws {${errorType}} ${errorDescription}\n * @example\n * ${exampleCode}\n */',
            examples: [{
                code: 'function calculateTax(income, rate) {\n  return income * rate;\n}',
                documentation: '/**\n * Calculates tax amount based on income and rate\n * @param {number} income - The gross income amount\n * @param {number} rate - The tax rate (0-1)\n * @returns {number} The calculated tax amount\n * @example\n * const tax = calculateTax(50000, 0.2); // returns 10000\n */',
                context: 'Utility function for tax calculation',
                quality: 'excellent',
                explanation: 'Complete JSDoc with params, return type, and example'
            }]
        },
        {
            name: 'Python Docstring Documentation',
            type: 'function_doc',
            language: 'python',
            style: 'sphinx',
            context: 'public_api',
            template: '"""\n${description}\n\nArgs:\n    ${paramName} (${paramType}): ${paramDescription}\n\nReturns:\n    ${returnType}: ${returnDescription}\n\nRaises:\n    ${errorType}: ${errorDescription}\n\nExample:\n    ${exampleCode}\n"""',
            examples: [{
                code: 'def calculate_average(numbers):\n    return sum(numbers) / len(numbers)',
                documentation: '"""\nCalculate the average of a list of numbers.\n\nArgs:\n    numbers (list): A list of numeric values\n\nReturns:\n    float: The arithmetic mean of the numbers\n\nRaises:\n    ZeroDivisionError: If the list is empty\n\nExample:\n    >>> calculate_average([1, 2, 3, 4, 5])\n    3.0\n"""',
                context: 'Mathematical utility function',
                quality: 'excellent',
                explanation: 'Complete Python docstring with Google/NumPy style'
            }]
        },
        {
            name: 'TypeScript Interface Documentation',
            type: 'class_doc',
            language: 'typescript',
            style: 'jsdoc',
            context: 'public_api',
            template: '/**\n * ${description}\n * @interface ${interfaceName}\n * @property {${propertyType}} ${propertyName} - ${propertyDescription}\n */',
            examples: [{
                code: 'interface User {\n  id: string;\n  name: string;\n  email: string;\n}',
                documentation: '/**\n * Represents a user in the system\n * @interface User\n * @property {string} id - Unique identifier for the user\n * @property {string} name - Full name of the user\n * @property {string} email - Email address of the user\n */',
                context: 'Data model interface',
                quality: 'good',
                explanation: 'TypeScript interface documentation with property descriptions'
            }]
        },
        {
            name: 'README Section Documentation',
            type: 'readme_doc',
            language: 'markdown',
            style: 'markdown',
            context: 'public_api',
            template: '## ${sectionTitle}\n\n${description}\n\n### Usage\n\n```${language}\n${usageExample}\n```\n\n### Parameters\n\n- `${paramName}` (${paramType}): ${paramDescription}\n\n### Returns\n\n${returnDescription}',
            examples: [{
                code: 'module.exports = function authenticate(username, password) { ... }',
                documentation: '## Authentication\n\nThis module provides user authentication functionality.\n\n### Usage\n\n```javascript\nconst auth = require("./auth");\nconst isValid = auth.authenticate("user", "pass");\n```\n\n### Parameters\n\n- `username` (string): The username to authenticate\n- `password` (string): The password to verify\n\n### Returns\n\nBoolean indicating if authentication was successful',
                context: 'Module documentation for README',
                quality: 'good',
                explanation: 'README-style documentation with usage examples'
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
     * Initialize user documentation behavior
     */
    private initializeUserBehavior(): DocumentationBehavior {
        return {
            userId: 'user',
            preferredStyles: {},
            contextPreferences: {},
            languageSpecificStyles: {},
            writingStyle: {
                tone: 'technical',
                perspective: 'third_person',
                verbosity: 'moderate',
                exampleUsage: 'sometimes',
                templateUsage: 0.5
            },
            comprehensivenessLevel: 'balanced',
            consistencyPatterns: [],
            updateFrequency: 0.5
        };
    }

    /**
     * Initialize predefined documentation patterns
     */
    private initializePredefinedPatterns(): void {
        for (const pattern of this.PREDEFINED_PATTERNS) {
            const fullPattern: DocumentationPattern = {
                patternId: `predefined_${pattern.type}_${pattern.language}_${pattern.style}`,
                name: pattern.name!,
                type: pattern.type!,
                language: pattern.language!,
                style: pattern.style!,
                context: pattern.context!,
                template: pattern.template!,
                examples: pattern.examples!,
                userPreference: 0.5,
                confidence: 0.8,
                metrics: {
                    averageLength: 150,
                    detailLevel: 'moderate',
                    includesExamples: true,
                    includesParameters: true,
                    includesReturnTypes: true,
                    includesExceptions: false,
                    usesFormalTone: true,
                    consistencyScore: 0.8
                }
            };
            
            this.documentationPatterns.set(fullPattern.patternId, fullPattern);
        }
    }

    /**
     * Analyze documentation in files to learn user patterns
     */
    public async analyzeDocumentation(document: vscode.TextDocument): Promise<void> {
        const content = document.getText();
        const language = document.languageId;
        const fileName = document.fileName;
        
        // Extract documentation blocks
        const docBlocks = this.extractDocumentationBlocks(content, language);
        
        // Analyze each documentation block
        const analysis = await this.analyzeDocumentationBlocks(docBlocks, language);
        
        // Update user behavior
        await this.updateUserBehavior(analysis, language);
        
        // Store analysis results
        this.recentAnalysis.set(fileName, {
            timestamp: Date.now(),
            documentationBlocks: docBlocks.length,
            analysis,
            language
        });
        
        await this.saveData();
    }

    /**
     * Extract documentation blocks from code
     */
    private extractDocumentationBlocks(content: string, language: string): any[] {
        const blocks: any[] = [];
        const lines = content.split('\n');
        
        // Different comment patterns for different languages
        const patterns = this.getCommentPatterns(language);
        
        let currentBlock: any = null;
        let inMultilineComment = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]?.trim() || '';
            
            // Detect start of documentation block
            if (patterns.multilineStart.some((pattern: string) => line.includes(pattern))) {
                inMultilineComment = true;
                currentBlock = {
                    type: this.detectDocumentationType(line, lines, i),
                    startLine: i,
                    content: [line],
                    style: this.detectDocumentationStyle(line, language),
                    context: this.inferDocumentationContext(lines, i)
                };
            }
            // Continue multiline comment
            else if (inMultilineComment && currentBlock) {
                currentBlock.content.push(line);
                
                if (patterns.multilineEnd.some((pattern: string) => line.includes(pattern))) {
                    inMultilineComment = false;
                    currentBlock.endLine = i;
                    currentBlock.fullContent = currentBlock.content.join('\n');
                    blocks.push(currentBlock);
                    currentBlock = null;
                }
            }
            // Single line comment
            else if (patterns.singleLine.some((pattern: string) => line.startsWith(pattern))) {
                blocks.push({
                    type: 'inline_comment',
                    startLine: i,
                    endLine: i,
                    content: [line],
                    fullContent: line,
                    style: 'plain_text',
                    context: this.inferDocumentationContext(lines, i)
                });
            }
        }
        
        return blocks;
    }

    /**
     * Get comment patterns for different languages
     */
    private getCommentPatterns(language: string): any {
        const patterns: { [key: string]: any } = {
            javascript: {
                multilineStart: ['/**', '/*'],
                multilineEnd: ['*/'],
                singleLine: ['//', '//']
            },
            typescript: {
                multilineStart: ['/**', '/*'],
                multilineEnd: ['*/'],
                singleLine: ['//', '//']
            },
            python: {
                multilineStart: ['"""', "'''"],
                multilineEnd: ['"""', "'''"],
                singleLine: ['#']
            },
            java: {
                multilineStart: ['/**', '/*'],
                multilineEnd: ['*/'],
                singleLine: ['//']
            },
            csharp: {
                multilineStart: ['/**', '/*', '///'],
                multilineEnd: ['*/'],
                singleLine: ['//', '///']
            }
        };
        
        return patterns[language] || patterns.javascript;
    }

    /**
     * Detect documentation type
     */
    private detectDocumentationType(line: string, lines: string[], index: number): DocumentationType {
        const nextFewLines = lines.slice(index + 1, index + 5).join(' ').toLowerCase();
        
        if (nextFewLines.includes('function') || nextFewLines.includes('def ')) {
            return 'function_doc';
        } else if (nextFewLines.includes('class ') || nextFewLines.includes('interface ')) {
            return 'class_doc';
        } else if (nextFewLines.includes('const ') || nextFewLines.includes('let ') || nextFewLines.includes('var ')) {
            return 'variable_doc';
        } else if (line.toLowerCase().includes('todo')) {
            return 'todo_comment';
        } else if (line.toLowerCase().includes('warning') || line.toLowerCase().includes('fixme')) {
            return 'warning_comment';
        } else if (line.toLowerCase().includes('license') || line.toLowerCase().includes('copyright')) {
            return 'license_header';
        }
        
        return 'inline_comment';
    }

    /**
     * Detect documentation style
     */
    private detectDocumentationStyle(line: string, language: string): DocumentationStyle {
        if (line.includes('@param') || line.includes('@returns') || line.includes('@throws')) {
            return 'jsdoc';
        } else if (line.includes('Args:') || line.includes('Returns:') || line.includes('Raises:')) {
            return 'sphinx';
        } else if (line.includes('/**')) {
            return language === 'java' ? 'javadoc' : 'jsdoc';
        } else if (line.includes('"""') || line.includes("'''")) {
            return 'sphinx';
        } else if (line.includes('#') && (line.includes('##') || line.includes('###'))) {
            return 'markdown';
        }
        
        return 'plain_text';
    }

    /**
     * Infer documentation context
     */
    private inferDocumentationContext(lines: string[], index: number): DocumentationContext {
        const surroundingCode = lines.slice(Math.max(0, index - 2), index + 5).join(' ').toLowerCase();
        
        if (surroundingCode.includes('public') || surroundingCode.includes('export')) {
            return 'public_api';
        } else if (surroundingCode.includes('private') || surroundingCode.includes('internal')) {
            return 'internal_method';
        } else if (surroundingCode.includes('helper') || surroundingCode.includes('util')) {
            return 'helper_function';
        } else if (surroundingCode.includes('complex') || surroundingCode.includes('algorithm')) {
            return 'complex_logic';
        } else if (surroundingCode.includes('config') || surroundingCode.includes('setting')) {
            return 'configuration';
        } else if (surroundingCode.includes('error') || surroundingCode.includes('exception')) {
            return 'error_handling';
        } else if (surroundingCode.includes('performance') || surroundingCode.includes('optimize')) {
            return 'performance_critical';
        } else if (surroundingCode.includes('security') || surroundingCode.includes('auth')) {
            return 'security_related';
        }
        
        return 'internal_method';
    }

    /**
     * Analyze documentation blocks
     */
    private async analyzeDocumentationBlocks(blocks: any[], language: string): Promise<any> {
        const analysis = {
            totalBlocks: blocks.length,
            styleDistribution: {} as { [style: string]: number },
            typeDistribution: {} as { [type: string]: number },
            averageLength: 0,
            hasExamples: 0,
            hasParameters: 0,
            hasReturnTypes: 0,
            consistencyScore: 0,
            writingStyle: this.analyzeWritingStyle(blocks)
        };
        
        let totalLength = 0;
        
        for (const block of blocks) {
            // Style distribution
            analysis.styleDistribution[block.style] = 
                (analysis.styleDistribution[block.style] || 0) + 1;
            
            // Type distribution
            analysis.typeDistribution[block.type] = 
                (analysis.typeDistribution[block.type] || 0) + 1;
            
            // Content analysis
            const content = block.fullContent.toLowerCase();
            totalLength += content.length;
            
            if (content.includes('example') || content.includes('usage')) {
                analysis.hasExamples++;
            }
            
            if (content.includes('@param') || content.includes('args:')) {
                analysis.hasParameters++;
            }
            
            if (content.includes('@returns') || content.includes('returns:')) {
                analysis.hasReturnTypes++;
            }
        }
        
        analysis.averageLength = blocks.length > 0 ? totalLength / blocks.length : 0;
        analysis.consistencyScore = this.calculateConsistencyScore(blocks);
        
        return analysis;
    }

    /**
     * Analyze writing style from documentation blocks
     */
    private analyzeWritingStyle(blocks: any[]): WritingStyle {
        let formalCount = 0;
        let casualCount = 0;
        let firstPersonCount = 0;
        let secondPersonCount = 0;
        let thirdPersonCount = 0;
        let exampleCount = 0;
        
        for (const block of blocks) {
            const content = block.fullContent.toLowerCase();
            
            // Tone analysis
            if (content.includes('shall') || content.includes('will') || content.includes('must')) {
                formalCount++;
            } else if (content.includes("you'll") || content.includes("we'll") || content.includes('easy')) {
                casualCount++;
            }
            
            // Perspective analysis
            if (content.includes(' i ') || content.includes('my ')) {
                firstPersonCount++;
            } else if (content.includes('you ') || content.includes('your ')) {
                secondPersonCount++;
            } else {
                thirdPersonCount++;
            }
            
            // Example usage
            if (content.includes('example') || content.includes('usage')) {
                exampleCount++;
            }
        }
        
        const total = blocks.length;
        
        return {
            tone: formalCount > casualCount ? 'formal' : 'casual',
            perspective: this.determinePerspective(firstPersonCount, secondPersonCount, thirdPersonCount),
            verbosity: this.determineVerbosity(blocks),
            exampleUsage: this.determineExampleUsage(exampleCount, total),
            templateUsage: this.calculateTemplateUsage(blocks)
        };
    }

    /**
     * Determine perspective from counts
     */
    private determinePerspective(first: number, second: number, third: number): 'first_person' | 'second_person' | 'third_person' | 'imperative' {
        if (first > second && first > third) return 'first_person';
        if (second > first && second > third) return 'second_person';
        return 'third_person';
    }

    /**
     * Determine verbosity level
     */
    private determineVerbosity(blocks: any[]): 'concise' | 'moderate' | 'verbose' {
        const avgLength = blocks.reduce((sum, block) => sum + block.fullContent.length, 0) / blocks.length;
        
        if (avgLength < 50) return 'concise';
        if (avgLength < 150) return 'moderate';
        return 'verbose';
    }

    /**
     * Determine example usage frequency
     */
    private determineExampleUsage(exampleCount: number, total: number): 'never' | 'sometimes' | 'frequently' | 'always' {
        const ratio = exampleCount / total;
        
        if (ratio === 0) return 'never';
        if (ratio < 0.3) return 'sometimes';
        if (ratio < 0.7) return 'frequently';
        return 'always';
    }

    /**
     * Calculate template usage score
     */
    private calculateTemplateUsage(blocks: any[]): number {
        let templateCount = 0;
        
        for (const block of blocks) {
            const content = block.fullContent;
            if (content.includes('@param') || content.includes('@returns') || 
                content.includes('Args:') || content.includes('Returns:')) {
                templateCount++;
            }
        }
        
        return blocks.length > 0 ? templateCount / blocks.length : 0;
    }

    /**
     * Calculate consistency score
     */
    private calculateConsistencyScore(blocks: any[]): number {
        if (blocks.length < 2) return 1;
        
        const styles = blocks.map(block => block.style);
        const uniqueStyles = new Set(styles);
        
        // More consistent if fewer unique styles
        return 1 - (uniqueStyles.size - 1) / Math.max(blocks.length - 1, 1);
    }

    /**
     * Update user behavior based on analysis
     */
    private async updateUserBehavior(analysis: any, language: string): Promise<void> {
        // Update style preferences
        for (const [style, count] of Object.entries(analysis.styleDistribution)) {
            this.userBehavior.preferredStyles[style as DocumentationStyle] = 
                (this.userBehavior.preferredStyles[style as DocumentationStyle] || 0) + (count as number);
        }
        
        // Update language-specific styles
        const dominantStyle = Object.entries(analysis.styleDistribution)
            .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] as DocumentationStyle;
        
        if (dominantStyle) {
            this.userBehavior.languageSpecificStyles[language] = dominantStyle;
        }
        
        // Update writing style
        this.userBehavior.writingStyle = {
            ...this.userBehavior.writingStyle,
            ...analysis.writingStyle
        };
        
        // Update comprehensiveness level
        if (analysis.hasExamples / analysis.totalBlocks > 0.7) {
            this.userBehavior.comprehensivenessLevel = 'comprehensive';
        } else if (analysis.hasExamples / analysis.totalBlocks < 0.3) {
            this.userBehavior.comprehensivenessLevel = 'minimal';
        }
    }

    /**
     * Generate documentation suggestions
     */
    public async generateDocumentationSuggestions(
        document: vscode.TextDocument,
        selection?: vscode.Selection
    ): Promise<DocumentationSuggestion[]> {
        const suggestions: DocumentationSuggestion[] = [];
        const content = selection ? document.getText(selection) : document.getText();
        const language = document.languageId;
        
        // Analyze code to find undocumented elements
        const undocumentedElements = this.findUndocumentedElements(content, language);
        
        // Generate suggestions for each undocumented element
        for (const element of undocumentedElements) {
            const suggestion = await this.createDocumentationSuggestion(element, language);
            if (suggestion) {
                suggestions.push(suggestion);
            }
        }
        
        // Check for documentation improvements
        const improvementSuggestions = await this.findDocumentationImprovements(content, language);
        suggestions.push(...improvementSuggestions);
        
        return this.prioritizeDocumentationSuggestions(suggestions);
    }

    /**
     * Find undocumented code elements
     */
    private findUndocumentedElements(content: string, language: string): any[] {
        const elements: any[] = [];
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]?.trim() || '';
            
            // Check for functions
            if (this.isFunctionDeclaration(line, language)) {
                if (!this.hasDocumentationAbove(lines, i)) {
                    elements.push({
                        type: 'function',
                        line: i,
                        code: line,
                        name: this.extractFunctionName(line, language),
                        parameters: this.extractParameters(line, language)
                    });
                }
            }
            
            // Check for classes
            if (this.isClassDeclaration(line, language)) {
                if (!this.hasDocumentationAbove(lines, i)) {
                    elements.push({
                        type: 'class',
                        line: i,
                        code: line,
                        name: this.extractClassName(line, language)
                    });
                }
            }
            
            // Check for complex logic blocks
            if (this.isComplexLogic(line)) {
                if (!this.hasCommentAbove(lines, i)) {
                    elements.push({
                        type: 'complex_logic',
                        line: i,
                        code: line,
                        reason: 'Complex logic that could benefit from explanation'
                    });
                }
            }
        }
        
        return elements;
    }

    /**
     * Check if line is a function declaration
     */
    private isFunctionDeclaration(line: string, language: string): boolean {
        const patterns: { [key: string]: RegExp[] } = {
            javascript: [/function\s+\w+/, /const\s+\w+\s*=.*=>/, /\w+\s*:\s*function/, /export\s+function/],
            typescript: [/function\s+\w+/, /const\s+\w+\s*=.*=>/, /\w+\s*:\s*function/, /export\s+function/],
            python: [/def\s+\w+/, /async\s+def\s+\w+/],
            java: [/(public|private|protected).*\w+\s*\(/],
            csharp: [/(public|private|protected).*\w+\s*\(/]
        };
        
        const languagePatterns = patterns[language] || patterns.javascript;
        return languagePatterns ? languagePatterns.some(pattern => pattern.test(line)) : false;
    }

    /**
     * Check if line is a class declaration
     */
    private isClassDeclaration(line: string, language: string): boolean {
        return /class\s+\w+|interface\s+\w+/.test(line);
    }

    /**
     * Check if line contains complex logic
     */
    private isComplexLogic(line: string): boolean {
        const complexityIndicators = [
            /for.*for/, // Nested loops
            /if.*if/, // Nested conditions
            /try.*catch/, // Error handling
            /switch.*case/, // Switch statements
            /\w+\?\.\w+\?\.\w+/, // Optional chaining (complexity)
            /&&.*\|\|/, // Complex boolean logic
        ];
        
        return complexityIndicators.some(pattern => pattern.test(line));
    }

    /**
     * Check if there's documentation above the line
     */
    private hasDocumentationAbove(lines: string[], lineIndex: number): boolean {
        // Check previous few lines for documentation
        for (let i = Math.max(0, lineIndex - 3); i < lineIndex; i++) {
            const line = lines[i]?.trim() || '';
            if (line.includes('/**') || line.includes('"""') || line.includes("'''")) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if there's a comment above the line
     */
    private hasCommentAbove(lines: string[], lineIndex: number): boolean {
        if (lineIndex > 0) {
            const prevLine = lines[lineIndex - 1]?.trim() || '';
            return prevLine.startsWith('//') || prevLine.startsWith('#');
        }
        return false;
    }

    /**
     * Extract function name from declaration
     */
    private extractFunctionName(line: string, language: string): string {
        const patterns: { [key: string]: RegExp } = {
            javascript: /function\s+(\w+)|const\s+(\w+)\s*=|(\w+)\s*:/,
            typescript: /function\s+(\w+)|const\s+(\w+)\s*=|(\w+)\s*:/,
            python: /def\s+(\w+)/,
            java: /\s+(\w+)\s*\(/,
            csharp: /\s+(\w+)\s*\(/
        };
        
        const pattern = patterns[language] || patterns.javascript;
        if (!pattern) return 'unknown';
        
        const match = line.match(pattern);
        return match ? (match[1] || match[2] || match[3] || 'unknown') : 'unknown';
    }

    /**
     * Extract class name from declaration
     */
    private extractClassName(line: string, language: string): string {
        const match = line.match(/(?:class|interface)\s+(\w+)/);
        return match?.[1] || 'unknown';
    }

    /**
     * Extract parameters from function declaration
     */
    private extractParameters(line: string, language: string): string[] {
        const match = line.match(/\(([^)]*)\)/);
        if (!match || !match[1]) return [];
        
        return match[1].split(',').map(param => param.trim()).filter(param => param.length > 0);
    }

    /**
     * Create documentation suggestion
     */
    private async createDocumentationSuggestion(
        element: any,
        language: string
    ): Promise<DocumentationSuggestion | null> {
        const preferredStyle = this.userBehavior.languageSpecificStyles[language] || 
                              this.getMostPreferredStyle();
        
        const pattern = this.findBestMatchingPattern(element.type, language, preferredStyle);
        if (!pattern) return null;
        
        const documentation = this.generateDocumentation(element, pattern);
        
        return {
            id: `doc_suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'missing_doc',
            targetCode: element.code,
            suggestedDocumentation: documentation,
            pattern,
            priority: this.calculatePriority(element),
            reason: `Missing documentation for ${element.type}: ${element.name || 'code block'}`,
            estimatedBenefit: this.calculateBenefit(element, pattern)
        };
    }

    /**
     * Get most preferred documentation style
     */
    private getMostPreferredStyle(): DocumentationStyle {
        const styles = Object.entries(this.userBehavior.preferredStyles);
        if (styles.length === 0) return 'jsdoc';
        
        const sortedStyles = styles.sort(([,a], [,b]) => b - a);
        return (sortedStyles[0]?.[0] as DocumentationStyle) || 'jsdoc';
    }

    /**
     * Find best matching pattern
     */
    private findBestMatchingPattern(
        elementType: string,
        language: string,
        style: DocumentationStyle
    ): DocumentationPattern | null {
        let bestPattern: DocumentationPattern | null = null;
        let bestScore = 0;
        
        for (const pattern of this.documentationPatterns.values()) {
            let score = 0;
            
            // Language match
            if (pattern.language === language) score += 0.4;
            else if (pattern.language === 'any') score += 0.2;
            
            // Style match
            if (pattern.style === style) score += 0.3;
            
            // Type match
            if (pattern.type === `${elementType}_doc`) score += 0.3;
            
            // User preference
            score *= pattern.userPreference;
            
            if (score > bestScore) {
                bestScore = score;
                bestPattern = pattern;
            }
        }
        
        return bestPattern;
    }

    /**
     * Generate documentation based on pattern
     */
    private generateDocumentation(element: any, pattern: DocumentationPattern): string {
        let documentation = pattern.template;
        
        // Replace template variables
        documentation = documentation.replace(/\$\{description\}/g, 
            `${element.type === 'function' ? 'Function' : 'Class'} description`);
        
        if (element.name) {
            documentation = documentation.replace(/\$\{(\w+Name)\}/g, element.name);
        }
        
        // Handle parameters
        if (element.parameters && element.parameters.length > 0) {
            const paramDocs = element.parameters.map((param: string) => {
                return documentation.match(/@param/) 
                    ? `@param {any} ${param} - Parameter description`
                    : `    ${param}: Parameter description`;
            }).join('\n');
            
            documentation = documentation.replace(/\$\{param.*?\}/g, paramDocs);
        }
        
        // Add return type
        documentation = documentation.replace(/\$\{return.*?\}/g, 'Return value description');
        
        // Add example if user prefers examples
        if (this.userBehavior.writingStyle.exampleUsage !== 'never') {
            if (!documentation.includes('example') && pattern.style === 'jsdoc') {
                documentation += '\n * @example\n * // Usage example here';
            }
        }
        
        return documentation;
    }

    /**
     * Calculate priority for documentation suggestion
     */
    private calculatePriority(element: any): 'low' | 'medium' | 'high' {
        if (element.type === 'function') {
            return element.parameters && element.parameters.length > 2 ? 'high' : 'medium';
        } else if (element.type === 'class') {
            return 'high';
        } else if (element.type === 'complex_logic') {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Calculate estimated benefit
     */
    private calculateBenefit(element: any, pattern: DocumentationPattern): number {
        let benefit = 0.5;
        
        // Type-based benefit
        if (element.type === 'function') benefit += 0.3;
        if (element.type === 'class') benefit += 0.4;
        if (element.type === 'complex_logic') benefit += 0.2;
        
        // Complexity-based benefit
        if (element.parameters && element.parameters.length > 0) {
            benefit += element.parameters.length * 0.1;
        }
        
        // Pattern confidence
        benefit *= pattern.confidence;
        
        return Math.min(1, benefit);
    }

    /**
     * Find documentation improvements
     */
    private async findDocumentationImprovements(
        content: string,
        language: string
    ): Promise<DocumentationSuggestion[]> {
        const improvements: DocumentationSuggestion[] = [];
        const existingDocs = this.extractDocumentationBlocks(content, language);
        
        for (const doc of existingDocs) {
            const improvements_for_doc = this.evaluateDocumentationQuality(doc, language);
            improvements.push(...improvements_for_doc);
        }
        
        return improvements;
    }

    /**
     * Evaluate documentation quality and suggest improvements
     */
    private evaluateDocumentationQuality(doc: any, language: string): DocumentationSuggestion[] {
        const suggestions: DocumentationSuggestion[] = [];
        const content = doc.fullContent.toLowerCase();
        
        // Check for missing examples
        if (this.userBehavior.writingStyle.exampleUsage === 'frequently' && 
            !content.includes('example') && !content.includes('usage')) {
            
            const defaultPattern = Array.from(this.documentationPatterns.values())[0];
            if (defaultPattern) {
                suggestions.push({
                    id: `improve_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'add_examples',
                    targetCode: doc.fullContent,
                    currentDocumentation: doc.fullContent,
                    suggestedDocumentation: doc.fullContent + '\n * @example\n * // Add usage example here',
                    pattern: defaultPattern,
                    priority: 'medium',
                    reason: 'Documentation could benefit from usage examples',
                    estimatedBenefit: 0.6
                });
            }
        }
        
        // Check for inconsistent style
        const preferredStyle = this.userBehavior.languageSpecificStyles[language];
        if (preferredStyle && doc.style !== preferredStyle) {
            const defaultPattern = Array.from(this.documentationPatterns.values())[0];
            if (defaultPattern) {
                suggestions.push({
                    id: `standardize_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'standardize_doc',
                    targetCode: doc.fullContent,
                    currentDocumentation: doc.fullContent,
                    suggestedDocumentation: `// Standardized to ${preferredStyle} style\n${doc.fullContent}`,
                    pattern: defaultPattern,
                    priority: 'low',
                    reason: `Documentation style should be standardized to ${preferredStyle}`,
                    estimatedBenefit: 0.4
                });
            }
        }
        
        return suggestions;
    }

    /**
     * Prioritize documentation suggestions
     */
    private prioritizeDocumentationSuggestions(
        suggestions: DocumentationSuggestion[]
    ): DocumentationSuggestion[] {
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
     * Learn from documentation feedback
     */
    public async learnFromDocumentationFeedback(
        suggestion: DocumentationSuggestion,
        feedback: FeedbackData
    ): Promise<void> {
        const pattern = suggestion.pattern;
        
        if (feedback.action === 'accept') {
            pattern.userPreference = Math.min(1, pattern.userPreference + 0.1);
            pattern.confidence = Math.min(1, pattern.confidence + 0.05);
            
            // Update style preferences
            this.userBehavior.preferredStyles[pattern.style] = 
                (this.userBehavior.preferredStyles[pattern.style] || 0) + 1;
                
        } else if (feedback.action === 'reject') {
            pattern.userPreference = Math.max(0, pattern.userPreference - 0.1);
            pattern.confidence = Math.max(0.1, pattern.confidence - 0.05);
            
            // Decrease style preference
            this.userBehavior.preferredStyles[pattern.style] = Math.max(0,
                (this.userBehavior.preferredStyles[pattern.style] || 0) - 0.5
            );
        }
        
        await this.saveData();
    }

    /**
     * Get documentation insights
     */
    public getDocumentationInsights(): {
        preferredStyles: DocumentationStyle[];
        writingStyle: WritingStyle;
        comprehensivenessLevel: string;
        consistencyScore: number;
        improvementSuggestions: string[];
    } {
        // Get preferred styles
        const preferredStyles = Object.entries(this.userBehavior.preferredStyles)
            .filter(([_, score]) => score > 2)
            .sort(([_, a], [__, b]) => b - a)
            .map(([style, _]) => style as DocumentationStyle);
        
        // Calculate consistency score
        const consistencyScore = this.userBehavior.consistencyPatterns.length > 0 ? 0.8 : 0.5;
        
        // Generate improvement suggestions
        const improvements = this.generateDocumentationImprovements();
        
        return {
            preferredStyles,
            writingStyle: this.userBehavior.writingStyle,
            comprehensivenessLevel: this.userBehavior.comprehensivenessLevel,
            consistencyScore,
            improvementSuggestions: improvements
        };
    }

    /**
     * Generate documentation improvement suggestions
     */
    private generateDocumentationImprovements(): string[] {
        const suggestions: string[] = [];
        
        // Check style consistency
        const styleCount = Object.keys(this.userBehavior.preferredStyles).length;
        if (styleCount > 3) {
            suggestions.push('Consider standardizing on 1-2 documentation styles for better consistency');
        }
        
        // Check example usage
        if (this.userBehavior.writingStyle.exampleUsage === 'never') {
            suggestions.push('Adding usage examples to documentation can significantly improve code understanding');
        }
        
        // Check verbosity balance
        if (this.userBehavior.writingStyle.verbosity === 'verbose') {
            suggestions.push('Consider being more concise in documentation while maintaining clarity');
        } else if (this.userBehavior.writingStyle.verbosity === 'concise') {
            suggestions.push('Adding more detail to documentation can help other developers understand the code better');
        }
        
        return suggestions;
    }

    /**
     * Load data from storage
     */
    private async loadData(): Promise<void> {
        try {
            const patternsData = this.context.globalState.get<{ [key: string]: DocumentationPattern }>(this.STORAGE_KEY_PATTERNS, {});
            this.documentationPatterns = new Map(Object.entries(patternsData));
            
            const behaviorData = this.context.globalState.get<DocumentationBehavior>(this.STORAGE_KEY_BEHAVIOR);
            if (behaviorData) {
                this.userBehavior = behaviorData;
            }
            
            console.log(`Loaded ${this.documentationPatterns.size} documentation patterns`);
        } catch (error) {
            console.error('Error loading documentation data:', error);
        }
    }

    /**
     * Save data to storage
     */
    private async saveData(): Promise<void> {
        try {
            const patternsData = Object.fromEntries(this.documentationPatterns);
            await this.context.globalState.update(this.STORAGE_KEY_PATTERNS, patternsData);
            
            await this.context.globalState.update(this.STORAGE_KEY_BEHAVIOR, this.userBehavior);
        } catch (error) {
            console.error('Error saving documentation data:', error);
        }
    }
}
