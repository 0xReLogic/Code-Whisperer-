import * as vscode from 'vscode';
import { FeedbackData } from './feedbackSystem';
import { LearnedPattern } from './patternAdaptationEngine';

// Interface untuk temporal pattern
export interface TemporalPattern {
    patternId: string;
    timelineData: TemporalDataPoint[];
    trend: 'increasing' | 'decreasing' | 'stable' | 'cyclical';
    confidence: number;
    lastAnalysis: number;
    evolutionStages: EvolutionStage[];
}

export interface TemporalDataPoint {
    timestamp: number;
    value: number; // usage frequency, acceptance rate, etc.
    context: {
        weekday?: number; // 0-6 (Sunday-Saturday)
        hour?: number; // 0-23
        language?: string;
        projectType?: string;
    };
}

export interface EvolutionStage {
    startTime: number;
    endTime: number;
    patternType: string;
    description: string;
    confidence: number;
    examples: string[];
}

// Interface untuk coding habit changes
export interface CodingHabitChange {
    changeId: string;
    timestamp: number;
    changeType: 'preference_shift' | 'style_evolution' | 'new_adoption' | 'abandonment';
    language: string;
    oldPattern: string;
    newPattern: string;
    confidence: number;
    evidence: {
        oldUsageCount: number;
        newUsageCount: number;
        transitionPeriod: number; // days
        confirmationEvents: number;
    };
}

export class TemporalPatternAnalyzer {
    private context: vscode.ExtensionContext;
    private temporalPatterns: Map<string, TemporalPattern> = new Map();
    private codingHabitChanges: CodingHabitChange[] = [];
    private readonly STORAGE_KEY_TEMPORAL = 'codeWhispererTemporal';
    private readonly STORAGE_KEY_HABITS = 'codeWhispererHabits';
    private readonly ANALYSIS_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
    private readonly MIN_DATA_POINTS = 5; // Minimum data points for trend analysis

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadTemporalData();
        this.startTemporalAnalysis();
    }

    /**
     * Record temporal data point
     */
    public recordDataPoint(
        patternId: string,
        value: number,
        context: TemporalDataPoint['context'] = {}
    ): void {
        let pattern = this.temporalPatterns.get(patternId);
        
        if (!pattern) {
            pattern = {
                patternId,
                timelineData: [],
                trend: 'stable',
                confidence: 0.5,
                lastAnalysis: Date.now(),
                evolutionStages: []
            };
            this.temporalPatterns.set(patternId, pattern);
        }

        // Add new data point
        const dataPoint: TemporalDataPoint = {
            timestamp: Date.now(),
            value,
            context: {
                ...context,
                weekday: new Date().getDay(),
                hour: new Date().getHours()
            }
        };

        pattern.timelineData.push(dataPoint);

        // Keep only recent data (last 90 days)
        const cutoffTime = Date.now() - (90 * 24 * 60 * 60 * 1000);
        pattern.timelineData = pattern.timelineData.filter(dp => dp.timestamp >= cutoffTime);

        this.saveTemporalData();
    }

    /**
     * Analyze coding habit evolution
     */
    public async analyzeHabitEvolution(feedbackHistory: FeedbackData[]): Promise<CodingHabitChange[]> {
        const changes: CodingHabitChange[] = [];
        
        // Group feedback by language and time periods
        const languageGroups = this.groupFeedbackByLanguage(feedbackHistory);
        
        for (const [language, feedback] of languageGroups) {
            const langChanges = await this.detectLanguageSpecificChanges(language, feedback);
            changes.push(...langChanges);
        }
        
        // Update stored changes
        this.codingHabitChanges.push(...changes);
        
        // Keep only recent changes (last 6 months)
        const cutoffTime = Date.now() - (180 * 24 * 60 * 60 * 1000);
        this.codingHabitChanges = this.codingHabitChanges.filter(c => c.timestamp >= cutoffTime);
        
        await this.saveHabitChanges();
        
        return changes;
    }

    /**
     * Detect language-specific habit changes
     */
    private async detectLanguageSpecificChanges(
        language: string,
        feedbackData: FeedbackData[]
    ): Promise<CodingHabitChange[]> {
        const changes: CodingHabitChange[] = [];
        
        // Sort feedback by timestamp
        feedbackData.sort((a, b) => a.timestamp - b.timestamp);
        
        // Analyze different types of patterns
        const patternTypes = [
            'variable_declaration', // var -> let/const
            'function_syntax', // function() -> arrow functions
            'import_style', // require() -> import
            'async_patterns', // callbacks -> promises -> async/await
            'error_handling', // if/else -> try/catch
            'testing_approach' // different testing styles
        ];
        
        for (const patternType of patternTypes) {
            const typeChanges = await this.analyzePatternTypeEvolution(
                language,
                patternType,
                feedbackData
            );
            changes.push(...typeChanges);
        }
        
        return changes;
    }

    /**
     * Analyze evolution of specific pattern type
     */
    private async analyzePatternTypeEvolution(
        language: string,
        patternType: string,
        feedbackData: FeedbackData[]
    ): Promise<CodingHabitChange[]> {
        const changes: CodingHabitChange[] = [];
        
        // Extract pattern-specific data
        const patternData = this.extractPatternData(feedbackData, patternType);
        
        if (patternData.length < this.MIN_DATA_POINTS) {
            return changes;
        }
        
        // Detect transitions using sliding window
        const windowSize = 14; // 2 weeks
        const windows = this.createTimeWindows(patternData, windowSize);
        
        for (let i = 1; i < windows.length; i++) {
            const prevWindow = windows[i - 1];
            const currentWindow = windows[i];
            
            if (prevWindow && currentWindow) {
                const change = this.detectPatternTransition(
                    language,
                    patternType,
                    prevWindow,
                    currentWindow
                );
                
                if (change) {
                    changes.push(change);
                }
            }
        }
        
        return changes;
    }

    /**
     * Extract pattern-specific data from feedback
     */
    private extractPatternData(feedbackData: FeedbackData[], patternType: string): any[] {
        return feedbackData
            .filter(feedback => this.isRelevantToPatternType(feedback, patternType))
            .map(feedback => ({
                timestamp: feedback.timestamp,
                pattern: this.extractPatternFromFeedback(feedback, patternType),
                action: feedback.action,
                suggestion: feedback.context.suggestionText
            }));
    }

    /**
     * Check if feedback is relevant to pattern type
     */
    private isRelevantToPatternType(feedback: FeedbackData, patternType: string): boolean {
        const suggestion = feedback.context.suggestionText.toLowerCase();
        
        switch (patternType) {
            case 'variable_declaration':
                return suggestion.includes('var ') || suggestion.includes('let ') || suggestion.includes('const ');
            
            case 'function_syntax':
                return suggestion.includes('function') || suggestion.includes('=>') || suggestion.includes('arrow');
            
            case 'import_style':
                return suggestion.includes('import') || suggestion.includes('require') || suggestion.includes('from');
            
            case 'async_patterns':
                return suggestion.includes('async') || suggestion.includes('await') || suggestion.includes('promise') || suggestion.includes('callback');
            
            case 'error_handling':
                return suggestion.includes('try') || suggestion.includes('catch') || suggestion.includes('throw') || suggestion.includes('error');
            
            case 'testing_approach':
                return suggestion.includes('test') || suggestion.includes('expect') || suggestion.includes('assert') || suggestion.includes('mock');
            
            default:
                return false;
        }
    }

    /**
     * Extract specific pattern from feedback
     */
    private extractPatternFromFeedback(feedback: FeedbackData, patternType: string): string {
        const suggestion = feedback.context.suggestionText;
        
        switch (patternType) {
            case 'variable_declaration':
                if (suggestion.includes('const ')) return 'const';
                if (suggestion.includes('let ')) return 'let';
                if (suggestion.includes('var ')) return 'var';
                break;
                
            case 'function_syntax':
                if (suggestion.includes('=>')) return 'arrow';
                if (suggestion.includes('function')) return 'function';
                break;
                
            case 'import_style':
                if (suggestion.includes('import')) return 'import';
                if (suggestion.includes('require')) return 'require';
                break;
                
            case 'async_patterns':
                if (suggestion.includes('async') || suggestion.includes('await')) return 'async_await';
                if (suggestion.includes('promise')) return 'promise';
                if (suggestion.includes('callback')) return 'callback';
                break;
        }
        
        return 'unknown';
    }

    /**
     * Create time windows for analysis
     */
    private createTimeWindows(patternData: any[], windowSizeDays: number): any[][] {
        if (patternData.length === 0) return [];
        
        const windowSizeMs = windowSizeDays * 24 * 60 * 60 * 1000;
        const windows: any[][] = [];
        
        const startTime = patternData[0].timestamp;
        const endTime = patternData[patternData.length - 1].timestamp;
        
        for (let time = startTime; time <= endTime; time += windowSizeMs) {
            const windowEnd = time + windowSizeMs;
            const windowData = patternData.filter(
                d => d.timestamp >= time && d.timestamp < windowEnd
            );
            
            if (windowData.length > 0) {
                windows.push(windowData);
            }
        }
        
        return windows;
    }

    /**
     * Detect pattern transition between windows
     */
    private detectPatternTransition(
        language: string,
        patternType: string,
        prevWindow: any[],
        currentWindow: any[]
    ): CodingHabitChange | null {
        // Calculate pattern distribution in each window
        const prevDistribution = this.calculatePatternDistribution(prevWindow);
        const currentDistribution = this.calculatePatternDistribution(currentWindow);
        
        // Find significant changes
        const significantChanges = this.findSignificantChanges(prevDistribution, currentDistribution);
        
        if (significantChanges.length > 0) {
            const change = significantChanges[0]; // Take the most significant change
            
            if (change) {
                return {
                    changeId: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: currentWindow[0]?.timestamp || Date.now(),
                    changeType: this.determineChangeType(change),
                    language,
                    oldPattern: change.from,
                    newPattern: change.to,
                    confidence: change.confidence,
                    evidence: {
                        oldUsageCount: prevDistribution[change.from] || 0,
                        newUsageCount: currentDistribution[change.to] || 0,
                        transitionPeriod: this.calculateTransitionPeriod(prevWindow, currentWindow),
                        confirmationEvents: Math.min(prevWindow.length, currentWindow.length)
                    }
                };
            }
        }
        
        return null;
    }

    /**
     * Calculate pattern distribution in a window
     */
    private calculatePatternDistribution(windowData: any[]): { [pattern: string]: number } {
        const distribution: { [pattern: string]: number } = {};
        
        for (const data of windowData) {
            if (data.action === 'accept') { // Only count accepted patterns
                distribution[data.pattern] = (distribution[data.pattern] || 0) + 1;
            }
        }
        
        return distribution;
    }

    /**
     * Find significant changes between distributions
     */
    private findSignificantChanges(
        prev: { [pattern: string]: number },
        current: { [pattern: string]: number }
    ): { from: string; to: string; confidence: number }[] {
        const changes: { from: string; to: string; confidence: number }[] = [];
        const threshold = 0.3; // 30% change threshold
        
        // Find patterns that decreased significantly
        for (const [pattern, prevCount] of Object.entries(prev)) {
            const currentCount = current[pattern] || 0;
            const totalPrev = Object.values(prev).reduce((sum, count) => sum + count, 0);
            const totalCurrent = Object.values(current).reduce((sum, count) => sum + count, 0);
            
            if (totalPrev > 0 && totalCurrent > 0) {
                const prevRatio = prevCount / totalPrev;
                const currentRatio = currentCount / totalCurrent;
                const decrease = prevRatio - currentRatio;
                
                if (decrease > threshold) {
                    // Find what replaced this pattern
                    for (const [newPattern, newCount] of Object.entries(current)) {
                        if (newPattern !== pattern) {
                            const newPrevCount = prev[newPattern] || 0;
                            const newPrevRatio = newPrevCount / totalPrev;
                            const newCurrentRatio = newCount / totalCurrent;
                            const increase = newCurrentRatio - newPrevRatio;
                            
                            if (increase > threshold / 2) {
                                changes.push({
                                    from: pattern,
                                    to: newPattern,
                                    confidence: Math.min(decrease, increase)
                                });
                            }
                        }
                    }
                }
            }
        }
        
        return changes.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Determine the type of change
     */
    private determineChangeType(change: { from: string; to: string; confidence: number }): CodingHabitChange['changeType'] {
        if (change.confidence > 0.7) {
            return 'preference_shift';
        } else if (change.confidence > 0.5) {
            return 'style_evolution';
        } else if (change.from === 'unknown') {
            return 'new_adoption';
        } else if (change.to === 'unknown') {
            return 'abandonment';
        } else {
            return 'preference_shift';
        }
    }

    /**
     * Calculate transition period in days
     */
    private calculateTransitionPeriod(prevWindow: any[], currentWindow: any[]): number {
        if (prevWindow.length === 0 || currentWindow.length === 0) return 0;
        
        const prevEnd = Math.max(...prevWindow.map(d => d.timestamp));
        const currentStart = Math.min(...currentWindow.map(d => d.timestamp));
        
        return Math.max(0, currentStart - prevEnd) / (24 * 60 * 60 * 1000);
    }

    /**
     * Group feedback by language
     */
    private groupFeedbackByLanguage(feedbackData: FeedbackData[]): Map<string, FeedbackData[]> {
        const groups = new Map<string, FeedbackData[]>();
        
        for (const feedback of feedbackData) {
            const language = feedback.context.language;
            if (!groups.has(language)) {
                groups.set(language, []);
            }
            groups.get(language)!.push(feedback);
        }
        
        return groups;
    }

    /**
     * Analyze temporal trends for a pattern
     */
    public analyzeTrend(patternId: string): 'increasing' | 'decreasing' | 'stable' | 'cyclical' {
        const pattern = this.temporalPatterns.get(patternId);
        if (!pattern || pattern.timelineData.length < this.MIN_DATA_POINTS) {
            return 'stable';
        }
        
        const data = pattern.timelineData.slice(-30); // Last 30 data points
        
        // Simple linear regression to detect trend
        const n = data.length;
        const sumX = data.reduce((sum, _, i) => sum + i, 0);
        const sumY = data.reduce((sum, point) => sum + point.value, 0);
        const sumXY = data.reduce((sum, point, i) => sum + i * point.value, 0);
        const sumXX = data.reduce((sum, _, i) => sum + i * i, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        
        // Check for cyclical patterns
        if (this.detectCyclicalPattern(data)) {
            return 'cyclical';
        }
        
        // Determine trend based on slope
        if (Math.abs(slope) < 0.01) {
            return 'stable';
        } else if (slope > 0) {
            return 'increasing';
        } else {
            return 'decreasing';
        }
    }

    /**
     * Detect cyclical patterns in data
     */
    private detectCyclicalPattern(data: TemporalDataPoint[]): boolean {
        if (data.length < 14) return false; // Need at least 2 weeks of data
        
        // Check for weekly patterns
        const weeklyPattern = this.checkWeeklyPattern(data);
        const dailyPattern = this.checkDailyPattern(data);
        
        return weeklyPattern || dailyPattern;
    }

    /**
     * Check for weekly patterns
     */
    private checkWeeklyPattern(data: TemporalDataPoint[]): boolean {
        const weekdayAverages = new Array(7).fill(0);
        const weekdayCounts = new Array(7).fill(0);
        
        for (const point of data) {
            if (point.context.weekday !== undefined) {
                weekdayAverages[point.context.weekday] += point.value;
                weekdayCounts[point.context.weekday]++;
            }
        }
        
        // Calculate actual averages
        for (let i = 0; i < 7; i++) {
            if (weekdayCounts[i] > 0) {
                weekdayAverages[i] /= weekdayCounts[i];
            }
        }
        
        // Check if there's significant variation
        const max = Math.max(...weekdayAverages);
        const min = Math.min(...weekdayAverages);
        const variance = max - min;
        const mean = weekdayAverages.reduce((sum, avg) => sum + avg, 0) / 7;
        
        return variance > mean * 0.3; // 30% variation indicates cyclical pattern
    }

    /**
     * Check for daily patterns
     */
    private checkDailyPattern(data: TemporalDataPoint[]): boolean {
        const hourlyAverages = new Array(24).fill(0);
        const hourlyCounts = new Array(24).fill(0);
        
        for (const point of data) {
            if (point.context.hour !== undefined) {
                hourlyAverages[point.context.hour] += point.value;
                hourlyCounts[point.context.hour]++;
            }
        }
        
        // Calculate actual averages
        for (let i = 0; i < 24; i++) {
            if (hourlyCounts[i] > 0) {
                hourlyAverages[i] /= hourlyCounts[i];
            }
        }
        
        // Check for work hours vs off-hours pattern
        const workHours = [9, 10, 11, 12, 13, 14, 15, 16, 17];
        const workAverage = workHours.reduce((sum, hour) => sum + hourlyAverages[hour], 0) / workHours.length;
        const offHours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 18, 19, 20, 21, 22, 23];
        const offAverage = offHours.reduce((sum, hour) => sum + hourlyAverages[hour], 0) / offHours.length;
        
        return Math.abs(workAverage - offAverage) > (workAverage + offAverage) * 0.25;
    }

    /**
     * Get temporal insights
     */
    public getTemporalInsights(): {
        evolutionSummary: string[];
        trendingPatterns: { patternId: string; trend: string; confidence: number }[];
        recentChanges: CodingHabitChange[];
        cyclicalPatterns: string[];
    } {
        const evolutionSummary: string[] = [];
        const trendingPatterns: { patternId: string; trend: string; confidence: number }[] = [];
        const cyclicalPatterns: string[] = [];
        
        // Analyze all patterns
        for (const [patternId, pattern] of this.temporalPatterns.entries()) {
            const trend = this.analyzeTrend(patternId);
            pattern.trend = trend;
            
            if (trend !== 'stable') {
                trendingPatterns.push({
                    patternId,
                    trend,
                    confidence: pattern.confidence
                });
            }
            
            if (trend === 'cyclical') {
                cyclicalPatterns.push(patternId);
            }
        }
        
        // Generate evolution summary
        const recentChanges = this.codingHabitChanges
            .filter(change => change.timestamp > Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            .sort((a, b) => b.timestamp - a.timestamp);
        
        if (recentChanges.length > 0) {
            evolutionSummary.push(`Detected ${recentChanges.length} coding habit changes in the last month`);
            
            const languageChanges = recentChanges.reduce((acc, change) => {
                acc[change.language] = (acc[change.language] || 0) + 1;
                return acc;
            }, {} as { [key: string]: number });
            
            for (const [language, count] of Object.entries(languageChanges)) {
                evolutionSummary.push(`${language}: ${count} habit evolution${count > 1 ? 's' : ''}`);
            }
        }
        
        return {
            evolutionSummary,
            trendingPatterns: trendingPatterns.sort((a, b) => b.confidence - a.confidence),
            recentChanges: recentChanges.slice(0, 10),
            cyclicalPatterns
        };
    }

    /**
     * Start temporal analysis loop
     */
    private startTemporalAnalysis(): void {
        // Run analysis every 24 hours
        setInterval(async () => {
            await this.performTemporalAnalysis();
        }, this.ANALYSIS_INTERVAL);
        
        // Run initial analysis after 1 minute
        setTimeout(() => this.performTemporalAnalysis(), 60 * 1000);
    }

    /**
     * Perform periodic temporal analysis
     */
    private async performTemporalAnalysis(): Promise<void> {
        console.log('Running temporal pattern analysis...');
        
        // Update trends for all patterns
        for (const [patternId, pattern] of this.temporalPatterns.entries()) {
            pattern.trend = this.analyzeTrend(patternId);
            pattern.lastAnalysis = Date.now();
        }
        
        await this.saveTemporalData();
        
        console.log(`Temporal analysis complete. ${this.temporalPatterns.size} patterns analyzed.`);
    }

    /**
     * Load temporal data from storage
     */
    private async loadTemporalData(): Promise<void> {
        try {
            const temporalData = this.context.globalState.get<{ [key: string]: TemporalPattern }>(this.STORAGE_KEY_TEMPORAL, {});
            this.temporalPatterns = new Map(Object.entries(temporalData));
            
            const habitData = this.context.globalState.get<CodingHabitChange[]>(this.STORAGE_KEY_HABITS, []);
            this.codingHabitChanges = habitData;
            
            console.log(`Loaded ${this.temporalPatterns.size} temporal patterns and ${this.codingHabitChanges.length} habit changes`);
        } catch (error) {
            console.error('Error loading temporal data:', error);
        }
    }

    /**
     * Save temporal data to storage
     */
    private async saveTemporalData(): Promise<void> {
        try {
            const temporalData = Object.fromEntries(this.temporalPatterns);
            await this.context.globalState.update(this.STORAGE_KEY_TEMPORAL, temporalData);
        } catch (error) {
            console.error('Error saving temporal data:', error);
        }
    }

    /**
     * Save habit changes to storage
     */
    private async saveHabitChanges(): Promise<void> {
        try {
            await this.context.globalState.update(this.STORAGE_KEY_HABITS, this.codingHabitChanges);
        } catch (error) {
            console.error('Error saving habit changes:', error);
        }
    }
}
