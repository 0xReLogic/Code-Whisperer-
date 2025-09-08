import * as vscode from 'vscode';
import * as path from 'path';
import { CodeWhispererConfig } from './config';

/**
 * WASM module interface definition
 */
export interface WasmModule {
    CodeWhispererEngine: any;
    EngineConfig: any;
    EditorContext: any;
    create_default_config(): any;
    validate_syntax(code: string, language: string): boolean;
    init(): void;
}

/**
 * WASM module loader and manager
 */
export class WasmLoader {
    private static instance: WasmLoader;
    private wasmModule: WasmModule | null = null;
    private engine: any = null;
    private isLoading = false;
    private loadPromise: Promise<WasmModule> | null = null;
    private context: vscode.ExtensionContext | null = null;

    private constructor() {}

    static getInstance(): WasmLoader {
        if (!this.instance) {
            this.instance = new WasmLoader();
        }
        return this.instance;
    }

    /**
     * Set the extension context for persistent storage
     */
    setContext(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Get persistent statistics from storage - REAL DATA ONLY
     */
    private getPersistentStats() {
        if (!this.context) {
            return {
                totalPatterns: 0,
                totalSuggestions: 0,
                acceptedSuggestions: 0,
                rejectedSuggestions: 0,
                totalAnalyses: 0,
                confidenceSum: 0
            };
        }

        return {
            totalPatterns: this.context.globalState.get('codeWhisperer.totalPatterns', 0),
            totalSuggestions: this.context.globalState.get('codeWhisperer.totalSuggestions', 0),
            acceptedSuggestions: this.context.globalState.get('codeWhisperer.acceptedSuggestions', 0),
            rejectedSuggestions: this.context.globalState.get('codeWhisperer.rejectedSuggestions', 0),
            totalAnalyses: this.context.globalState.get('codeWhisperer.totalAnalyses', 0),
            confidenceSum: this.context.globalState.get('codeWhisperer.confidenceSum', 0)
        };
    }

    /**
     * Update persistent statistics with REAL data
     */
    private async updatePersistentStats(stats: any) {
        if (!this.context) return;

        await this.context.globalState.update('codeWhisperer.totalPatterns', stats.totalPatterns);
        await this.context.globalState.update('codeWhisperer.totalSuggestions', stats.totalSuggestions);
        await this.context.globalState.update('codeWhisperer.acceptedSuggestions', stats.acceptedSuggestions);
        await this.context.globalState.update('codeWhisperer.rejectedSuggestions', stats.rejectedSuggestions);
        await this.context.globalState.update('codeWhisperer.totalAnalyses', stats.totalAnalyses);
        await this.context.globalState.update('codeWhisperer.confidenceSum', stats.confidenceSum);
    }

    /**
     * Calculate REAL acceptance rate from actual user feedback
     */
    private calculateAcceptanceRate(stats: any): number {
        const totalFeedback = stats.acceptedSuggestions + stats.rejectedSuggestions;
        if (totalFeedback === 0) return 0;
        return stats.acceptedSuggestions / totalFeedback;
    }

    /**
     * Calculate REAL average confidence from actual analyses
     */
    private calculateAverageConfidence(stats: any): number {
        if (stats.totalAnalyses === 0) return 0;
        return stats.confidenceSum / stats.totalAnalyses;
    }

    /**
     * Increment analysis count and update confidence - REAL tracking
     */
    async incrementAnalysis(confidence: number) {
        const stats = this.getPersistentStats();
        stats.totalAnalyses += 1;
        stats.confidenceSum += confidence;
        await this.updatePersistentStats(stats);
    }

    /**
     * Add real pattern when detected - REAL tracking  
     */
    async addRealPattern() {
        const stats = this.getPersistentStats();
        stats.totalPatterns += 1;
        await this.updatePersistentStats(stats);
    }

    /**
     * Load the WASM module
     */
    async loadModule(): Promise<WasmModule> {
        if (this.wasmModule) {
            return this.wasmModule;
        }

        if (this.isLoading && this.loadPromise) {
            return this.loadPromise;
        }

        this.isLoading = true;
        this.loadPromise = this.performLoad();

        try {
            this.wasmModule = await this.loadPromise;
            return this.wasmModule;
        } finally {
            this.isLoading = false;
        }
    }

    private async performLoad(): Promise<WasmModule> {
        try {
            if (CodeWhispererConfig.debugMode) {
                console.log('Loading Code Whisperer WASM module...');
            }

            // For now, we'll create a mock interface until WASM is fully integrated
            // TODO: Replace with actual WASM loading
            const wasmLoader = this; // Reference to access context
            const mockWasmModule: WasmModule = {
                CodeWhispererEngine: class {
                    constructor(config: any) {
                        if (CodeWhispererConfig.debugMode) {
                            console.log('Creating CodeWhispererEngine with config:', config);
                        }
                    }

                    analyzeCode(code: string, context: any) {
                        return {
                            patterns: this.extractPatterns(code),
                            suggestions: this.generateSuggestions(code),
                            confidence: 0.85,
                            processingTime: Math.random() * 100 + 50
                        };
                    }

                    private extractPatterns(code: string) {
                        const patterns = [];
                        
                        // Mock pattern detection
                        if (code.includes('function')) {
                            patterns.push({
                                type: 'function_declaration',
                                confidence: 0.9,
                                location: { line: 1, column: 1 }
                            });
                        }

                        if (code.includes('const ') || code.includes('let ') || code.includes('var ')) {
                            patterns.push({
                                type: 'variable_declaration',
                                confidence: 0.8,
                                location: { line: 1, column: 1 }
                            });
                        }

                        if (code.includes('class ')) {
                            patterns.push({
                                type: 'class_declaration',
                                confidence: 0.95,
                                location: { line: 1, column: 1 }
                            });
                        }

                        return patterns;
                    }

                    private generateSuggestions(code: string) {
                        const suggestions = [];
                        
                        // Mock suggestions based on detected patterns
                        if (code.includes('console.log')) {
                            suggestions.push({
                                type: 'refactor',
                                message: 'Consider using a proper logging library',
                                confidence: 0.7,
                                priority: 'medium'
                            });
                        }

                        if (code.includes('var ')) {
                            suggestions.push({
                                type: 'modernize',
                                message: 'Consider using const or let instead of var',
                                confidence: 0.9,
                                priority: 'high'
                            });
                        }

                        if (code.includes('==')) {
                            suggestions.push({
                                type: 'best_practice',
                                message: 'Consider using strict equality (===) instead of ==',
                                confidence: 0.8,
                                priority: 'medium'
                            });
                        }

                        return suggestions;
                    }

                    learnFromFeedback(suggestionId: string, accepted: boolean) {
                        if (CodeWhispererConfig.debugMode) {
                            console.log(`Learning from feedback: ${suggestionId} -> ${accepted}`);
                        }
                        
                        // Update REAL statistics based on actual user feedback
                        const currentStats = wasmLoader.getPersistentStats();
                        currentStats.totalSuggestions += 1;
                        
                        if (accepted) {
                            currentStats.acceptedSuggestions += 1;
                        } else {
                            currentStats.rejectedSuggestions += 1;
                        }
                        
                        wasmLoader.updatePersistentStats(currentStats);
                        return true;
                    }

                    getStatistics() {
                        const persistentStats = wasmLoader.getPersistentStats();
                        return {
                            totalPatterns: persistentStats.totalPatterns,
                            totalSuggestions: persistentStats.totalSuggestions,
                            acceptanceRate: wasmLoader.calculateAcceptanceRate(persistentStats),
                            averageConfidence: wasmLoader.calculateAverageConfidence(persistentStats),
                            lastUpdated: new Date().toISOString()
                        };
                    }

                    addPattern(pattern: any) {
                        // Add REAL pattern from actual analysis
                        wasmLoader.addRealPattern();
                        wasmLoader.incrementAnalysis(pattern.confidence);
                    }
                },

                EngineConfig: class {
                    public learning_mode: string;
                    public analysis_depth: string;
                    public confidence_threshold: number;
                    public max_suggestions: number;
                    public enabled_languages: string[];
                    public cache_size: number;
                    public pattern_expiry_days: number;

                    constructor() {
                        this.learning_mode = CodeWhispererConfig.learningMode;
                        this.analysis_depth = CodeWhispererConfig.analysisDepth;
                        this.confidence_threshold = CodeWhispererConfig.confidenceThreshold;
                        this.max_suggestions = CodeWhispererConfig.maxSuggestions;
                        this.enabled_languages = CodeWhispererConfig.enabledLanguages;
                        this.cache_size = CodeWhispererConfig.cacheSize;
                        this.pattern_expiry_days = CodeWhispererConfig.patternExpiryDays;
                    }
                },

                EditorContext: class {
                    public file_path: string;
                    public language: string;
                    public cursor_position: any;
                    public selection: any;
                    public surrounding_context: string;

                    constructor(editor: vscode.TextEditor) {
                        this.file_path = editor.document.fileName;
                        this.language = editor.document.languageId;
                        this.cursor_position = {
                            line: editor.selection.active.line,
                            character: editor.selection.active.character
                        };
                        this.selection = {
                            start: {
                                line: editor.selection.start.line,
                                character: editor.selection.start.character
                            },
                            end: {
                                line: editor.selection.end.line,
                                character: editor.selection.end.character
                            }
                        };
                        this.surrounding_context = this.getSurroundingContext(editor);
                    }

                    private getSurroundingContext(editor: vscode.TextEditor): string {
                        const document = editor.document;
                        const position = editor.selection.active;
                        const lineCount = document.lineCount;
                        
                        const startLine = Math.max(0, position.line - 5);
                        const endLine = Math.min(lineCount - 1, position.line + 5);
                        
                        let context = '';
                        for (let i = startLine; i <= endLine; i++) {
                            context += document.lineAt(i).text + '\n';
                        }
                        
                        return context;
                    }
                },

                create_default_config() {
                    return new this.EngineConfig();
                },

                validate_syntax(code: string, language: string): boolean {
                    // Mock syntax validation
                    if (!code || code.trim().length === 0) {
                        return false;
                    }

                    // Basic syntax checks for common issues
                    const openBraces = (code.match(/\{/g) || []).length;
                    const closeBraces = (code.match(/\}/g) || []).length;
                    const openParens = (code.match(/\(/g) || []).length;
                    const closeParens = (code.match(/\)/g) || []).length;

                    return openBraces === closeBraces && openParens === closeParens;
                },

                init() {
                    if (CodeWhispererConfig.debugMode) {
                        console.log('Code Whisperer WASM module initialized');
                    }
                }
            };

            // Initialize the module
            mockWasmModule.init();

            if (CodeWhispererConfig.debugMode) {
                console.log('WASM module loaded successfully');
            }

            return mockWasmModule;

        } catch (error) {
            console.error('Failed to load WASM module:', error);
            throw new Error(`Failed to load Code Whisperer core: ${error}`);
        }
    }

    /**
     * Get or create the engine instance
     */
    async getEngine(): Promise<any> {
        if (!this.engine) {
            const module = await this.loadModule();
            const config = module.create_default_config();
            this.engine = new module.CodeWhispererEngine(config);
        }
        return this.engine;
    }

    /**
     * Create editor context from active editor
     */
    async createEditorContext(editor: vscode.TextEditor): Promise<any> {
        const module = await this.loadModule();
        return new module.EditorContext(editor);
    }

    /**
     * Validate syntax using WASM module
     */
    async validateSyntax(code: string, language: string): Promise<boolean> {
        try {
            const module = await this.loadModule();
            return module.validate_syntax(code, language);
        } catch (error) {
            console.error('Syntax validation failed:', error);
            return false;
        }
    }

    /**
     * Check if WASM module is loaded
     */
    isLoaded(): boolean {
        return this.wasmModule !== null;
    }

    /**
     * Reload the WASM module
     */
    async reload(): Promise<WasmModule> {
        this.wasmModule = null;
        this.engine = null;
        this.isLoading = false;
        this.loadPromise = null;
        return this.loadModule();
    }

    /**
     * Get module performance metrics
     */
    getPerformanceMetrics() {
        return {
            isLoaded: this.isLoaded(),
            loadTime: this.loadPromise ? Date.now() : null,
            memoryUsage: process.memoryUsage ? process.memoryUsage() : null
        };
    }
}

/**
 * Convenience function to get WASM loader instance
 */
export function getWasmLoader(): WasmLoader {
    return WasmLoader.getInstance();
}
