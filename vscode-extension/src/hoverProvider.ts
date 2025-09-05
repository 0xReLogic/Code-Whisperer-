import * as vscode from 'vscode';
import { getRealTimeAnalyzer } from './realTimeAnalyzer';
import { getWasmLoader } from './wasmLoader';
import { CodeWhispererConfig } from './config';

interface PatternInfo {
    type: string;
    confidence: number;
    description: string;
    suggestions: string[];
    examples: string[];
    frequency: number;
}

interface HoverContent {
    patterns: PatternInfo[];
    suggestions: string[];
    metrics: {
        analysisTime: number;
        confidence: number;
        lastUpdated: Date;
    };
}

export class CodeWhispererHoverProvider implements vscode.HoverProvider {
    private lastHoverPosition: vscode.Position | undefined;
    private lastHoverTime = 0;
    private hoverCache = new Map<string, HoverContent>();

    public async provideHover(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        
        // Check if hover suggestions are enabled
        if (!CodeWhispererConfig.enableHoverSuggestions) {
            return undefined;
        }

        // Debounce hover requests
        const now = Date.now();
        if (this.lastHoverPosition && 
            this.lastHoverPosition.line === position.line &&
            Math.abs(this.lastHoverPosition.character - position.character) < 5 &&
            now - this.lastHoverTime < 500) {
            return undefined;
        }

        this.lastHoverPosition = position;
        this.lastHoverTime = now;

        try {
            const hoverContent = await this.getHoverContent(document, position, token);
            
            if (!hoverContent || token.isCancellationRequested) {
                return undefined;
            }

            return this.createHoverMarkdown(hoverContent, position);
        } catch (error) {
            if (CodeWhispererConfig.debugMode) {
                console.error('Hover provider error:', error);
            }
            return undefined;
        }
    }

    private async getHoverContent(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<HoverContent | undefined> {
        
        const cacheKey = `${document.uri.toString()}:${position.line}:${position.character}`;
        
        // Check cache first
        const cached = this.hoverCache.get(cacheKey);
        if (cached && this.isCacheValid(cached)) {
            return cached;
        }

        // Get current word/context around cursor
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return undefined;
        }

        const word = document.getText(wordRange);
        const lineText = document.lineAt(position.line).text;
        const contextRange = new vscode.Range(
            Math.max(0, position.line - 2),
            0,
            Math.min(document.lineCount - 1, position.line + 2),
            0
        );
        const contextText = document.getText(contextRange);

        // Get analysis results from real-time analyzer
        const analyzer = getRealTimeAnalyzer();
        const analysisResult = analyzer.getLastAnalysisResult(document.uri.toString());
        
        if (!analysisResult) {
            // Force analysis for this document
            await analyzer.forceAnalysis(document);
            return this.getHoverContent(document, position, token);
        }

        if (token.isCancellationRequested) {
            return undefined;
        }

        // Analyze patterns relevant to current position
        const relevantPatterns = this.findRelevantPatterns(
            analysisResult.patterns,
            word,
            lineText,
            contextText,
            position
        );

        // Generate suggestions for current context
        const suggestions = await this.generateHoverSuggestions(
            word,
            lineText,
            contextText,
            relevantPatterns,
            document.languageId
        );

        const hoverContent: HoverContent = {
            patterns: relevantPatterns,
            suggestions,
            metrics: {
                analysisTime: analysisResult.metrics.analysisTime,
                confidence: analysisResult.metrics.confidence,
                lastUpdated: new Date()
            }
        };

        // Cache the result
        this.hoverCache.set(cacheKey, hoverContent);
        
        // Clean old cache entries
        this.cleanCache();

        return hoverContent;
    }

    private findRelevantPatterns(
        patterns: any[],
        word: string,
        lineText: string,
        contextText: string,
        position: vscode.Position
    ): PatternInfo[] {
        
        return patterns
            .filter(pattern => this.isPatternRelevant(pattern, word, lineText, contextText))
            .map(pattern => this.convertToPatternInfo(pattern))
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 3); // Limit to top 3 patterns
    }

    private isPatternRelevant(
        pattern: any,
        word: string,
        lineText: string,
        contextText: string
    ): boolean {
        
        if (!pattern || !pattern.tokens) {
            return false;
        }

        // Check if pattern contains current word or similar tokens
        const tokens = pattern.tokens.map((t: any) => t.toLowerCase());
        const wordLower = word.toLowerCase();
        
        if (tokens.includes(wordLower)) {
            return true;
        }

        // Check for partial matches
        const hasPartialMatch = tokens.some((token: string) => 
            token.includes(wordLower) || wordLower.includes(token)
        );

        if (hasPartialMatch) {
            return true;
        }

        // Check if pattern context matches current line/context
        const patternContext = pattern.context || '';
        const combinedContext = lineText + ' ' + contextText;
        
        return this.calculateTextSimilarity(patternContext, combinedContext) > 0.3;
    }

    private convertToPatternInfo(pattern: any): PatternInfo {
        return {
            type: pattern.type || 'unknown',
            confidence: pattern.confidence || 0.5,
            description: pattern.description || 'Pattern detected',
            suggestions: pattern.suggestions || [],
            examples: pattern.examples || [],
            frequency: pattern.frequency || 1
        };
    }

    private async generateHoverSuggestions(
        word: string,
        lineText: string,
        contextText: string,
        patterns: PatternInfo[],
        languageId: string
    ): Promise<string[]> {
        
        const suggestions: string[] = [];
        
        // Add pattern-based suggestions
        patterns.forEach(pattern => {
            suggestions.push(...pattern.suggestions);
        });

        // Add context-based suggestions using WASM
        try {
            const wasmLoader = getWasmLoader();
            const engine = await wasmLoader.getEngine();
            
            const contextAnalysis = engine.analyzeCode(contextText, {
                focus: word,
                line: lineText,
                language: languageId
            });

            if (contextAnalysis.suggestions) {
                suggestions.push(...contextAnalysis.suggestions);
            }
        } catch (error) {
            if (CodeWhispererConfig.debugMode) {
                console.error('WASM suggestion generation failed:', error);
            }
        }

        // Remove duplicates and limit suggestions
        return [...new Set(suggestions)]
            .filter(s => s && s.trim().length > 0)
            .slice(0, 5);
    }

    private createHoverMarkdown(
        content: HoverContent,
        position: vscode.Position
    ): vscode.Hover {
        
        const markdownString = new vscode.MarkdownString();
        markdownString.isTrusted = true;
        markdownString.supportHtml = true;

        // Header
        markdownString.appendMarkdown('## 🧠 Code Whisperer Analysis\n\n');

        // Patterns section
        if (content.patterns.length > 0) {
            markdownString.appendMarkdown('### 📊 Detected Patterns\n\n');
            
            content.patterns.forEach((pattern, index) => {
                const confidenceBar = this.createConfidenceBar(pattern.confidence);
                markdownString.appendMarkdown(
                    `**${pattern.type}** ${confidenceBar}\n` +
                    `*${pattern.description}*\n\n`
                );

                if (pattern.examples.length > 0) {
                    markdownString.appendMarkdown('*Examples:*\n');
                    pattern.examples.slice(0, 2).forEach(example => {
                        markdownString.appendCodeblock(example, 'typescript');
                    });
                }
            });
        }

        // Suggestions section
        if (content.suggestions.length > 0) {
            markdownString.appendMarkdown('### 💡 Suggestions\n\n');
            
            content.suggestions.forEach(suggestion => {
                markdownString.appendMarkdown(`• ${suggestion}\n`);
            });
            markdownString.appendMarkdown('\n');
        }

        // Metrics section
        if (CodeWhispererConfig.debugMode) {
            markdownString.appendMarkdown('### 📈 Metrics\n\n');
            markdownString.appendMarkdown(
                `• **Analysis Time:** ${content.metrics.analysisTime}ms\n` +
                `• **Confidence:** ${(content.metrics.confidence * 100).toFixed(1)}%\n` +
                `• **Last Updated:** ${content.metrics.lastUpdated.toLocaleTimeString()}\n\n`
            );
        }

        // Action buttons
        markdownString.appendMarkdown(
            '[Analyze Document](command:codeWhisperer.analyzeDocument) | ' +
            '[Open Dashboard](command:codeWhisperer.openDashboard) | ' +
            '[Settings](command:codeWhisperer.openSettings)\n'
        );

        return new vscode.Hover(markdownString);
    }

    private createConfidenceBar(confidence: number): string {
        const bars = Math.round(confidence * 5);
        const filled = '█'.repeat(bars);
        const empty = '░'.repeat(5 - bars);
        return `\`${filled}${empty}\` ${(confidence * 100).toFixed(0)}%`;
    }

    private calculateTextSimilarity(text1: string, text2: string): number {
        // Simple Jaccard similarity for text comparison
        const tokens1 = new Set(text1.toLowerCase().split(/\s+/));
        const tokens2 = new Set(text2.toLowerCase().split(/\s+/));
        
        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }

    private isCacheValid(content: HoverContent): boolean {
        const maxAge = 30000; // 30 seconds
        return Date.now() - content.metrics.lastUpdated.getTime() < maxAge;
    }

    private cleanCache(): void {
        const maxSize = 100;
        if (this.hoverCache.size > maxSize) {
            // Remove oldest 20% of entries
            const entries = Array.from(this.hoverCache.entries());
            const toRemove = Math.floor(entries.length * 0.2);
            
            entries
                .sort((a, b) => a[1].metrics.lastUpdated.getTime() - b[1].metrics.lastUpdated.getTime())
                .slice(0, toRemove)
                .forEach(([key]) => this.hoverCache.delete(key));
        }
    }

    public dispose(): void {
        this.hoverCache.clear();
    }
}

// Export singleton instance
let hoverProvider: CodeWhispererHoverProvider | undefined;

export function getHoverProvider(): CodeWhispererHoverProvider {
    if (!hoverProvider) {
        hoverProvider = new CodeWhispererHoverProvider();
    }
    return hoverProvider;
}
