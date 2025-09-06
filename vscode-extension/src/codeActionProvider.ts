import * as vscode from 'vscode';
import { getRealTimeAnalyzer } from './realTimeAnalyzer';
import { getWasmLoader } from './wasmLoader';
import { CodeWhispererConfig } from './config';

interface ActionContext {
    document: vscode.TextDocument;
    range: vscode.Range;
    diagnostic?: vscode.Diagnostic;
    selection?: vscode.Selection;
}

interface QuickFix {
    title: string;
    description: string;
    kind: vscode.CodeActionKind;
    edit?: vscode.WorkspaceEdit;
    command?: vscode.Command;
    isPreferred?: boolean;
    confidence: number;
}

export class CodeWhispererCodeActionProvider implements vscode.CodeActionProvider {
    private static readonly PROVIDED_CODE_ACTION_KINDS = [
        vscode.CodeActionKind.QuickFix,
        vscode.CodeActionKind.Refactor,
        vscode.CodeActionKind.RefactorExtract,
        vscode.CodeActionKind.RefactorInline,
        vscode.CodeActionKind.RefactorRewrite,
        vscode.CodeActionKind.Source,
        vscode.CodeActionKind.SourceOrganizeImports
    ];

    public static readonly metadata: vscode.CodeActionProviderMetadata = {
        providedCodeActionKinds: CodeWhispererCodeActionProvider.PROVIDED_CODE_ACTION_KINDS
    };

    public async provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeAction[]> {

        const actions: vscode.CodeAction[] = [];

        try {
            const actionContext: ActionContext = {
                document,
                range,
                selection: range instanceof vscode.Selection ? range : undefined
            };

            // Handle diagnostic-related quick fixes
            for (const diagnostic of context.diagnostics) {
                if (diagnostic.source === 'Code Whisperer') {
                    actionContext.diagnostic = diagnostic;
                    const quickFixes = await this.getQuickFixesForDiagnostic(actionContext, token);
                    actions.push(...this.convertQuickFixesToCodeActions(quickFixes, actionContext));
                }
            }

            // Provide refactoring actions even without diagnostics
            if (!context.only || context.only.contains(vscode.CodeActionKind.Refactor)) {
                const refactorActions = await this.getRefactoringActions(actionContext, token);
                actions.push(...this.convertQuickFixesToCodeActions(refactorActions, actionContext));
            }

            // Provide source actions
            if (!context.only || context.only.contains(vscode.CodeActionKind.Source)) {
                const sourceActions = await this.getSourceActions(actionContext, token);
                actions.push(...this.convertQuickFixesToCodeActions(sourceActions, actionContext));
            }

            // Pattern-based suggestions
            const patternActions = await this.getPatternBasedActions(actionContext, token);
            actions.push(...this.convertQuickFixesToCodeActions(patternActions, actionContext));

        } catch (error) {
            if (CodeWhispererConfig.debugMode) {
                console.error('Code action provider error:', error);
            }
        }

        return actions.filter(action => !token.isCancellationRequested);
    }

    private async getQuickFixesForDiagnostic(
        context: ActionContext,
        token: vscode.CancellationToken
    ): Promise<QuickFix[]> {
        
        const fixes: QuickFix[] = [];
        const diagnostic = context.diagnostic;
        
        if (!diagnostic || !diagnostic.code) {
            return fixes;
        }

        const code = diagnostic.code.toString();

        switch (code) {
            case 'console-log-detection':
                fixes.push(...this.getConsoleLogFixes(context));
                break;
            case 'var-usage':
                fixes.push(...this.getVarUsageFixes(context));
                break;
            case 'loose-equality':
                fixes.push(...this.getLooseEqualityFixes(context));
                break;
            case 'print-statement':
                fixes.push(...this.getPrintStatementFixes(context));
                break;
            case 'bare-except':
                fixes.push(...this.getBareExceptFixes(context));
                break;
            case 'system-out-println':
                fixes.push(...this.getSystemOutPrintlnFixes(context));
                break;
            case 'long-line':
                fixes.push(...this.getLongLineFixes(context));
                break;
            case 'todo-comment':
                fixes.push(...this.getTodoCommentFixes(context));
                break;
        }

        return fixes;
    }

    private getConsoleLogFixes(context: ActionContext): QuickFix[] {
        const line = context.document.lineAt(context.range.start.line);
        const lineText = line.text;
        
        return [
            {
                title: 'Remove console.log statement',
                description: 'Remove this console.log statement',
                kind: vscode.CodeActionKind.QuickFix,
                edit: this.createEdit(context.document, line.range, ''),
                isPreferred: true,
                confidence: 0.9
            },
            {
                title: 'Comment out console.log',
                description: 'Comment out this console.log statement',
                kind: vscode.CodeActionKind.QuickFix,
                edit: this.createEdit(context.document, line.range, `// ${lineText}`),
                confidence: 0.7
            },
            {
                title: 'Replace with logger',
                description: 'Replace console.log with proper logging',
                kind: vscode.CodeActionKind.QuickFix,
                edit: this.createEdit(context.document, context.range, 
                    lineText.replace('console.log', 'logger.info')),
                confidence: 0.8
            }
        ];
    }

    private getVarUsageFixes(context: ActionContext): QuickFix[] {
        const line = context.document.lineAt(context.range.start.line);
        const lineText = line.text;
        
        return [
            {
                title: 'Replace var with let',
                description: 'Replace var with let for block scoping',
                kind: vscode.CodeActionKind.QuickFix,
                edit: this.createEdit(context.document, context.range, 'let'),
                isPreferred: true,
                confidence: 0.9
            },
            {
                title: 'Replace var with const',
                description: 'Replace var with const if value is not reassigned',
                kind: vscode.CodeActionKind.QuickFix,
                edit: this.createEdit(context.document, context.range, 'const'),
                confidence: 0.8
            }
        ];
    }

    private getLooseEqualityFixes(context: ActionContext): QuickFix[] {
        const line = context.document.lineAt(context.range.start.line);
        const lineText = line.text;
        
        return [
            {
                title: 'Replace == with ===',
                description: 'Use strict equality for type-safe comparison',
                kind: vscode.CodeActionKind.QuickFix,
                edit: this.createEdit(context.document, context.range, '==='),
                isPreferred: true,
                confidence: 0.9
            },
            {
                title: 'Replace != with !==',
                description: 'Use strict inequality for type-safe comparison',
                kind: vscode.CodeActionKind.QuickFix,
                edit: this.createEdit(context.document, context.range, '!=='),
                confidence: 0.9
            }
        ];
    }

    private getPrintStatementFixes(context: ActionContext): QuickFix[] {
        const line = context.document.lineAt(context.range.start.line);
        const lineText = line.text;
        
        return [
            {
                title: 'Replace with logging.info',
                description: 'Replace print with proper logging',
                kind: vscode.CodeActionKind.QuickFix,
                edit: this.createEdit(context.document, context.range, 'logging.info'),
                isPreferred: true,
                confidence: 0.8
            },
            {
                title: 'Remove print statement',
                description: 'Remove this print statement',
                kind: vscode.CodeActionKind.QuickFix,
                edit: this.createEdit(context.document, line.range, ''),
                confidence: 0.7
            }
        ];
    }

    private getBareExceptFixes(context: ActionContext): QuickFix[] {
        const line = context.document.lineAt(context.range.start.line);
        
        return [
            {
                title: 'Replace with except Exception:',
                description: 'Catch general exceptions explicitly',
                kind: vscode.CodeActionKind.QuickFix,
                edit: this.createEdit(context.document, context.range, 'except Exception:'),
                isPreferred: true,
                confidence: 0.8
            },
            {
                title: 'Add specific exception type',
                description: 'Specify the type of exception to catch',
                kind: vscode.CodeActionKind.QuickFix,
                edit: this.createEdit(context.document, context.range, 'except ValueError:'),
                confidence: 0.7
            }
        ];
    }

    private getSystemOutPrintlnFixes(context: ActionContext): QuickFix[] {
        const line = context.document.lineAt(context.range.start.line);
        const lineText = line.text;
        
        return [
            {
                title: 'Replace with logger.info',
                description: 'Replace System.out.println with proper logging',
                kind: vscode.CodeActionKind.QuickFix,
                edit: this.createEdit(context.document, context.range, 'logger.info'),
                isPreferred: true,
                confidence: 0.8
            },
            {
                title: 'Remove System.out.println',
                description: 'Remove this print statement',
                kind: vscode.CodeActionKind.QuickFix,
                edit: this.createEdit(context.document, line.range, ''),
                confidence: 0.7
            }
        ];
    }

    private getLongLineFixes(context: ActionContext): QuickFix[] {
        return [
            {
                title: 'Break line at 120 characters',
                description: 'Split this long line for better readability',
                kind: vscode.CodeActionKind.QuickFix,
                command: {
                    title: 'Break long line',
                    command: 'codeWhisperer.breakLongLine',
                    arguments: [context.document.uri, context.range]
                },
                confidence: 0.6
            }
        ];
    }

    private getTodoCommentFixes(context: ActionContext): QuickFix[] {
        return [
            {
                title: 'Create issue tracker item',
                description: 'Convert TODO to issue tracker item',
                kind: vscode.CodeActionKind.QuickFix,
                command: {
                    title: 'Create issue',
                    command: 'codeWhisperer.createIssueFromTodo',
                    arguments: [context.document.uri, context.range]
                },
                confidence: 0.5
            }
        ];
    }

    private async getRefactoringActions(
        context: ActionContext,
        token: vscode.CancellationToken
    ): Promise<QuickFix[]> {
        
        const actions: QuickFix[] = [];
        const selectedText = context.document.getText(context.range);

        if (selectedText.trim().length === 0) {
            return actions;
        }

        // Extract to variable
        if (this.canExtractToVariable(selectedText)) {
            actions.push({
                title: 'Extract to variable',
                description: 'Extract selected expression to a variable',
                kind: vscode.CodeActionKind.RefactorExtract,
                command: {
                    title: 'Extract to variable',
                    command: 'codeWhisperer.extractToVariable',
                    arguments: [context.document.uri, context.range]
                },
                confidence: 0.8
            });
        }

        // Extract to function
        if (this.canExtractToFunction(selectedText)) {
            actions.push({
                title: 'Extract to function',
                description: 'Extract selected code to a function',
                kind: vscode.CodeActionKind.RefactorExtract,
                command: {
                    title: 'Extract to function',
                    command: 'codeWhisperer.extractToFunction',
                    arguments: [context.document.uri, context.range]
                },
                confidence: 0.7
            });
        }

        // Inline variable
        if (this.canInlineVariable(selectedText)) {
            actions.push({
                title: 'Inline variable',
                description: 'Inline this variable',
                kind: vscode.CodeActionKind.RefactorInline,
                command: {
                    title: 'Inline variable',
                    command: 'codeWhisperer.inlineVariable',
                    arguments: [context.document.uri, context.range]
                },
                confidence: 0.7
            });
        }

        return actions;
    }

    private async getSourceActions(
        context: ActionContext,
        token: vscode.CancellationToken
    ): Promise<QuickFix[]> {
        
        const actions: QuickFix[] = [];

        // Organize imports
        actions.push({
            title: 'Organize imports',
            description: 'Sort and organize import statements',
            kind: vscode.CodeActionKind.SourceOrganizeImports,
            command: {
                title: 'Organize imports',
                command: 'codeWhisperer.organizeImports',
                arguments: [context.document.uri]
            },
            confidence: 0.8
        });

        // Add missing imports (based on undefined references)
        const missingImports = await this.detectMissingImports(context);
        missingImports.forEach(importAction => {
            actions.push(importAction);
        });

        return actions;
    }

    private async getPatternBasedActions(
        context: ActionContext,
        token: vscode.CancellationToken
    ): Promise<QuickFix[]> {
        
        const actions: QuickFix[] = [];

        try {
            const analyzer = getRealTimeAnalyzer();
            const analysisResult = analyzer.getLastAnalysisResult(context.document.uri.toString());

            if (!analysisResult || !analysisResult.patterns) {
                return actions;
            }

            // Find patterns that apply to the current range
            analysisResult.patterns.forEach((pattern: any) => {
                if (pattern.suggestions && this.isPatternRelevantToRange(pattern, context)) {
                    pattern.suggestions.forEach((suggestion: string) => {
                        actions.push({
                            title: `Apply pattern suggestion: ${suggestion}`,
                            description: `Based on detected ${pattern.type} pattern`,
                            kind: vscode.CodeActionKind.QuickFix,
                            command: {
                                title: 'Apply pattern suggestion',
                                command: 'codeWhisperer.applyPatternSuggestion',
                                arguments: [context.document.uri, context.range, suggestion, pattern]
                            },
                            confidence: pattern.confidence || 0.5
                        });
                    });
                }
            });

        } catch (error) {
            if (CodeWhispererConfig.debugMode) {
                console.error('Pattern-based action error:', error);
            }
        }

        return actions;
    }

    private async detectMissingImports(context: ActionContext): Promise<QuickFix[]> {
        const actions: QuickFix[] = [];
        // This would analyze the code for undefined references and suggest imports
        // Implementation would depend on language-specific analysis
        
        return actions;
    }

    private convertQuickFixesToCodeActions(fixes: QuickFix[], context: ActionContext): vscode.CodeAction[] {
        return fixes.map(fix => {
            const action = new vscode.CodeAction(fix.title, fix.kind);
            // action.detail = fix.description; // Detail property might not be available in all VS Code versions
            action.edit = fix.edit;
            action.command = fix.command;
            action.isPreferred = fix.isPreferred;
            
            // Add diagnostics if this is a quick fix
            if (context.diagnostic && fix.kind === vscode.CodeActionKind.QuickFix) {
                action.diagnostics = [context.diagnostic];
            }

            return action;
        });
    }

    private createEdit(document: vscode.TextDocument, range: vscode.Range, newText: string): vscode.WorkspaceEdit {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, range, newText);
        return edit;
    }

    private canExtractToVariable(text: string): boolean {
        // Simple heuristic: check if it's an expression that can be extracted
        return text.trim().length > 5 && 
               !text.includes('\n') && 
               !text.trim().startsWith('var ') &&
               !text.trim().startsWith('let ') &&
               !text.trim().startsWith('const ');
    }

    private canExtractToFunction(text: string): boolean {
        // Simple heuristic: check if it's multiple statements or complex logic
        return text.trim().length > 20 && 
               (text.includes('\n') || text.includes(';'));
    }

    private canInlineVariable(text: string): boolean {
        // Simple heuristic: check if it looks like a variable declaration
        return /^\s*(var|let|const)\s+\w+\s*=/.test(text.trim());
    }

    private isPatternRelevantToRange(pattern: any, context: ActionContext): boolean {
        // Check if pattern applies to the current range
        if (!pattern.range) {
            return true; // Apply globally if no specific range
        }

        const patternRange = new vscode.Range(
            pattern.range.start.line,
            pattern.range.start.character,
            pattern.range.end.line,
            pattern.range.end.character
        );

        return context.range.intersection(patternRange) !== undefined;
    }

    public dispose(): void {
        // Cleanup if needed
    }
}

// Export singleton instance
let codeActionProvider: CodeWhispererCodeActionProvider | undefined;

export function getCodeActionProvider(): CodeWhispererCodeActionProvider {
    if (!codeActionProvider) {
        codeActionProvider = new CodeWhispererCodeActionProvider();
    }
    return codeActionProvider;
}
