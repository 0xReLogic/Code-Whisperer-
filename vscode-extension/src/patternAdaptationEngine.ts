import * as vscode from 'vscode';
import { FeedbackData, FeedbackCollectionSystem } from './feedbackSystem';

// Interface untuk pattern yang dipelajari
export interface LearnedPattern {
    patternId: string;
    patternType: 'syntax' | 'naming' | 'structure' | 'style' | 'refactoring';
    pattern: string; // actual pattern/rule
    confidence: number; // 0-1 score
    language: string;
    context: {
        projectType?: string;
        fileName?: string;
        functionContext?: string;
    };
    usage: {
        suggested: number;
        accepted: number;
        rejected: number;
        lastUsed: number;
    };
    adaptations: AdaptationEvent[];
}

export interface AdaptationEvent {
    timestamp: number;
    reason: 'user_feedback' | 'temporal_change' | 'context_change' | 'confidence_threshold';
    oldConfidence: number;
    newConfidence: number;
    description: string;
}

// Interface untuk adaptation strategy
export interface AdaptationStrategy {
    name: string;
    description: string;
    weight: number; // how much this strategy affects confidence
    enabled: boolean;
}

export class PatternAdaptationEngine {
    private context: vscode.ExtensionContext;
    private feedbackSystem: FeedbackCollectionSystem;
    private learnedPatterns: Map<string, LearnedPattern> = new Map();
    private readonly STORAGE_KEY = 'codeWhispererPatterns';
    private readonly MIN_CONFIDENCE = 0.1;
    private readonly MAX_CONFIDENCE = 1.0;
    private readonly CONFIDENCE_DECAY_RATE = 0.02; // per day

    // Adaptation strategies
    private adaptationStrategies: AdaptationStrategy[] = [
        {
            name: 'user_feedback',
            description: 'Adjust based on user accept/reject feedback',
            weight: 0.3,
            enabled: true
        },
        {
            name: 'frequency_based',
            description: 'Increase confidence for frequently accepted patterns',
            weight: 0.2,
            enabled: true
        },
        {
            name: 'recency_boost',
            description: 'Boost confidence for recently used patterns',
            weight: 0.15,
            enabled: true
        },
        {
            name: 'context_relevance',
            description: 'Adjust based on context similarity',
            weight: 0.2,
            enabled: true
        },
        {
            name: 'temporal_decay',
            description: 'Gradually reduce confidence for unused patterns',
            weight: 0.15,
            enabled: true
        }
    ];

    constructor(context: vscode.ExtensionContext, feedbackSystem: FeedbackCollectionSystem) {
        this.context = context;
        this.feedbackSystem = feedbackSystem;
        this.loadLearnedPatterns();
        this.startAdaptationLoop();
    }

    /**
     * Learn a new pattern or update existing one
     */
    public async learnPattern(
        patternType: LearnedPattern['patternType'],
        pattern: string,
        language: string,
        context: LearnedPattern['context'] = {}
    ): Promise<string> {
        const patternId = this.generatePatternId(pattern, language, context);
        
        let learnedPattern = this.learnedPatterns.get(patternId);
        
        if (learnedPattern) {
            // Update existing pattern
            learnedPattern.usage.suggested++;
            learnedPattern.usage.lastUsed = Date.now();
        } else {
            // Create new pattern
            learnedPattern = {
                patternId,
                patternType,
                pattern,
                confidence: 0.5, // Start with medium confidence
                language,
                context,
                usage: {
                    suggested: 1,
                    accepted: 0,
                    rejected: 0,
                    lastUsed: Date.now()
                },
                adaptations: []
            };
        }
        
        this.learnedPatterns.set(patternId, learnedPattern);
        await this.saveLearnedPatterns();
        
        return patternId;
    }

    /**
     * Adapt patterns based on user feedback
     */
    public async adaptFromFeedback(feedback: FeedbackData): Promise<void> {
        // Find patterns that might be related to this feedback
        const relatedPatterns = this.findRelatedPatterns(feedback);
        
        for (const pattern of relatedPatterns) {
            await this.updatePatternFromFeedback(pattern, feedback);
        }
    }

    /**
     * Update a specific pattern based on feedback
     */
    private async updatePatternFromFeedback(pattern: LearnedPattern, feedback: FeedbackData): Promise<void> {
        const oldConfidence = pattern.confidence;
        
        // Update usage statistics
        if (feedback.action === 'accept') {
            pattern.usage.accepted++;
            pattern.confidence = this.adjustConfidence(pattern.confidence, 0.1, 'increase');
        } else if (feedback.action === 'reject') {
            pattern.usage.rejected++;
            pattern.confidence = this.adjustConfidence(pattern.confidence, 0.15, 'decrease');
        }
        
        // Record adaptation event
        pattern.adaptations.push({
            timestamp: Date.now(),
            reason: 'user_feedback',
            oldConfidence,
            newConfidence: pattern.confidence,
            description: `User ${feedback.action}ed suggestion, confidence ${feedback.action === 'accept' ? 'increased' : 'decreased'}`
        });
        
        console.log(`Pattern ${pattern.patternId} confidence: ${oldConfidence} → ${pattern.confidence}`);
    }

    /**
     * Find patterns related to feedback
     */
    private findRelatedPatterns(feedback: FeedbackData): LearnedPattern[] {
        const related: LearnedPattern[] = [];
        
        for (const pattern of this.learnedPatterns.values()) {
            // Match by language
            if (pattern.language !== feedback.context.language) continue;
            
            // Match by pattern content similarity
            if (this.isPatternRelatedToFeedback(pattern, feedback)) {
                related.push(pattern);
            }
        }
        
        return related;
    }

    /**
     * Check if pattern is related to feedback
     */
    private isPatternRelatedToFeedback(pattern: LearnedPattern, feedback: FeedbackData): boolean {
        const suggestionText = feedback.context.suggestionText.toLowerCase();
        const patternText = pattern.pattern.toLowerCase();
        
        // Simple similarity check (can be improved with more sophisticated algorithms)
        return suggestionText.includes(patternText) || patternText.includes(suggestionText);
    }

    /**
     * Get suggestions based on learned patterns
     */
    public getSuggestions(
        language: string,
        context: LearnedPattern['context'] = {},
        minConfidence: number = 0.3
    ): LearnedPattern[] {
        const suggestions: LearnedPattern[] = [];
        
        for (const pattern of this.learnedPatterns.values()) {
            // Filter by language
            if (pattern.language !== language) continue;
            
            // Filter by minimum confidence
            if (pattern.confidence < minConfidence) continue;
            
            // Calculate contextual confidence
            const contextualConfidence = this.calculateContextualConfidence(pattern, context);
            
            if (contextualConfidence >= minConfidence) {
                // Create a copy with adjusted confidence
                const adjustedPattern = { ...pattern, confidence: contextualConfidence };
                suggestions.push(adjustedPattern);
            }
        }
        
        // Sort by confidence (highest first)
        return suggestions.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Calculate contextual confidence for a pattern
     */
    private calculateContextualConfidence(pattern: LearnedPattern, context: LearnedPattern['context']): number {
        let baseConfidence = pattern.confidence;
        let adjustments = 0;
        
        // Apply adaptation strategies
        for (const strategy of this.adaptationStrategies) {
            if (!strategy.enabled) continue;
            
            let adjustment = 0;
            
            switch (strategy.name) {
                case 'frequency_based':
                    // Higher frequency = higher confidence
                    const frequency = pattern.usage.accepted / Math.max(pattern.usage.suggested, 1);
                    adjustment = (frequency - 0.5) * strategy.weight;
                    break;
                    
                case 'recency_boost':
                    // Recent usage = confidence boost
                    const daysSinceLastUse = (Date.now() - pattern.usage.lastUsed) / (1000 * 60 * 60 * 24);
                    adjustment = Math.max(0, 1 - daysSinceLastUse / 30) * strategy.weight;
                    break;
                    
                case 'context_relevance':
                    // Similar context = confidence boost
                    adjustment = this.calculateContextSimilarity(pattern.context, context) * strategy.weight;
                    break;
                    
                case 'temporal_decay':
                    // Old patterns lose confidence
                    const daysSinceCreation = (Date.now() - pattern.usage.lastUsed) / (1000 * 60 * 60 * 24);
                    adjustment = -Math.min(daysSinceCreation * this.CONFIDENCE_DECAY_RATE, 0.5);
                    break;
            }
            
            adjustments += adjustment;
        }
        
        // Apply adjustments
        const finalConfidence = this.clampConfidence(baseConfidence + adjustments);
        
        return finalConfidence;
    }

    /**
     * Calculate similarity between two contexts
     */
    private calculateContextSimilarity(context1: LearnedPattern['context'], context2: LearnedPattern['context']): number {
        let similarity = 0;
        let factors = 0;
        
        // Project type similarity
        if (context1.projectType && context2.projectType) {
            similarity += context1.projectType === context2.projectType ? 1 : 0;
            factors++;
        }
        
        // File name similarity
        if (context1.fileName && context2.fileName) {
            const ext1 = context1.fileName.split('.').pop();
            const ext2 = context2.fileName.split('.').pop();
            similarity += ext1 === ext2 ? 0.5 : 0;
            factors++;
        }
        
        // Function context similarity
        if (context1.functionContext && context2.functionContext) {
            const words1 = context1.functionContext.toLowerCase().split(/\W+/);
            const words2 = context2.functionContext.toLowerCase().split(/\W+/);
            const commonWords = words1.filter(word => words2.includes(word)).length;
            const totalWords = Math.max(words1.length, words2.length);
            similarity += totalWords > 0 ? commonWords / totalWords : 0;
            factors++;
        }
        
        return factors > 0 ? similarity / factors : 0;
    }

    /**
     * Adjust confidence value
     */
    private adjustConfidence(current: number, amount: number, direction: 'increase' | 'decrease'): number {
        const adjustment = direction === 'increase' ? amount : -amount;
        return this.clampConfidence(current + adjustment);
    }

    /**
     * Clamp confidence to valid range
     */
    private clampConfidence(confidence: number): number {
        return Math.max(this.MIN_CONFIDENCE, Math.min(this.MAX_CONFIDENCE, confidence));
    }

    /**
     * Generate unique pattern ID
     */
    private generatePatternId(pattern: string, language: string, context: LearnedPattern['context']): string {
        const contextStr = JSON.stringify(context);
        const combined = `${language}_${pattern}_${contextStr}`;
        return `pattern_${this.simpleHash(combined)}`;
    }

    /**
     * Simple hash function for pattern IDs
     */
    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Start the adaptation loop (runs periodically)
     */
    private startAdaptationLoop(): void {
        // Run adaptation every hour
        setInterval(async () => {
            await this.performPeriodicAdaptation();
        }, 60 * 60 * 1000);
        
        // Run initial adaptation
        setTimeout(() => this.performPeriodicAdaptation(), 5000);
    }

    /**
     * Perform periodic adaptation tasks
     */
    private async performPeriodicAdaptation(): Promise<void> {
        console.log('Running periodic pattern adaptation...');
        
        // Apply temporal decay
        await this.applyTemporalDecay();
        
        // Clean up low-confidence patterns
        await this.cleanupLowConfidencePatterns();
        
        // Update pattern rankings
        await this.updatePatternRankings();
        
        console.log(`Adaptation complete. ${this.learnedPatterns.size} patterns maintained.`);
    }

    /**
     * Apply temporal decay to all patterns
     */
    private async applyTemporalDecay(): Promise<void> {
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        for (const pattern of this.learnedPatterns.values()) {
            const daysSinceLastUse = (now - pattern.usage.lastUsed) / oneDayMs;
            
            if (daysSinceLastUse > 1) {
                const oldConfidence = pattern.confidence;
                const decay = daysSinceLastUse * this.CONFIDENCE_DECAY_RATE;
                pattern.confidence = this.clampConfidence(pattern.confidence - decay);
                
                // Record adaptation if significant change
                if (Math.abs(oldConfidence - pattern.confidence) > 0.05) {
                    pattern.adaptations.push({
                        timestamp: now,
                        reason: 'temporal_change',
                        oldConfidence,
                        newConfidence: pattern.confidence,
                        description: `Temporal decay applied after ${Math.round(daysSinceLastUse)} days of inactivity`
                    });
                }
            }
        }
    }

    /**
     * Remove patterns with very low confidence
     */
    private async cleanupLowConfidencePatterns(): Promise<void> {
        const toRemove: string[] = [];
        
        for (const [patternId, pattern] of this.learnedPatterns.entries()) {
            if (pattern.confidence < this.MIN_CONFIDENCE && pattern.usage.suggested > 10) {
                toRemove.push(patternId);
            }
        }
        
        for (const patternId of toRemove) {
            this.learnedPatterns.delete(patternId);
            console.log(`Removed low-confidence pattern: ${patternId}`);
        }
        
        if (toRemove.length > 0) {
            await this.saveLearnedPatterns();
        }
    }

    /**
     * Update pattern rankings based on performance
     */
    private async updatePatternRankings(): Promise<void> {
        // This could implement more sophisticated ranking algorithms
        // For now, we'll just ensure patterns are properly sorted by confidence
        const patterns = Array.from(this.learnedPatterns.values());
        patterns.sort((a, b) => b.confidence - a.confidence);
        
        console.log(`Top 5 patterns: ${patterns.slice(0, 5).map(p => `${p.patternId}(${p.confidence.toFixed(2)})`).join(', ')}`);
    }

    /**
     * Get adaptation statistics
     */
    public getAdaptationStats(): {
        totalPatterns: number;
        averageConfidence: number;
        topPatterns: LearnedPattern[];
        recentAdaptations: AdaptationEvent[];
        strategyEffectiveness: { [key: string]: number };
    } {
        const patterns = Array.from(this.learnedPatterns.values());
        const totalPatterns = patterns.length;
        const averageConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / totalPatterns;
        
        const topPatterns = patterns
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 10);
        
        const recentAdaptations = patterns
            .flatMap(p => p.adaptations)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 20);
        
        // Calculate strategy effectiveness (placeholder)
        const strategyEffectiveness = this.adaptationStrategies.reduce((acc, strategy) => {
            acc[strategy.name] = strategy.weight * (strategy.enabled ? 1 : 0);
            return acc;
        }, {} as { [key: string]: number });
        
        return {
            totalPatterns,
            averageConfidence,
            topPatterns,
            recentAdaptations,
            strategyEffectiveness
        };
    }

    /**
     * Load learned patterns from storage
     */
    private async loadLearnedPatterns(): Promise<void> {
        try {
            const stored = this.context.globalState.get<{ [key: string]: LearnedPattern }>(this.STORAGE_KEY, {});
            this.learnedPatterns = new Map(Object.entries(stored));
            console.log(`Loaded ${this.learnedPatterns.size} learned patterns`);
        } catch (error) {
            console.error('Error loading learned patterns:', error);
            this.learnedPatterns = new Map();
        }
    }

    /**
     * Save learned patterns to storage
     */
    private async saveLearnedPatterns(): Promise<void> {
        try {
            const toStore = Object.fromEntries(this.learnedPatterns);
            await this.context.globalState.update(this.STORAGE_KEY, toStore);
        } catch (error) {
            console.error('Error saving learned patterns:', error);
        }
    }
}
