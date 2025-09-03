use crate::pattern_scoring_engine::{PatternScoringEngine, ScoringResult, PatternScore, ScoringContext};
use crate::pattern_extractor::{PatternAnalysis, NamingStyle};
use crate::user_behavior_tracker::BehaviorAnalysis;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

/// Intelligent suggestion generation engine for code completion and refactoring
pub struct SuggestionGenerationEngine {
    scoring_engine: PatternScoringEngine,
    suggestion_config: SuggestionConfiguration,
    template_engine: TemplateEngine,
    refactoring_engine: RefactoringEngine,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuggestionConfiguration {
    pub max_suggestions: usize,
    pub confidence_threshold: f32,
    pub context_window_size: usize,
    pub prioritize_user_patterns: bool,
    pub enable_refactoring_suggestions: bool,
    pub suggestion_types: Vec<SuggestionType>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum SuggestionType {
    CodeCompletion,
    VariableNaming,
    FunctionSignature,
    StyleImprovement,
    StructuralRefactoring,
    ImportOptimization,
    Documentation,
    ErrorPrevention,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuggestionResult {
    pub suggestions: Vec<CodeSuggestion>,
    pub confidence_metrics: ConfidenceMetrics,
    pub generation_metadata: GenerationMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeSuggestion {
    pub id: String,
    pub suggestion_type: SuggestionType,
    pub title: String,
    pub description: String,
    pub suggested_code: String,
    pub original_code: Option<String>,
    pub confidence_score: f32,
    pub pattern_match_score: f32,
    pub user_preference_score: f32,
    pub context_relevance: f32,
    pub position: CodePosition,
    pub preview_changes: Vec<CodeChange>,
    pub reasoning: String,
    pub related_patterns: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodePosition {
    pub line: u32,
    pub column: u32,
    pub start_offset: usize,
    pub end_offset: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeChange {
    pub change_type: ChangeType,
    pub original_text: String,
    pub suggested_text: String,
    pub position: CodePosition,
    pub impact_assessment: ImpactAssessment,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChangeType {
    Insert,
    Replace,
    Delete,
    Reorder,
    Format,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImpactAssessment {
    pub affected_lines: u32,
    pub breaking_change_risk: f32,
    pub performance_impact: PerformanceImpact,
    pub readability_improvement: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PerformanceImpact {
    Positive(f32),
    Neutral,
    Negative(f32),
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfidenceMetrics {
    pub overall_confidence: f32,
    pub pattern_confidence: f32,
    pub context_confidence: f32,
    pub user_alignment_confidence: f32,
    pub suggestion_diversity: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationMetadata {
    pub processing_time_ms: u64,
    pub patterns_analyzed: usize,
    pub suggestions_generated: usize,
    pub suggestions_filtered: usize,
    pub context_factors: Vec<String>,
    pub generation_strategy: GenerationStrategy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GenerationStrategy {
    PatternBased,
    TemplateMatching,
    HybridApproach,
    UserPreferenceDriven,
}

/// Template engine for generating code suggestions
pub struct TemplateEngine {
    templates: HashMap<String, CodeTemplate>,
    language_specific_rules: HashMap<String, LanguageRules>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeTemplate {
    pub id: String,
    pub language: String,
    pub pattern_type: String,
    pub template_code: String,
    pub variables: Vec<TemplateVariable>,
    pub conditions: Vec<TemplateCondition>,
    pub priority: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateVariable {
    pub name: String,
    pub variable_type: String,
    pub default_value: Option<String>,
    pub validation_pattern: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateCondition {
    pub condition_type: String,
    pub pattern: String,
    pub required: bool,
}

#[derive(Debug, Clone)]
pub struct LanguageRules {
    pub naming_conventions: HashMap<String, NamingStyle>,
    pub indentation_style: String,
    pub brace_style: String,
    pub import_patterns: Vec<String>,
    pub common_patterns: Vec<String>,
}

/// Refactoring suggestion engine
pub struct RefactoringEngine {
    refactoring_patterns: HashMap<String, RefactoringPattern>,
    safety_checks: SafetyChecker,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefactoringPattern {
    pub id: String,
    pub name: String,
    pub description: String,
    pub before_pattern: String,
    pub after_pattern: String,
    pub conditions: Vec<String>,
    pub benefits: Vec<String>,
    pub risks: Vec<String>,
    pub complexity_score: f32,
}

#[derive(Debug, Clone)]
pub struct SafetyChecker {
    pub breaking_change_patterns: Vec<String>,
    pub safe_transformations: Vec<String>,
}

impl Default for SuggestionConfiguration {
    fn default() -> Self {
        Self {
            max_suggestions: 10,
            confidence_threshold: 0.6,
            context_window_size: 50,
            prioritize_user_patterns: true,
            enable_refactoring_suggestions: true,
            suggestion_types: vec![
                SuggestionType::CodeCompletion,
                SuggestionType::VariableNaming,
                SuggestionType::FunctionSignature,
                SuggestionType::StyleImprovement,
            ],
        }
    }
}

impl SuggestionGenerationEngine {
    pub fn new() -> Self {
        Self {
            scoring_engine: PatternScoringEngine::new(),
            suggestion_config: SuggestionConfiguration::default(),
            template_engine: TemplateEngine::new(),
            refactoring_engine: RefactoringEngine::new(),
        }
    }

    pub fn with_config(config: SuggestionConfiguration) -> Self {
        Self {
            scoring_engine: PatternScoringEngine::new(),
            suggestion_config: config,
            template_engine: TemplateEngine::new(),
            refactoring_engine: RefactoringEngine::new(),
        }
    }

    /// Generate intelligent code suggestions based on context and patterns
    pub fn generate_suggestions(
        &mut self,
        code: &str,
        cursor_position: CodePosition,
        patterns: &PatternAnalysis,
        user_behavior: &BehaviorAnalysis,
        language: &str,
    ) -> Result<SuggestionResult, String> {
        let start_time = std::time::Instant::now();
        
        // Create scoring context
        let context = self.create_scoring_context(code, &cursor_position, language)?;
        
        // Score patterns for relevance
        let scoring_result = self.scoring_engine.score_patterns(patterns, user_behavior, &context)?;
        
        let mut suggestions = Vec::new();
        
        // Generate different types of suggestions
        if self.suggestion_config.suggestion_types.contains(&SuggestionType::CodeCompletion) {
            suggestions.extend(self.generate_completion_suggestions(code, &cursor_position, &scoring_result, language)?);
        }
        
        if self.suggestion_config.suggestion_types.contains(&SuggestionType::VariableNaming) {
            suggestions.extend(self.generate_naming_suggestions(code, &cursor_position, &scoring_result, language)?);
        }
        
        if self.suggestion_config.suggestion_types.contains(&SuggestionType::FunctionSignature) {
            suggestions.extend(self.generate_function_suggestions(code, &cursor_position, &scoring_result, language)?);
        }
        
        if self.suggestion_config.suggestion_types.contains(&SuggestionType::StyleImprovement) {
            suggestions.extend(self.generate_style_suggestions(code, &cursor_position, &scoring_result, language)?);
        }
        
        if self.suggestion_config.enable_refactoring_suggestions {
            suggestions.extend(self.generate_refactoring_suggestions(code, &cursor_position, language)?);
        }
        
        // Filter and rank suggestions
        suggestions = self.filter_and_rank_suggestions(suggestions, &scoring_result)?;
        
        // Calculate confidence metrics
        let confidence_metrics = self.calculate_confidence_metrics(&suggestions, &scoring_result);
        
        // Generate metadata
        let processing_time = start_time.elapsed().as_millis() as u64;
        let generation_metadata = GenerationMetadata {
            processing_time_ms: processing_time,
            patterns_analyzed: scoring_result.scored_patterns.len(),
            suggestions_generated: suggestions.len(),
            suggestions_filtered: 0, // TODO: Track filtered count
            context_factors: self.extract_context_factors(&context),
            generation_strategy: GenerationStrategy::HybridApproach,
        };
        
        Ok(SuggestionResult {
            suggestions,
            confidence_metrics,
            generation_metadata,
        })
    }

    fn create_scoring_context(&self, code: &str, cursor_position: &CodePosition, language: &str) -> Result<ScoringContext, String> {
        let lines: Vec<&str> = code.lines().collect();
        let current_line = lines.get(cursor_position.line as usize).unwrap_or(&"").to_string();
        
        // Extract recent patterns from surrounding context
        let context_start = cursor_position.line.saturating_sub(self.suggestion_config.context_window_size as u32 / 2);
        let context_end = (cursor_position.line + self.suggestion_config.context_window_size as u32 / 2).min(lines.len() as u32);
        
        let context_lines: Vec<String> = lines[context_start as usize..context_end as usize]
            .iter()
            .map(|&line| line.to_string())
            .collect();
        
        let recent_patterns = self.extract_patterns_from_context(&context_lines);
        
        Ok(ScoringContext {
            current_file_type: language.to_string(),
            current_function_context: self.extract_function_context(&current_line),
            recent_patterns,
            time_of_day: chrono::Utc::now().timestamp(),
            project_context: "code_completion".to_string(),
            user_session_data: None,
        })
    }

    fn generate_completion_suggestions(
        &self,
        code: &str,
        cursor_position: &CodePosition,
        scoring_result: &ScoringResult,
        language: &str,
    ) -> Result<Vec<CodeSuggestion>, String> {
        let mut suggestions = Vec::new();
        
        // Analyze the current context for completion opportunities
        let context = self.analyze_completion_context(code, cursor_position)?;
        
        // Generate suggestions based on top-scored patterns
        for pattern in scoring_result.scored_patterns.iter().take(5) {
            if pattern.composite_score > self.suggestion_config.confidence_threshold {
                if let Some(suggestion) = self.create_completion_from_pattern(pattern, &context, language) {
                    suggestions.push(suggestion);
                }
            }
        }
        
        // Add template-based suggestions
        suggestions.extend(self.template_engine.generate_template_suggestions(&context, language)?);
        
        Ok(suggestions)
    }

    fn generate_naming_suggestions(
        &self,
        code: &str,
        cursor_position: &CodePosition,
        scoring_result: &ScoringResult,
        language: &str,
    ) -> Result<Vec<CodeSuggestion>, String> {
        let mut suggestions = Vec::new();
        
        // Detect variables that might benefit from better naming
        let naming_opportunities = self.detect_naming_opportunities(code, cursor_position)?;
        
        for opportunity in naming_opportunities {
            // Find relevant naming patterns
            let relevant_patterns: Vec<&PatternScore> = scoring_result.scored_patterns
                .iter()
                .filter(|p| p.pattern_id.contains("naming") || p.pattern_id.contains("variable"))
                .collect();
            
            if let Some(suggestion) = self.create_naming_suggestion(opportunity, &relevant_patterns, language) {
                suggestions.push(suggestion);
            }
        }
        
        Ok(suggestions)
    }

    fn generate_function_suggestions(
        &self,
        code: &str,
        cursor_position: &CodePosition,
        scoring_result: &ScoringResult,
        language: &str,
    ) -> Result<Vec<CodeSuggestion>, String> {
        let mut suggestions = Vec::new();
        
        // Detect function signature improvement opportunities
        let function_context = self.analyze_function_context(code, cursor_position)?;
        
        if let Some(context) = function_context {
            // Generate parameter suggestions
            if let Some(suggestion) = self.suggest_function_parameters(&context, scoring_result, language) {
                suggestions.push(suggestion);
            }
            
            // Generate return type suggestions
            if let Some(suggestion) = self.suggest_return_type(&context, scoring_result, language) {
                suggestions.push(suggestion);
            }
            
            // Generate documentation suggestions
            if let Some(suggestion) = self.suggest_function_documentation(&context, language) {
                suggestions.push(suggestion);
            }
        }
        
        Ok(suggestions)
    }

    fn generate_style_suggestions(
        &self,
        code: &str,
        cursor_position: &CodePosition,
        scoring_result: &ScoringResult,
        language: &str,
    ) -> Result<Vec<CodeSuggestion>, String> {
        let mut suggestions = Vec::new();
        
        // Analyze style patterns
        let style_patterns: Vec<&PatternScore> = scoring_result.scored_patterns
            .iter()
            .filter(|p| p.pattern_id.contains("style") || p.pattern_id.contains("indentation") || p.pattern_id.contains("brace"))
            .collect();
        
        // Generate style improvement suggestions
        for pattern in style_patterns {
            if let Some(suggestion) = self.create_style_suggestion(code, cursor_position, pattern, language) {
                suggestions.push(suggestion);
            }
        }
        
        Ok(suggestions)
    }

    fn generate_refactoring_suggestions(
        &self,
        code: &str,
        cursor_position: &CodePosition,
        language: &str,
    ) -> Result<Vec<CodeSuggestion>, String> {
        self.refactoring_engine.generate_refactoring_suggestions(code, cursor_position, language)
    }

    fn filter_and_rank_suggestions(
        &self,
        mut suggestions: Vec<CodeSuggestion>,
        _scoring_result: &ScoringResult,
    ) -> Result<Vec<CodeSuggestion>, String> {
        // Filter by confidence threshold
        suggestions.retain(|s| s.confidence_score >= self.suggestion_config.confidence_threshold);
        
        // Sort by composite score (confidence + pattern match + user preference + context relevance)
        suggestions.sort_by(|a, b| {
            let score_a = a.confidence_score + a.pattern_match_score + a.user_preference_score + a.context_relevance;
            let score_b = b.confidence_score + b.pattern_match_score + b.user_preference_score + b.context_relevance;
            score_b.partial_cmp(&score_a).unwrap()
        });
        
        // Limit to max suggestions
        suggestions.truncate(self.suggestion_config.max_suggestions);
        
        Ok(suggestions)
    }

    fn calculate_confidence_metrics(&self, suggestions: &[CodeSuggestion], scoring_result: &ScoringResult) -> ConfidenceMetrics {
        if suggestions.is_empty() {
            return ConfidenceMetrics {
                overall_confidence: 0.0,
                pattern_confidence: 0.0,
                context_confidence: 0.0,
                user_alignment_confidence: 0.0,
                suggestion_diversity: 0.0,
            };
        }
        
        let overall_confidence = suggestions.iter().map(|s| s.confidence_score).sum::<f32>() / suggestions.len() as f32;
        let pattern_confidence = suggestions.iter().map(|s| s.pattern_match_score).sum::<f32>() / suggestions.len() as f32;
        let context_confidence = suggestions.iter().map(|s| s.context_relevance).sum::<f32>() / suggestions.len() as f32;
        let user_alignment_confidence = suggestions.iter().map(|s| s.user_preference_score).sum::<f32>() / suggestions.len() as f32;
        
        // Calculate diversity based on suggestion types
        let unique_types: std::collections::HashSet<_> = suggestions.iter().map(|s| &s.suggestion_type).collect();
        let suggestion_diversity = unique_types.len() as f32 / suggestions.len() as f32;
        
        ConfidenceMetrics {
            overall_confidence,
            pattern_confidence,
            context_confidence,
            user_alignment_confidence,
            suggestion_diversity,
        }
    }

    // Helper methods (placeholder implementations)
    fn extract_patterns_from_context(&self, _context_lines: &[String]) -> Vec<String> {
        vec!["variable_declaration".to_string(), "function_call".to_string()]
    }

    fn extract_function_context(&self, _current_line: &str) -> Option<String> {
        Some("function_scope".to_string())
    }

    fn extract_context_factors(&self, _context: &ScoringContext) -> Vec<String> {
        vec!["cursor_position".to_string(), "file_type".to_string()]
    }

    fn analyze_completion_context(&self, _code: &str, _cursor_position: &CodePosition) -> Result<CompletionContext, String> {
        Ok(CompletionContext {
            current_token: "example".to_string(),
            expected_type: Some("string".to_string()),
            in_function: true,
            in_comment: false,
        })
    }

    fn create_completion_from_pattern(&self, pattern: &PatternScore, _context: &CompletionContext, _language: &str) -> Option<CodeSuggestion> {
        Some(CodeSuggestion {
            id: format!("completion_{}", pattern.pattern_id),
            suggestion_type: SuggestionType::CodeCompletion,
            title: "Code Completion".to_string(),
            description: format!("Suggested based on pattern: {}", pattern.pattern_id),
            suggested_code: "// Generated code".to_string(),
            original_code: None,
            confidence_score: pattern.confidence_score,
            pattern_match_score: pattern.composite_score,
            user_preference_score: pattern.user_preference_score,
            context_relevance: pattern.context_score,
            position: CodePosition { line: 0, column: 0, start_offset: 0, end_offset: 0 },
            preview_changes: vec![],
            reasoning: format!("Based on pattern analysis: {}", pattern.pattern_id),
            related_patterns: vec![pattern.pattern_id.clone()],
        })
    }

    fn detect_naming_opportunities(&self, _code: &str, _cursor_position: &CodePosition) -> Result<Vec<NamingOpportunity>, String> {
        Ok(vec![])
    }

    fn create_naming_suggestion(&self, _opportunity: NamingOpportunity, _patterns: &[&PatternScore], _language: &str) -> Option<CodeSuggestion> {
        None
    }

    fn analyze_function_context(&self, _code: &str, _cursor_position: &CodePosition) -> Result<Option<FunctionContext>, String> {
        Ok(None)
    }

    fn suggest_function_parameters(&self, _context: &FunctionContext, _scoring_result: &ScoringResult, _language: &str) -> Option<CodeSuggestion> {
        None
    }

    fn suggest_return_type(&self, _context: &FunctionContext, _scoring_result: &ScoringResult, _language: &str) -> Option<CodeSuggestion> {
        None
    }

    fn suggest_function_documentation(&self, _context: &FunctionContext, _language: &str) -> Option<CodeSuggestion> {
        None
    }

    fn create_style_suggestion(&self, _code: &str, _cursor_position: &CodePosition, _pattern: &PatternScore, _language: &str) -> Option<CodeSuggestion> {
        None
    }
}

// Helper structs for internal use
#[derive(Debug, Clone)]
struct CompletionContext {
    current_token: String,
    expected_type: Option<String>,
    in_function: bool,
    in_comment: bool,
}

#[derive(Debug, Clone)]
struct NamingOpportunity {
    variable_name: String,
    position: CodePosition,
    context: String,
}

#[derive(Debug, Clone)]
struct FunctionContext {
    function_name: String,
    parameters: Vec<String>,
    return_type: Option<String>,
    position: CodePosition,
}

impl TemplateEngine {
    pub fn new() -> Self {
        Self {
            templates: HashMap::new(),
            language_specific_rules: HashMap::new(),
        }
    }

    pub fn generate_template_suggestions(&self, _context: &CompletionContext, _language: &str) -> Result<Vec<CodeSuggestion>, String> {
        Ok(vec![])
    }
}

impl RefactoringEngine {
    pub fn new() -> Self {
        Self {
            refactoring_patterns: HashMap::new(),
            safety_checks: SafetyChecker {
                breaking_change_patterns: vec![],
                safe_transformations: vec![],
            },
        }
    }

    pub fn generate_refactoring_suggestions(&self, _code: &str, _cursor_position: &CodePosition, _language: &str) -> Result<Vec<CodeSuggestion>, String> {
        Ok(vec![])
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_suggestion_engine_creation() {
        let engine = SuggestionGenerationEngine::new();
        assert_eq!(engine.suggestion_config.max_suggestions, 10);
        assert_eq!(engine.suggestion_config.confidence_threshold, 0.6);
    }

    #[test]
    fn test_custom_configuration() {
        let config = SuggestionConfiguration {
            max_suggestions: 20,
            confidence_threshold: 0.8,
            context_window_size: 100,
            prioritize_user_patterns: false,
            enable_refactoring_suggestions: false,
            suggestion_types: vec![SuggestionType::CodeCompletion],
        };
        
        let engine = SuggestionGenerationEngine::with_config(config.clone());
        assert_eq!(engine.suggestion_config.max_suggestions, 20);
        assert_eq!(engine.suggestion_config.confidence_threshold, 0.8);
        assert!(!engine.suggestion_config.enable_refactoring_suggestions);
    }

    #[test]
    fn test_confidence_metrics_calculation() {
        let engine = SuggestionGenerationEngine::new();
        let suggestions = vec![
            CodeSuggestion {
                id: "test1".to_string(),
                suggestion_type: SuggestionType::CodeCompletion,
                title: "Test".to_string(),
                description: "Test".to_string(),
                suggested_code: "test".to_string(),
                original_code: None,
                confidence_score: 0.8,
                pattern_match_score: 0.7,
                user_preference_score: 0.6,
                context_relevance: 0.9,
                position: CodePosition { line: 0, column: 0, start_offset: 0, end_offset: 0 },
                preview_changes: vec![],
                reasoning: "test".to_string(),
                related_patterns: vec![],
            }
        ];
        
        let scoring_result = ScoringResult {
            scored_patterns: vec![],
            ranking_metrics: crate::pattern_scoring_engine::RankingMetrics {
                total_patterns: 0,
                high_confidence_count: 0,
                medium_confidence_count: 0,
                low_confidence_count: 0,
                average_score: 0.0,
                score_variance: 0.0,
            },
            confidence_distribution: crate::pattern_scoring_engine::ConfidenceDistribution {
                high_confidence: vec![],
                medium_confidence: vec![],
                low_confidence: vec![],
                threshold_adjustments: HashMap::new(),
            },
            adaptive_adjustments: crate::pattern_scoring_engine::AdaptiveAdjustments {
                learning_rate_adjustments: HashMap::new(),
                weight_modifications: crate::pattern_scoring_engine::ScoringConfiguration::default(),
                pattern_decay_factors: HashMap::new(),
                context_boost_factors: HashMap::new(),
            },
        };
        
        let metrics = engine.calculate_confidence_metrics(&suggestions, &scoring_result);
        assert_eq!(metrics.overall_confidence, 0.8);
        assert_eq!(metrics.pattern_confidence, 0.7);
        assert_eq!(metrics.user_alignment_confidence, 0.6);
        assert_eq!(metrics.context_confidence, 0.9);
    }

    #[test]
    fn test_scoring_context_creation() {
        let engine = SuggestionGenerationEngine::new();
        let code = "function test() {\n    let x = 5;\n    return x + 1;\n}";
        let cursor_position = CodePosition {
            line: 1,
            column: 10,
            start_offset: 20,
            end_offset: 20,
        };
        
        let context = engine.create_scoring_context(code, &cursor_position, "javascript").unwrap();
        assert_eq!(context.current_file_type, "javascript");
        assert_eq!(context.project_context, "code_completion");
    }
}
