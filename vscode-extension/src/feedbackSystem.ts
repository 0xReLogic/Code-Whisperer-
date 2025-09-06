import * as vscode from 'vscode';

// Interface untuk feedback data
export interface FeedbackData {
    suggestionId: string;
    suggestionType: 'hover' | 'completion' | 'diagnostic' | 'codeAction';
    action: 'accept' | 'reject' | 'ignore';
    timestamp: number;
    context: {
        language: string;
        fileName: string;
        lineNumber: number;
        suggestionText: string;
        codeContext: string; // surrounding code for context
    };
    userReason?: string; // optional user-provided reason
}

// Interface untuk feedback statistics
export interface FeedbackStats {
    totalSuggestions: number;
    acceptedCount: number;
    rejectedCount: number;
    ignoredCount: number;
    acceptanceRate: number;
    suggestionTypeStats: {
        [key: string]: {
            total: number;
            accepted: number;
            rejected: number;
            ignored: number;
        };
    };
}

export class FeedbackCollectionSystem {
    private context: vscode.ExtensionContext;
    private feedbackData: FeedbackData[] = [];
    private readonly STORAGE_KEY = 'codeWhispererFeedback';
    private readonly MAX_FEEDBACK_ENTRIES = 10000; // Limit storage size

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadFeedbackData();
    }

    /**
     * Generate unique suggestion ID
     */
    public generateSuggestionId(): string {
        return `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Record user feedback for a suggestion
     */
    public async recordFeedback(feedback: FeedbackData): Promise<void> {
        try {
            // Add to in-memory array
            this.feedbackData.push(feedback);

            // Limit array size for performance
            if (this.feedbackData.length > this.MAX_FEEDBACK_ENTRIES) {
                this.feedbackData = this.feedbackData.slice(-this.MAX_FEEDBACK_ENTRIES);
            }

            // Save to persistent storage
            await this.saveFeedbackData();

            // Emit event for other components to react
            this.emitFeedbackEvent(feedback);

            console.log(`Feedback recorded: ${feedback.action} for ${feedback.suggestionType}`);
        } catch (error) {
            console.error('Error recording feedback:', error);
        }
    }

    /**
     * Show feedback UI to user
     */
    public async showFeedbackUI(
        suggestionId: string,
        suggestionType: FeedbackData['suggestionType'],
        suggestionText: string,
        position: vscode.Position
    ): Promise<void> {
        const actions = [
            { title: '👍 Helpful', action: 'accept' as const },
            { title: '👎 Not Helpful', action: 'reject' as const },
            { title: '❌ Dismiss', action: 'ignore' as const }
        ];

        const selectedAction = await vscode.window.showInformationMessage(
            `Code Whisperer: "${suggestionText.substring(0, 50)}..."`,
            ...actions
        );

        if (selectedAction) {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

            const feedback: FeedbackData = {
                suggestionId,
                suggestionType,
                action: selectedAction.action,
                timestamp: Date.now(),
                context: {
                    language: editor.document.languageId,
                    fileName: editor.document.fileName,
                    lineNumber: position.line,
                    suggestionText,
                    codeContext: this.getCodeContext(editor, position)
                }
            };

            // If user rejected, optionally ask for reason
            if (selectedAction.action === 'reject') {
                const reason = await vscode.window.showInputBox({
                    prompt: 'Optional: Why was this suggestion not helpful?',
                    placeHolder: 'e.g., "Doesn\'t match my coding style", "Incorrect suggestion"'
                });
                if (reason) {
                    feedback.userReason = reason;
                }
            }

            await this.recordFeedback(feedback);
        }
    }

    /**
     * Get code context around a position
     */
    private getCodeContext(editor: vscode.TextEditor, position: vscode.Position): string {
        const startLine = Math.max(0, position.line - 2);
        const endLine = Math.min(editor.document.lineCount - 1, position.line + 2);
        
        let context = '';
        for (let i = startLine; i <= endLine; i++) {
            context += editor.document.lineAt(i).text + '\n';
        }
        return context.trim();
    }

    /**
     * Get feedback statistics
     */
    public getFeedbackStats(): FeedbackStats {
        const total = this.feedbackData.length;
        const accepted = this.feedbackData.filter(f => f.action === 'accept').length;
        const rejected = this.feedbackData.filter(f => f.action === 'reject').length;
        const ignored = this.feedbackData.filter(f => f.action === 'ignore').length;

        const suggestionTypeStats: { [key: string]: any } = {};
        
        // Calculate stats per suggestion type
        ['hover', 'completion', 'diagnostic', 'codeAction'].forEach(type => {
            const typeData = this.feedbackData.filter(f => f.suggestionType === type);
            suggestionTypeStats[type] = {
                total: typeData.length,
                accepted: typeData.filter(f => f.action === 'accept').length,
                rejected: typeData.filter(f => f.action === 'reject').length,
                ignored: typeData.filter(f => f.action === 'ignore').length
            };
        });

        return {
            totalSuggestions: total,
            acceptedCount: accepted,
            rejectedCount: rejected,
            ignoredCount: ignored,
            acceptanceRate: total > 0 ? (accepted / total) * 100 : 0,
            suggestionTypeStats
        };
    }

    /**
     * Get recent feedback data for analysis
     */
    public getRecentFeedback(days: number = 7): FeedbackData[] {
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        return this.feedbackData.filter(f => f.timestamp >= cutoffTime);
    }

    /**
     * Get feedback data for specific suggestion types
     */
    public getFeedbackByType(type: FeedbackData['suggestionType']): FeedbackData[] {
        return this.feedbackData.filter(f => f.suggestionType === type);
    }

    /**
     * Get feedback data for specific languages
     */
    public getFeedbackByLanguage(language: string): FeedbackData[] {
        return this.feedbackData.filter(f => f.context.language === language);
    }

    /**
     * Clear old feedback data (older than specified days)
     */
    public async clearOldFeedback(days: number = 30): Promise<void> {
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        const initialCount = this.feedbackData.length;
        
        this.feedbackData = this.feedbackData.filter(f => f.timestamp >= cutoffTime);
        
        await this.saveFeedbackData();
        
        const removedCount = initialCount - this.feedbackData.length;
        console.log(`Cleared ${removedCount} old feedback entries`);
    }

    /**
     * Export feedback data for analysis
     */
    public exportFeedbackData(): string {
        return JSON.stringify({
            exportTimestamp: Date.now(),
            totalEntries: this.feedbackData.length,
            stats: this.getFeedbackStats(),
            data: this.feedbackData
        }, null, 2);
    }

    /**
     * Load feedback data from storage
     */
    private async loadFeedbackData(): Promise<void> {
        try {
            const stored = this.context.globalState.get<FeedbackData[]>(this.STORAGE_KEY, []);
            this.feedbackData = stored;
            console.log(`Loaded ${this.feedbackData.length} feedback entries`);
        } catch (error) {
            console.error('Error loading feedback data:', error);
            this.feedbackData = [];
        }
    }

    /**
     * Save feedback data to storage
     */
    private async saveFeedbackData(): Promise<void> {
        try {
            await this.context.globalState.update(this.STORAGE_KEY, this.feedbackData);
        } catch (error) {
            console.error('Error saving feedback data:', error);
        }
    }

    /**
     * Emit feedback event for other components
     */
    private emitFeedbackEvent(feedback: FeedbackData): void {
        // Create a custom event that other components can listen to
        const event = new vscode.EventEmitter<FeedbackData>();
        event.fire(feedback);
    }

    /**
     * Get learning insights from feedback
     */
    public getLearningInsights(): {
        preferredSuggestionTypes: string[];
        mostRejectedReasons: string[];
        languagePreferences: { [key: string]: number };
        timeBasedPatterns: { [key: string]: number };
    } {
        const stats = this.getFeedbackStats();
        
        // Find preferred suggestion types (highest acceptance rate)
        const preferredTypes = Object.entries(stats.suggestionTypeStats)
            .filter(([_, data]) => data.total > 0)
            .sort(([_, a], [__, b]) => (b.accepted / b.total) - (a.accepted / a.total))
            .map(([type, _]) => type);

        // Get most common rejection reasons
        const rejectionReasons = this.feedbackData
            .filter(f => f.action === 'reject' && f.userReason)
            .map(f => f.userReason!)
            .reduce((acc, reason) => {
                acc[reason] = (acc[reason] || 0) + 1;
                return acc;
            }, {} as { [key: string]: number });

        const mostRejectedReasons = Object.entries(rejectionReasons)
            .sort(([_, a], [__, b]) => b - a)
            .map(([reason, _]) => reason);

        // Language preferences (acceptance rate by language)
        const languagePrefs = this.feedbackData.reduce((acc, f) => {
            const lang = f.context.language;
            if (!acc[lang]) {
                acc[lang] = { accepted: 0, total: 0 };
            }
            acc[lang]!.total++;
            if (f.action === 'accept') {
                acc[lang]!.accepted++;
            }
            return acc;
        }, {} as { [key: string]: { accepted: number; total: number } });

        const languagePreferences = Object.entries(languagePrefs).reduce((acc, [lang, data]) => {
            acc[lang] = data.total > 0 ? (data.accepted / data.total) * 100 : 0;
            return acc;
        }, {} as { [key: string]: number });

        // Time-based patterns (hourly acceptance rates)
        const timePatterns = this.feedbackData.reduce((acc, f) => {
            const hour = new Date(f.timestamp).getHours();
            const key = `${hour}:00`;
            if (!acc[key]) {
                acc[key] = { accepted: 0, total: 0 };
            }
            acc[key]!.total++;
            if (f.action === 'accept') {
                acc[key]!.accepted++;
            }
            return acc;
        }, {} as { [key: string]: { accepted: number; total: number } });

        const timeBasedPatterns = Object.entries(timePatterns).reduce((acc, [time, data]) => {
            acc[time] = data.total > 0 ? (data.accepted / data.total) * 100 : 0;
            return acc;
        }, {} as { [key: string]: number });

        return {
            preferredSuggestionTypes: preferredTypes,
            mostRejectedReasons,
            languagePreferences,
            timeBasedPatterns
        };
    }
}
