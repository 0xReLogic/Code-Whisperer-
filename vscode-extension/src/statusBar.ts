import * as vscode from 'vscode';
import { CodeWhispererConfig } from './config';

/**
 * Status bar manager for Code Whisperer extension
 * Shows pattern learning progress and extension status
 */
export class StatusBarManager {
    private static instance: StatusBarManager;
    private statusBarItem: vscode.StatusBarItem;
    private isAnalyzing = false;
    private patternCount = 0;
    private lastAnalysisTime: Date | null = null;

    private constructor() {
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        
        this.statusBarItem.command = 'codeWhisperer.openDashboard';
        this.setupStatusBar();
    }

    static getInstance(): StatusBarManager {
        if (!this.instance) {
            this.instance = new StatusBarManager();
        }
        return this.instance;
    }

    /**
     * Initialize and show the status bar
     */
    private setupStatusBar(): void {
        this.updateStatusBar();
        
        if (CodeWhispererConfig.showProgressIndicator) {
            this.statusBarItem.show();
        }
    }

    /**
     * Update status bar display
     */
    private updateStatusBar(): void {
        if (!CodeWhispererConfig.enabled) {
            this.statusBarItem.text = "$(circle-slash) Code Whisperer: Disabled";
            this.statusBarItem.tooltip = "Code Whisperer is disabled. Click to open settings.";
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            return;
        }

        if (this.isAnalyzing) {
            this.statusBarItem.text = "$(sync~spin) Code Whisperer: Analyzing...";
            this.statusBarItem.tooltip = "Analyzing code patterns...";
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        } else {
            const icon = this.getStatusIcon();
            const text = `${icon} CW: ${this.patternCount} patterns`;
            
            this.statusBarItem.text = text;
            this.statusBarItem.tooltip = this.getTooltipText();
            this.statusBarItem.backgroundColor = undefined;
        }
    }

    /**
     * Get appropriate status icon based on pattern count
     */
    private getStatusIcon(): string {
        if (this.patternCount === 0) {
            return "$(lightbulb)";
        } else if (this.patternCount < 50) {
            return "$(lightbulb)";
        } else if (this.patternCount < 200) {
            return "$(symbol-event)";
        } else {
            return "$(sparkle)";
        }
    }

    /**
     * Generate tooltip text with detailed information
     */
    private getTooltipText(): string {
        const lines = [
            `Code Whisperer: ${this.patternCount} learned patterns`,
            '',
            `Status: ${CodeWhispererConfig.enabled ? 'Active' : 'Disabled'}`,
            `Learning Mode: ${CodeWhispererConfig.learningMode}`,
            `Analysis Depth: ${CodeWhispererConfig.analysisDepth}`,
            `Confidence Threshold: ${(CodeWhispererConfig.confidenceThreshold * 100).toFixed(0)}%`
        ];

        if (this.lastAnalysisTime) {
            const timeAgo = this.getTimeAgo(this.lastAnalysisTime);
            lines.push(`Last Analysis: ${timeAgo}`);
        }

        lines.push('', 'Click to open Pattern Dashboard');
        
        return lines.join('\n');
    }

    /**
     * Get human-readable time ago string
     */
    private getTimeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) {
            return 'just now';
        } else if (diffMins < 60) {
            return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        }
    }

    /**
     * Show that analysis is in progress
     */
    startAnalysis(): void {
        this.isAnalyzing = true;
        this.updateStatusBar();
    }

    /**
     * Stop showing analysis progress
     */
    stopAnalysis(): void {
        this.isAnalyzing = false;
        this.lastAnalysisTime = new Date();
        this.updateStatusBar();
    }

    /**
     * Update pattern count
     */
    updatePatternCount(count: number): void {
        this.patternCount = count;
        this.updateStatusBar();
    }

    /**
     * Increment pattern count by one
     */
    incrementPatternCount(): void {
        this.patternCount++;
        this.updateStatusBar();
    }

    /**
     * Show temporary message in status bar
     */
    showTemporaryMessage(message: string, duration = 3000): void {
        const originalText = this.statusBarItem.text;
        const originalTooltip = this.statusBarItem.tooltip;
        
        this.statusBarItem.text = `$(info) ${message}`;
        this.statusBarItem.tooltip = message;
        
        setTimeout(() => {
            this.statusBarItem.text = originalText;
            this.statusBarItem.tooltip = originalTooltip;
        }, duration);
    }

    /**
     * Show error message in status bar
     */
    showError(message: string, duration = 5000): void {
        const originalText = this.statusBarItem.text;
        const originalTooltip = this.statusBarItem.tooltip;
        const originalBackground = this.statusBarItem.backgroundColor;
        
        this.statusBarItem.text = `$(error) ${message}`;
        this.statusBarItem.tooltip = `Error: ${message}`;
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        
        setTimeout(() => {
            this.statusBarItem.text = originalText;
            this.statusBarItem.tooltip = originalTooltip;
            this.statusBarItem.backgroundColor = originalBackground;
        }, duration);
    }

    /**
     * Show warning message in status bar
     */
    showWarning(message: string, duration = 4000): void {
        const originalText = this.statusBarItem.text;
        const originalTooltip = this.statusBarItem.tooltip;
        const originalBackground = this.statusBarItem.backgroundColor;
        
        this.statusBarItem.text = `$(warning) ${message}`;
        this.statusBarItem.tooltip = `Warning: ${message}`;
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        
        setTimeout(() => {
            this.statusBarItem.text = originalText;
            this.statusBarItem.tooltip = originalTooltip;
            this.statusBarItem.backgroundColor = originalBackground;
        }, duration);
    }

    /**
     * Show success message in status bar
     */
    showSuccess(message: string, duration = 2000): void {
        const originalText = this.statusBarItem.text;
        const originalTooltip = this.statusBarItem.tooltip;
        
        this.statusBarItem.text = `$(check) ${message}`;
        this.statusBarItem.tooltip = message;
        
        setTimeout(() => {
            this.statusBarItem.text = originalText;
            this.statusBarItem.tooltip = originalTooltip;
        }, duration);
    }

    /**
     * Toggle visibility based on configuration
     */
    updateVisibility(): void {
        if (CodeWhispererConfig.showProgressIndicator) {
            this.statusBarItem.show();
        } else {
            this.statusBarItem.hide();
        }
    }

    /**
     * Handle configuration changes
     */
    onConfigurationChanged(): void {
        this.updateVisibility();
        this.updateStatusBar();
    }

    /**
     * Show analysis statistics
     */
    showStatistics(stats: {
        totalPatterns: number;
        acceptanceRate: number;
        averageConfidence: number;
    }): void {
        this.patternCount = stats.totalPatterns;
        
        const message = `${stats.totalPatterns} patterns, ${(stats.acceptanceRate * 100).toFixed(1)}% acceptance`;
        this.showTemporaryMessage(message, 5000);
        
        setTimeout(() => {
            this.updateStatusBar();
        }, 5100);
    }

    /**
     * Dispose of the status bar item
     */
    dispose(): void {
        this.statusBarItem.dispose();
    }

    /**
     * Get current status information
     */
    getStatus(): {
        isAnalyzing: boolean;
        patternCount: number;
        lastAnalysisTime: Date | null;
        isVisible: boolean;
    } {
        return {
            isAnalyzing: this.isAnalyzing,
            patternCount: this.patternCount,
            lastAnalysisTime: this.lastAnalysisTime,
            isVisible: CodeWhispererConfig.showProgressIndicator
        };
    }
}

/**
 * Convenience function to get status bar manager instance
 */
export function getStatusBarManager(): StatusBarManager {
    return StatusBarManager.getInstance();
}
