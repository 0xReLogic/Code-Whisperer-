import * as vscode from 'vscode';

// Dynamically import the WASM module
let wasmModule: any = null;

async function loadWasmModule(): Promise<any> {
    if (wasmModule) {
        return wasmModule;
    }

    try {
        // For now, we'll use a simple approach
        // TODO: Implement proper WASM loading
        vscode.window.showInformationMessage('WASM module loading placeholder');
        return null;
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to load WASM module: ${error}`);
        throw error;
    }
}

export async function activate(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage('Code Whisperer extension is now active!');

    // Load the WASM module
    try {
        await loadWasmModule();
        vscode.window.showInformationMessage('WASM module loaded successfully');
    } catch (error) {
        vscode.window.showErrorMessage('Failed to load Code Whisperer core module');
    }

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
    vscode.window.showInformationMessage('Code Whisperer extension is now deactivated!');
}
