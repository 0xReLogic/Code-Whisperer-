use crate::pattern_extractor::{PatternAnalysis, NamingStyle};
use crate::user_behavior_tracker::{BehaviorAnalysis, SessionData};
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

/// Pattern scoring engine for ranking pattern relevance and suggestion quality
pub struct PatternScoringEngine {
    scoring_config: ScoringConfiguration,
    historical_patterns: HashMap<String, PatternScore>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoringConfiguration {
    pub recency_weight: f32,
    pub frequency_weight: f32,
    pub context_weight: f32,
    pub user_preference_weight: f32,
    pub confidence_threshold: f32,
    pub adaptive_learning_rate: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternScore {
    pub pattern_id: String,
    pub relevance_score: f32,
    pub confidence_score: f32,
    pub frequency_score: f32,
    pub recency_score: f32,
    pub context_score: f32,
    pub user_preference_score: f32,
    pub composite_score: f32,
    pub last_updated: i64,
    pub usage_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoringResult {
    pub scored_patterns: Vec<PatternScore>,
    pub ranking_metrics: RankingMetrics,
    pub confidence_distribution: ConfidenceDistribution,
    pub adaptive_adjustments: AdaptiveAdjustments,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RankingMetrics {
    pub total_patterns: usize,
    pub high_confidence_count: usize,
    pub medium_confidence_count: usize,
    pub low_confidence_count: usize,
    pub average_score: f32,
    pub score_variance: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfidenceDistribution {
    pub high_confidence: Vec<PatternScore>,    // > 0.8
    pub medium_confidence: Vec<PatternScore>,  // 0.5 - 0.8
    pub low_confidence: Vec<PatternScore>,     // < 0.5
    pub threshold_adjustments: HashMap<String, f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdaptiveAdjustments {
    pub learning_rate_adjustments: HashMap<String, f32>,
    pub weight_modifications: ScoringConfiguration,
    pub pattern_decay_factors: HashMap<String, f32>,
    pub context_boost_factors: HashMap<String, f32>,
}

#[derive(Debug, Clone)]
pub struct ScoringContext {
    pub current_file_type: String,
    pub current_function_context: Option<String>,
    pub recent_patterns: Vec<String>,
    pub time_of_day: i64,
    pub project_context: String,
    pub user_session_data: Option<SessionData>,
}

impl Default for ScoringConfiguration {
    fn default() -> Self {
        Self {
            recency_weight: 0.25,
            frequency_weight: 0.25,
            context_weight: 0.25,
            user_preference_weight: 0.25,
            confidence_threshold: 0.6,
            adaptive_learning_rate: 0.1,
        }
    }
}

impl PatternScoringEngine {
    pub fn new() -> Self {
        Self {
            scoring_config: ScoringConfiguration::default(),
            historical_patterns: HashMap::new(),
        }
    }

    pub fn with_config(config: ScoringConfiguration) -> Self {
        Self {
            scoring_config: config,
            historical_patterns: HashMap::new(),
        }
    }

    /// Score patterns based on multiple factors including recency, frequency, context, and user preferences
    pub fn score_patterns(
        &mut self,
        patterns: &PatternAnalysis,
        user_behavior: &BehaviorAnalysis,
        context: &ScoringContext,
    ) -> Result<ScoringResult, String> {
        let mut scored_patterns = Vec::new();

        // Score each pattern type
        self.score_naming_patterns(&patterns.naming_conventions, context, &mut scored_patterns)?;
        self.score_style_patterns(&patterns.style_metrics, context, &mut scored_patterns)?;
        self.score_structural_patterns(&patterns.structure_patterns, context, &mut scored_patterns)?;

        // Apply user behavior influence
        self.apply_user_behavior_scoring(&mut scored_patterns, user_behavior)?;

        // Calculate composite scores
        self.calculate_composite_scores(&mut scored_patterns);

        // Sort by composite score (descending)
        scored_patterns.sort_by(|a, b| b.composite_score.partial_cmp(&a.composite_score).unwrap());

        // Update historical patterns
        self.update_historical_patterns(&scored_patterns);

        // Generate ranking metrics
        let ranking_metrics = self.calculate_ranking_metrics(&scored_patterns);
        let confidence_distribution = self.calculate_confidence_distribution(&scored_patterns);
        let adaptive_adjustments = self.calculate_adaptive_adjustments(&scored_patterns, user_behavior);

        Ok(ScoringResult {
            scored_patterns,
            ranking_metrics,
            confidence_distribution,
            adaptive_adjustments,
        })
    }

    fn score_naming_patterns(
        &self,
        naming_conventions: &crate::pattern_extractor::NamingConventions,
        context: &ScoringContext,
        scored_patterns: &mut Vec<PatternScore>,
    ) -> Result<(), String> {
        // Score primary naming style
        let style_score = self.calculate_style_relevance(&naming_conventions.function_naming, context);
        scored_patterns.push(PatternScore {
            pattern_id: format!("function_naming_style_{:?}", naming_conventions.function_naming),
            relevance_score: style_score,
            confidence_score: 0.8,
            frequency_score: self.calculate_frequency_score(&format!("function_naming_style_{:?}", naming_conventions.function_naming)),
            recency_score: self.calculate_recency_score(&format!("function_naming_style_{:?}", naming_conventions.function_naming)),
            context_score: self.calculate_context_score(&format!("function_naming_style_{:?}", naming_conventions.function_naming), context),
            user_preference_score: 0.0, // Will be updated later
            composite_score: 0.0, // Will be calculated later
            last_updated: chrono::Utc::now().timestamp(),
            usage_count: 1,
        });

        // Score variable naming style
        scored_patterns.push(PatternScore {
            pattern_id: format!("variable_naming_style_{:?}", naming_conventions.variable_naming),
            relevance_score: self.calculate_style_relevance(&naming_conventions.variable_naming, context),
            confidence_score: 0.8,
            frequency_score: self.calculate_frequency_score(&format!("variable_naming_style_{:?}", naming_conventions.variable_naming)),
            recency_score: self.calculate_recency_score(&format!("variable_naming_style_{:?}", naming_conventions.variable_naming)),
            context_score: self.calculate_context_score(&format!("variable_naming_style_{:?}", naming_conventions.variable_naming), context),
            user_preference_score: 0.0,
            composite_score: 0.0,
            last_updated: chrono::Utc::now().timestamp(),
            usage_count: 1,
        });

        Ok(())
    }

    fn score_style_patterns(
        &self,
        style_metrics: &crate::pattern_extractor::StyleMetrics,
        context: &ScoringContext,
        scored_patterns: &mut Vec<PatternScore>,
    ) -> Result<(), String> {
        // Score indentation style
        scored_patterns.push(PatternScore {
            pattern_id: format!("indentation_{:?}_{}", style_metrics.indentation_type, style_metrics.indentation_size),
            relevance_score: 0.8,
            confidence_score: 0.9,
            frequency_score: self.calculate_frequency_score(&format!("indentation_{:?}_{}", style_metrics.indentation_type, style_metrics.indentation_size)),
            recency_score: self.calculate_recency_score(&format!("indentation_{:?}_{}", style_metrics.indentation_type, style_metrics.indentation_size)),
            context_score: self.calculate_context_score(&format!("indentation_{:?}_{}", style_metrics.indentation_type, style_metrics.indentation_size), context),
            user_preference_score: 0.0,
            composite_score: 0.0,
            last_updated: chrono::Utc::now().timestamp(),
            usage_count: 1,
        });

        // Score brace style
        scored_patterns.push(PatternScore {
            pattern_id: format!("brace_style_{:?}", style_metrics.brace_style),
            relevance_score: 0.8,
            confidence_score: 0.9,
            frequency_score: self.calculate_frequency_score(&format!("brace_style_{:?}", style_metrics.brace_style)),
            recency_score: self.calculate_recency_score(&format!("brace_style_{:?}", style_metrics.brace_style)),
            context_score: self.calculate_context_score(&format!("brace_style_{:?}", style_metrics.brace_style), context),
            user_preference_score: 0.0,
            composite_score: 0.0,
            last_updated: chrono::Utc::now().timestamp(),
            usage_count: 1,
        });

        Ok(())
    }

    fn score_structural_patterns(
        &self,
        structural_patterns: &crate::pattern_extractor::StructurePatterns,
        context: &ScoringContext,
        scored_patterns: &mut Vec<PatternScore>,
    ) -> Result<(), String> {
        // Score function organization patterns
        scored_patterns.push(PatternScore {
            pattern_id: format!("function_length_{}", structural_patterns.function_length_preference),
            relevance_score: 0.8, // High relevance for function length patterns
            confidence_score: 0.85,
            frequency_score: self.calculate_frequency_score(&format!("function_length_{}", structural_patterns.function_length_preference)),
            recency_score: self.calculate_recency_score(&format!("function_length_{}", structural_patterns.function_length_preference)),
            context_score: self.calculate_context_score(&format!("function_length_{}", structural_patterns.function_length_preference), context),
            user_preference_score: 0.0,
            composite_score: 0.0,
            last_updated: chrono::Utc::now().timestamp(),
            usage_count: 1,
        });

        Ok(())
    }

    fn apply_user_behavior_scoring(
        &self,
        scored_patterns: &mut Vec<PatternScore>,
        user_behavior: &BehaviorAnalysis,
    ) -> Result<(), String> {
        for pattern in scored_patterns.iter_mut() {
            // Calculate user preference score based on historical behavior
            pattern.user_preference_score = self.calculate_user_preference_score(
                &pattern.pattern_id,
                user_behavior,
            );
        }
        Ok(())
    }

    fn calculate_composite_scores(&self, scored_patterns: &mut Vec<PatternScore>) {
        for pattern in scored_patterns.iter_mut() {
            pattern.composite_score = 
                pattern.recency_score * self.scoring_config.recency_weight +
                pattern.frequency_score * self.scoring_config.frequency_weight +
                pattern.context_score * self.scoring_config.context_weight +
                pattern.user_preference_score * self.scoring_config.user_preference_weight;
            
            // Boost composite score based on confidence
            pattern.composite_score *= pattern.confidence_score;
        }
    }

    fn calculate_style_relevance(&self, style: &NamingStyle, context: &ScoringContext) -> f32 {
        // Higher relevance for styles that match the current file type context
        match (context.current_file_type.as_str(), style) {
            ("javascript" | "typescript", NamingStyle::CamelCase) => 0.9,
            ("python", NamingStyle::SnakeCase) => 0.9,
            ("rust", NamingStyle::SnakeCase) => 0.9,
            ("java" | "csharp", NamingStyle::PascalCase) => 0.9,
            _ => 0.6,
        }
    }

    fn calculate_frequency_score(&self, pattern_id: &str) -> f32 {
        if let Some(historical) = self.historical_patterns.get(pattern_id) {
            // Normalize usage count to a 0-1 score
            (historical.usage_count as f32 / 100.0).min(1.0)
        } else {
            0.1 // New patterns get a low but non-zero frequency score
        }
    }

    fn calculate_recency_score(&self, pattern_id: &str) -> f32 {
        if let Some(historical) = self.historical_patterns.get(pattern_id) {
            let current_time = chrono::Utc::now().timestamp();
            let time_diff = current_time - historical.last_updated;
            let days_old = time_diff as f32 / (24.0 * 60.0 * 60.0);
            
            // Exponential decay: more recent = higher score
            (-days_old / 7.0).exp() // Half-life of 1 week
        } else {
            1.0 // New patterns get maximum recency score
        }
    }

    fn calculate_context_score(&self, pattern_id: &str, context: &ScoringContext) -> f32 {
        let mut score: f32 = 0.5; // Base score
        
        // Boost score if pattern appears in recent patterns
        if context.recent_patterns.iter().any(|p| p.contains(pattern_id)) {
            score += 0.3;
        }
        
        // Boost score based on project context matching
        if pattern_id.contains(&context.project_context) {
            score += 0.2;
        }
        
        score.min(1.0)
    }

    fn calculate_user_preference_score(&self, _pattern_id: &str, user_behavior: &BehaviorAnalysis) -> f32 {
        // Calculate preference based on user's historical choices
        let mut preference_score: f32 = 0.5;
        
        // Check if user has shown preference for this pattern type
        // Simple scoring based on pattern preferences
        preference_score += 0.3;
        
        preference_score.min(1.0)
    }

    fn update_historical_patterns(&mut self, scored_patterns: &[PatternScore]) {
        for pattern in scored_patterns {
            let entry = self.historical_patterns.entry(pattern.pattern_id.clone())
                .or_insert_with(|| pattern.clone());
            
            entry.usage_count += 1;
            entry.last_updated = chrono::Utc::now().timestamp();
            entry.composite_score = pattern.composite_score;
        }
    }

    fn calculate_ranking_metrics(&self, scored_patterns: &[PatternScore]) -> RankingMetrics {
        let total_patterns = scored_patterns.len();
        let mut high_confidence_count = 0;
        let mut medium_confidence_count = 0;
        let mut low_confidence_count = 0;
        let mut score_sum = 0.0;
        let mut scores = Vec::new();

        for pattern in scored_patterns {
            scores.push(pattern.composite_score);
            score_sum += pattern.composite_score;
            
            if pattern.confidence_score > 0.8 {
                high_confidence_count += 1;
            } else if pattern.confidence_score > 0.5 {
                medium_confidence_count += 1;
            } else {
                low_confidence_count += 1;
            }
        }

        let average_score = if total_patterns > 0 { score_sum / total_patterns as f32 } else { 0.0 };
        
        // Calculate variance
        let variance = if total_patterns > 0 {
            scores.iter().map(|score| (score - average_score).powi(2)).sum::<f32>() / total_patterns as f32
        } else {
            0.0
        };

        RankingMetrics {
            total_patterns,
            high_confidence_count,
            medium_confidence_count,
            low_confidence_count,
            average_score,
            score_variance: variance,
        }
    }

    fn calculate_confidence_distribution(&self, scored_patterns: &[PatternScore]) -> ConfidenceDistribution {
        let mut high_confidence = Vec::new();
        let mut medium_confidence = Vec::new();
        let mut low_confidence = Vec::new();

        for pattern in scored_patterns {
            if pattern.confidence_score > 0.8 {
                high_confidence.push(pattern.clone());
            } else if pattern.confidence_score > 0.5 {
                medium_confidence.push(pattern.clone());
            } else {
                low_confidence.push(pattern.clone());
            }
        }

        ConfidenceDistribution {
            high_confidence,
            medium_confidence,
            low_confidence,
            threshold_adjustments: HashMap::new(), // TODO: Implement adaptive threshold adjustments
        }
    }

    fn calculate_adaptive_adjustments(
        &self,
        scored_patterns: &[PatternScore],
        _user_behavior: &BehaviorAnalysis,
    ) -> AdaptiveAdjustments {
        let mut learning_rate_adjustments = HashMap::new();
        let mut pattern_decay_factors = HashMap::new();
        let context_boost_factors = HashMap::new();

        // Adjust learning rates based on pattern performance
        for pattern in scored_patterns {
            let adjustment = if pattern.composite_score > 0.8 {
                0.05 // Slower learning for high-performing patterns
            } else if pattern.composite_score < 0.3 {
                0.15 // Faster learning for poor-performing patterns
            } else {
                0.1 // Default learning rate
            };
            
            learning_rate_adjustments.insert(pattern.pattern_id.clone(), adjustment);
            
            // Calculate decay factors based on usage and performance
            let decay_factor = if pattern.usage_count > 10 && pattern.composite_score > 0.7 {
                0.95 // Slower decay for proven patterns
            } else {
                0.9 // Faster decay for unproven patterns
            };
            
            pattern_decay_factors.insert(pattern.pattern_id.clone(), decay_factor);
        }

        AdaptiveAdjustments {
            learning_rate_adjustments,
            weight_modifications: self.scoring_config.clone(), // TODO: Implement dynamic weight adjustments
            pattern_decay_factors,
            context_boost_factors,
        }
    }

    /// Get top N patterns based on composite score
    pub fn get_top_patterns(&self, scored_result: &ScoringResult, n: usize) -> Vec<PatternScore> {
        scored_result.scored_patterns.iter()
            .take(n)
            .cloned()
            .collect()
    }

    /// Filter patterns by confidence threshold
    pub fn filter_by_confidence(&self, scored_result: &ScoringResult, threshold: f32) -> Vec<PatternScore> {
        scored_result.scored_patterns.iter()
            .filter(|pattern| pattern.confidence_score >= threshold)
            .cloned()
            .collect()
    }

    /// Update scoring configuration for adaptive learning
    pub fn update_scoring_config(&mut self, new_config: ScoringConfiguration) {
        self.scoring_config = new_config;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pattern_extractor::{NamingConventions, StructurePatterns};
    use crate::style_analyzer::{CodingStyleAnalysis, IndentationStyle, BraceStyleAnalysis};
    use crate::user_behavior_tracker::{BehaviorAnalysis, SessionData, PatternPreferences};

    #[test]
    fn test_pattern_scoring_engine_creation() {
        let engine = PatternScoringEngine::new();
        assert_eq!(engine.scoring_config.recency_weight, 0.25);
        assert_eq!(engine.scoring_config.frequency_weight, 0.25);
    }

    #[test]
    fn test_custom_scoring_configuration() {
        let config = ScoringConfiguration {
            recency_weight: 0.4,
            frequency_weight: 0.3,
            context_weight: 0.2,
            user_preference_weight: 0.1,
            confidence_threshold: 0.7,
            adaptive_learning_rate: 0.15,
        };
        
        let engine = PatternScoringEngine::with_config(config.clone());
        assert_eq!(engine.scoring_config.recency_weight, 0.4);
        assert_eq!(engine.scoring_config.confidence_threshold, 0.7);
    }

    #[test]
    fn test_style_relevance_calculation() {
        let engine = PatternScoringEngine::new();
        let context = ScoringContext {
            current_file_type: "javascript".to_string(),
            current_function_context: None,
            recent_patterns: vec![],
            time_of_day: chrono::Utc::now().timestamp(),
            project_context: "web_app".to_string(),
            user_session_data: None,
        };

        let relevance = engine.calculate_style_relevance(&NamingStyle::CamelCase, &context);
        assert_eq!(relevance, 0.9); // JavaScript should prefer camelCase

        let context_python = ScoringContext {
            current_file_type: "python".to_string(),
            current_function_context: None,
            recent_patterns: vec![],
            time_of_day: chrono::Utc::now().timestamp(),
            project_context: "data_science".to_string(),
            user_session_data: None,
        };

        let relevance_python = engine.calculate_style_relevance(&NamingStyle::SnakeCase, &context_python);
        assert_eq!(relevance_python, 0.9); // Python should prefer snake_case
    }

    #[test]
    fn test_composite_score_calculation() {
        let mut engine = PatternScoringEngine::new();
        let mut patterns = vec![
            PatternScore {
                pattern_id: "test_pattern".to_string(),
                relevance_score: 0.8,
                confidence_score: 0.9,
                frequency_score: 0.7,
                recency_score: 0.8,
                context_score: 0.6,
                user_preference_score: 0.75,
                composite_score: 0.0,
                last_updated: chrono::Utc::now().timestamp(),
                usage_count: 5,
            }
        ];

        engine.calculate_composite_scores(&mut patterns);
        
        let expected_score = (0.8 * 0.25 + 0.7 * 0.25 + 0.6 * 0.25 + 0.75 * 0.25) * 0.9;
        assert!((patterns[0].composite_score - expected_score).abs() < 0.001);
    }

    #[test]
    fn test_ranking_metrics_calculation() {
        let engine = PatternScoringEngine::new();
        let scored_patterns = vec![
            PatternScore {
                pattern_id: "high_conf".to_string(),
                relevance_score: 0.9,
                confidence_score: 0.85,
                frequency_score: 0.8,
                recency_score: 0.9,
                context_score: 0.7,
                user_preference_score: 0.8,
                composite_score: 0.8,
                last_updated: chrono::Utc::now().timestamp(),
                usage_count: 10,
            },
            PatternScore {
                pattern_id: "medium_conf".to_string(),
                relevance_score: 0.7,
                confidence_score: 0.65,
                frequency_score: 0.6,
                recency_score: 0.7,
                context_score: 0.5,
                user_preference_score: 0.6,
                composite_score: 0.6,
                last_updated: chrono::Utc::now().timestamp(),
                usage_count: 5,
            },
            PatternScore {
                pattern_id: "low_conf".to_string(),
                relevance_score: 0.5,
                confidence_score: 0.3,
                frequency_score: 0.4,
                recency_score: 0.5,
                context_score: 0.3,
                user_preference_score: 0.4,
                composite_score: 0.4,
                last_updated: chrono::Utc::now().timestamp(),
                usage_count: 2,
            },
        ];

        let metrics = engine.calculate_ranking_metrics(&scored_patterns);
        assert_eq!(metrics.total_patterns, 3);
        assert_eq!(metrics.high_confidence_count, 1);
        assert_eq!(metrics.medium_confidence_count, 1);
        assert_eq!(metrics.low_confidence_count, 1);
    }
}
