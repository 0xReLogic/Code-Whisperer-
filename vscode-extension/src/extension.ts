import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Code Whisperer extension is now active!');

    // Register the analyze code command
    let analyzeCodeCommand = vscode.commands.registerCommand('codeWhisperer.analyzeCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
            vscode.window.showWarningMessage('Please select some code to analyze');
            return;
        }

        // For now, show a simple analysis result
        // TODO: Integrate with WASM module for actual pattern analysis
        const analysisResult = `Analyzed ${selectedText.length} characters of code.`;
        vscode.window.showInformationMessage(analysisResult);

        // Show analysis in output channel
        const outputChannel = vscode.window.createOutputChannel('Code Whisperer');
        outputChannel.show();
        outputChannel.appendLine('=== Code Analysis Result ===');
        outputChannel.appendLine(`Selected text length: ${selectedText.length}`);
        outputChannel.appendLine(`Language: ${editor.document.languageId}`);
        outputChannel.appendLine(`File: ${editor.document.fileName}`);
        outputChannel.appendLine('');
        outputChannel.appendLine('Detected patterns:');
        outputChannel.appendLine('- Basic code structure analysis (placeholder)');
        outputChannel.appendLine('- Pattern recognition will be implemented in Phase 2');
    });

    // Register the show patterns command
    let showPatternsCommand = vscode.commands.registerCommand('codeWhisperer.showPatterns', () => {
        // TODO: Show learned patterns from storage
        vscode.window.showInformationMessage('Pattern learning system will be implemented in Phase 2');
    });

    context.subscriptions.push(analyzeCodeCommand);
    context.subscriptions.push(showPatternsCommand);
}

export function deactivate() {
    console.log('Code Whisperer extension is now deactivated!');
}
