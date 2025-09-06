import * as vscode from 'vscode';
import { getRealTimeAnalyzer } from './realTimeAnalyzer';
import { getWasmLoader } from './wasmLoader';
import { CodeWhispererConfig } from './config';

interface DiagnosticInfo {
    range: vscode.Range;
    severity: vscode.DiagnosticSeverity;
    message: string;
    source: string;
    code?: string | number;
    relatedInformation?: vscode.DiagnosticRelatedInformation[];
    tags?: vscode.DiagnosticTag[];
}

interface PatternDiagnostic {
    type: 'pattern-violation' | 'improvement-suggestion' | 'consistency-issue' | 'performance-warning';
    confidence: number;
    pattern: any;
    description: string;
    suggestions: string[];
    range: vscode.Range;
}

export class CodeWhispererDiagnosticProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private disposables: vscode.Disposable[] = [];
    private analysisCache = new Map<string, PatternDiagnostic[]>();

    constructor(context: vscode.ExtensionContext) {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('codeWhisperer');
        context.subscriptions.push(this.diagnosticCollection);
        
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Listen to document changes for diagnostic updates
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument((event) => {
                this.debounceUpdateDiagnostics(event.document);
            })
        );

        // Listen to active editor changes
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor) {
                    this.updateDiagnostics(editor.document);
                }
            })
        );

        // Listen to document close events
        this.disposables.push(
            vscode.workspace.onDidCloseTextDocument((document) => {
                this.diagnosticCollection.delete(document.uri);
                this.analysisCache.delete(document.uri.toString());
            })
        );

        // Listen to configuration changes
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration((event) => {
                if (event.affectsConfiguration('codeWhisperer')) {
                    this.refreshAllDiagnostics();
                }
            })
        );

        // Listen to analysis completion events
        this.disposables.push(
            vscode.commands.registerCommand('codeWhisperer.onAnalysisComplete', (data) => {
                const uri = vscode.Uri.parse(data.document);
                vscode.workspace.textDocuments.forEach(doc => {
                    if (doc.uri.toString() === uri.toString()) {
                        this.updateDiagnosticsFromAnalysis(doc, data.result);
                    }
                });
            })
        );
    }

    private debounceTimer: NodeJS.Timeout | undefined;
    private debounceUpdateDiagnostics(document: vscode.TextDocument): void {
        if (!CodeWhispererConfig.enableDiagnostics) {
            return;
        }

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.updateDiagnostics(document);
        }, 1000); // 1 second debounce
    }

    public async updateDiagnostics(document: vscode.TextDocument): Promise<void> {
        if (!CodeWhispererConfig.enableDiagnostics || !this.isSupportedDocument(document)) {
            return;
        }

        try {
            const patternDiagnostics = await this.analyzeDocumentForDiagnostics(document);
            const vsDiagnostics = this.convertToVSCodeDiagnostics(patternDiagnostics);
            
            this.diagnosticCollection.set(document.uri, vsDiagnostics);
            this.analysisCache.set(document.uri.toString(), patternDiagnostics);
        } catch (error) {
            if (CodeWhispererConfig.debugMode) {
                console.error('Diagnostic analysis error:', error);
            }
        }
    }

    private async updateDiagnosticsFromAnalysis(
        document: vscode.TextDocument,
        analysisResult: any
    ): Promise<void> {
        if (!CodeWhispererConfig.enableDiagnostics) {
            return;
        }

        try {
            const patternDiagnostics = this.extractDiagnosticsFromAnalysis(document, analysisResult);
            const vsDiagnostics = this.convertToVSCodeDiagnostics(patternDiagnostics);
            
            this.diagnosticCollection.set(document.uri, vsDiagnostics);
            this.analysisCache.set(document.uri.toString(), patternDiagnostics);
        } catch (error) {
            if (CodeWhispererConfig.debugMode) {
                console.error('Analysis-based diagnostic error:', error);
            }
        }
    }

    private async analyzeDocumentForDiagnostics(document: vscode.TextDocument): Promise<PatternDiagnostic[]> {
        const diagnostics: PatternDiagnostic[] = [];

        // Get existing analysis results
        const analyzer = getRealTimeAnalyzer();
        const analysisResult = analyzer.getLastAnalysisResult(document.uri.toString());

        if (analysisResult) {
            diagnostics.push(...this.extractDiagnosticsFromAnalysis(document, analysisResult));
        }

        // Add language-specific diagnostics
        diagnostics.push(...await this.getLanguageSpecificDiagnostics(document));

        // Add general code quality diagnostics
        diagnostics.push(...this.getCodeQualityDiagnostics(document));

        return diagnostics;
    }

    private extractDiagnosticsFromAnalysis(
        document: vscode.TextDocument,
        analysisResult: any
    ): PatternDiagnostic[] {
        const diagnostics: PatternDiagnostic[] = [];

        if (!analysisResult.patterns) {
            return diagnostics;
        }

        analysisResult.patterns.forEach((pattern: any) => {
            if (pattern.issues && pattern.issues.length > 0) {
                pattern.issues.forEach((issue: any) => {
                    const range = this.createRangeFromIssue(document, issue);
                    if (range) {
                        diagnostics.push({
                            type: this.mapIssueTypeToPatternDiagnostic(issue.type),
                            confidence: pattern.confidence || 0.5,
                            pattern,
                            description: issue.description || 'Pattern-based issue detected',
                            suggestions: issue.suggestions || [],
                            range
                        });
                    }
                });
            }

            // Check for consistency issues
            if (pattern.inconsistencies) {
                pattern.inconsistencies.forEach((inconsistency: any) => {
                    const range = this.createRangeFromIssue(document, inconsistency);
                    if (range) {
                        diagnostics.push({
                            type: 'consistency-issue',
                            confidence: pattern.confidence || 0.5,
                            pattern,
                            description: `Inconsistent ${pattern.type}: ${inconsistency.description}`,
                            suggestions: inconsistency.suggestions || [],
                            range
                        });
                    }
                });
            }
        });

        return diagnostics;
    }

    private async getLanguageSpecificDiagnostics(document: vscode.TextDocument): Promise<PatternDiagnostic[]> {
        const diagnostics: PatternDiagnostic[] = [];
        const languageId = document.languageId;

        switch (languageId) {
            case 'typescript':
            case 'javascript':
                diagnostics.push(...this.getJavaScriptDiagnostics(document));
                break;
            case 'python':
                diagnostics.push(...this.getPythonDiagnostics(document));
                break;
            case 'java':
                diagnostics.push(...this.getJavaDiagnostics(document));
                break;
        }

        return diagnostics;
    }

    private getJavaScriptDiagnostics(document: vscode.TextDocument): PatternDiagnostic[] {
        const diagnostics: PatternDiagnostic[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        lines.forEach((line, lineIndex) => {
            // Check for console.log in production code
            if (line.includes('console.log') && !line.includes('//')) {
                const charIndex = line.indexOf('console.log');
                const range = new vscode.Range(lineIndex, charIndex, lineIndex, charIndex + 11);
                
                diagnostics.push({
                    type: 'improvement-suggestion',
                    confidence: 0.8,
                    pattern: { type: 'console-log-detection' },
                    description: 'Consider removing console.log statements in production code',
                    suggestions: ['Use proper logging framework', 'Remove debug statements'],
                    range
                });
            }

            // Check for var usage (prefer let/const)
            const varMatch = line.match(/\bvar\s+/);
            if (varMatch) {
                const charIndex = line.indexOf(varMatch[0]);
                const range = new vscode.Range(lineIndex, charIndex, lineIndex, charIndex + varMatch[0].length);
                
                diagnostics.push({
                    type: 'improvement-suggestion',
                    confidence: 0.9,
                    pattern: { type: 'var-usage' },
                    description: 'Consider using "let" or "const" instead of "var"',
                    suggestions: ['Use "let" for mutable variables', 'Use "const" for immutable values'],
                    range
                });
            }

            // Check for == instead of ===
            const eqMatch = line.match(/[^=!]==(?!=)/);
            if (eqMatch) {
                const charIndex = line.indexOf(eqMatch[0]);
                const range = new vscode.Range(lineIndex, charIndex + 1, lineIndex, charIndex + 3);
                
                diagnostics.push({
                    type: 'improvement-suggestion',
                    confidence: 0.8,
                    pattern: { type: 'loose-equality' },
                    description: 'Consider using strict equality (===) instead of loose equality (==)',
                    suggestions: ['Use === for strict equality', 'Use !== for strict inequality'],
                    range
                });
            }
        });

        return diagnostics;
    }

    private getPythonDiagnostics(document: vscode.TextDocument): PatternDiagnostic[] {
        const diagnostics: PatternDiagnostic[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        lines.forEach((line, lineIndex) => {
            // Check for print statements (should use logging in production)
            if (line.trim().startsWith('print(') && !line.includes('#')) {
                const charIndex = line.indexOf('print');
                const range = new vscode.Range(lineIndex, charIndex, lineIndex, charIndex + 5);
                
                diagnostics.push({
                    type: 'improvement-suggestion',
                    confidence: 0.7,
                    pattern: { type: 'print-statement' },
                    description: 'Consider using logging instead of print statements',
                    suggestions: ['Use logging.info()', 'Use logging.debug()'],
                    range
                });
            }

            // Check for bare except clauses
            if (line.trim() === 'except:') {
                const charIndex = line.indexOf('except:');
                const range = new vscode.Range(lineIndex, charIndex, lineIndex, charIndex + 7);
                
                diagnostics.push({
                    type: 'pattern-violation',
                    confidence: 0.9,
                    pattern: { type: 'bare-except' },
                    description: 'Bare except clauses are discouraged. Specify exception types.',
                    suggestions: ['Catch specific exceptions', 'Use "except Exception:" if necessary'],
                    range
                });
            }
        });

        return diagnostics;
    }

    private getJavaDiagnostics(document: vscode.TextDocument): PatternDiagnostic[] {
        const diagnostics: PatternDiagnostic[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        lines.forEach((line, lineIndex) => {
            // Check for System.out.println in production code
            if (line.includes('System.out.println') && !line.includes('//')) {
                const charIndex = line.indexOf('System.out.println');
                const range = new vscode.Range(lineIndex, charIndex, lineIndex, charIndex + 18);
                
                diagnostics.push({
                    type: 'improvement-suggestion',
                    confidence: 0.8,
                    pattern: { type: 'system-out-println' },
                    description: 'Consider using a logging framework instead of System.out.println',
                    suggestions: ['Use Logger.info()', 'Use SLF4J logging'],
                    range
                });
            }
        });

        return diagnostics;
    }

    private getCodeQualityDiagnostics(document: vscode.TextDocument): PatternDiagnostic[] {
        const diagnostics: PatternDiagnostic[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        lines.forEach((line, lineIndex) => {
            // Check for long lines
            if (line.length > 120) {
                const range = new vscode.Range(lineIndex, 120, lineIndex, line.length);
                
                diagnostics.push({
                    type: 'improvement-suggestion',
                    confidence: 0.6,
                    pattern: { type: 'long-line' },
                    description: 'Line exceeds recommended length (120 characters)',
                    suggestions: ['Break line into multiple lines', 'Extract to variable'],
                    range
                });
            }

            // Check for TODO comments
            const todoMatch = line.match(/(TODO|FIXME|HACK):/i);
            if (todoMatch) {
                const charIndex = line.indexOf(todoMatch[0]);
                const range = new vscode.Range(lineIndex, charIndex, lineIndex, charIndex + todoMatch[0].length);
                
                diagnostics.push({
                    type: 'improvement-suggestion',
                    confidence: 0.5,
                    pattern: { type: 'todo-comment' },
                    description: `${todoMatch[0]} comment found - consider addressing`,
                    suggestions: ['Address the TODO item', 'Create an issue tracker item'],
                    range
                });
            }
        });

        return diagnostics;
    }

    private convertToVSCodeDiagnostics(patternDiagnostics: PatternDiagnostic[]): vscode.Diagnostic[] {
        return patternDiagnostics.map(pd => {
            const diagnostic = new vscode.Diagnostic(
                pd.range,
                pd.description,
                this.mapPatternDiagnosticToSeverity(pd.type, pd.confidence)
            );

            diagnostic.source = 'Code Whisperer';
            diagnostic.code = pd.pattern.type;

            // Add related information if suggestions are available
            if (pd.suggestions.length > 0) {
                diagnostic.relatedInformation = pd.suggestions.map(suggestion => 
                    new vscode.DiagnosticRelatedInformation(
                        new vscode.Location(vscode.Uri.parse(''), pd.range),
                        `Suggestion: ${suggestion}`
                    )
                );
            }

            // Add tags for deprecated or unnecessary code
            if (pd.type === 'pattern-violation' && pd.confidence > 0.8) {
                diagnostic.tags = [vscode.DiagnosticTag.Deprecated];
            }

            return diagnostic;
        });
    }

    private mapPatternDiagnosticToSeverity(
        type: PatternDiagnostic['type'], 
        confidence: number
    ): vscode.DiagnosticSeverity {
        if (confidence < 0.3) {
            return vscode.DiagnosticSeverity.Hint;
        }

        switch (type) {
            case 'pattern-violation':
                return confidence > 0.8 ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
            case 'consistency-issue':
                return vscode.DiagnosticSeverity.Warning;
            case 'performance-warning':
                return vscode.DiagnosticSeverity.Warning;
            case 'improvement-suggestion':
                return confidence > 0.7 ? vscode.DiagnosticSeverity.Information : vscode.DiagnosticSeverity.Hint;
            default:
                return vscode.DiagnosticSeverity.Information;
        }
    }

    private mapIssueTypeToPatternDiagnostic(issueType: string): PatternDiagnostic['type'] {
        switch (issueType) {
            case 'violation': return 'pattern-violation';
            case 'inconsistency': return 'consistency-issue';
            case 'performance': return 'performance-warning';
            case 'suggestion': return 'improvement-suggestion';
            default: return 'improvement-suggestion';
        }
    }

    private createRangeFromIssue(document: vscode.TextDocument, issue: any): vscode.Range | undefined {
        try {
            if (issue.line !== undefined && issue.column !== undefined) {
                const line = Math.max(0, Math.min(issue.line, document.lineCount - 1));
                const char = Math.max(0, issue.column);
                const endChar = issue.endColumn || char + (issue.length || 1);
                
                return new vscode.Range(line, char, line, endChar);
            }

            if (issue.range) {
                return new vscode.Range(
                    issue.range.start.line,
                    issue.range.start.character,
                    issue.range.end.line,
                    issue.range.end.character
                );
            }

            return undefined;
        } catch (error) {
            return undefined;
        }
    }

    private isSupportedDocument(document: vscode.TextDocument): boolean {
        const supportedLanguages = CodeWhispererConfig.enabledLanguages;
        return supportedLanguages.includes(document.languageId) &&
               document.uri.scheme === 'file' &&
               !document.isUntitled;
    }

    private refreshAllDiagnostics(): void {
        if (!CodeWhispererConfig.enableDiagnostics) {
            this.diagnosticCollection.clear();
            return;
        }

        vscode.workspace.textDocuments.forEach(document => {
            if (this.isSupportedDocument(document)) {
                this.updateDiagnostics(document);
            }
        });
    }

    public clearDiagnostics(uri?: vscode.Uri): void {
        if (uri) {
            this.diagnosticCollection.delete(uri);
            this.analysisCache.delete(uri.toString());
        } else {
            this.diagnosticCollection.clear();
            this.analysisCache.clear();
        }
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        this.diagnosticCollection.dispose();
        this.analysisCache.clear();
    }
}

// Export singleton instance
let diagnosticProvider: CodeWhispererDiagnosticProvider | undefined;

export function getDiagnosticProvider(context: vscode.ExtensionContext): CodeWhispererDiagnosticProvider {
    if (!diagnosticProvider) {
        diagnosticProvider = new CodeWhispererDiagnosticProvider(context);
    }
    return diagnosticProvider;
}
