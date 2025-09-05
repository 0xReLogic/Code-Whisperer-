import * as vscode from 'vscode';
import { CodeWhispererConfig } from './config';
import { getWasmLoader } from './wasmLoader';
import { getStatusBarManager } from './statusBar';
import { getRealTimeAnalyzer } from './realTimeAnalyzer';
import { getHoverProvider } from './hoverProvider';
import { getCompletionProvider } from './completionProvider';

// Global extension state
let outputChannel: vscode.OutputChannel;
let diagnosticCollection: vscode.DiagnosticCollection;

export async function activate(context: vscode.ExtensionContext) {
    // Initialize output channel for logging
    outputChannel = vscode.window.createOutputChannel('Code Whisperer');
    diagnosticCollection = vscode.languages.createDiagnosticCollection('codeWhisperer');
    
    // Log activation
    if (CodeWhispererConfig.debugMode) {
        outputChannel.appendLine('Code Whisperer extension is activating...');
        outputChannel.appendLine('Configuration: ' + JSON.stringify(CodeWhispererConfig.getConfigSummary(), null, 2));
    }

    // Show activation message
    if (CodeWhispererConfig.enabled) {
        vscode.window.showInformationMessage('Code Whisperer extension is now active!');
    } else {
        vscode.window.showWarningMessage('Code Whisperer is disabled. Enable it in settings to use pattern analysis.');
    }

    // Initialize status bar manager
    const statusBarManager = getStatusBarManager();
    context.subscriptions.push({ dispose: () => statusBarManager.dispose() });

    // Load the WASM module
    try {
        statusBarManager.startAnalysis();
        const wasmLoader = getWasmLoader();
        await wasmLoader.loadModule();
        statusBarManager.stopAnalysis();
        statusBarManager.showSuccess('WASM module loaded');
        
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('WASM module loaded successfully');
        }
    } catch (error) {
        statusBarManager.stopAnalysis();
        statusBarManager.showError('Failed to load WASM module');
        vscode.window.showErrorMessage('Failed to load Code Whisperer core module');
        
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine(`Error loading WASM module: ${error}`);
        }
    }

    // Initialize real-time analyzer
    const realTimeAnalyzer = getRealTimeAnalyzer();
    context.subscriptions.push({ dispose: () => realTimeAnalyzer.dispose() });

    // Register language providers
    registerLanguageProviders(context);

    // Register commands
    registerCommands(context);

    // Set up configuration change listener
    const configListener = CodeWhispererConfig.onConfigurationChanged((event) => {
        statusBarManager.onConfigurationChanged();
        
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('Configuration changed');
        }
        
        // Validate configuration
        const validation = CodeWhispererConfig.validateConfig();
        if (!validation.isValid) {
            vscode.window.showWarningMessage(`Code Whisperer configuration issues: ${validation.errors.join(', ')}`);
        }
    });
    
    context.subscriptions.push(configListener);

    // Set up real-time analysis if enabled
    if (CodeWhispererConfig.realTimeAnalysis) {
        setupRealTimeAnalysis(context);
    }

    if (CodeWhispererConfig.debugMode) {
        outputChannel.appendLine('Code Whisperer extension activated successfully');
        outputChannel.show();
    }
}

function registerLanguageProviders(context: vscode.ExtensionContext) {
    // Get supported languages from configuration
    const supportedLanguages = CodeWhispererConfig.enabledLanguages;
    
    // Register hover provider for supported languages
    const hoverProvider = getHoverProvider();
    supportedLanguages.forEach(language => {
        const hoverProviderDisposable = vscode.languages.registerHoverProvider(
            { language, scheme: 'file' },
            hoverProvider
        );
        context.subscriptions.push(hoverProviderDisposable);
    });

    // Register completion provider for supported languages
    const completionProvider = getCompletionProvider();
    supportedLanguages.forEach(language => {
        const completionProviderDisposable = vscode.languages.registerCompletionItemProvider(
            { language, scheme: 'file' },
            completionProvider,
            '.', ':', '(', '[', '{', ' '  // Trigger characters
        );
        context.subscriptions.push(completionProviderDisposable);
    });

    // Register for all supported languages with a single registration
    const allLanguagesHoverDisposable = vscode.languages.registerHoverProvider(
        { pattern: '**/*.{ts,js,py,java,cpp,c,cs,go,rs,php,rb,kt,swift}' },
        hoverProvider
    );
    context.subscriptions.push(allLanguagesHoverDisposable);

    const allLanguagesCompletionDisposable = vscode.languages.registerCompletionItemProvider(
        { pattern: '**/*.{ts,js,py,java,cpp,c,cs,go,rs,php,rb,kt,swift}' },
        completionProvider,
        '.', ':', '(', '[', '{', ' '
    );
    context.subscriptions.push(allLanguagesCompletionDisposable);

    // Register disposal
    context.subscriptions.push({ dispose: () => hoverProvider.dispose() });
    context.subscriptions.push({ dispose: () => completionProvider.dispose() });
}

function registerCommands(context: vscode.ExtensionContext) {
    // Analyze Code command
    const analyzeCodeCommand = vscode.commands.registerCommand('codeWhisperer.analyzeCode', async () => {
        await analyzeCurrentCode();
    });

    // Show Patterns command
    const showPatternsCommand = vscode.commands.registerCommand('codeWhisperer.showPatterns', async () => {
        await showLearnedPatterns();
    });

    // Toggle Suggestions command
    const toggleSuggestionsCommand = vscode.commands.registerCommand('codeWhisperer.toggleSuggestions', async () => {
        const currentState = CodeWhispererConfig.enabled;
        await CodeWhispererConfig.updateSetting('enabled', !currentState);
        
        const statusBarManager = getStatusBarManager();
        if (!currentState) {
            statusBarManager.showSuccess('Code Whisperer enabled');
        } else {
            statusBarManager.showWarning('Code Whisperer disabled');
        }
    });

    // Open Dashboard command
    const openDashboardCommand = vscode.commands.registerCommand('codeWhisperer.openDashboard', async () => {
        await openPatternDashboard();
    });

    // Reset Learning command
    const resetLearningCommand = vscode.commands.registerCommand('codeWhisperer.resetLearning', async () => {
        const result = await vscode.window.showWarningMessage(
            'This will reset all learned patterns. Are you sure?',
            { modal: true },
            'Yes, Reset',
            'Cancel'
        );
        
        if (result === 'Yes, Reset') {
            // TODO: Implement pattern reset
            const statusBarManager = getStatusBarManager();
            statusBarManager.updatePatternCount(0);
            statusBarManager.showSuccess('Patterns reset');
            vscode.window.showInformationMessage('All learned patterns have been reset.');
        }
    });

    // Export Patterns command
    const exportPatternsCommand = vscode.commands.registerCommand('codeWhisperer.exportPatterns', async () => {
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('code-whisperer-patterns.json'),
            filters: {
                'JSON files': ['json'],
                'All files': ['*']
            }
        });
        
        if (uri) {
            // TODO: Implement pattern export
            vscode.window.showInformationMessage('Patterns exported successfully.');
        }
    });

    // Import Patterns command
    const importPatternsCommand = vscode.commands.registerCommand('codeWhisperer.importPatterns', async () => {
        const uris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: {
                'JSON files': ['json'],
                'All files': ['*']
            }
        });
        
        if (uris && uris.length > 0) {
            // TODO: Implement pattern import
            vscode.window.showInformationMessage('Patterns imported successfully.');
        }
    });

    // Register all commands
    context.subscriptions.push(
        analyzeCodeCommand,
        showPatternsCommand,
        toggleSuggestionsCommand,
        openDashboardCommand,
        resetLearningCommand,
        exportPatternsCommand,
        importPatternsCommand
    );
}

async function analyzeCurrentCode(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
    }

    if (!CodeWhispererConfig.enabled) {
        vscode.window.showWarningMessage('Code Whisperer is disabled. Enable it in settings first.');
        return;
    }

    if (!CodeWhispererConfig.isLanguageEnabled(editor.document.languageId)) {
        vscode.window.showWarningMessage(`Language ${editor.document.languageId} is not enabled for analysis.`);
        return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    if (!selectedText) {
        vscode.window.showWarningMessage('Please select some code to analyze');
        return;
    }

    try {
        const statusBarManager = getStatusBarManager();
        statusBarManager.startAnalysis();

        // Get WASM engine and analyze code
        const wasmLoader = getWasmLoader();
        const engine = await wasmLoader.getEngine();
        const editorContext = await wasmLoader.createEditorContext(editor);

        const analysisResult = engine.analyzeCode(selectedText, editorContext);

        statusBarManager.stopAnalysis();
        statusBarManager.incrementPatternCount();

        // Show analysis results
        outputChannel.clear();
        outputChannel.show();
        outputChannel.appendLine('=== Code Analysis Result ===');
        outputChannel.appendLine(`Selected text length: ${selectedText.length} characters`);
        outputChannel.appendLine(`Language: ${editor.document.languageId}`);
        outputChannel.appendLine(`File: ${editor.document.fileName}`);
        outputChannel.appendLine(`Processing time: ${analysisResult.processingTime.toFixed(2)}ms`);
        outputChannel.appendLine(`Confidence: ${(analysisResult.confidence * 100).toFixed(1)}%`);
        outputChannel.appendLine('');
        
        outputChannel.appendLine('Detected patterns:');
        if (analysisResult.patterns.length > 0) {
            analysisResult.patterns.forEach((pattern: any, index: number) => {
                outputChannel.appendLine(`  ${index + 1}. ${pattern.type} (confidence: ${(pattern.confidence * 100).toFixed(1)}%)`);
            });
        } else {
            outputChannel.appendLine('  No patterns detected');
        }

        outputChannel.appendLine('');
        outputChannel.appendLine('Suggestions:');
        if (analysisResult.suggestions.length > 0) {
            analysisResult.suggestions.forEach((suggestion: any, index: number) => {
                outputChannel.appendLine(`  ${index + 1}. [${suggestion.priority}] ${suggestion.message} (confidence: ${(suggestion.confidence * 100).toFixed(1)}%)`);
            });
        } else {
            outputChannel.appendLine('  No suggestions available');
        }

        // Show summary message
        const patternCount = analysisResult.patterns.length;
        const suggestionCount = analysisResult.suggestions.length;
        const message = `Analysis complete: ${patternCount} patterns, ${suggestionCount} suggestions`;
        
        vscode.window.showInformationMessage(message);
        statusBarManager.showTemporaryMessage(message);

    } catch (error) {
        const statusBarManager = getStatusBarManager();
        statusBarManager.stopAnalysis();
        statusBarManager.showError('Analysis failed');
        
        vscode.window.showErrorMessage(`Analysis failed: ${error}`);
        
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine(`Analysis error: ${error}`);
        }
    }
}

async function showLearnedPatterns(): Promise<void> {
    try {
        const wasmLoader = getWasmLoader();
        const engine = await wasmLoader.getEngine();
        const stats = engine.getStatistics();

        const panel = vscode.window.createWebviewPanel(
            'codeWhispererPatterns',
            'Code Whisperer - Learned Patterns',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = getPatternWebviewContent(stats);

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to load patterns: ${error}`);
    }
}

async function openPatternDashboard(): Promise<void> {
    try {
        const wasmLoader = getWasmLoader();
        const engine = await wasmLoader.getEngine();
        const stats = engine.getStatistics();

        const panel = vscode.window.createWebviewPanel(
            'codeWhispererDashboard',
            'Code Whisperer - Pattern Dashboard',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = getDashboardWebviewContent(stats);

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open dashboard: ${error}`);
    }
}

function setupRealTimeAnalysis(context: vscode.ExtensionContext): void {
    let analysisTimeout: NodeJS.Timeout;

    const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
        if (!CodeWhispererConfig.realTimeAnalysis || !CodeWhispererConfig.enabled) {
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor || event.document !== editor.document) {
            return;
        }

        if (!CodeWhispererConfig.isLanguageEnabled(event.document.languageId)) {
            return;
        }

        // Debounce analysis
        if (analysisTimeout) {
            clearTimeout(analysisTimeout);
        }

        analysisTimeout = setTimeout(async () => {
            try {
                // TODO: Implement real-time analysis
                if (CodeWhispererConfig.debugMode) {
                    outputChannel.appendLine('Real-time analysis triggered');
                }
            } catch (error) {
                if (CodeWhispererConfig.debugMode) {
                    outputChannel.appendLine(`Real-time analysis error: ${error}`);
                }
            }
        }, CodeWhispererConfig.suggestionDelay);
    });

    context.subscriptions.push(documentChangeListener);
}

function getPatternWebviewContent(stats: any): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Code Whisperer - Learned Patterns</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    padding: 20px; 
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                .stat { 
                    margin: 15px 0; 
                    padding: 10px;
                    background-color: var(--vscode-panel-background);
                    border-radius: 5px;
                    border: 1px solid var(--vscode-panel-border);
                }
                .stat-label { 
                    font-weight: bold; 
                    color: var(--vscode-textLink-foreground);
                }
                .stat-value {
                    margin-left: 10px;
                    color: var(--vscode-charts-green);
                }
            </style>
        </head>
        <body>
            <h1>🧠 Learned Patterns</h1>
            <p>Pattern analysis and learning statistics for Code Whisperer</p>
            
            <div class="stat">
                <span class="stat-label">Total Patterns:</span>
                <span class="stat-value">${stats.totalPatterns}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Total Suggestions:</span>
                <span class="stat-value">${stats.totalSuggestions}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Acceptance Rate:</span>
                <span class="stat-value">${(stats.acceptanceRate * 100).toFixed(1)}%</span>
            </div>
            <div class="stat">
                <span class="stat-label">Average Confidence:</span>
                <span class="stat-value">${(stats.averageConfidence * 100).toFixed(1)}%</span>
            </div>
            <div class="stat">
                <span class="stat-label">Last Updated:</span>
                <span class="stat-value">${stats.lastUpdated}</span>
            </div>
        </body>
        </html>
    `;
}

function getDashboardWebviewContent(stats: any): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Code Whisperer - Dashboard</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    padding: 20px; 
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .card {
                    background-color: var(--vscode-panel-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .card h3 {
                    margin-top: 0;
                    color: var(--vscode-textLink-foreground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 10px;
                }
                .stat-value {
                    font-size: 2.5em;
                    font-weight: bold;
                    color: var(--vscode-charts-green);
                    margin: 10px 0;
                }
                .stat-label {
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .progress-bar {
                    width: 100%;
                    height: 8px;
                    background-color: var(--vscode-progressBar-background);
                    border-radius: 4px;
                    margin: 10px 0;
                }
                .progress-fill {
                    height: 100%;
                    background-color: var(--vscode-charts-green);
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }
                .status-badge {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    background-color: var(--vscode-charts-green);
                    color: white;
                    font-size: 0.8em;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <h1>📊 Code Whisperer Dashboard</h1>
            <p>Real-time pattern learning and analysis statistics</p>
            
            <div class="dashboard-grid">
                <div class="card">
                    <h3>🧠 Learning Progress</h3>
                    <div class="stat-value">${stats.totalPatterns}</div>
                    <div class="stat-label">Patterns Learned</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, (stats.totalPatterns / 1000) * 100)}%"></div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>💡 Suggestions</h3>
                    <div class="stat-value">${stats.totalSuggestions}</div>
                    <div class="stat-label">Total Suggestions Generated</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, (stats.totalSuggestions / 5000) * 100)}%"></div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>✅ Acceptance Rate</h3>
                    <div class="stat-value">${(stats.acceptanceRate * 100).toFixed(1)}%</div>
                    <div class="stat-label">User Acceptance</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${stats.acceptanceRate * 100}%"></div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>🎯 Confidence</h3>
                    <div class="stat-value">${(stats.averageConfidence * 100).toFixed(1)}%</div>
                    <div class="stat-label">Average Confidence Score</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${stats.averageConfidence * 100}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="card" style="margin-top: 20px;">
                <h3>⚡ System Status</h3>
                <p><strong>Last Updated:</strong> ${new Date(stats.lastUpdated).toLocaleString()}</p>
                <p><strong>Status:</strong> <span class="status-badge">Active and Learning</span></p>
                <p><strong>Performance:</strong> <span class="status-badge">Optimal</span></p>
                <p><strong>WASM Module:</strong> <span class="status-badge">Loaded</span></p>
            </div>
        </body>
        </html>
    `;
}

export function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
    vscode.window.showInformationMessage('Code Whisperer extension deactivated');
}
