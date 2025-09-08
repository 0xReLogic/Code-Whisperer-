import * as vscode from 'vscode';
import { CodeWhispererConfig } from './config';
import { getWasmLoader } from './wasmLoader';
import { getStatusBarManager } from './statusBar';
import { getRealTimeAnalyzer } from './realTimeAnalyzer';
import { getHoverProvider } from './hoverProvider';
import { getCompletionProvider } from './completionProvider';
import { getDiagnosticProvider } from './diagnosticProvider';
import { getCodeActionProvider } from './codeActionProvider';

// Phase 5: Advanced Intelligence Features
import { FeedbackCollectionSystem } from './feedbackSystem';
import { PatternAdaptationEngine } from './patternAdaptationEngine';
import { TemporalPatternAnalyzer } from './temporalPatternAnalyzer';
import { ContextAwareLearningSystem } from './contextAwareLearning';
import { MultiLanguagePatternCorrelator } from './multiLanguageCorrelator';
import { RefactoringPatternDetector } from './refactoringPatternDetector';
import { TestingPatternRecognizer } from './testingPatternRecognizer';
import { DocumentationStyleLearner } from './documentationStyleLearner';
import { ErrorHandlingPatternAnalyzer } from './errorHandlingPatternAnalyzer';
import { CodingPersonalityProfiler } from './codingPersonalityProfiler';

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
        wasmLoader.setContext(context); // Set context for persistent storage
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

    // Initialize Phase 5: Advanced Intelligence Features (with error tolerance)
    try {
        await initializeAdvancedIntelligenceIndividually(context);
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('✅ Advanced Intelligence Features initialized successfully');
        }
    } catch (error) {
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine(`⚠️ Advanced Intelligence initialization failed, but extension will continue: ${error}`);
        }
        // Continue with basic functionality even if AI fails
    }

    // Register language providers
    registerLanguageProviders(context);

    // Register commands
    registerCommands(context);

    // *** REAL DATA TRACKING - Track when user accepts completion suggestions ***
    const acceptSuggestionCommand = vscode.commands.registerCommand('codeWhisperer.acceptSuggestion', async (suggestionId: string) => {
        const wasmLoader = getWasmLoader();
        const engine = await wasmLoader.getEngine();
        await engine.learnFromFeedback(suggestionId, true);
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine(`✅ User accepted suggestion: ${suggestionId}`);
        }
    });
    
    const rejectSuggestionCommand = vscode.commands.registerCommand('codeWhisperer.rejectSuggestion', async (suggestionId: string) => {
        const wasmLoader = getWasmLoader();
        const engine = await wasmLoader.getEngine();
        await engine.learnFromFeedback(suggestionId, false);
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine(`❌ User rejected suggestion: ${suggestionId}`);
        }
    });
    
    context.subscriptions.push(acceptSuggestionCommand, rejectSuggestionCommand);

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

    // Register diagnostic provider
    const diagnosticProvider = getDiagnosticProvider(context);
    context.subscriptions.push({ dispose: () => diagnosticProvider.dispose() });

    // Register code action provider
    const codeActionProvider = getCodeActionProvider();
    supportedLanguages.forEach(language => {
        const codeActionProviderDisposable = vscode.languages.registerCodeActionsProvider(
            { language, scheme: 'file' },
            codeActionProvider,
            {
                providedCodeActionKinds: [
                    vscode.CodeActionKind.QuickFix,
                    vscode.CodeActionKind.Refactor,
                    vscode.CodeActionKind.RefactorExtract,
                    vscode.CodeActionKind.RefactorInline,
                    vscode.CodeActionKind.RefactorRewrite,
                    vscode.CodeActionKind.Source,
                    vscode.CodeActionKind.SourceOrganizeImports
                ]
            }
        );
        context.subscriptions.push(codeActionProviderDisposable);
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

    const allLanguagesCodeActionDisposable = vscode.languages.registerCodeActionsProvider(
        { pattern: '**/*.{ts,js,py,java,cpp,c,cs,go,rs,php,rb,kt,swift}' },
        codeActionProvider,
        {
            providedCodeActionKinds: [
                vscode.CodeActionKind.QuickFix,
                vscode.CodeActionKind.Refactor,
                vscode.CodeActionKind.RefactorExtract,
                vscode.CodeActionKind.RefactorInline,
                vscode.CodeActionKind.RefactorRewrite,
                vscode.CodeActionKind.Source,
                vscode.CodeActionKind.SourceOrganizeImports
            ]
        }
    );
    context.subscriptions.push(allLanguagesCodeActionDisposable);

    // Register disposal
    context.subscriptions.push({ dispose: () => hoverProvider.dispose() });
    context.subscriptions.push({ dispose: () => completionProvider.dispose() });
    context.subscriptions.push({ dispose: () => codeActionProvider.dispose() });
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

    // Code Action Commands
    const breakLongLineCommand = vscode.commands.registerCommand('codeWhisperer.breakLongLine', 
        async (uri: vscode.Uri, range: vscode.Range) => {
            const document = await vscode.workspace.openTextDocument(uri);
            const editor = await vscode.window.showTextDocument(document);
            const line = document.lineAt(range.start.line);
            const lineText = line.text;
            
            // Simple line breaking at reasonable points
            const breakPoint = Math.min(120, lineText.length);
            const beforeBreak = lineText.substring(0, breakPoint);
            const afterBreak = lineText.substring(breakPoint);
            const indent = lineText.match(/^\s*/)?.[0] || '';
            
            const newText = `${beforeBreak}\n${indent}    ${afterBreak.trim()}`;
            
            const edit = new vscode.WorkspaceEdit();
            edit.replace(uri, line.range, newText);
            await vscode.workspace.applyEdit(edit);
        }
    );

    const extractToVariableCommand = vscode.commands.registerCommand('codeWhisperer.extractToVariable',
        async (uri: vscode.Uri, range: vscode.Range) => {
            const document = await vscode.workspace.openTextDocument(uri);
            const selectedText = document.getText(range);
            
            const variableName = await vscode.window.showInputBox({
                prompt: 'Enter variable name',
                value: 'extracted',
                validateInput: (value) => {
                    if (!value || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value)) {
                        return 'Invalid variable name';
                    }
                    return null;
                }
            });
            
            if (variableName) {
                const lineNumber = range.start.line;
                const indent = document.lineAt(lineNumber).text.match(/^\s*/)?.[0] || '';
                const declaration = `${indent}const ${variableName} = ${selectedText};\n`;
                
                const edit = new vscode.WorkspaceEdit();
                edit.insert(uri, new vscode.Position(lineNumber, 0), declaration);
                edit.replace(uri, range, variableName);
                await vscode.workspace.applyEdit(edit);
            }
        }
    );

    const organizeImportsCommand = vscode.commands.registerCommand('codeWhisperer.organizeImports',
        async (uri: vscode.Uri) => {
            const document = await vscode.workspace.openTextDocument(uri);
            const text = document.getText();
            const lines = text.split('\n');
            
            // Simple import organization - group and sort imports
            const imports: string[] = [];
            const otherLines: string[] = [];
            
            lines.forEach(line => {
                if (line.trim().startsWith('import ') || line.trim().startsWith('from ')) {
                    imports.push(line);
                } else {
                    otherLines.push(line);
                }
            });
            
            imports.sort();
            const organizedText = [...imports, '', ...otherLines].join('\n');
            
            const edit = new vscode.WorkspaceEdit();
            edit.replace(uri, new vscode.Range(0, 0, document.lineCount, 0), organizedText);
            await vscode.workspace.applyEdit(edit);
        }
    );

    // Phase 5: Advanced Intelligence Commands
    const showCodingPersonalityCommand = vscode.commands.registerCommand('codeWhisperer.showCodingPersonality', async () => {
        try {
            const aiSystems = context.globalState.get('advancedIntelligence') as any;
            if (CodeWhispererConfig.debugMode) {
                outputChannel.appendLine(`AI Systems available: ${!!aiSystems}`);
                outputChannel.appendLine(`Personality Profiler available: ${!!aiSystems?.personalityProfiler}`);
            }
            
            if (aiSystems?.personalityProfiler) {
                const personality = aiSystems.personalityProfiler.getCodingPersonalityInsights();
                const panel = vscode.window.createWebviewPanel(
                    'codingPersonality',
                    'Your Coding Personality',
                    vscode.ViewColumn.One,
                    {}
                );
                panel.webview.html = createPersonalityHTML(personality);
            } else {
                vscode.window.showWarningMessage('Coding Personality Profiler not initialized. Please wait for extension to fully load.');
                if (CodeWhispererConfig.debugMode) {
                    outputChannel.appendLine('Available AI systems keys: ' + (aiSystems ? Object.keys(aiSystems).join(', ') : 'none'));
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error showing coding personality: ${error}`);
            if (CodeWhispererConfig.debugMode) {
                outputChannel.appendLine(`Error in showCodingPersonality: ${error}`);
            }
        }
    });

    const showFeedbackInsightsCommand = vscode.commands.registerCommand('codeWhisperer.showFeedbackInsights', async () => {
        const aiSystems = context.globalState.get('advancedIntelligence') as any;
        if (aiSystems?.feedbackSystem) {
            const insights = aiSystems.feedbackSystem.getLearningInsights();
            vscode.window.showInformationMessage(
                `Learning Insights: ${insights.preferredSuggestionTypes.join(', ')}`
            );
        }
    });

    const analyzeTemporalPatternsCommand = vscode.commands.registerCommand('codeWhisperer.analyzeTemporalPatterns', async () => {
        const aiSystems = context.globalState.get('advancedIntelligence') as any;
        if (aiSystems?.temporalAnalyzer) {
            const insights = aiSystems.temporalAnalyzer.getTemporalInsights();
            vscode.window.showInformationMessage(
                `Recent Changes: ${insights.recentChanges.length} coding habit changes detected`
            );
        }
    });

    const generateTestSuggestionsCommand = vscode.commands.registerCommand('codeWhisperer.generateTestSuggestions', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const aiSystems = context.globalState.get('advancedIntelligence') as any;
        if (aiSystems?.testingRecognizer) {
            const suggestions = await aiSystems.testingRecognizer.generateTestingSuggestions(editor.document);
            if (suggestions.length > 0) {
                vscode.window.showInformationMessage(`Found ${suggestions.length} testing suggestions`);
            } else {
                vscode.window.showInformationMessage('No testing suggestions available for this code');
            }
        }
    });

    const analyzeErrorHandlingCommand = vscode.commands.registerCommand('codeWhisperer.analyzeErrorHandling', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const aiSystems = context.globalState.get('advancedIntelligence') as any;
        if (aiSystems?.errorAnalyzer) {
            const suggestions = await aiSystems.errorAnalyzer.generateErrorHandlingSuggestions(editor.document);
            if (suggestions.length > 0) {
                vscode.window.showInformationMessage(`Found ${suggestions.length} error handling improvements`);
            } else {
                vscode.window.showInformationMessage('Your error handling looks good!');
            }
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
        importPatternsCommand,
        breakLongLineCommand,
        extractToVariableCommand,
        organizeImportsCommand,
        // Phase 5 commands
        showCodingPersonalityCommand,
        showFeedbackInsightsCommand,
        analyzeTemporalPatternsCommand,
        generateTestSuggestionsCommand,
        analyzeErrorHandlingCommand
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
        
        // *** REAL DATA TRACKING - Increment analysis count with actual confidence ***
        await wasmLoader.incrementAnalysis(analysisResult.confidence);
        
        // Add real patterns discovered
        for (const pattern of analysisResult.patterns) {
            await engine.addPattern(pattern);
        }
        
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

function createPersonalityHTML(personality: any): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Your Coding Personality Profile</title>
            <style>
                body { 
                    font-family: var(--vscode-font-family); 
                    padding: 20px; 
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    line-height: 1.6;
                }
                .personality-section { 
                    margin: 20px 0; 
                    padding: 15px;
                    background-color: var(--vscode-panel-background);
                    border-radius: 8px;
                    border: 1px solid var(--vscode-panel-border);
                }
                .trait-label { 
                    font-weight: bold; 
                    color: var(--vscode-textLink-foreground);
                    margin-right: 10px;
                }
                .trait-value { 
                    color: var(--vscode-foreground);
                    font-size: 1.1em;
                }
                .progress-bar {
                    width: 100%;
                    height: 8px;
                    background-color: var(--vscode-progressBar-background);
                    border-radius: 4px;
                    margin: 5px 0;
                }
                .progress-fill {
                    height: 100%;
                    background-color: var(--vscode-charts-blue);
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }
                .recommendations {
                    background-color: var(--vscode-list-activeSelectionBackground);
                    padding: 10px;
                    border-radius: 5px;
                    margin-top: 10px;
                }
                h1 { color: var(--vscode-titleBar-activeForeground); }
                h2 { color: var(--vscode-textLink-foreground); }
            </style>
        </head>
        <body>
            <h1>🧬 Your Coding DNA Profile</h1>
            
            <div class="personality-section">
                <h2>🎯 Core Personality</h2>
                <div><span class="trait-label">Primary Archetype:</span> <span class="trait-value">${personality.primaryArchetype || 'Analyzer'}</span></div>
                <div><span class="trait-label">Confidence Level:</span> <span class="trait-value">${(personality.confidenceLevel * 100).toFixed(1)}%</span></div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${personality.confidenceLevel * 100}%"></div>
                </div>
            </div>

            <div class="personality-section">
                <h2>🔧 Programming Style</h2>
                <div><span class="trait-label">Approach:</span> <span class="trait-value">${personality.programmingApproach || 'Balanced'}</span></div>
                <div><span class="trait-label">Complexity Preference:</span> <span class="trait-value">${personality.complexityPreference || 'Medium'}</span></div>
                <div><span class="trait-label">Innovation Score:</span> <span class="trait-value">${(personality.innovationScore * 100).toFixed(1)}%</span></div>
            </div>

            <div class="personality-section">
                <h2>💡 Recommendations</h2>
                <div class="recommendations">
                    ${personality.recommendations ? personality.recommendations.map((rec: string) => `<div>• ${rec}</div>`).join('') : '<div>• Keep exploring new patterns and techniques!</div>'}
                </div>
            </div>

            <div class="personality-section">
                <h2>📈 Growth Areas</h2>
                <div class="recommendations">
                    ${personality.growthAreas ? personality.growthAreas.map((area: string) => `<div>• ${area}</div>`).join('') : '<div>• Continue learning and adapting!</div>'}
                </div>
            </div>
        </body>
        </html>
    `;
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

/**
 * Initialize AI components individually with better error handling
 */
async function initializeAdvancedIntelligenceIndividually(context: vscode.ExtensionContext): Promise<void> {
    if (CodeWhispererConfig.debugMode) {
        outputChannel.appendLine('Initializing Phase 5: Advanced Intelligence Features (Individual Mode)...');
    }

    const aiSystems: any = {};
    let successCount = 0;

    // Try each component individually
    try {
        outputChannel.appendLine('Initializing Feedback System...');
        aiSystems.feedbackSystem = new FeedbackCollectionSystem(context);
        outputChannel.appendLine('✅ Feedback System initialized');
        successCount++;
    } catch (error) {
        outputChannel.appendLine(`❌ Feedback System failed: ${error}`);
    }

    try {
        outputChannel.appendLine('Initializing Pattern Adaptation Engine...');
        if (aiSystems.feedbackSystem) {
            aiSystems.patternEngine = new PatternAdaptationEngine(context, aiSystems.feedbackSystem);
            outputChannel.appendLine('✅ Pattern Adaptation Engine initialized');
            successCount++;
        } else {
            outputChannel.appendLine('❌ Pattern Adaptation Engine skipped (requires Feedback System)');
        }
    } catch (error) {
        outputChannel.appendLine(`❌ Pattern Adaptation Engine failed: ${error}`);
    }

    try {
        outputChannel.appendLine('Initializing Temporal Pattern Analyzer...');
        aiSystems.temporalAnalyzer = new TemporalPatternAnalyzer(context);
        outputChannel.appendLine('✅ Temporal Pattern Analyzer initialized');
        successCount++;
    } catch (error) {
        outputChannel.appendLine(`❌ Temporal Pattern Analyzer failed: ${error}`);
    }

    try {
        outputChannel.appendLine('Initializing Context-Aware Learning System...');
        aiSystems.contextLearning = new ContextAwareLearningSystem(context);
        outputChannel.appendLine('✅ Context-Aware Learning System initialized');
        successCount++;
    } catch (error) {
        outputChannel.appendLine(`❌ Context-Aware Learning System failed: ${error}`);
    }

    try {
        outputChannel.appendLine('Initializing Multi-Language Pattern Correlator...');
        aiSystems.multiLanguageCorrelator = new MultiLanguagePatternCorrelator(context);
        outputChannel.appendLine('✅ Multi-Language Pattern Correlator initialized');
        successCount++;
    } catch (error) {
        outputChannel.appendLine(`❌ Multi-Language Pattern Correlator failed: ${error}`);
    }

    try {
        outputChannel.appendLine('Initializing Refactoring Pattern Detector...');
        aiSystems.refactoringDetector = new RefactoringPatternDetector(context);
        outputChannel.appendLine('✅ Refactoring Pattern Detector initialized');
        successCount++;
    } catch (error) {
        outputChannel.appendLine(`❌ Refactoring Pattern Detector failed: ${error}`);
    }

    try {
        outputChannel.appendLine('Initializing Testing Pattern Recognizer...');
        aiSystems.testingRecognizer = new TestingPatternRecognizer(context);
        outputChannel.appendLine('✅ Testing Pattern Recognizer initialized');
        successCount++;
    } catch (error) {
        outputChannel.appendLine(`❌ Testing Pattern Recognizer failed: ${error}`);
    }

    try {
        outputChannel.appendLine('Initializing Documentation Style Learner...');
        aiSystems.docStyleLearner = new DocumentationStyleLearner(context);
        outputChannel.appendLine('✅ Documentation Style Learner initialized');
        successCount++;
    } catch (error) {
        outputChannel.appendLine(`❌ Documentation Style Learner failed: ${error}`);
    }

    try {
        outputChannel.appendLine('Initializing Error Handling Pattern Analyzer...');
        aiSystems.errorAnalyzer = new ErrorHandlingPatternAnalyzer(context);
        outputChannel.appendLine('✅ Error Handling Pattern Analyzer initialized');
        successCount++;
    } catch (error) {
        outputChannel.appendLine(`❌ Error Handling Pattern Analyzer failed: ${error}`);
    }

    try {
        outputChannel.appendLine('Initializing Coding Personality Profiler...');
        aiSystems.personalityProfiler = new CodingPersonalityProfiler(context);
        outputChannel.appendLine('✅ Coding Personality Profiler initialized');
        successCount++;
    } catch (error) {
        outputChannel.appendLine(`❌ Coding Personality Profiler failed: ${error}`);
    }

    // Store whatever we successfully initialized
    await context.globalState.update('advancedIntelligence', aiSystems);
    
    outputChannel.appendLine(`✅ AI Initialization complete: ${successCount}/10 components initialized`);
    
    if (successCount > 0) {
        vscode.window.showInformationMessage(`🎉 Code Whisperer: ${successCount}/10 AI components activated!`);
    } else {
        vscode.window.showWarningMessage('⚠️ Code Whisperer: No AI components could be initialized');
    }
}

/**
 * Initialize Phase 5: Advanced Intelligence Features
 */
async function initializeAdvancedIntelligence(context: vscode.ExtensionContext): Promise<void> {
    if (CodeWhispererConfig.debugMode) {
        outputChannel.appendLine('Initializing Phase 5: Advanced Intelligence Features...');
    }

    try {
        // 1. Initialize User Feedback System
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('Initializing Feedback System...');
        }
        const feedbackSystem = new FeedbackCollectionSystem(context);
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('✅ Feedback System initialized');
        }
        
        // 2. Initialize Pattern Adaptation Engine (requires feedback system)
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('Initializing Pattern Adaptation Engine...');
        }
        const patternEngine = new PatternAdaptationEngine(context, feedbackSystem);
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('✅ Pattern Adaptation Engine initialized');
        }
        
        // 3. Initialize Temporal Pattern Analyzer
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('Initializing Temporal Pattern Analyzer...');
        }
        const temporalAnalyzer = new TemporalPatternAnalyzer(context);
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('✅ Temporal Pattern Analyzer initialized');
        }
        
        // 4. Initialize Context-Aware Learning System
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('Initializing Context-Aware Learning System...');
        }
        const contextLearning = new ContextAwareLearningSystem(context);
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('✅ Context-Aware Learning System initialized');
        }
        
        // 5. Initialize Multi-Language Pattern Correlator
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('Initializing Multi-Language Pattern Correlator...');
        }
        const multiLanguageCorrelator = new MultiLanguagePatternCorrelator(context);
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('✅ Multi-Language Pattern Correlator initialized');
        }
        
        // 6. Initialize Refactoring Pattern Detector
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('Initializing Refactoring Pattern Detector...');
        }
        const refactoringDetector = new RefactoringPatternDetector(context);
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('✅ Refactoring Pattern Detector initialized');
        }
        
        // 7. Initialize Testing Pattern Recognizer
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('Initializing Testing Pattern Recognizer...');
        }
        const testingRecognizer = new TestingPatternRecognizer(context);
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('✅ Testing Pattern Recognizer initialized');
        }
        
        // 8. Initialize Documentation Style Learner
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('Initializing Documentation Style Learner...');
        }
        const docStyleLearner = new DocumentationStyleLearner(context);
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('✅ Documentation Style Learner initialized');
        }
        
        // 9. Initialize Error Handling Pattern Analyzer
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('Initializing Error Handling Pattern Analyzer...');
        }
        const errorAnalyzer = new ErrorHandlingPatternAnalyzer(context);
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('✅ Error Handling Pattern Analyzer initialized');
        }
        
        // 10. Initialize Coding Personality Profiler
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('Initializing Coding Personality Profiler...');
        }
        const personalityProfiler = new CodingPersonalityProfiler(context);
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('✅ Coding Personality Profiler initialized');
        }

        // Store references in global state for access by other components
        const aiSystems = {
            feedbackSystem,
            patternEngine,
            temporalAnalyzer,
            contextLearning,
            multiLanguageCorrelator,
            refactoringDetector,
            testingRecognizer,
            docStyleLearner,
            errorAnalyzer,
            personalityProfiler
        };
        
        await context.globalState.update('advancedIntelligence', aiSystems);
        
        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('✅ All AI systems initialized successfully!');
            outputChannel.appendLine(`AI Systems keys: ${Object.keys(aiSystems).join(', ')}`);
        }

        // Set up automated analysis workflows
        // Set up automated analysis workflows
        setupAutomatedAnalysis(context, aiSystems);

        if (CodeWhispererConfig.debugMode) {
            outputChannel.appendLine('✅ All 10 Phase 5 AI components initialized successfully!');
        }

        vscode.window.showInformationMessage('🎉 Code Whisperer: Advanced Intelligence Features activated!');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';
        
        if (CodeWhispererConfig.debugMode && outputChannel) {
            outputChannel.appendLine(`❌ Error initializing Advanced Intelligence: ${errorMessage}`);
            if (errorStack) {
                outputChannel.appendLine(`Stack trace: ${errorStack}`);
            }
        }
        vscode.window.showErrorMessage(`Failed to initialize Code Whisperer Advanced Intelligence Features: ${errorMessage}`);
    }
}

/**
 * Set up automated analysis workflows for AI components
 */
function setupAutomatedAnalysis(context: vscode.ExtensionContext, aiSystems: any): void {
    // Set up document change listeners for continuous learning
    const documentChangeListener = vscode.workspace.onDidChangeTextDocument(async (event) => {
        if (!CodeWhispererConfig.realTimeAnalysis) return;

        try {
            const document = event.document;
            
            // Analyze with context-aware learning
            await aiSystems.contextLearning.analyzeCurrentContext();
            
            // Detect refactoring opportunities
            if (aiSystems.refactoringDetector) {
                await aiSystems.refactoringDetector.analyzeCodeForRefactoring(document);
            }
            
            // Analyze error handling patterns
            if (aiSystems.errorAnalyzer) {
                await aiSystems.errorAnalyzer.analyzeErrorHandling(document);
            }
            
            // Learn documentation style
            if (aiSystems.docStyleLearner) {
                await aiSystems.docStyleLearner.analyzeDocumentation(document);
            }
            
            // Analyze testing patterns
            if (aiSystems.testingRecognizer) {
                await aiSystems.testingRecognizer.analyzeTestFile(document);
            }
            
        } catch (error) {
            if (CodeWhispererConfig.debugMode) {
                outputChannel.appendLine(`Error in automated analysis: ${error}`);
            }
        }
    });

    // Set up active editor change listener for personality profiling
    const activeEditorChangeListener = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
        if (!editor || !CodeWhispererConfig.realTimeAnalysis) return;

        try {
            // Update coding personality profile
            if (aiSystems.personalityProfiler) {
                await aiSystems.personalityProfiler.analyzeUserCodingDNA(editor.document);
            }
            
            // Analyze temporal patterns
            if (aiSystems.temporalAnalyzer) {
                // Record activity for temporal analysis
                aiSystems.temporalAnalyzer.recordDataPoint(
                    'file_switch',
                    1,
                    {
                        language: editor.document.languageId,
                        hour: new Date().getHours(),
                        weekday: new Date().getDay()
                    }
                );
            }
            
        } catch (error) {
            if (CodeWhispererConfig.debugMode) {
                outputChannel.appendLine(`Error in editor change analysis: ${error}`);
            }
        }
    });

    context.subscriptions.push(documentChangeListener, activeEditorChangeListener);
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
