import * as vscode from 'vscode';
import { getRealTimeAnalyzer } from './realTimeAnalyzer';
import { getWasmLoader } from './wasmLoader';
import { CodeWhispererConfig } from './config';

interface CompletionContext {
    prefix: string;
    suffix: string;
    lineText: string;
    cursorPosition: vscode.Position;
    document: vscode.TextDocument;
    surrounding: string;
}

interface CompletionSuggestion {
    text: string;
    type: vscode.CompletionItemKind;
    confidence: number;
    description: string;
    insertText?: string | vscode.SnippetString;
    additionalTextEdits?: vscode.TextEdit[];
    documentation?: vscode.MarkdownString;
    sortText?: string;
}

export class CodeWhispererCompletionProvider implements vscode.CompletionItemProvider {
    private lastCompletionTime = 0;
    private completionCache = new Map<string, CompletionSuggestion[]>();
    private triggerCharacters = new Set(['.', ':', '(', '[', '{', ' ', '\n']);

    public async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[] | vscode.CompletionList | undefined> {

        // Check if inline suggestions are enabled
        if (!CodeWhispererConfig.enableInlineSuggestions) {
            return undefined;
        }

        // Debounce completion requests
        const now = Date.now();
        if (now - this.lastCompletionTime < 100) {
            return undefined;
        }
        this.lastCompletionTime = now;

        try {
            const completionContext = this.buildCompletionContext(document, position);
            const suggestions = await this.generateCompletions(completionContext, token);
            
            if (!suggestions || suggestions.length === 0 || token.isCancellationRequested) {
                return undefined;
            }

            return this.convertToCompletionItems(suggestions, completionContext);
        } catch (error) {
            if (CodeWhispererConfig.debugMode) {
                console.error('Completion provider error:', error);
            }
            return undefined;
        }
    }

    public async resolveCompletionItem(
        item: vscode.CompletionItem,
        token: vscode.CancellationToken
    ): Promise<vscode.CompletionItem> {
        
        // Add additional documentation or details if needed
        if (item.detail && !item.documentation) {
            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown(`**Code Whisperer Suggestion**\n\n`);
            markdown.appendMarkdown(`${item.detail}\n\n`);
            
            if (item.label && typeof item.label === 'string') {
                markdown.appendCodeblock(item.label, 'typescript');
            }
            
            item.documentation = markdown;
        }

        return item;
    }

    private buildCompletionContext(
        document: vscode.TextDocument,
        position: vscode.Position
    ): CompletionContext {
        
        const lineText = document.lineAt(position.line).text;
        const prefix = lineText.substring(0, position.character);
        const suffix = lineText.substring(position.character);
        
        // Get surrounding context (few lines before and after)
        const startLine = Math.max(0, position.line - 5);
        const endLine = Math.min(document.lineCount - 1, position.line + 5);
        const surroundingRange = new vscode.Range(startLine, 0, endLine, 0);
        const surrounding = document.getText(surroundingRange);

        return {
            prefix,
            suffix,
            lineText,
            cursorPosition: position,
            document,
            surrounding
        };
    }

    private async generateCompletions(
        context: CompletionContext,
        token: vscode.CancellationToken
    ): Promise<CompletionSuggestion[]> {
        
        const cacheKey = this.createCacheKey(context);
        
        // Check cache first
        const cached = this.completionCache.get(cacheKey);
        if (cached && this.isCacheValid(cacheKey)) {
            return cached;
        }

        const suggestions: CompletionSuggestion[] = [];

        // Get pattern-based suggestions
        const patternSuggestions = await this.getPatternBasedSuggestions(context, token);
        suggestions.push(...patternSuggestions);

        // Get context-aware suggestions
        const contextSuggestions = await this.getContextAwareSuggestions(context, token);
        suggestions.push(...contextSuggestions);

        // Get language-specific suggestions
        const languageSuggestions = await this.getLanguageSpecificSuggestions(context, token);
        suggestions.push(...languageSuggestions);

        if (token.isCancellationRequested) {
            return [];
        }

        // Remove duplicates and sort by confidence
        const uniqueSuggestions = this.deduplicateAndSort(suggestions);
        
        // Cache the results
        this.completionCache.set(cacheKey, uniqueSuggestions);
        
        return uniqueSuggestions.slice(0, CodeWhispererConfig.maxSuggestions);
    }

    private async getPatternBasedSuggestions(
        context: CompletionContext,
        token: vscode.CancellationToken
    ): Promise<CompletionSuggestion[]> {
        
        const analyzer = getRealTimeAnalyzer();
        const analysisResult = analyzer.getLastAnalysisResult(context.document.uri.toString());
        
        if (!analysisResult) {
            return [];
        }

        const suggestions: CompletionSuggestion[] = [];
        const currentWord = this.getCurrentWord(context);

        analysisResult.patterns.forEach(pattern => {
            if (this.isPatternRelevant(pattern, context, currentWord)) {
                const patternSuggestions = this.extractSuggestionsFromPattern(pattern, context);
                suggestions.push(...patternSuggestions);
            }
        });

        return suggestions;
    }

    private async getContextAwareSuggestions(
        context: CompletionContext,
        token: vscode.CancellationToken
    ): Promise<CompletionSuggestion[]> {
        
        try {
            const wasmLoader = getWasmLoader();
            const engine = await wasmLoader.getEngine();
            
            const completionRequest = {
                code: context.surrounding,
                position: {
                    line: context.cursorPosition.line,
                    character: context.cursorPosition.character
                },
                language: context.document.languageId,
                prefix: context.prefix,
                suffix: context.suffix
            };

            const wasmSuggestions = engine.analyzeCode(context.surrounding, completionRequest);
            
            return this.convertWasmSuggestions(wasmSuggestions.suggestions || [], context);
        } catch (error) {
            if (CodeWhispererConfig.debugMode) {
                console.error('WASM completion error:', error);
            }
            return [];
        }
    }

    private async getLanguageSpecificSuggestions(
        context: CompletionContext,
        token: vscode.CancellationToken
    ): Promise<CompletionSuggestion[]> {
        
        const suggestions: CompletionSuggestion[] = [];
        const languageId = context.document.languageId;

        switch (languageId) {
            case 'typescript':
            case 'javascript':
                suggestions.push(...this.getJavaScriptSuggestions(context));
                break;
            case 'python':
                suggestions.push(...this.getPythonSuggestions(context));
                break;
            case 'java':
                suggestions.push(...this.getJavaSuggestions(context));
                break;
            default:
                suggestions.push(...this.getGenericSuggestions(context));
        }

        return suggestions;
    }

    private getJavaScriptSuggestions(context: CompletionContext): CompletionSuggestion[] {
        const suggestions: CompletionSuggestion[] = [];
        const prefix = context.prefix.trim();

        // Common JavaScript patterns
        if (prefix.endsWith('console.')) {
            suggestions.push({
                text: 'log',
                type: vscode.CompletionItemKind.Method,
                confidence: 0.9,
                description: 'Console log method',
                insertText: 'log($1)',
                documentation: new vscode.MarkdownString('Log a message to the console')
            });
        }

        if (prefix.includes('function') || prefix.includes('=>')) {
            suggestions.push({
                text: 'async',
                type: vscode.CompletionItemKind.Keyword,
                confidence: 0.8,
                description: 'Async function modifier',
                insertText: 'async ',
                documentation: new vscode.MarkdownString('Make function asynchronous')
            });
        }

        return suggestions;
    }

    private getPythonSuggestions(context: CompletionContext): CompletionSuggestion[] {
        const suggestions: CompletionSuggestion[] = [];
        const prefix = context.prefix.trim();

        // Common Python patterns
        if (prefix.endsWith('def ')) {
            suggestions.push({
                text: '__init__',
                type: vscode.CompletionItemKind.Method,
                confidence: 0.9,
                description: 'Constructor method',
                insertText: '__init__(self$1):',
                documentation: new vscode.MarkdownString('Class constructor method')
            });
        }

        if (prefix.includes('import ')) {
            suggestions.push({
                text: 'os',
                type: vscode.CompletionItemKind.Module,
                confidence: 0.8,
                description: 'Operating system interface',
                insertText: 'os',
                documentation: new vscode.MarkdownString('Standard library for OS operations')
            });
        }

        return suggestions;
    }

    private getJavaSuggestions(context: CompletionContext): CompletionSuggestion[] {
        const suggestions: CompletionSuggestion[] = [];
        const prefix = context.prefix.trim();

        // Common Java patterns
        if (prefix.includes('public ') || prefix.includes('private ')) {
            suggestions.push({
                text: 'static',
                type: vscode.CompletionItemKind.Keyword,
                confidence: 0.8,
                description: 'Static modifier',
                insertText: 'static ',
                documentation: new vscode.MarkdownString('Static method/field modifier')
            });
        }

        return suggestions;
    }

    private getGenericSuggestions(context: CompletionContext): CompletionSuggestion[] {
        const suggestions: CompletionSuggestion[] = [];
        
        // Generic programming constructs
        if (context.prefix.includes('if')) {
            suggestions.push({
                text: 'else',
                type: vscode.CompletionItemKind.Keyword,
                confidence: 0.7,
                description: 'Else clause',
                insertText: 'else {\n\t$1\n}',
                documentation: new vscode.MarkdownString('Else condition block')
            });
        }

        return suggestions;
    }

    private convertToCompletionItems(
        suggestions: CompletionSuggestion[],
        context: CompletionContext
    ): vscode.CompletionItem[] {
        
        return suggestions.map((suggestion, index) => {
            const item = new vscode.CompletionItem(
                suggestion.text,
                suggestion.type
            );

            item.detail = suggestion.description;
            item.documentation = suggestion.documentation;
            item.sortText = suggestion.sortText || `${(1 - suggestion.confidence).toFixed(3)}_${index.toString().padStart(3, '0')}`;
            
            if (suggestion.insertText) {
                if (typeof suggestion.insertText === 'string') {
                    item.insertText = new vscode.SnippetString(suggestion.insertText);
                } else {
                    item.insertText = suggestion.insertText;
                }
            }

            if (suggestion.additionalTextEdits) {
                item.additionalTextEdits = suggestion.additionalTextEdits;
            }

            // Add confidence indicator
            item.label = {
                label: suggestion.text,
                detail: ` (${(suggestion.confidence * 100).toFixed(0)}%)`
            };

            return item;
        });
    }

    private getCurrentWord(context: CompletionContext): string {
        const match = context.prefix.match(/\w+$/);
        return match ? match[0] : '';
    }

    private isPatternRelevant(pattern: any, context: CompletionContext, currentWord: string): boolean {
        if (!pattern.tokens) {
            return false;
        }

        const tokens = pattern.tokens.map((t: any) => t.toLowerCase());
        const wordLower = currentWord.toLowerCase();
        
        return tokens.some((token: string) => 
            token.includes(wordLower) || wordLower.includes(token)
        );
    }

    private extractSuggestionsFromPattern(pattern: any, context: CompletionContext): CompletionSuggestion[] {
        const suggestions: CompletionSuggestion[] = [];
        
        if (pattern.suggestions) {
            pattern.suggestions.forEach((suggestion: string) => {
                suggestions.push({
                    text: suggestion,
                    type: vscode.CompletionItemKind.Text,
                    confidence: pattern.confidence || 0.5,
                    description: `Pattern-based suggestion (${pattern.type})`,
                    documentation: new vscode.MarkdownString(`Suggested based on detected pattern: **${pattern.type}**`)
                });
            });
        }

        return suggestions;
    }

    private convertWasmSuggestions(wasmSuggestions: any[], context: CompletionContext): CompletionSuggestion[] {
        return wasmSuggestions.map(suggestion => ({
            text: suggestion.text || suggestion,
            type: this.mapWasmTypeToCompletionKind(suggestion.type),
            confidence: suggestion.confidence || 0.6,
            description: suggestion.description || 'AI-generated suggestion',
            insertText: suggestion.insertText,
            documentation: suggestion.documentation ? 
                new vscode.MarkdownString(suggestion.documentation) : undefined
        }));
    }

    private mapWasmTypeToCompletionKind(type: string): vscode.CompletionItemKind {
        switch (type) {
            case 'function': return vscode.CompletionItemKind.Function;
            case 'method': return vscode.CompletionItemKind.Method;
            case 'variable': return vscode.CompletionItemKind.Variable;
            case 'class': return vscode.CompletionItemKind.Class;
            case 'interface': return vscode.CompletionItemKind.Interface;
            case 'keyword': return vscode.CompletionItemKind.Keyword;
            case 'snippet': return vscode.CompletionItemKind.Snippet;
            default: return vscode.CompletionItemKind.Text;
        }
    }

    private deduplicateAndSort(suggestions: CompletionSuggestion[]): CompletionSuggestion[] {
        const seen = new Set<string>();
        const unique: CompletionSuggestion[] = [];

        suggestions
            .sort((a, b) => b.confidence - a.confidence)
            .forEach(suggestion => {
                const key = suggestion.text.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    unique.push(suggestion);
                }
            });

        return unique;
    }

    private createCacheKey(context: CompletionContext): string {
        return `${context.document.uri.toString()}:${context.cursorPosition.line}:${context.prefix}`;
    }

    private isCacheValid(cacheKey: string): boolean {
        // Simple cache validity - could be enhanced
        return this.completionCache.has(cacheKey);
    }

    public dispose(): void {
        this.completionCache.clear();
    }
}

// Export singleton instance
let completionProvider: CodeWhispererCompletionProvider | undefined;

export function getCompletionProvider(): CodeWhispererCompletionProvider {
    if (!completionProvider) {
        completionProvider = new CodeWhispererCompletionProvider();
    }
    return completionProvider;
}
