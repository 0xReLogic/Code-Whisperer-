import * as vscode from 'vscode';

/**
 * Configuration manager for Code Whisperer extension
 * Handles all user settings and preferences
 */
export class CodeWhispererConfig {
    private static readonly SECTION = 'codeWhisperer';
    
    /**
     * Get extension configuration section
     */
    private static getConfig(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration(this.SECTION);
    }

    /**
     * Check if the extension is enabled
     */
    static get enabled(): boolean {
        return this.getConfig().get<boolean>('enabled', true);
    }

    /**
     * Check if real-time analysis is enabled
     */
    static get realTimeAnalysis(): boolean {
        return this.getConfig().get<boolean>('realTimeAnalysis', true);
    }

    /**
     * Get suggestion delay in milliseconds
     */
    static get suggestionDelay(): number {
        return this.getConfig().get<number>('suggestionDelay', 500);
    }

    /**
     * Get maximum number of suggestions to show
     */
    static get maxSuggestions(): number {
        return this.getConfig().get<number>('maxSuggestions', 5);
    }

    /**
     * Get confidence threshold for suggestions
     */
    static get confidenceThreshold(): number {
        return this.getConfig().get<number>('confidenceThreshold', 0.7);
    }

    /**
     * Get learning mode setting
     */
    static get learningMode(): 'adaptive' | 'conservative' | 'aggressive' {
        return this.getConfig().get<'adaptive' | 'conservative' | 'aggressive'>('learningMode', 'adaptive');
    }

    /**
     * Get analysis depth setting
     */
    static get analysisDepth(): 'basic' | 'standard' | 'comprehensive' {
        return this.getConfig().get<'basic' | 'standard' | 'comprehensive'>('analysisDepth', 'standard');
    }

    /**
     * Get list of enabled languages
     */
    static get enabledLanguages(): string[] {
        return this.getConfig().get<string[]>('enabledLanguages', [
            'javascript', 'typescript', 'python', 'rust', 'java', 'cpp', 'go'
        ]);
    }

    /**
     * Check if progress indicator should be shown
     */
    static get showProgressIndicator(): boolean {
        return this.getConfig().get<boolean>('showProgressIndicator', true);
    }

    /**
     * Check if hover suggestions are enabled
     */
    static get enableHoverSuggestions(): boolean {
        return this.getConfig().get<boolean>('enableHoverSuggestions', true);
    }

    /**
     * Check if inline suggestions are enabled
     */
    static get enableInlineSuggestions(): boolean {
        return this.getConfig().get<boolean>('enableInlineSuggestions', true);
    }

    /**
     * Check if diagnostics are enabled
     */
    static get enableDiagnostics(): boolean {
        return this.getConfig().get<boolean>('enableDiagnostics', true);
    }

    /**
     * Get cache size setting
     */
    static get cacheSize(): number {
        return this.getConfig().get<number>('cacheSize', 1000);
    }

    /**
     * Get pattern expiry days
     */
    static get patternExpiryDays(): number {
        return this.getConfig().get<number>('patternExpiryDays', 30);
    }

    /**
     * Check if telemetry is enabled
     */
    static get enableTelemetry(): boolean {
        return this.getConfig().get<boolean>('enableTelemetry', false);
    }

    /**
     * Check if debug mode is enabled
     */
    static get debugMode(): boolean {
        return this.getConfig().get<boolean>('debugMode', true); // Enable debug by default for testing
    }

    /**
     * Check if a specific language is enabled for analysis
     */
    static isLanguageEnabled(languageId: string): boolean {
        return this.enabledLanguages.includes(languageId);
    }

    /**
     * Update a configuration setting
     */
    static async updateSetting<T>(key: string, value: T, target?: vscode.ConfigurationTarget): Promise<void> {
        await this.getConfig().update(key, value, target);
    }

    /**
     * Reset all settings to defaults
     */
    static async resetToDefaults(): Promise<void> {
        const config = this.getConfig();
        const inspection = config.inspect('enabled');
        
        if (inspection) {
            // Reset global settings
            if (inspection.globalValue !== undefined) {
                await config.update('enabled', undefined, vscode.ConfigurationTarget.Global);
            }
            // Reset workspace settings
            if (inspection.workspaceValue !== undefined) {
                await config.update('enabled', undefined, vscode.ConfigurationTarget.Workspace);
            }
            // Reset workspace folder settings
            if (inspection.workspaceFolderValue !== undefined) {
                await config.update('enabled', undefined, vscode.ConfigurationTarget.WorkspaceFolder);
            }
        }
    }

    /**
     * Get configuration summary for debugging
     */
    static getConfigSummary(): any {
        return {
            enabled: this.enabled,
            realTimeAnalysis: this.realTimeAnalysis,
            suggestionDelay: this.suggestionDelay,
            maxSuggestions: this.maxSuggestions,
            confidenceThreshold: this.confidenceThreshold,
            learningMode: this.learningMode,
            analysisDepth: this.analysisDepth,
            enabledLanguages: this.enabledLanguages,
            showProgressIndicator: this.showProgressIndicator,
            enableHoverSuggestions: this.enableHoverSuggestions,
            enableInlineSuggestions: this.enableInlineSuggestions,
            enableDiagnostics: this.enableDiagnostics,
            cacheSize: this.cacheSize,
            patternExpiryDays: this.patternExpiryDays,
            enableTelemetry: this.enableTelemetry,
            debugMode: this.debugMode
        };
    }

    /**
     * Listen for configuration changes
     */
    static onConfigurationChanged(callback: (event: vscode.ConfigurationChangeEvent) => void): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration(this.SECTION)) {
                callback(event);
            }
        });
    }

    /**
     * Validate configuration values
     */
    static validateConfig(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (this.suggestionDelay < 100 || this.suggestionDelay > 2000) {
            errors.push('suggestionDelay must be between 100 and 2000 milliseconds');
        }

        if (this.maxSuggestions < 1 || this.maxSuggestions > 20) {
            errors.push('maxSuggestions must be between 1 and 20');
        }

        if (this.confidenceThreshold < 0.1 || this.confidenceThreshold > 1.0) {
            errors.push('confidenceThreshold must be between 0.1 and 1.0');
        }

        if (this.cacheSize < 100 || this.cacheSize > 10000) {
            errors.push('cacheSize must be between 100 and 10000');
        }

        if (this.patternExpiryDays < 1 || this.patternExpiryDays > 365) {
            errors.push('patternExpiryDays must be between 1 and 365');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

/**
 * Configuration change event interface
 */
export interface ConfigChangeEvent {
    key: string;
    oldValue: any;
    newValue: any;
}

/**
 * Configuration presets for different use cases
 */
export class ConfigPresets {
    static readonly PERFORMANCE = {
        realTimeAnalysis: false,
        suggestionDelay: 1000,
        maxSuggestions: 3,
        analysisDepth: 'basic' as const,
        cacheSize: 500
    };

    static readonly PRODUCTIVITY = {
        realTimeAnalysis: true,
        suggestionDelay: 300,
        maxSuggestions: 7,
        analysisDepth: 'standard' as const,
        cacheSize: 1500
    };

    static readonly COMPREHENSIVE = {
        realTimeAnalysis: true,
        suggestionDelay: 200,
        maxSuggestions: 10,
        analysisDepth: 'comprehensive' as const,
        cacheSize: 3000
    };

    /**
     * Apply a configuration preset
     */
    static async applyPreset(preset: 'performance' | 'productivity' | 'comprehensive'): Promise<void> {
        let config: any;
        
        switch (preset) {
            case 'performance':
                config = this.PERFORMANCE;
                break;
            case 'productivity':
                config = this.PRODUCTIVITY;
                break;
            case 'comprehensive':
                config = this.COMPREHENSIVE;
                break;
            default:
                throw new Error(`Unknown preset: ${preset}`);
        }

        const workspace = vscode.workspace.getConfiguration('codeWhisperer');
        
        for (const [key, value] of Object.entries(config)) {
            await workspace.update(key, value, vscode.ConfigurationTarget.Global);
        }
    }
}
