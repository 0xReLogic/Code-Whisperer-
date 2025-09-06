import * as vscode from 'vscode';
import { FeedbackData } from './feedbackSystem';
import { LearnedPattern } from './patternAdaptationEngine';

// Interface untuk coding personality traits
export interface CodingPersonalityTraits {
    verbosity: VerbosityLevel;
    abstraction: AbstractionLevel;
    paradigm: ProgrammingParadigm;
    structure: StructuralPreference;
    naming: NamingStyle;
    commenting: CommentingStyle;
    riskTolerance: RiskTolerance;
    optimization: OptimizationFocus;
    collaboration: CollaborationStyle;
    learning: LearningStyle;
}

export type VerbosityLevel = 'minimal' | 'concise' | 'descriptive' | 'verbose' | 'exhaustive';
export type AbstractionLevel = 'concrete' | 'practical' | 'moderate' | 'abstract' | 'theoretical';
export type ProgrammingParadigm = 'procedural' | 'object_oriented' | 'functional' | 'declarative' | 'hybrid';
export type StructuralPreference = 'flat' | 'modular' | 'hierarchical' | 'layered' | 'microservices';
export type NamingStyle = 'terse' | 'conventional' | 'descriptive' | 'domain_specific' | 'self_documenting';
export type CommentingStyle = 'minimal' | 'inline' | 'block' | 'documentation' | 'comprehensive';
export type RiskTolerance = 'conservative' | 'cautious' | 'balanced' | 'adventurous' | 'cutting_edge';
export type OptimizationFocus = 'readability' | 'performance' | 'memory' | 'maintainability' | 'scalability';
export type CollaborationStyle = 'independent' | 'peer_review' | 'pair_programming' | 'team_oriented' | 'mentoring';
export type LearningStyle = 'documentation' | 'experimentation' | 'examples' | 'community' | 'formal_training';

// Interface untuk personality indicators
export interface PersonalityIndicator {
    trait: keyof CodingPersonalityTraits;
    value: string;
    confidence: number;
    evidence: string[];
    frequency: number;
}

// Interface untuk coding DNA pattern
export interface CodingDNAPattern {
    patternId: string;
    name: string;
    category: DNACategory;
    indicators: PersonalityIndicator[];
    strength: number;
    consistency: number;
    evolution: EvolutionTrend;
    examples: CodeExample[];
}

export type DNACategory = 
    | 'architectural_thinking'
    | 'code_aesthetics'
    | 'problem_solving'
    | 'abstraction_preference'
    | 'quality_focus'
    | 'innovation_tendency'
    | 'collaboration_patterns'
    | 'learning_approach';

export type EvolutionTrend = 'stable' | 'growing' | 'declining' | 'fluctuating' | 'emerging';

export interface CodeExample {
    code: string;
    context: string;
    traits: string[];
    explanation: string;
    quality: number;
}

// Interface untuk personality profile
export interface CodingPersonalityProfile {
    userId: string;
    traits: CodingPersonalityTraits;
    dnaPatterns: CodingDNAPattern[];
    strengths: string[];
    growthAreas: string[];
    preferredTechnologies: TechnologyPreference[];
    workingStyle: WorkingStyle;
    communicationStyle: CommunicationStyle;
    profileConfidence: number;
    lastUpdated: Date;
}

export interface TechnologyPreference {
    technology: string;
    category: 'language' | 'framework' | 'tool' | 'platform';
    proficiency: number;
    enthusiasm: number;
    usage_frequency: number;
}

export interface WorkingStyle {
    planningApproach: 'detailed' | 'outline' | 'adaptive' | 'emergent';
    feedbackPreference: 'immediate' | 'periodic' | 'milestone' | 'completion';
    changeAdaptation: 'resistant' | 'cautious' | 'accepting' | 'embracing';
    complexityHandling: 'simplify' | 'decompose' | 'abstract' | 'systematic';
}

export interface CommunicationStyle {
    codeComments: 'sparse' | 'functional' | 'explanatory' | 'tutorial';
    commitMessages: 'terse' | 'descriptive' | 'detailed' | 'narrative';
    documentation: 'minimal' | 'functional' | 'comprehensive' | 'tutorial';
    teamInteraction: 'independent' | 'collaborative' | 'supportive' | 'mentoring';
}

// Interface untuk personality insights
export interface PersonalityInsight {
    category: string;
    insight: string;
    evidence: string[];
    confidence: number;
    recommendations: string[];
}

export class CodingPersonalityProfiler {
    private context: vscode.ExtensionContext;
    private personalityProfile: CodingPersonalityProfile;
    private recentAnalysis: Map<string, any> = new Map();
    private codeMetrics: Map<string, any> = new Map();
    private readonly STORAGE_KEY_PROFILE = 'codeWhispererPersonalityProfile';
    private readonly ANALYSIS_WINDOW_DAYS = 30;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.personalityProfile = this.initializeProfile();
        this.loadData();
    }

    /**
     * Initialize personality profile
     */
    private initializeProfile(): CodingPersonalityProfile {
        return {
            userId: 'user',
            traits: {
                verbosity: 'concise',
                abstraction: 'practical',
                paradigm: 'hybrid',
                structure: 'modular',
                naming: 'conventional',
                commenting: 'inline',
                riskTolerance: 'balanced',
                optimization: 'readability',
                collaboration: 'peer_review',
                learning: 'examples'
            },
            dnaPatterns: [],
            strengths: [],
            growthAreas: [],
            preferredTechnologies: [],
            workingStyle: {
                planningApproach: 'adaptive',
                feedbackPreference: 'periodic',
                changeAdaptation: 'accepting',
                complexityHandling: 'decompose'
            },
            communicationStyle: {
                codeComments: 'functional',
                commitMessages: 'descriptive',
                documentation: 'functional',
                teamInteraction: 'collaborative'
            },
            profileConfidence: 0.1,
            lastUpdated: new Date()
        };
    }

    /**
     * Analyze code to extract personality traits
     */
    public async analyzeCodePersonality(document: vscode.TextDocument): Promise<void> {
        const content = document.getText();
        const language = document.languageId;
        const fileName = document.fileName;
        
        // Extract various personality indicators
        const analysis = {
            verbosityAnalysis: this.analyzeVerbosity(content),
            abstractionAnalysis: this.analyzeAbstraction(content, language),
            paradigmAnalysis: this.analyzeParadigm(content, language),
            structureAnalysis: this.analyzeStructure(content, language),
            namingAnalysis: this.analyzeNaming(content, language),
            commentingAnalysis: this.analyzeCommenting(content),
            riskAnalysis: this.analyzeRiskTolerance(content, language),
            optimizationAnalysis: this.analyzeOptimizationFocus(content),
            qualityIndicators: this.analyzeQualityFocus(content, language),
            innovationIndicators: this.analyzeInnovationTendency(content, language)
        };
        
        // Update personality profile
        await this.updatePersonalityProfile(analysis, language);
        
        // Store analysis
        this.recentAnalysis.set(fileName, {
            timestamp: Date.now(),
            analysis,
            language,
            fileSize: content.length,
            complexity: this.calculateComplexity(content)
        });
        
        await this.saveData();
    }

    /**
     * Analyze verbosity level from code
     */
    private analyzeVerbosity(content: string): any {
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
        
        // Count various verbosity indicators
        const commentLines = lines.filter(line => 
            line.trim().startsWith('//') || 
            line.trim().startsWith('#') || 
            line.trim().startsWith('*')
        ).length;
        
        const longVariableNames = (content.match(/\b\w{10,}\b/g) || []).length;
        const descriptiveComments = (content.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || [])
            .filter(comment => comment.length > 50).length;
        
        let verbosityScore = 0;
        
        if (avgLineLength > 80) verbosityScore += 1;
        if (commentLines / lines.length > 0.2) verbosityScore += 1;
        if (longVariableNames > 5) verbosityScore += 1;
        if (descriptiveComments > 3) verbosityScore += 1;
        
        const levels: VerbosityLevel[] = ['minimal', 'concise', 'descriptive', 'verbose', 'exhaustive'];
        
        return {
            level: levels[Math.min(verbosityScore, 4)],
            score: verbosityScore / 4,
            avgLineLength,
            commentRatio: commentLines / lines.length,
            longNameCount: longVariableNames,
            evidence: [
                `Average line length: ${avgLineLength.toFixed(1)}`,
                `Comment ratio: ${(commentLines / lines.length * 100).toFixed(1)}%`,
                `Long variable names: ${longVariableNames}`
            ]
        };
    }

    /**
     * Analyze abstraction level preferences
     */
    private analyzeAbstraction(content: string, language: string): any {
        let abstractionScore = 0;
        const evidence: string[] = [];
        
        // Check for abstract patterns
        const abstractPatterns = [
            'interface', 'abstract', 'generic', 'template',
            'factory', 'builder', 'strategy', 'observer',
            'decorator', 'adapter', 'facade'
        ];
        
        const concretePatterns = [
            'hardcode', 'literal', 'direct', 'specific',
            'manual', 'explicit'
        ];
        
        for (const pattern of abstractPatterns) {
            const matches = (content.toLowerCase().match(new RegExp(pattern, 'g')) || []).length;
            if (matches > 0) {
                abstractionScore += matches * 0.2;
                evidence.push(`Uses ${pattern} pattern (${matches} times)`);
            }
        }
        
        for (const pattern of concretePatterns) {
            const matches = (content.toLowerCase().match(new RegExp(pattern, 'g')) || []).length;
            abstractionScore -= matches * 0.1;
        }
        
        // Check for design patterns
        const designPatterns = this.detectDesignPatterns(content);
        abstractionScore += designPatterns.length * 0.3;
        evidence.push(...designPatterns.map(p => `Uses ${p} design pattern`));
        
        // Check for generic/template usage
        const generics = (content.match(/<[A-Z][^>]*>/g) || []).length;
        abstractionScore += generics * 0.1;
        if (generics > 0) {
            evidence.push(`Uses generics/templates (${generics} times)`);
        }
        
        const levels: AbstractionLevel[] = ['concrete', 'practical', 'moderate', 'abstract', 'theoretical'];
        const normalizedScore = Math.max(0, Math.min(1, abstractionScore / 3));
        
        return {
            level: levels[Math.floor(normalizedScore * 4)],
            score: normalizedScore,
            designPatterns,
            genericsUsage: generics,
            evidence
        };
    }

    /**
     * Detect design patterns in code
     */
    private detectDesignPatterns(content: string): string[] {
        const patterns: string[] = [];
        const lowerContent = content.toLowerCase();
        
        const patternSignatures = {
            'Factory': ['factory', 'create', 'builder'],
            'Observer': ['observer', 'notify', 'subscribe', 'listener'],
            'Strategy': ['strategy', 'algorithm', 'behavior'],
            'Decorator': ['decorator', 'wrapper', 'enhance'],
            'Singleton': ['singleton', 'instance', 'getinstance'],
            'Adapter': ['adapter', 'convert', 'translate'],
            'Command': ['command', 'execute', 'action'],
            'State': ['state', 'context', 'transition']
        };
        
        for (const [pattern, signatures] of Object.entries(patternSignatures)) {
            const matchCount = signatures.reduce((count, sig) => 
                count + (lowerContent.match(new RegExp(sig, 'g')) || []).length, 0);
            
            if (matchCount >= 2) {
                patterns.push(pattern);
            }
        }
        
        return patterns;
    }

    /**
     * Analyze programming paradigm preferences
     */
    private analyzeParadigm(content: string, language: string): any {
        const paradigmScores = {
            procedural: 0,
            object_oriented: 0,
            functional: 0,
            declarative: 0
        };
        
        const evidence: string[] = [];
        
        // Procedural indicators
        const functions = (content.match(/function\s+\w+|def\s+\w+/g) || []).length;
        paradigmScores.procedural += functions * 0.1;
        if (functions > 0) evidence.push(`Functions defined: ${functions}`);
        
        // OOP indicators
        const classes = (content.match(/class\s+\w+/g) || []).length;
        const methods = (content.match(/\.\w+\(/g) || []).length;
        const inheritance = (content.match(/extends|implements|inherits/g) || []).length;
        
        paradigmScores.object_oriented += classes * 0.3 + methods * 0.05 + inheritance * 0.2;
        if (classes > 0) evidence.push(`Classes defined: ${classes}`);
        if (inheritance > 0) evidence.push(`Inheritance used: ${inheritance} times`);
        
        // Functional indicators
        const functionalPatterns = ['map', 'filter', 'reduce', 'forEach', 'lambda', '=>'];
        for (const pattern of functionalPatterns) {
            const matches = (content.match(new RegExp(pattern, 'g')) || []).length;
            paradigmScores.functional += matches * 0.1;
        }
        
        const higherOrderFunctions = (content.match(/\w+\s*=>\s*\w+\s*=>/g) || []).length;
        paradigmScores.functional += higherOrderFunctions * 0.3;
        if (higherOrderFunctions > 0) evidence.push(`Higher-order functions: ${higherOrderFunctions}`);
        
        // Declarative indicators  
        const declarativePatterns = ['select', 'from', 'where', 'join', 'query'];
        for (const pattern of declarativePatterns) {
            const matches = (content.match(new RegExp(pattern, 'gi')) || []).length;
            paradigmScores.declarative += matches * 0.2;
        }
        
        // Find dominant paradigm
        const dominantEntry = Object.entries(paradigmScores)
            .sort(([,a], [,b]) => b - a)[0];
        const dominant = dominantEntry?.[0] as ProgrammingParadigm || 'hybrid';
        
        // Check if it's hybrid (multiple paradigms with similar scores)
        const sortedScores = Object.values(paradigmScores).sort((a, b) => b - a);
        const isHybrid = sortedScores.length >= 2 && 
                        sortedScores[0] !== undefined && 
                        sortedScores[1] !== undefined && 
                        (sortedScores[0] - sortedScores[1]) < 0.5;
        
        return {
            paradigm: isHybrid ? 'hybrid' : dominant,
            scores: paradigmScores,
            isHybrid,
            evidence
        };
    }

    /**
     * Analyze structural preferences
     */
    private analyzeStructure(content: string, language: string): any {
        const structureScore = {
            flat: 0,
            modular: 0,
            hierarchical: 0,
            layered: 0
        };
        
        const evidence: string[] = [];
        
        // Count imports/includes
        const imports = (content.match(/import|#include|require|using/g) || []).length;
        structureScore.modular += imports * 0.1;
        if (imports > 5) evidence.push(`High import usage: ${imports}`);
        
        // Count nested structures
        const nestingLevel = this.calculateMaxNesting(content);
        if (nestingLevel > 3) {
            structureScore.hierarchical += nestingLevel * 0.2;
            evidence.push(`Deep nesting: ${nestingLevel} levels`);
        } else {
            structureScore.flat += (4 - nestingLevel) * 0.2;
        }
        
        // Check for layered patterns
        const layeredPatterns = ['controller', 'service', 'repository', 'model', 'view'];
        for (const pattern of layeredPatterns) {
            if (content.toLowerCase().includes(pattern)) {
                structureScore.layered += 0.3;
                evidence.push(`Uses ${pattern} layer`);
            }
        }
        
        // Check for modular patterns
        const modularPatterns = ['module', 'component', 'plugin', 'middleware'];
        for (const pattern of modularPatterns) {
            const matches = (content.toLowerCase().match(new RegExp(pattern, 'g')) || []).length;
            structureScore.modular += matches * 0.2;
        }
        
        const dominantEntry = Object.entries(structureScore)
            .sort(([,a], [,b]) => b - a)[0];
        const dominant = (dominantEntry?.[0] as StructuralPreference) || 'modular';
        
        return {
            preference: dominant,
            scores: structureScore,
            nestingLevel,
            importsCount: imports,
            evidence
        };
    }

    /**
     * Calculate maximum nesting level
     */
    private calculateMaxNesting(content: string): number {
        let maxNesting = 0;
        let currentNesting = 0;
        
        for (const char of content) {
            if (char === '{' || char === '(') {
                currentNesting++;
                maxNesting = Math.max(maxNesting, currentNesting);
            } else if (char === '}' || char === ')') {
                currentNesting--;
            }
        }
        
        return maxNesting;
    }

    /**
     * Analyze naming style preferences
     */
    private analyzeNaming(content: string, language: string): any {
        const names = this.extractNames(content, language);
        const evidence: string[] = [];
        
        let terseCount = 0;
        let descriptiveCount = 0;
        let domainSpecificCount = 0;
        
        for (const name of names) {
            if (name.length <= 3) {
                terseCount++;
            } else if (name.length >= 10) {
                descriptiveCount++;
            }
            
            if (this.isDomainSpecific(name)) {
                domainSpecificCount++;
            }
        }
        
        const totalNames = names.length;
        const terseRatio = terseCount / totalNames;
        const descriptiveRatio = descriptiveCount / totalNames;
        const domainRatio = domainSpecificCount / totalNames;
        
        evidence.push(`Average name length: ${names.reduce((sum, name) => sum + name.length, 0) / totalNames || 0}`);
        evidence.push(`Terse names: ${(terseRatio * 100).toFixed(1)}%`);
        evidence.push(`Descriptive names: ${(descriptiveRatio * 100).toFixed(1)}%`);
        
        let style: NamingStyle;
        if (terseRatio > 0.4) style = 'terse';
        else if (descriptiveRatio > 0.3) style = 'descriptive';
        else if (domainRatio > 0.2) style = 'domain_specific';
        else if (descriptiveRatio > 0.5) style = 'self_documenting';
        else style = 'conventional';
        
        return {
            style,
            terseRatio,
            descriptiveRatio,
            domainRatio,
            avgLength: names.reduce((sum, name) => sum + name.length, 0) / totalNames || 0,
            evidence
        };
    }

    /**
     * Extract variable and function names from code
     */
    private extractNames(content: string, language: string): string[] {
        const names: string[] = [];
        
        // Common patterns for different languages
        const patterns = [
            /(?:var|let|const)\s+(\w+)/g,
            /function\s+(\w+)/g,
            /def\s+(\w+)/g,
            /class\s+(\w+)/g,
            /(\w+)\s*=/g,
            /(\w+)\s*:/g
        ];
        
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (match[1] && match[1].length > 1) {
                    names.push(match[1]);
                }
            }
        }
        
        return [...new Set(names)]; // Remove duplicates
    }

    /**
     * Check if name is domain-specific
     */
    private isDomainSpecific(name: string): boolean {
        const domainPatterns = [
            'user', 'auth', 'login', 'session', 'token', 'api', 'http',
            'database', 'db', 'sql', 'query', 'repository', 'service',
            'controller', 'model', 'view', 'component', 'handler'
        ];
        
        const lowerName = name.toLowerCase();
        return domainPatterns.some(pattern => lowerName.includes(pattern));
    }

    /**
     * Analyze commenting style
     */
    private analyzeCommenting(content: string): any {
        const lines = content.split('\n');
        const totalLines = lines.length;
        
        let inlineComments = 0;
        let blockComments = 0;
        let documentationComments = 0;
        let todoComments = 0;
        
        let inBlockComment = false;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Block comments
            if (trimmedLine.includes('/*') || trimmedLine.includes('"""') || trimmedLine.includes("'''")) {
                inBlockComment = true;
                if (trimmedLine.includes('/**') || trimmedLine.includes('"""')) {
                    documentationComments++;
                } else {
                    blockComments++;
                }
            }
            
            if (trimmedLine.includes('*/') || trimmedLine.includes('"""') || trimmedLine.includes("'''")) {
                inBlockComment = false;
            }
            
            // Inline comments
            if (!inBlockComment && (trimmedLine.includes('//') || trimmedLine.includes('#'))) {
                inlineComments++;
                
                if (trimmedLine.toLowerCase().includes('todo') || 
                    trimmedLine.toLowerCase().includes('fixme')) {
                    todoComments++;
                }
            }
        }
        
        const commentRatio = (inlineComments + blockComments + documentationComments) / totalLines;
        const docRatio = documentationComments / (inlineComments + blockComments + documentationComments || 1);
        
        let style: CommentingStyle;
        if (commentRatio < 0.1) style = 'minimal';
        else if (docRatio > 0.3) style = 'documentation';
        else if (blockComments > inlineComments) style = 'block';
        else if (commentRatio > 0.3) style = 'comprehensive';
        else style = 'inline';
        
        return {
            style,
            commentRatio,
            inlineComments,
            blockComments,
            documentationComments,
            todoComments,
            evidence: [
                `Comment ratio: ${(commentRatio * 100).toFixed(1)}%`,
                `Inline comments: ${inlineComments}`,
                `Block comments: ${blockComments}`,
                `Documentation comments: ${documentationComments}`
            ]
        };
    }

    /**
     * Analyze risk tolerance
     */
    private analyzeRiskTolerance(content: string, language: string): any {
        let riskScore = 0;
        const evidence: string[] = [];
        
        // Conservative indicators
        const conservativePatterns = [
            'null check', 'undefined check', 'try.*catch', 'except',
            'validate', 'assert', 'defensive', 'guard'
        ];
        
        // Risky indicators
        const riskyPatterns = [
            'eval', 'exec', 'innerHTML', 'dangerouslySetInnerHTML',
            'any', 'unknown', 'as.*any', 'suppresswarnings'
        ];
        
        // Cutting-edge indicators
        const cuttingEdgePatterns = [
            'experimental', 'beta', 'alpha', 'preview', 'unstable',
            'latest', 'edge', 'nightly'
        ];
        
        for (const pattern of conservativePatterns) {
            const matches = (content.match(new RegExp(pattern, 'gi')) || []).length;
            riskScore -= matches * 0.1;
            if (matches > 0) evidence.push(`Conservative: ${pattern} (${matches})`);
        }
        
        for (const pattern of riskyPatterns) {
            const matches = (content.match(new RegExp(pattern, 'gi')) || []).length;
            riskScore += matches * 0.2;
            if (matches > 0) evidence.push(`Risky: ${pattern} (${matches})`);
        }
        
        for (const pattern of cuttingEdgePatterns) {
            const matches = (content.match(new RegExp(pattern, 'gi')) || []).length;
            riskScore += matches * 0.3;
            if (matches > 0) evidence.push(`Cutting-edge: ${pattern} (${matches})`);
        }
        
        // Determine tolerance level
        let tolerance: RiskTolerance;
        if (riskScore < -0.5) tolerance = 'conservative';
        else if (riskScore < -0.2) tolerance = 'cautious';
        else if (riskScore < 0.2) tolerance = 'balanced';
        else if (riskScore < 0.5) tolerance = 'adventurous';
        else tolerance = 'cutting_edge';
        
        return {
            tolerance,
            score: riskScore,
            evidence
        };
    }

    /**
     * Analyze optimization focus
     */
    private analyzeOptimizationFocus(content: string): any {
        const focusScores = {
            readability: 0,
            performance: 0,
            memory: 0,
            maintainability: 0,
            scalability: 0
        };
        
        const evidence: string[] = [];
        
        // Readability indicators
        const readabilityPatterns = ['readable', 'clear', 'simple', 'clean'];
        for (const pattern of readabilityPatterns) {
            const matches = (content.toLowerCase().match(new RegExp(pattern, 'g')) || []).length;
            focusScores.readability += matches * 0.2;
        }
        
        // Performance indicators
        const performancePatterns = ['optimize', 'fast', 'efficient', 'performance', 'cache'];
        for (const pattern of performancePatterns) {
            const matches = (content.toLowerCase().match(new RegExp(pattern, 'g')) || []).length;
            focusScores.performance += matches * 0.2;
        }
        
        // Memory indicators
        const memoryPatterns = ['memory', 'heap', 'garbage', 'leak', 'allocation'];
        for (const pattern of memoryPatterns) {
            const matches = (content.toLowerCase().match(new RegExp(pattern, 'g')) || []).length;
            focusScores.memory += matches * 0.2;
        }
        
        // Maintainability indicators
        const maintainabilityPatterns = ['maintainable', 'refactor', 'modular', 'flexible'];
        for (const pattern of maintainabilityPatterns) {
            const matches = (content.toLowerCase().match(new RegExp(pattern, 'g')) || []).length;
            focusScores.maintainability += matches * 0.2;
        }
        
        // Scalability indicators
        const scalabilityPatterns = ['scalable', 'scale', 'distributed', 'concurrent'];
        for (const pattern of scalabilityPatterns) {
            const matches = (content.toLowerCase().match(new RegExp(pattern, 'g')) || []).length;
            focusScores.scalability += matches * 0.2;
        }
        
        // Check for code quality indicators
        const qualityIndicators = this.analyzeCodeQuality(content);
        focusScores.readability += qualityIndicators.readabilityScore;
        focusScores.maintainability += qualityIndicators.maintainabilityScore;
        
        const dominantEntry = Object.entries(focusScores)
            .sort(([,a], [,b]) => b - a)[0];
        const dominant = (dominantEntry?.[0] as OptimizationFocus) || 'readability';
        
        return {
            focus: dominant,
            scores: focusScores,
            evidence
        };
    }

    /**
     * Analyze code quality indicators
     */
    private analyzeCodeQuality(content: string): any {
        let readabilityScore = 0;
        let maintainabilityScore = 0;
        
        // Line length (readability)
        const lines = content.split('\n');
        const longLines = lines.filter(line => line.length > 100).length;
        readabilityScore -= longLines * 0.1;
        
        // Function length (maintainability)
        const functions = content.match(/function[\s\S]*?(?=function|\n\n|$)/g) || [];
        const longFunctions = functions.filter(func => func.split('\n').length > 20).length;
        maintainabilityScore -= longFunctions * 0.2;
        
        // Consistent indentation (readability)
        const indentationConsistent = this.checkIndentationConsistency(content);
        if (indentationConsistent) readabilityScore += 0.3;
        
        return {
            readabilityScore: Math.max(0, readabilityScore),
            maintainabilityScore: Math.max(0, maintainabilityScore)
        };
    }

    /**
     * Check indentation consistency
     */
    private checkIndentationConsistency(content: string): boolean {
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        let spaceIndents = 0;
        let tabIndents = 0;
        
        for (const line of lines) {
            if (line.startsWith('    ')) spaceIndents++;
            if (line.startsWith('\t')) tabIndents++;
        }
        
        return Math.abs(spaceIndents - tabIndents) / lines.length < 0.1;
    }

    /**
     * Analyze quality focus patterns
     */
    private analyzeQualityFocus(content: string, language: string): any {
        const qualityIndicators = {
            testing: 0,
            documentation: 0,
            errorHandling: 0,
            codeReview: 0,
            performance: 0
        };
        
        // Testing indicators
        const testPatterns = ['test', 'spec', 'assert', 'expect', 'mock'];
        for (const pattern of testPatterns) {
            const matches = (content.toLowerCase().match(new RegExp(pattern, 'g')) || []).length;
            qualityIndicators.testing += matches * 0.1;
        }
        
        // Documentation indicators
        const docPatterns = ['/**', '"""', 'readme', 'documentation'];
        for (const pattern of docPatterns) {
            const matches = (content.toLowerCase().match(new RegExp(pattern, 'g')) || []).length;
            qualityIndicators.documentation += matches * 0.1;
        }
        
        // Error handling indicators
        const errorPatterns = ['try', 'catch', 'except', 'finally', 'error'];
        for (const pattern of errorPatterns) {
            const matches = (content.toLowerCase().match(new RegExp(pattern, 'g')) || []).length;
            qualityIndicators.errorHandling += matches * 0.1;
        }
        
        return qualityIndicators;
    }

    /**
     * Analyze innovation tendency
     */
    private analyzeInnovationTendency(content: string, language: string): any {
        let innovationScore = 0;
        const evidence: string[] = [];
        
        // New language features
        const modernFeatures = this.detectModernFeatures(content, language);
        innovationScore += modernFeatures.length * 0.2;
        evidence.push(...modernFeatures.map(f => `Uses modern feature: ${f}`));
        
        // Experimental patterns
        const experimentalPatterns = ['experimental', 'prototype', 'poc', 'alpha', 'beta'];
        for (const pattern of experimentalPatterns) {
            const matches = (content.toLowerCase().match(new RegExp(pattern, 'g')) || []).length;
            innovationScore += matches * 0.3;
        }
        
        // Creative solutions
        const creativityIndicators = ['hack', 'clever', 'trick', 'workaround', 'innovative'];
        for (const indicator of creativityIndicators) {
            const matches = (content.toLowerCase().match(new RegExp(indicator, 'g')) || []).length;
            innovationScore += matches * 0.2;
        }
        
        return {
            score: Math.min(1, innovationScore),
            modernFeatures,
            evidence
        };
    }

    /**
     * Detect modern language features
     */
    private detectModernFeatures(content: string, language: string): string[] {
        const features: string[] = [];
        
        const languageFeatures: { [key: string]: string[] } = {
            javascript: [
                'async/await', 'arrow functions', 'destructuring', 'template literals',
                'optional chaining', 'nullish coalescing', 'dynamic imports'
            ],
            typescript: [
                'type guards', 'mapped types', 'conditional types', 'template literal types',
                'const assertions', 'satisfies operator'
            ],
            python: [
                'f-strings', 'async/await', 'type hints', 'dataclasses',
                'pattern matching', 'walrus operator'
            ]
        };
        
        const patterns: { [key: string]: RegExp[] } = {
            'async/await': [/async\s+function/, /await\s+/],
            'arrow functions': [/=>\s*{/, /=>\s*\w/],
            'destructuring': [/{\s*\w+\s*}/, /\[\s*\w+\s*\]/],
            'template literals': [/`[^`]*\$\{[^}]*\}[^`]*`/],
            'optional chaining': [/\?\./],
            'nullish coalescing': [/\?\?/],
            'f-strings': [/f["'][^"']*\{[^}]*\}[^"']*["']/],
            'type hints': [/:\s*\w+\s*=/, /def\s+\w+\([^)]*:\s*\w+/]
        };
        
        const relevantFeatures = languageFeatures[language] || [];
        
        for (const feature of relevantFeatures) {
            const featurePatterns = patterns[feature];
            if (featurePatterns && featurePatterns.some(pattern => pattern.test(content))) {
                features.push(feature);
            }
        }
        
        return features;
    }

    /**
     * Calculate overall code complexity
     */
    private calculateComplexity(content: string): number {
        let complexity = 1; // Base complexity
        
        // Cyclomatic complexity indicators
        const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', 'and', 'or'];
        for (const keyword of complexityKeywords) {
            const matches = (content.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
            complexity += matches;
        }
        
        // Nesting penalty
        const nestingLevel = this.calculateMaxNesting(content);
        complexity += nestingLevel * 2;
        
        // Function count
        const functions = (content.match(/function|def |=>/g) || []).length;
        complexity += functions * 0.5;
        
        return Math.round(complexity * 10) / 10;
    }

    /**
     * Update personality profile based on analysis
     */
    private async updatePersonalityProfile(analysis: any, language: string): Promise<void> {
        const profile = this.personalityProfile;
        
        // Update traits with weighted averaging
        const updateWeight = 0.1; // How much new analysis affects existing profile
        
        // Update verbosity
        const verbosityMap = { minimal: 0, concise: 0.25, descriptive: 0.5, verbose: 0.75, exhaustive: 1 };
        const currentVerbosity = verbosityMap[profile.traits.verbosity];
        const newVerbosity = verbosityMap[analysis.verbosityAnalysis.level as VerbosityLevel] ?? 0.5;
        const avgVerbosity = currentVerbosity * (1 - updateWeight) + newVerbosity * updateWeight;
        profile.traits.verbosity = Object.entries(verbosityMap)
            .find(([_, value]) => Math.abs(value - avgVerbosity) < 0.13)?.[0] as VerbosityLevel || 'concise';
        
        // Update abstraction
        const abstractionMap = { concrete: 0, practical: 0.25, moderate: 0.5, abstract: 0.75, theoretical: 1 };
        const currentAbstraction = abstractionMap[profile.traits.abstraction];
        const newAbstraction = abstractionMap[analysis.abstractionAnalysis.level as AbstractionLevel] ?? 0.5;
        const avgAbstraction = currentAbstraction * (1 - updateWeight) + newAbstraction * updateWeight;
        profile.traits.abstraction = Object.entries(abstractionMap)
            .find(([_, value]) => Math.abs(value - avgAbstraction) < 0.13)?.[0] as AbstractionLevel || 'practical';
        
        // Update paradigm
        profile.traits.paradigm = analysis.paradigmAnalysis.paradigm;
        
        // Update structure preference
        profile.traits.structure = analysis.structureAnalysis.preference;
        
        // Update naming style
        profile.traits.naming = analysis.namingAnalysis.style;
        
        // Update commenting style
        profile.traits.commenting = analysis.commentingAnalysis.style;
        
        // Update risk tolerance
        profile.traits.riskTolerance = analysis.riskAnalysis.tolerance;
        
        // Update optimization focus
        profile.traits.optimization = analysis.optimizationAnalysis.focus;
        
        // Update DNA patterns
        this.updateDNAPatterns(analysis, language);
        
        // Update technology preferences
        this.updateTechnologyPreferences(language);
        
        // Increment profile confidence
        profile.profileConfidence = Math.min(1, profile.profileConfidence + 0.05);
        profile.lastUpdated = new Date();
    }

    /**
     * Update DNA patterns
     */
    private updateDNAPatterns(analysis: any, language: string): void {
        // Create or update architectural thinking pattern
        const architecturalPattern: CodingDNAPattern = {
            patternId: 'architectural_thinking',
            name: 'Architectural Thinking',
            category: 'architectural_thinking',
            indicators: [
                {
                    trait: 'abstraction',
                    value: analysis.abstractionAnalysis.level,
                    confidence: 0.8,
                    evidence: analysis.abstractionAnalysis.evidence,
                    frequency: 1
                },
                {
                    trait: 'structure',
                    value: analysis.structureAnalysis.preference,
                    confidence: 0.7,
                    evidence: analysis.structureAnalysis.evidence,
                    frequency: 1
                }
            ],
            strength: (analysis.abstractionAnalysis.score + analysis.structureAnalysis.scores[analysis.structureAnalysis.preference]) / 2,
            consistency: 0.8,
            evolution: 'stable',
            examples: []
        };
        
        // Update or add the pattern
        const existingIndex = this.personalityProfile.dnaPatterns.findIndex(p => p.patternId === 'architectural_thinking');
        if (existingIndex >= 0) {
            this.personalityProfile.dnaPatterns[existingIndex] = architecturalPattern;
        } else {
            this.personalityProfile.dnaPatterns.push(architecturalPattern);
        }
    }

    /**
     * Update technology preferences
     */
    private updateTechnologyPreferences(language: string): void {
        const existing = this.personalityProfile.preferredTechnologies.find(t => t.technology === language);
        
        if (existing) {
            existing.usage_frequency += 1;
            existing.proficiency = Math.min(1, existing.proficiency + 0.05);
        } else {
            this.personalityProfile.preferredTechnologies.push({
                technology: language,
                category: 'language',
                proficiency: 0.3,
                enthusiasm: 0.5,
                usage_frequency: 1
            });
        }
    }

    /**
     * Generate personality insights
     */
    public generatePersonalityInsights(): PersonalityInsight[] {
        const insights: PersonalityInsight[] = [];
        const profile = this.personalityProfile;
        
        // Verbosity insight
        insights.push({
            category: 'Communication Style',
            insight: `You prefer ${profile.traits.verbosity} code with ${profile.traits.commenting} comments`,
            evidence: [
                `Code verbosity: ${profile.traits.verbosity}`,
                `Comment style: ${profile.traits.commenting}`,
                `Documentation approach: ${profile.communicationStyle.documentation}`
            ],
            confidence: profile.profileConfidence,
            recommendations: this.getVerbosityRecommendations(profile.traits.verbosity)
        });
        
        // Paradigm insight
        insights.push({
            category: 'Programming Approach',
            insight: `You favor ${profile.traits.paradigm} programming with ${profile.traits.structure} architecture`,
            evidence: [
                `Primary paradigm: ${profile.traits.paradigm}`,
                `Structural preference: ${profile.traits.structure}`,
                `Abstraction level: ${profile.traits.abstraction}`
            ],
            confidence: profile.profileConfidence,
            recommendations: this.getParadigmRecommendations(profile.traits.paradigm)
        });
        
        // Quality focus insight
        insights.push({
            category: 'Quality Focus',
            insight: `You optimize for ${profile.traits.optimization} with ${profile.traits.riskTolerance} risk tolerance`,
            evidence: [
                `Optimization focus: ${profile.traits.optimization}`,
                `Risk tolerance: ${profile.traits.riskTolerance}`,
                `Error handling approach: ${profile.traits.riskTolerance}`
            ],
            confidence: profile.profileConfidence,
            recommendations: this.getQualityRecommendations(profile.traits.optimization)
        });
        
        return insights;
    }

    /**
     * Get verbosity recommendations
     */
    private getVerbosityRecommendations(verbosity: VerbosityLevel): string[] {
        const recommendations: { [key in VerbosityLevel]: string[] } = {
            minimal: [
                'Consider adding more descriptive comments for complex logic',
                'Document public APIs and interfaces',
                'Use meaningful variable names even if longer'
            ],
            concise: [
                'Good balance of brevity and clarity',
                'Consider adding examples in documentation',
                'Maintain consistent naming conventions'
            ],
            descriptive: [
                'Your detailed style helps team understanding',
                'Watch for over-commenting obvious code',
                'Focus comments on why, not what'
            ],
            verbose: [
                'Consider consolidating repetitive comments',
                'Focus on high-level documentation',
                'Use code structure to convey meaning'
            ],
            exhaustive: [
                'Simplify documentation for better readability',
                'Trust your variable names to be self-documenting',
                'Focus comments on complex business logic only'
            ]
        };
        
        return recommendations[verbosity] || [];
    }

    /**
     * Get paradigm recommendations
     */
    private getParadigmRecommendations(paradigm: ProgrammingParadigm): string[] {
        const recommendations: { [key in ProgrammingParadigm]: string[] } = {
            procedural: [
                'Consider object-oriented patterns for complex data',
                'Explore functional programming for data transformations',
                'Use modules to organize related functions'
            ],
            object_oriented: [
                'Apply SOLID principles consistently',
                'Consider composition over inheritance',
                'Use interfaces for better testability'
            ],
            functional: [
                'Leverage immutability for safer code',
                'Use higher-order functions effectively',
                'Consider functional reactive programming'
            ],
            declarative: [
                'Focus on what rather than how',
                'Use domain-specific languages when appropriate',
                'Combine with imperative code when needed'
            ],
            hybrid: [
                'Your multi-paradigm approach is flexible',
                'Ensure consistency within modules',
                'Document paradigm choices for the team'
            ]
        };
        
        return recommendations[paradigm] || [];
    }

    /**
     * Get quality recommendations
     */
    private getQualityRecommendations(optimization: OptimizationFocus): string[] {
        const recommendations: { [key in OptimizationFocus]: string[] } = {
            readability: [
                'Your focus on readable code benefits the team',
                'Consider automated formatting tools',
                'Add examples to complex algorithms'
            ],
            performance: [
                'Profile before optimizing',
                'Document performance-critical sections',
                'Consider readability vs performance tradeoffs'
            ],
            memory: [
                'Use memory profiling tools',
                'Document memory-sensitive operations',
                'Consider lazy loading patterns'
            ],
            maintainability: [
                'Excellent focus on long-term code health',
                'Use dependency injection for flexibility',
                'Consider refactoring patterns'
            ],
            scalability: [
                'Design for horizontal scaling',
                'Consider microservices architecture',
                'Use caching and queuing strategically'
            ]
        };
        
        return recommendations[optimization] || [];
    }

    /**
     * Generate personality summary
     */
    public getPersonalitySummary(): {
        profile: CodingPersonalityProfile;
        insights: PersonalityInsight[];
        strengths: string[];
        growthAreas: string[];
        recommendations: string[];
    } {
        const insights = this.generatePersonalityInsights();
        const strengths = this.identifyStrengths();
        const growthAreas = this.identifyGrowthAreas();
        const recommendations = this.generateRecommendations();
        
        return {
            profile: this.personalityProfile,
            insights,
            strengths,
            growthAreas,
            recommendations
        };
    }

    /**
     * Identify coding strengths
     */
    private identifyStrengths(): string[] {
        const strengths: string[] = [];
        const traits = this.personalityProfile.traits;
        
        if (traits.verbosity === 'descriptive' || traits.commenting === 'comprehensive') {
            strengths.push('Excellent documentation and communication skills');
        }
        
        if (traits.paradigm === 'hybrid') {
            strengths.push('Flexible multi-paradigm programming approach');
        }
        
        if (traits.optimization === 'maintainability') {
            strengths.push('Strong focus on long-term code quality');
        }
        
        if (traits.riskTolerance === 'balanced') {
            strengths.push('Well-balanced approach to risk and innovation');
        }
        
        if (traits.abstraction === 'moderate' || traits.abstraction === 'abstract') {
            strengths.push('Good architectural and design thinking');
        }
        
        return strengths;
    }

    /**
     * Identify growth areas
     */
    private identifyGrowthAreas(): string[] {
        const growthAreas: string[] = [];
        const traits = this.personalityProfile.traits;
        
        if (traits.verbosity === 'minimal' && traits.commenting === 'minimal') {
            growthAreas.push('Could benefit from more documentation and comments');
        }
        
        if (traits.paradigm === 'procedural' && traits.structure === 'flat') {
            growthAreas.push('Consider exploring object-oriented or functional patterns');
        }
        
        if (traits.riskTolerance === 'conservative') {
            growthAreas.push('Could explore new technologies and patterns more');
        }
        
        if (traits.optimization === 'performance' && traits.abstraction === 'concrete') {
            growthAreas.push('Balance performance optimization with code maintainability');
        }
        
        return growthAreas;
    }

    /**
     * Generate personalized recommendations
     */
    private generateRecommendations(): string[] {
        const recommendations: string[] = [];
        const profile = this.personalityProfile;
        
        // Based on confidence level
        if (profile.profileConfidence < 0.5) {
            recommendations.push('Continue coding to build a more complete personality profile');
        }
        
        // Technology recommendations
        const mostUsedTech = profile.preferredTechnologies
            .sort((a, b) => b.usage_frequency - a.usage_frequency)[0];
        
        if (mostUsedTech) {
            recommendations.push(`Consider exploring advanced ${mostUsedTech.technology} patterns and best practices`);
        }
        
        // Learning style recommendations
        if (profile.traits.learning === 'examples') {
            recommendations.push('Explore code examples and open source projects for learning');
        } else if (profile.traits.learning === 'documentation') {
            recommendations.push('Deep dive into official documentation and specifications');
        }
        
        return recommendations;
    }

    /**
     * Learn from user feedback
     */
    public async learnFromPersonalityFeedback(
        trait: keyof CodingPersonalityTraits,
        suggestedValue: string,
        feedback: FeedbackData
    ): Promise<void> {
        if (feedback.action === 'accept') {
            // Update the trait if user accepts the suggestion
            (this.personalityProfile.traits as any)[trait] = suggestedValue;
            this.personalityProfile.profileConfidence = Math.min(1, this.personalityProfile.profileConfidence + 0.1);
        } else if (feedback.action === 'reject') {
            // Lower confidence in current analysis
            this.personalityProfile.profileConfidence = Math.max(0.1, this.personalityProfile.profileConfidence - 0.05);
        }
        
        await this.saveData();
    }

    /**
     * Load data from storage
     */
    private async loadData(): Promise<void> {
        try {
            const profileData = this.context.globalState.get<CodingPersonalityProfile>(this.STORAGE_KEY_PROFILE);
            if (profileData) {
                this.personalityProfile = {
                    ...profileData,
                    lastUpdated: new Date(profileData.lastUpdated)
                };
            }
            
            console.log(`Loaded personality profile with confidence: ${this.personalityProfile.profileConfidence}`);
        } catch (error) {
            console.error('Error loading personality profile:', error);
        }
    }

    /**
     * Save data to storage
     */
    private async saveData(): Promise<void> {
        try {
            await this.context.globalState.update(this.STORAGE_KEY_PROFILE, this.personalityProfile);
        } catch (error) {
            console.error('Error saving personality profile:', error);
        }
    }
}
