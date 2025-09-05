import * as vscode from 'vscode';
import { getWasmLoader } from './wasmLoader';
import { getStatusBarManager } from './statusBar';
import { CodeWhispererConfig } from './config';

interface AnalysisResult {
    patterns: any[];
    suggestions: any[];
    metrics: {
        analysisTime: number;
        confidence: number;
        patternCount: number;
    };
}

interface AnalysisTask {
    document: vscode.TextDocument;
    version: number;
    timestamp: number;
}

export class RealTimeAnalyzer {
    private static instance: RealTimeAnalyzer | undefined;
    private analysisQueue: Map<string, AnalysisTask> = new Map();
    private debounceTimer: NodeJS.Timeout | undefined;
    private isAnalyzing = false;
    private disposables: vscode.Disposable[] = [];
    private lastAnalysisResults: Map<string, AnalysisResult> = new Map();

    private constructor() {
        this.setupEventListeners();
    }

    public static getInstance(): RealTimeAnalyzer {
        if (!RealTimeAnalyzer.instance) {
            RealTimeAnalyzer.instance = new RealTimeAnalyzer();
        }
        return RealTimeAnalyzer.instance;
    }

    private setupEventListeners(): void {
        // Listen to document changes
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument((event) => {
                this.queueAnalysis(event.document);
            })
        );

        // Listen to active editor changes
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor && editor.document) {
                    this.queueAnalysis(editor.document);
                }
            })
        );

        // Listen to configuration changes
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration((event) => {
                if (event.affectsConfiguration('codeWhisperer')) {
                    this.onConfigurationChanged();
                }
            })
        );
    }

    private queueAnalysis(document: vscode.TextDocument): void {
        // Skip non-supported file types
        if (!this.isSupportedDocument(document)) {
            return;
        }

        // Check if real-time analysis is enabled
        if (!CodeWhispererConfig.realTimeAnalysis) {
            return;
        }

        // Queue the analysis with debouncing
        const uri = document.uri.toString();
        const task: AnalysisTask = {
            document,
            version: document.version,
            timestamp: Date.now()
        };

        this.analysisQueue.set(uri, task);
        this.debounceAnalysis();
    }

    private debounceAnalysis(): void {
        // Clear existing timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Get debounce delay from configuration
        const debounceDelay = CodeWhispererConfig.suggestionDelay;

        this.debounceTimer = setTimeout(() => {
            this.processAnalysisQueue();
        }, debounceDelay);
    }

    private async processAnalysisQueue(): Promise<void> {
        if (this.isAnalyzing || this.analysisQueue.size === 0) {
            return;
        }

        this.isAnalyzing = true;
        const statusBar = getStatusBarManager();
        
        try {
            statusBar.startAnalysis();
            
            // Process all queued analysis tasks
            const tasks = Array.from(this.analysisQueue.values());
            this.analysisQueue.clear();

            for (const task of tasks) {
                await this.analyzeDocument(task);
            }

            statusBar.stopAnalysis();
        } catch (error) {
            console.error('Analysis error:', error);
            statusBar.showError('Analysis failed');
        } finally {
            this.isAnalyzing = false;
        }
    }

    private async analyzeDocument(task: AnalysisTask): Promise<void> {
        const { document, version } = task;
        
        // Check if document is still valid and hasn't changed
        if (document.version !== version || document.isClosed) {
            return;
        }

        const startTime = Date.now();
        const wasmLoader = getWasmLoader();
        
        try {
            // Use mock engine for analysis
            const mockEngine = await wasmLoader.getEngine();
            
            // Perform analysis using mock engine
            const analysisResult = mockEngine.analyzeCode(document.getText(), {
                filePath: document.uri.fsPath,
                language: document.languageId
            });
            
            // Extract patterns and suggestions from analysis result
            const patterns = analysisResult.patterns || [];
            const suggestions = analysisResult.suggestions || [];

            // Calculate metrics
            const analysisTime = Date.now() - startTime;
            const confidence = this.calculateConfidence(patterns, suggestions);
            
            const result: AnalysisResult = {
                patterns,
                suggestions,
                metrics: {
                    analysisTime,
                    confidence,
                    patternCount: patterns.length
                }
            };

            // Store results
            this.lastAnalysisResults.set(document.uri.toString(), result);

            // Update status bar
            const statusBar = getStatusBarManager();
            statusBar.updatePatternCount(patterns.length);

            // Trigger events for other components
            this.onAnalysisComplete(document, result);

        } catch (error) {
            console.error(`Analysis failed for ${document.uri.toString()}:`, error);
            throw error;
        }
    }

    private calculateConfidence(patterns: any[], suggestions: any[]): number {
        // Simple confidence calculation based on pattern quality and count
        if (patterns.length === 0) {
            return 0;
        }

        const avgPatternConfidence = patterns.reduce((sum, pattern) => 
            sum + (pattern.confidence || 0.5), 0) / patterns.length;
        
        const suggestionBonus = Math.min(suggestions.length * 0.1, 0.3);
        
        return Math.min(avgPatternConfidence + suggestionBonus, 1.0);
    }

    private onAnalysisComplete(document: vscode.TextDocument, result: AnalysisResult): void {
        // Emit analysis complete event for other components
        vscode.commands.executeCommand('codeWhisperer.onAnalysisComplete', {
            document: document.uri.toString(),
            result
        });
    }

    private isSupportedDocument(document: vscode.TextDocument): boolean {
        // Check if document type is supported
        const supportedLanguages = [
            'typescript', 'javascript', 'python', 'java', 'cpp', 'c',
            'csharp', 'go', 'rust', 'php', 'ruby', 'kotlin', 'swift'
        ];

        return supportedLanguages.includes(document.languageId) &&
               document.uri.scheme === 'file' &&
               !document.isUntitled;
    }

    private onConfigurationChanged(): void {
        // Clear queue if real-time analysis is disabled
        if (!CodeWhispererConfig.realTimeAnalysis) {
            this.analysisQueue.clear();
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = undefined;
            }
        }

        // Reanalyze active document if settings changed
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && CodeWhispererConfig.realTimeAnalysis) {
            this.queueAnalysis(activeEditor.document);
        }
    }

    public getLastAnalysisResult(uri: string): AnalysisResult | undefined {
        return this.lastAnalysisResults.get(uri);
    }

    public async forceAnalysis(document?: vscode.TextDocument): Promise<void> {
        const targetDocument = document || vscode.window.activeTextEditor?.document;
        
        if (!targetDocument) {
            vscode.window.showWarningMessage('No active document to analyze');
            return;
        }

        const task: AnalysisTask = {
            document: targetDocument,
            version: targetDocument.version,
            timestamp: Date.now()
        };

        await this.analyzeDocument(task);
    }

    public getAnalysisStats(): {
        queueSize: number;
        isAnalyzing: boolean;
        totalResults: number;
    } {
        return {
            queueSize: this.analysisQueue.size,
            isAnalyzing: this.isAnalyzing,
            totalResults: this.lastAnalysisResults.size
        };
    }

    public clearAnalysisCache(): void {
        this.lastAnalysisResults.clear();
        this.analysisQueue.clear();
        
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = undefined;
        }
    }

    public dispose(): void {
        this.clearAnalysisCache();
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        RealTimeAnalyzer.instance = undefined;
    }
}

// Export singleton instance getter
export function getRealTimeAnalyzer(): RealTimeAnalyzer {
    return RealTimeAnalyzer.getInstance();
}
