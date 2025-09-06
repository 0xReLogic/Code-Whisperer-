import * as vscode from 'vscode';
import { LearnedPattern } from './patternAdaptationEngine';
import { FeedbackData } from './feedbackSystem';

// Interface untuk language pattern mapping
export interface LanguagePatternMapping {
    sourceLanguage: string;
    targetLanguage: string;
    sourcePattern: string;
    targetPattern: string;
    confidence: number;
    similarity: number;
    mappingType: 'syntax' | 'paradigm' | 'concept' | 'library' | 'idiom';
    examples: PatternExample[];
    usage: {
        suggested: number;
        accepted: number;
        rejected: number;
        effectiveness: number;
    };
}

export interface PatternExample {
    sourceCode: string;
    targetCode: string;
    context: string;
    explanation: string;
}

// Interface untuk cross-language correlation
export interface CrossLanguageCorrelation {
    correlationId: string;
    languages: string[];
    patternCategory: string;
    commonConcept: string;
    languageSpecificPatterns: { [language: string]: string[] };
    strength: number; // 0-1, how strong the correlation is
    evidence: CorrelationEvidence[];
}

export interface CorrelationEvidence {
    timestamp: number;
    evidenceType: 'user_acceptance' | 'pattern_frequency' | 'co_occurrence' | 'explicit_feedback';
    sourceLanguage: string;
    targetLanguage: string;
    description: string;
    weight: number;
}

// Interface untuk programming paradigm detection
export interface ProgrammingParadigm {
    name: string;
    characteristics: string[];
    languages: string[];
    patterns: string[];
    confidence: number;
}

export class MultiLanguagePatternCorrelator {
    private context: vscode.ExtensionContext;
    private languageMappings: Map<string, LanguagePatternMapping> = new Map();
    private crossLanguageCorrelations: Map<string, CrossLanguageCorrelation> = new Map();
    private userParadigmPreferences: Map<string, number> = new Map(); // paradigm -> preference score
    private readonly STORAGE_KEY_MAPPINGS = 'codeWhispererLanguageMappings';
    private readonly STORAGE_KEY_CORRELATIONS = 'codeWhispererCorrelations';
    private readonly STORAGE_KEY_PARADIGMS = 'codeWhispererParadigms';

    // Pre-defined language pattern mappings
    private readonly PREDEFINED_MAPPINGS: Partial<LanguagePatternMapping>[] = [
        // Functional Programming Patterns
        {
            sourceLanguage: 'javascript',
            targetLanguage: 'python',
            sourcePattern: 'arrow_function',
            targetPattern: 'lambda',
            mappingType: 'syntax',
            confidence: 0.8,
            examples: [{
                sourceCode: 'const add = (a, b) => a + b',
                targetCode: 'add = lambda a, b: a + b',
                context: 'Simple function definition',
                explanation: 'Arrow functions in JS map to lambda expressions in Python'
            }]
        },
        {
            sourceLanguage: 'javascript',
            targetLanguage: 'python',
            sourcePattern: 'array_map',
            targetPattern: 'list_comprehension',
            mappingType: 'idiom',
            confidence: 0.9,
            examples: [{
                sourceCode: 'const doubled = numbers.map(x => x * 2)',
                targetCode: 'doubled = [x * 2 for x in numbers]',
                context: 'Array transformation',
                explanation: 'JS array map() corresponds to Python list comprehensions'
            }]
        },
        {
            sourceLanguage: 'python',
            targetLanguage: 'javascript',
            sourcePattern: 'list_comprehension',
            targetPattern: 'array_map',
            mappingType: 'idiom',
            confidence: 0.9,
            examples: [{
                sourceCode: 'squares = [x**2 for x in range(10)]',
                targetCode: 'const squares = Array.from({length: 10}, (_, x) => x**2)',
                context: 'Array generation and transformation',
                explanation: 'Python list comprehensions can be expressed as JS array operations'
            }]
        },
        // Async Patterns
        {
            sourceLanguage: 'javascript',
            targetLanguage: 'python',
            sourcePattern: 'async_await',
            targetPattern: 'asyncio_await',
            mappingType: 'paradigm',
            confidence: 0.85,
            examples: [{
                sourceCode: 'const data = await fetch(url)',
                targetCode: 'data = await aiohttp.get(url)',
                context: 'Asynchronous API calls',
                explanation: 'Async/await patterns are similar across both languages'
            }]
        },
        // OOP Patterns
        {
            sourceLanguage: 'java',
            targetLanguage: 'typescript',
            sourcePattern: 'class_inheritance',
            targetPattern: 'class_extends',
            mappingType: 'paradigm',
            confidence: 0.9,
            examples: [{
                sourceCode: 'class Dog extends Animal',
                targetCode: 'class Dog extends Animal',
                context: 'Class inheritance',
                explanation: 'Both languages use similar class inheritance syntax'
            }]
        },
        // Error Handling
        {
            sourceLanguage: 'java',
            targetLanguage: 'python',
            sourcePattern: 'try_catch',
            targetPattern: 'try_except',
            mappingType: 'concept',
            confidence: 0.95,
            examples: [{
                sourceCode: 'try { ... } catch (Exception e) { ... }',
                targetCode: 'try: ... except Exception as e: ...',
                context: 'Error handling',
                explanation: 'Exception handling concepts are identical, syntax differs'
            }]
        }
    ];

    // Programming paradigms mapping
    private readonly PARADIGMS: ProgrammingParadigm[] = [
        {
            name: 'functional',
            characteristics: ['immutability', 'pure_functions', 'higher_order_functions', 'recursion'],
            languages: ['javascript', 'python', 'haskell', 'clojure', 'scala'],
            patterns: ['map', 'filter', 'reduce', 'lambda', 'curry'],
            confidence: 0.8
        },
        {
            name: 'object_oriented',
            characteristics: ['encapsulation', 'inheritance', 'polymorphism', 'abstraction'],
            languages: ['java', 'csharp', 'cpp', 'python', 'typescript'],
            patterns: ['class', 'interface', 'extends', 'implements', 'abstract'],
            confidence: 0.9
        },
        {
            name: 'procedural',
            characteristics: ['sequential_execution', 'functions', 'modules', 'global_state'],
            languages: ['c', 'pascal', 'fortran', 'basic'],
            patterns: ['function', 'procedure', 'module', 'struct'],
            confidence: 0.7
        },
        {
            name: 'reactive',
            characteristics: ['observables', 'streams', 'event_driven', 'declarative'],
            languages: ['javascript', 'typescript', 'java', 'swift'],
            patterns: ['observable', 'subscribe', 'pipe', 'async_stream'],
            confidence: 0.8
        }
    ];

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadData();
        this.initializePredefinedMappings();
    }

    /**
     * Initialize predefined language mappings
     */
    private initializePredefinedMappings(): void {
        for (const mapping of this.PREDEFINED_MAPPINGS) {
            const key = `${mapping.sourceLanguage}_${mapping.targetLanguage}_${mapping.sourcePattern}`;
            if (!this.languageMappings.has(key)) {
                const fullMapping: LanguagePatternMapping = {
                    sourceLanguage: mapping.sourceLanguage!,
                    targetLanguage: mapping.targetLanguage!,
                    sourcePattern: mapping.sourcePattern!,
                    targetPattern: mapping.targetPattern!,
                    confidence: mapping.confidence || 0.5,
                    similarity: 0.8,
                    mappingType: mapping.mappingType!,
                    examples: mapping.examples || [],
                    usage: {
                        suggested: 0,
                        accepted: 0,
                        rejected: 0,
                        effectiveness: 0
                    }
                };
                this.languageMappings.set(key, fullMapping);
            }
        }
    }

    /**
     * Analyze user's programming patterns across languages
     */
    public async analyzeUserPatterns(patterns: LearnedPattern[]): Promise<void> {
        // Group patterns by language
        const languagePatterns = this.groupPatternsByLanguage(patterns);
        
        // Detect paradigm preferences
        await this.detectParadigmPreferences(languagePatterns);
        
        // Find cross-language correlations
        await this.findCrossLanguageCorrelations(languagePatterns);
        
        // Update pattern mappings based on user behavior
        await this.updatePatternMappings(patterns);
        
        await this.saveData();
    }

    /**
     * Group patterns by programming language
     */
    private groupPatternsByLanguage(patterns: LearnedPattern[]): Map<string, LearnedPattern[]> {
        const grouped = new Map<string, LearnedPattern[]>();
        
        for (const pattern of patterns) {
            if (!grouped.has(pattern.language)) {
                grouped.set(pattern.language, []);
            }
            grouped.get(pattern.language)!.push(pattern);
        }
        
        return grouped;
    }

    /**
     * Detect user's programming paradigm preferences
     */
    private async detectParadigmPreferences(languagePatterns: Map<string, LearnedPattern[]>): Promise<void> {
        // Reset preferences
        this.userParadigmPreferences.clear();
        
        for (const paradigm of this.PARADIGMS) {
            let totalScore = 0;
            let evidenceCount = 0;
            
            for (const [language, patterns] of languagePatterns.entries()) {
                if (paradigm.languages.includes(language)) {
                    const score = this.calculateParadigmScore(patterns, paradigm);
                    totalScore += score;
                    evidenceCount++;
                }
            }
            
            if (evidenceCount > 0) {
                const averageScore = totalScore / evidenceCount;
                this.userParadigmPreferences.set(paradigm.name, averageScore);
            }
        }
        
        console.log('User paradigm preferences:', Object.fromEntries(this.userParadigmPreferences));
    }

    /**
     * Calculate how much user prefers a specific paradigm
     */
    private calculateParadigmScore(patterns: LearnedPattern[], paradigm: ProgrammingParadigm): number {
        let score = 0;
        let patternCount = 0;
        
        for (const pattern of patterns) {
            // Check if pattern matches paradigm characteristics
            const matches = paradigm.patterns.filter(p => 
                pattern.pattern.toLowerCase().includes(p.toLowerCase())
            ).length;
            
            if (matches > 0) {
                // Weight by pattern confidence and usage
                const weight = pattern.confidence * (pattern.usage.accepted / Math.max(pattern.usage.suggested, 1));
                score += (matches / paradigm.patterns.length) * weight;
                patternCount++;
            }
        }
        
        return patternCount > 0 ? score / patternCount : 0;
    }

    /**
     * Find correlations between patterns across languages
     */
    private async findCrossLanguageCorrelations(languagePatterns: Map<string, LearnedPattern[]>): Promise<void> {
        const languages = Array.from(languagePatterns.keys());
        
        // Compare patterns between language pairs
        for (let i = 0; i < languages.length; i++) {
            for (let j = i + 1; j < languages.length; j++) {
                const lang1 = languages[i];
                const lang2 = languages[j];
                if (lang1 && lang2) {
                    const patterns1 = languagePatterns.get(lang1)!;
                    const patterns2 = languagePatterns.get(lang2)!;
                    
                    await this.findPatternCorrelationsBetweenLanguages(lang1, lang2, patterns1, patterns2);
                }
            }
        }
    }

    /**
     * Find correlations between two specific languages
     */
    private async findPatternCorrelationsBetweenLanguages(
        lang1: string,
        lang2: string,
        patterns1: LearnedPattern[],
        patterns2: LearnedPattern[]
    ): Promise<void> {
        // Group patterns by type/category
        const categories1 = this.categorizePatterns(patterns1);
        const categories2 = this.categorizePatterns(patterns2);
        
        // Find correlations within categories
        for (const [category, categoryPatterns1] of categories1.entries()) {
            const categoryPatterns2 = categories2.get(category);
            if (categoryPatterns2 && categoryPatterns1.length > 0 && categoryPatterns2.length > 0) {
                await this.analyzeCorrelationInCategory(
                    lang1, lang2, category, categoryPatterns1, categoryPatterns2
                );
            }
        }
    }

    /**
     * Categorize patterns by type
     */
    private categorizePatterns(patterns: LearnedPattern[]): Map<string, LearnedPattern[]> {
        const categories = new Map<string, LearnedPattern[]>();
        
        for (const pattern of patterns) {
            let category = 'general';
            
            // Categorize based on pattern type and content
            if (pattern.patternType === 'syntax') {
                if (pattern.pattern.includes('function') || pattern.pattern.includes('=>') || pattern.pattern.includes('lambda')) {
                    category = 'functions';
                } else if (pattern.pattern.includes('class') || pattern.pattern.includes('interface')) {
                    category = 'oop';
                } else if (pattern.pattern.includes('async') || pattern.pattern.includes('await')) {
                    category = 'async';
                } else if (pattern.pattern.includes('try') || pattern.pattern.includes('catch') || pattern.pattern.includes('except')) {
                    category = 'error_handling';
                }
            } else if (pattern.patternType === 'naming') {
                category = 'naming_conventions';
            } else if (pattern.patternType === 'structure') {
                category = 'code_structure';
            }
            
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category)!.push(pattern);
        }
        
        return categories;
    }

    /**
     * Analyze correlation within a specific category
     */
    private async analyzeCorrelationInCategory(
        lang1: string,
        lang2: string,
        category: string,
        patterns1: LearnedPattern[],
        patterns2: LearnedPattern[]
    ): Promise<void> {
        // Calculate usage strength in each language
        const strength1 = this.calculateCategoryStrength(patterns1);
        const strength2 = this.calculateCategoryStrength(patterns2);
        
        // If both languages show significant usage in this category
        if (strength1 > 0.3 && strength2 > 0.3) {
            const correlationId = `${lang1}_${lang2}_${category}`;
            
            let correlation = this.crossLanguageCorrelations.get(correlationId);
            if (!correlation) {
                correlation = {
                    correlationId,
                    languages: [lang1, lang2],
                    patternCategory: category,
                    commonConcept: this.determineCommonConcept(category),
                    languageSpecificPatterns: {
                        [lang1]: patterns1.map(p => p.pattern),
                        [lang2]: patterns2.map(p => p.pattern)
                    },
                    strength: 0,
                    evidence: []
                };
                this.crossLanguageCorrelations.set(correlationId, correlation);
            }
            
            // Calculate correlation strength
            correlation.strength = (strength1 + strength2) / 2;
            
            // Add evidence
            correlation.evidence.push({
                timestamp: Date.now(),
                evidenceType: 'pattern_frequency',
                sourceLanguage: lang1,
                targetLanguage: lang2,
                description: `Strong usage patterns detected in both languages for ${category}`,
                weight: correlation.strength
            });
        }
    }

    /**
     * Calculate strength of pattern usage in a category
     */
    private calculateCategoryStrength(patterns: LearnedPattern[]): number {
        if (patterns.length === 0) return 0;
        
        const totalConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0);
        const totalUsage = patterns.reduce((sum, p) => sum + p.usage.accepted, 0);
        const averageConfidence = totalConfidence / patterns.length;
        
        return averageConfidence * Math.min(1, totalUsage / 10); // Normalize usage
    }

    /**
     * Determine common concept for a category
     */
    private determineCommonConcept(category: string): string {
        const conceptMap: { [key: string]: string } = {
            'functions': 'Function definition and usage patterns',
            'oop': 'Object-oriented programming constructs',
            'async': 'Asynchronous programming patterns',
            'error_handling': 'Error handling and exception management',
            'naming_conventions': 'Identifier naming patterns',
            'code_structure': 'Code organization and structure'
        };
        
        return conceptMap[category] || 'General programming patterns';
    }

    /**
     * Update pattern mappings based on user feedback
     */
    private async updatePatternMappings(patterns: LearnedPattern[]): Promise<void> {
        // This would analyze user patterns and update existing mappings
        // For now, we'll focus on tracking usage of existing mappings
        
        for (const [key, mapping] of this.languageMappings.entries()) {
            // Find patterns that match this mapping
            const sourcePatterns = patterns.filter(p => 
                p.language === mapping.sourceLanguage && 
                p.pattern.includes(mapping.sourcePattern)
            );
            
            if (sourcePatterns.length > 0) {
                // Update usage statistics
                mapping.usage.suggested += sourcePatterns.length;
                
                const acceptedCount = sourcePatterns.reduce((sum, p) => sum + p.usage.accepted, 0);
                const rejectedCount = sourcePatterns.reduce((sum, p) => sum + p.usage.rejected, 0);
                
                mapping.usage.accepted += acceptedCount;
                mapping.usage.rejected += rejectedCount;
                
                // Recalculate effectiveness
                const totalSuggested = mapping.usage.suggested;
                if (totalSuggested > 0) {
                    mapping.usage.effectiveness = mapping.usage.accepted / totalSuggested;
                    
                    // Adjust confidence based on effectiveness
                    if (mapping.usage.effectiveness > 0.7) {
                        mapping.confidence = Math.min(0.95, mapping.confidence + 0.05);
                    } else if (mapping.usage.effectiveness < 0.3) {
                        mapping.confidence = Math.max(0.1, mapping.confidence - 0.05);
                    }
                }
            }
        }
    }

    /**
     * Get cross-language suggestions based on user's patterns
     */
    public getCrossLanguageSuggestions(
        currentLanguage: string,
        userPatterns: LearnedPattern[],
        targetLanguage?: string
    ): LanguagePatternMapping[] {
        const suggestions: LanguagePatternMapping[] = [];
        
        // If target language is specified, focus on that
        const targetLanguages = targetLanguage ? [targetLanguage] : this.getAllSupportedLanguages();
        
        for (const target of targetLanguages) {
            if (target === currentLanguage) continue;
            
            // Find mappings from current language to target
            const mappings = this.findMappingsForLanguagePair(currentLanguage, target);
            
            // Score mappings based on user's pattern preferences
            for (const mapping of mappings) {
                const relevanceScore = this.calculateMappingRelevance(mapping, userPatterns);
                
                if (relevanceScore > 0.3) {
                    // Adjust confidence based on relevance
                    const adjustedMapping = {
                        ...mapping,
                        confidence: mapping.confidence * relevanceScore
                    };
                    suggestions.push(adjustedMapping);
                }
            }
        }
        
        return suggestions.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Find mappings for a specific language pair
     */
    private findMappingsForLanguagePair(sourceLanguage: string, targetLanguage: string): LanguagePatternMapping[] {
        const mappings: LanguagePatternMapping[] = [];
        
        for (const mapping of this.languageMappings.values()) {
            if (mapping.sourceLanguage === sourceLanguage && mapping.targetLanguage === targetLanguage) {
                mappings.push(mapping);
            }
        }
        
        return mappings;
    }

    /**
     * Calculate how relevant a mapping is to user's patterns
     */
    private calculateMappingRelevance(mapping: LanguagePatternMapping, userPatterns: LearnedPattern[]): number {
        let relevance = 0;
        
        // Check if user has patterns that match the source pattern
        const matchingPatterns = userPatterns.filter(p => 
            p.language === mapping.sourceLanguage && 
            this.patternsMatch(p.pattern, mapping.sourcePattern)
        );
        
        if (matchingPatterns.length > 0) {
            // Calculate average confidence of matching patterns
            const avgConfidence = matchingPatterns.reduce((sum, p) => sum + p.confidence, 0) / matchingPatterns.length;
            relevance += avgConfidence * 0.6;
            
            // Factor in usage frequency
            const totalUsage = matchingPatterns.reduce((sum, p) => sum + p.usage.accepted, 0);
            relevance += Math.min(0.4, totalUsage / 10);
        }
        
        // Check paradigm alignment
        const paradigmBonus = this.calculateParadigmAlignment(mapping);
        relevance += paradigmBonus * 0.2;
        
        return Math.min(1, relevance);
    }

    /**
     * Check if two patterns match
     */
    private patternsMatch(pattern1: string, pattern2: string): boolean {
        const p1 = pattern1.toLowerCase();
        const p2 = pattern2.toLowerCase();
        
        // Simple keyword matching (can be improved with more sophisticated algorithms)
        return p1.includes(p2) || p2.includes(p1) || this.haveSimilarKeywords(p1, p2);
    }

    /**
     * Check if patterns have similar keywords
     */
    private haveSimilarKeywords(pattern1: string, pattern2: string): boolean {
        const keywords1 = pattern1.split(/\W+/).filter(w => w.length > 2);
        const keywords2 = pattern2.split(/\W+/).filter(w => w.length > 2);
        
        const commonKeywords = keywords1.filter(k => keywords2.includes(k));
        
        return commonKeywords.length > 0;
    }

    /**
     * Calculate paradigm alignment bonus
     */
    private calculateParadigmAlignment(mapping: LanguagePatternMapping): number {
        // Find paradigms that include both languages
        for (const paradigm of this.PARADIGMS) {
            if (paradigm.languages.includes(mapping.sourceLanguage) && 
                paradigm.languages.includes(mapping.targetLanguage)) {
                
                const userPreference = this.userParadigmPreferences.get(paradigm.name) || 0;
                if (userPreference > 0.5) {
                    return userPreference;
                }
            }
        }
        
        return 0;
    }

    /**
     * Learn from user feedback on cross-language suggestions
     */
    public async learnFromCrossLanguageFeedback(
        mapping: LanguagePatternMapping,
        feedback: FeedbackData
    ): Promise<void> {
        const key = `${mapping.sourceLanguage}_${mapping.targetLanguage}_${mapping.sourcePattern}`;
        const storedMapping = this.languageMappings.get(key);
        
        if (storedMapping) {
            // Update usage statistics
            if (feedback.action === 'accept') {
                storedMapping.usage.accepted++;
                storedMapping.confidence = Math.min(0.95, storedMapping.confidence + 0.02);
            } else if (feedback.action === 'reject') {
                storedMapping.usage.rejected++;
                storedMapping.confidence = Math.max(0.1, storedMapping.confidence - 0.03);
            }
            
            storedMapping.usage.suggested++;
            storedMapping.usage.effectiveness = storedMapping.usage.accepted / storedMapping.usage.suggested;
            
            // Add correlation evidence
            const correlationId = `${mapping.sourceLanguage}_${mapping.targetLanguage}_${mapping.mappingType}`;
            const correlation = this.crossLanguageCorrelations.get(correlationId);
            
            if (correlation) {
                correlation.evidence.push({
                    timestamp: Date.now(),
                    evidenceType: 'user_acceptance',
                    sourceLanguage: mapping.sourceLanguage,
                    targetLanguage: mapping.targetLanguage,
                    description: `User ${feedback.action}ed cross-language suggestion`,
                    weight: feedback.action === 'accept' ? 0.1 : -0.1
                });
                
                // Recalculate correlation strength
                const recentEvidence = correlation.evidence.filter(e => 
                    e.timestamp > Date.now() - 30 * 24 * 60 * 60 * 1000 // Last 30 days
                );
                const evidenceWeight = recentEvidence.reduce((sum, e) => sum + e.weight, 0);
                correlation.strength = Math.max(0, Math.min(1, correlation.strength + evidenceWeight * 0.1));
            }
            
            await this.saveData();
        }
    }

    /**
     * Get all supported languages
     */
    private getAllSupportedLanguages(): string[] {
        const languages = new Set<string>();
        
        for (const mapping of this.languageMappings.values()) {
            languages.add(mapping.sourceLanguage);
            languages.add(mapping.targetLanguage);
        }
        
        return Array.from(languages);
    }

    /**
     * Get cross-language insights
     */
    public getCrossLanguageInsights(): {
        strongestCorrelations: CrossLanguageCorrelation[];
        mostEffectiveMappings: LanguagePatternMapping[];
        paradigmPreferences: { [paradigm: string]: number };
        languageTransitionRecommendations: { from: string; to: string; reason: string; confidence: number }[];
    } {
        // Get strongest correlations
        const strongestCorrelations = Array.from(this.crossLanguageCorrelations.values())
            .filter(c => c.strength > 0.5)
            .sort((a, b) => b.strength - a.strength)
            .slice(0, 10);
        
        // Get most effective mappings
        const mostEffectiveMappings = Array.from(this.languageMappings.values())
            .filter(m => m.usage.suggested > 5 && m.usage.effectiveness > 0.7)
            .sort((a, b) => b.usage.effectiveness - a.usage.effectiveness)
            .slice(0, 10);
        
        // Get paradigm preferences
        const paradigmPreferences = Object.fromEntries(this.userParadigmPreferences);
        
        // Generate language transition recommendations
        const recommendations = this.generateLanguageTransitionRecommendations();
        
        return {
            strongestCorrelations,
            mostEffectiveMappings,
            paradigmPreferences,
            languageTransitionRecommendations: recommendations
        };
    }

    /**
     * Generate language transition recommendations
     */
    private generateLanguageTransitionRecommendations(): { from: string; to: string; reason: string; confidence: number }[] {
        const recommendations: { from: string; to: string; reason: string; confidence: number }[] = [];
        
        // Find user's most used languages
        const languageUsage = new Map<string, number>();
        for (const mapping of this.languageMappings.values()) {
            languageUsage.set(mapping.sourceLanguage, (languageUsage.get(mapping.sourceLanguage) || 0) + mapping.usage.accepted);
        }
        
        const topLanguages = Array.from(languageUsage.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([lang, _]) => lang);
        
        // Generate recommendations based on paradigm preferences
        const topParadigm = Array.from(this.userParadigmPreferences.entries())
            .sort((a, b) => b[1] - a[1])[0];
        
        if (topParadigm && topParadigm[1] > 0.6) {
            const [paradigmName, confidence] = topParadigm;
            const paradigm = this.PARADIGMS.find(p => p.name === paradigmName);
            
            if (paradigm) {
                for (const fromLang of topLanguages) {
                    for (const toLang of paradigm.languages) {
                        if (toLang !== fromLang && !topLanguages.includes(toLang)) {
                            recommendations.push({
                                from: fromLang,
                                to: toLang,
                                reason: `Strong ${paradigmName} paradigm preference - ${toLang} offers excellent ${paradigmName} features`,
                                confidence: confidence * 0.8
                            });
                        }
                    }
                }
            }
        }
        
        return recommendations.slice(0, 5);
    }

    /**
     * Load data from storage
     */
    private async loadData(): Promise<void> {
        try {
            const mappingsData = this.context.globalState.get<{ [key: string]: LanguagePatternMapping }>(this.STORAGE_KEY_MAPPINGS, {});
            this.languageMappings = new Map(Object.entries(mappingsData));
            
            const correlationsData = this.context.globalState.get<{ [key: string]: CrossLanguageCorrelation }>(this.STORAGE_KEY_CORRELATIONS, {});
            this.crossLanguageCorrelations = new Map(Object.entries(correlationsData));
            
            const paradigmsData = this.context.globalState.get<{ [key: string]: number }>(this.STORAGE_KEY_PARADIGMS, {});
            this.userParadigmPreferences = new Map(Object.entries(paradigmsData));
            
            console.log(`Loaded ${this.languageMappings.size} language mappings and ${this.crossLanguageCorrelations.size} correlations`);
        } catch (error) {
            console.error('Error loading multi-language data:', error);
        }
    }

    /**
     * Save data to storage
     */
    private async saveData(): Promise<void> {
        try {
            const mappingsData = Object.fromEntries(this.languageMappings);
            await this.context.globalState.update(this.STORAGE_KEY_MAPPINGS, mappingsData);
            
            const correlationsData = Object.fromEntries(this.crossLanguageCorrelations);
            await this.context.globalState.update(this.STORAGE_KEY_CORRELATIONS, correlationsData);
            
            const paradigmsData = Object.fromEntries(this.userParadigmPreferences);
            await this.context.globalState.update(this.STORAGE_KEY_PARADIGMS, paradigmsData);
        } catch (error) {
            console.error('Error saving multi-language data:', error);
        }
    }
}
