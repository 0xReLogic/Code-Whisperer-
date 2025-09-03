use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, Duration, Timelike, Datelike};

/// Privacy-conscious user behavior tracking system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserBehaviorTracker {
    session_data: SessionData,
    pattern_preferences: PatternPreferences,
    learning_context: LearningContext,
    privacy_settings: PrivacySettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BehaviorAnalysis {
    pub coding_patterns: CodingPatterns,
    pub preference_insights: PreferenceInsights,
    pub learning_progress: LearningProgress,
    pub context_awareness: ContextAwareness,
    pub suggestion_feedback: SuggestionFeedback,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionData {
    pub session_id: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub active_duration: Duration,
    pub languages_used: Vec<String>,
    pub files_edited: u32,
    pub lines_written: u32,
    pub keystrokes: u32,
    pub suggestions_accepted: u32,
    pub suggestions_rejected: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternPreferences {
    pub naming_style_preferences: HashMap<String, f32>, // style -> preference_score
    pub indentation_preference: IndentationPreference,
    pub brace_style_preference: BraceStylePreference,
    pub function_length_preference: FunctionLengthPreference,
    pub comment_style_preference: CommentStylePreference,
    pub import_organization_preference: ImportOrganizationPreference,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodingPatterns {
    pub most_used_patterns: HashMap<String, u32>, // pattern -> usage_count
    pub temporal_patterns: TemporalPatterns,
    pub contextual_patterns: ContextualPatterns,
    pub error_prone_patterns: Vec<ErrorPronePattern>,
    pub productivity_patterns: ProductivityPatterns,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreferenceInsights {
    pub style_consistency: f32,      // 0.0 to 1.0
    pub learning_velocity: f32,      // patterns learned per session
    pub adaptation_rate: f32,        // how quickly user adapts to suggestions
    pub preferred_suggestion_types: HashMap<String, f32>,
    pub feedback_sentiment: SentimentAnalysis,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningProgress {
    pub patterns_learned: u32,
    pub skill_improvement_areas: Vec<SkillArea>,
    pub mastery_levels: HashMap<String, MasteryLevel>, // skill -> level
    pub learning_goals: Vec<LearningGoal>,
    pub achievement_milestones: Vec<Achievement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextAwareness {
    pub project_context: ProjectContext,
    pub file_context: FileContext,
    pub team_context: TeamContext,
    pub temporal_context: TemporalContext,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuggestionFeedback {
    pub acceptance_rate: f32,        // 0.0 to 1.0
    pub rejection_reasons: HashMap<String, u32>, // reason -> count
    pub feedback_quality: FeedbackQuality,
    pub improvement_suggestions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningContext {
    pub current_skill_focus: Vec<String>,
    pub recent_mistakes: Vec<MistakePattern>,
    pub improvement_areas: Vec<String>,
    pub learning_session_count: u32,
    pub total_learning_time: Duration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacySettings {
    pub data_collection_enabled: bool,
    pub anonymization_level: AnonymizationLevel,
    pub data_retention_days: u32,
    pub sharing_preferences: SharingPreferences,
    pub export_data_allowed: bool,
}

// Supporting data structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndentationPreference {
    pub type_preference: IndentationType, // spaces or tabs
    pub size_preference: u32,             // 2, 4, 8 spaces
    pub consistency_score: f32,           // 0.0 to 1.0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IndentationType {
    Spaces,
    Tabs,
    Mixed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BraceStylePreference {
    Allman,      // braces on new line
    KAndR,       // braces on same line
    GNU,         // GNU style
    Mixed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionLengthPreference {
    pub preferred_min_lines: u32,
    pub preferred_max_lines: u32,
    pub complexity_tolerance: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CommentStylePreference {
    Minimal,     // few comments
    Moderate,    // balanced commenting
    Extensive,   // heavy documentation
    Mixed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ImportOrganizationPreference {
    Alphabetical,
    ByType,
    ByUsage,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemporalPatterns {
    pub peak_productivity_hours: Vec<u32>, // hours of day (0-23)
    pub weekly_patterns: HashMap<String, f32>, // day -> productivity_score
    pub session_length_patterns: Vec<Duration>,
    pub break_patterns: Vec<Duration>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextualPatterns {
    pub file_type_patterns: HashMap<String, Vec<String>>, // extension -> patterns
    pub project_size_patterns: HashMap<String, Vec<String>>, // size -> patterns
    pub collaboration_patterns: CollaborationPatterns,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorPronePattern {
    pub pattern_description: String,
    pub frequency: u32,
    pub severity: ErrorSeverity,
    pub suggested_alternatives: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ErrorSeverity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductivityPatterns {
    pub fast_completion_patterns: Vec<String>,
    pub slow_completion_patterns: Vec<String>,
    pub distraction_indicators: Vec<String>,
    pub flow_state_indicators: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SentimentAnalysis {
    pub positive_feedback_ratio: f32,
    pub frustration_indicators: Vec<String>,
    pub satisfaction_indicators: Vec<String>,
    pub overall_sentiment: Sentiment,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Sentiment {
    VeryPositive,
    Positive,
    Neutral,
    Negative,
    VeryNegative,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillArea {
    pub name: String,
    pub current_level: f32,    // 0.0 to 10.0
    pub improvement_rate: f32, // level increase per session
    pub focus_priority: Priority,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Priority {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MasteryLevel {
    Beginner,
    Novice,
    Intermediate,
    Advanced,
    Expert,
    Master,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningGoal {
    pub goal_id: String,
    pub description: String,
    pub target_date: DateTime<Utc>,
    pub progress: f32,         // 0.0 to 1.0
    pub priority: Priority,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Achievement {
    pub achievement_id: String,
    pub name: String,
    pub description: String,
    pub unlocked_date: DateTime<Utc>,
    pub category: AchievementCategory,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AchievementCategory {
    Productivity,
    CodeQuality,
    Learning,
    Consistency,
    Innovation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectContext {
    pub project_type: String,
    pub project_size: ProjectSize,
    pub team_size: u32,
    pub technology_stack: Vec<String>,
    pub project_phase: ProjectPhase,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProjectSize {
    Small,      // < 10k lines
    Medium,     // 10k - 100k lines
    Large,      // 100k - 1M lines
    Enterprise, // > 1M lines
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProjectPhase {
    Planning,
    Development,
    Testing,
    Maintenance,
    Refactoring,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileContext {
    pub file_type: String,
    pub file_size: u32,
    pub complexity_level: f32,
    pub recent_changes: u32,
    pub collaboration_frequency: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamContext {
    pub coding_standards: Vec<String>,
    pub shared_patterns: Vec<String>,
    pub team_preferences: PatternPreferences,
    pub collaboration_style: CollaborationStyle,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CollaborationStyle {
    Independent,
    PairProgramming,
    CodeReview,
    MobProgramming,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemporalContext {
    pub time_of_day: u32,      // hour (0-23)
    pub day_of_week: u32,      // 0-6 (Sunday-Saturday)
    pub session_duration: Duration,
    pub time_since_last_break: Duration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollaborationPatterns {
    pub code_review_patterns: Vec<String>,
    pub pair_programming_patterns: Vec<String>,
    pub merge_conflict_patterns: Vec<String>,
    pub communication_patterns: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedbackQuality {
    pub relevance_score: f32,     // 0.0 to 1.0
    pub timeliness_score: f32,    // 0.0 to 1.0
    pub actionability_score: f32, // 0.0 to 1.0
    pub user_satisfaction: f32,   // 0.0 to 1.0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MistakePattern {
    pub pattern_type: String,
    pub frequency: u32,
    pub context: String,
    pub correction_time: Duration,
    pub learning_progress: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AnonymizationLevel {
    None,        // no anonymization
    Basic,       // remove personal identifiers
    Moderate,    // hash sensitive data
    Full,        // full anonymization
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SharingPreferences {
    pub share_anonymous_patterns: bool,
    pub contribute_to_community: bool,
    pub participate_in_research: bool,
    pub allow_team_insights: bool,
}

impl UserBehaviorTracker {
    pub fn new() -> Self {
        Self {
            session_data: SessionData::new(),
            pattern_preferences: PatternPreferences::default(),
            learning_context: LearningContext::default(),
            privacy_settings: PrivacySettings::default(),
        }
    }

    /// Start a new coding session
    pub fn start_session(&mut self) -> String {
        self.session_data = SessionData::new();
        self.session_data.session_id.clone()
    }

    /// End the current coding session
    pub fn end_session(&mut self) {
        self.session_data.end_time = Some(Utc::now());
        if let Some(end_time) = self.session_data.end_time {
            self.session_data.active_duration = end_time - self.session_data.start_time;
        }
    }

    /// Track user interaction with a suggestion
    pub fn track_suggestion_interaction(&mut self, suggestion_id: &str, accepted: bool, feedback: Option<String>) {
        if accepted {
            self.session_data.suggestions_accepted += 1;
        } else {
            self.session_data.suggestions_rejected += 1;
        }

        // Update learning context based on interaction
        if let Some(feedback_text) = feedback {
            self.process_feedback(suggestion_id, &feedback_text);
        }
    }

    /// Track coding activity
    pub fn track_coding_activity(&mut self, language: &str, lines_written: u32, keystrokes: u32) {
        if !self.session_data.languages_used.contains(&language.to_string()) {
            self.session_data.languages_used.push(language.to_string());
        }
        self.session_data.lines_written += lines_written;
        self.session_data.keystrokes += keystrokes;
    }

    /// Track pattern usage
    pub fn track_pattern_usage(&mut self, pattern_type: &str, context: &str) {
        // This would update pattern preferences based on usage
        // Privacy-conscious: only track patterns, not specific code content
    }

    /// Analyze current behavior patterns
    pub fn analyze_behavior(&self) -> BehaviorAnalysis {
        BehaviorAnalysis {
            coding_patterns: self.analyze_coding_patterns(),
            preference_insights: self.analyze_preferences(),
            learning_progress: self.analyze_learning_progress(),
            context_awareness: self.analyze_context(),
            suggestion_feedback: self.analyze_suggestion_feedback(),
        }
    }

    /// Get personalized suggestions based on behavior patterns
    pub fn get_personalized_insights(&self) -> Vec<String> {
        let mut insights = Vec::new();

        // Analyze productivity patterns
        if self.session_data.suggestions_accepted > self.session_data.suggestions_rejected {
            insights.push("You're effectively using AI suggestions to improve your code quality.".to_string());
        }

        // Analyze learning patterns
        if self.learning_context.learning_session_count > 10 {
            insights.push("You're consistently engaging with learning opportunities.".to_string());
        }

        // Analyze temporal patterns
        let current_hour = Utc::now().hour();
        if (9..=11).contains(&current_hour) || (14..=16).contains(&current_hour) {
            insights.push("This appears to be one of your productive coding hours.".to_string());
        }

        insights
    }

    /// Update privacy settings
    pub fn update_privacy_settings(&mut self, settings: PrivacySettings) {
        self.privacy_settings = settings;
        
        // Apply privacy settings retroactively if needed
        if !self.privacy_settings.data_collection_enabled {
            self.clear_tracking_data();
        }
    }

    /// Export user data (GDPR compliance)
    pub fn export_user_data(&self) -> Result<String, String> {
        if !self.privacy_settings.export_data_allowed {
            return Err("Data export not allowed by privacy settings".to_string());
        }

        // Serialize all user data
        serde_json::to_string_pretty(&self)
            .map_err(|e| format!("Failed to serialize user data: {}", e))
    }

    /// Delete user data (GDPR compliance)
    pub fn delete_user_data(&mut self) {
        self.session_data = SessionData::new();
        self.pattern_preferences = PatternPreferences::default();
        self.learning_context = LearningContext::default();
    }

    fn process_feedback(&mut self, _suggestion_id: &str, _feedback: &str) {
        // Process user feedback to improve future suggestions
        // This would involve sentiment analysis and pattern recognition
    }

    fn analyze_coding_patterns(&self) -> CodingPatterns {
        CodingPatterns {
            most_used_patterns: HashMap::new(), // Would be populated from tracked data
            temporal_patterns: TemporalPatterns {
                peak_productivity_hours: vec![9, 10, 14, 15], // Example data
                weekly_patterns: HashMap::new(),
                session_length_patterns: vec![Duration::minutes(45)],
                break_patterns: vec![Duration::minutes(15)],
            },
            contextual_patterns: ContextualPatterns {
                file_type_patterns: HashMap::new(),
                project_size_patterns: HashMap::new(),
                collaboration_patterns: CollaborationPatterns {
                    code_review_patterns: Vec::new(),
                    pair_programming_patterns: Vec::new(),
                    merge_conflict_patterns: Vec::new(),
                    communication_patterns: Vec::new(),
                },
            },
            error_prone_patterns: Vec::new(),
            productivity_patterns: ProductivityPatterns {
                fast_completion_patterns: Vec::new(),
                slow_completion_patterns: Vec::new(),
                distraction_indicators: Vec::new(),
                flow_state_indicators: Vec::new(),
            },
        }
    }

    fn analyze_preferences(&self) -> PreferenceInsights {
        let acceptance_rate = if self.session_data.suggestions_accepted + self.session_data.suggestions_rejected > 0 {
            self.session_data.suggestions_accepted as f32 / 
            (self.session_data.suggestions_accepted + self.session_data.suggestions_rejected) as f32
        } else {
            0.0
        };

        PreferenceInsights {
            style_consistency: 0.8, // Would be calculated from tracked patterns
            learning_velocity: 0.6,  // Patterns learned per session
            adaptation_rate: acceptance_rate,
            preferred_suggestion_types: HashMap::new(),
            feedback_sentiment: SentimentAnalysis {
                positive_feedback_ratio: 0.7,
                frustration_indicators: Vec::new(),
                satisfaction_indicators: Vec::new(),
                overall_sentiment: Sentiment::Positive,
            },
        }
    }

    fn analyze_learning_progress(&self) -> LearningProgress {
        LearningProgress {
            patterns_learned: self.learning_context.learning_session_count * 2, // Example calculation
            skill_improvement_areas: vec![
                SkillArea {
                    name: "Code Quality".to_string(),
                    current_level: 7.0,
                    improvement_rate: 0.1,
                    focus_priority: Priority::Medium,
                }
            ],
            mastery_levels: HashMap::new(),
            learning_goals: Vec::new(),
            achievement_milestones: Vec::new(),
        }
    }

    fn analyze_context(&self) -> ContextAwareness {
        let now = Utc::now();
        
        ContextAwareness {
            project_context: ProjectContext {
                project_type: "web_application".to_string(),
                project_size: ProjectSize::Medium,
                team_size: 3,
                technology_stack: self.session_data.languages_used.clone(),
                project_phase: ProjectPhase::Development,
            },
            file_context: FileContext {
                file_type: "typescript".to_string(),
                file_size: 250,
                complexity_level: 3.5,
                recent_changes: 5,
                collaboration_frequency: 0.4,
            },
            team_context: TeamContext {
                coding_standards: vec!["eslint".to_string(), "prettier".to_string()],
                shared_patterns: Vec::new(),
                team_preferences: PatternPreferences::default(),
                collaboration_style: CollaborationStyle::CodeReview,
            },
            temporal_context: TemporalContext {
                time_of_day: now.hour(),
                day_of_week: now.weekday().number_from_sunday() - 1,
                session_duration: self.session_data.active_duration,
                time_since_last_break: Duration::minutes(30), // Example
            },
        }
    }

    fn analyze_suggestion_feedback(&self) -> SuggestionFeedback {
        let total_suggestions = self.session_data.suggestions_accepted + self.session_data.suggestions_rejected;
        let acceptance_rate = if total_suggestions > 0 {
            self.session_data.suggestions_accepted as f32 / total_suggestions as f32
        } else {
            0.0
        };

        SuggestionFeedback {
            acceptance_rate,
            rejection_reasons: HashMap::new(), // Would track specific reasons
            feedback_quality: FeedbackQuality {
                relevance_score: 0.8,
                timeliness_score: 0.9,
                actionability_score: 0.7,
                user_satisfaction: 0.8,
            },
            improvement_suggestions: vec![
                "Consider more context-aware suggestions".to_string(),
                "Improve suggestion timing".to_string(),
            ],
        }
    }

    fn clear_tracking_data(&mut self) {
        // Clear all tracking data while preserving essential functionality
        self.session_data = SessionData::new();
        self.learning_context = LearningContext::default();
    }
}

impl SessionData {
    fn new() -> Self {
        Self {
            session_id: uuid::Uuid::new_v4().to_string(),
            start_time: Utc::now(),
            end_time: None,
            active_duration: Duration::zero(),
            languages_used: Vec::new(),
            files_edited: 0,
            lines_written: 0,
            keystrokes: 0,
            suggestions_accepted: 0,
            suggestions_rejected: 0,
        }
    }
}

impl Default for PatternPreferences {
    fn default() -> Self {
        Self {
            naming_style_preferences: HashMap::new(),
            indentation_preference: IndentationPreference {
                type_preference: IndentationType::Spaces,
                size_preference: 4,
                consistency_score: 0.8,
            },
            brace_style_preference: BraceStylePreference::KAndR,
            function_length_preference: FunctionLengthPreference {
                preferred_min_lines: 5,
                preferred_max_lines: 50,
                complexity_tolerance: 5.0,
            },
            comment_style_preference: CommentStylePreference::Moderate,
            import_organization_preference: ImportOrganizationPreference::Alphabetical,
        }
    }
}

impl Default for LearningContext {
    fn default() -> Self {
        Self {
            current_skill_focus: Vec::new(),
            recent_mistakes: Vec::new(),
            improvement_areas: Vec::new(),
            learning_session_count: 0,
            total_learning_time: Duration::zero(),
        }
    }
}

impl Default for PrivacySettings {
    fn default() -> Self {
        Self {
            data_collection_enabled: true,
            anonymization_level: AnonymizationLevel::Moderate,
            data_retention_days: 365,
            sharing_preferences: SharingPreferences {
                share_anonymous_patterns: false,
                contribute_to_community: false,
                participate_in_research: false,
                allow_team_insights: true,
            },
            export_data_allowed: true,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_behavior_tracker_creation() {
        let tracker = UserBehaviorTracker::new();
        assert!(tracker.privacy_settings.data_collection_enabled);
    }

    #[test]
    fn test_session_management() {
        let mut tracker = UserBehaviorTracker::new();
        
        let session_id = tracker.start_session();
        assert!(!session_id.is_empty());
        assert!(tracker.session_data.end_time.is_none());
        
        tracker.end_session();
        assert!(tracker.session_data.end_time.is_some());
    }

    #[test]
    fn test_suggestion_tracking() {
        let mut tracker = UserBehaviorTracker::new();
        tracker.start_session();
        
        // Track accepted suggestion
        tracker.track_suggestion_interaction("suggest1", true, Some("helpful".to_string()));
        assert_eq!(tracker.session_data.suggestions_accepted, 1);
        
        // Track rejected suggestion
        tracker.track_suggestion_interaction("suggest2", false, Some("not relevant".to_string()));
        assert_eq!(tracker.session_data.suggestions_rejected, 1);
    }

    #[test]
    fn test_coding_activity_tracking() {
        let mut tracker = UserBehaviorTracker::new();
        tracker.start_session();
        
        tracker.track_coding_activity("javascript", 50, 250);
        assert!(tracker.session_data.languages_used.contains(&"javascript".to_string()));
        assert_eq!(tracker.session_data.lines_written, 50);
        assert_eq!(tracker.session_data.keystrokes, 250);
    }

    #[test]
    fn test_behavior_analysis() {
        let mut tracker = UserBehaviorTracker::new();
        tracker.start_session();
        
        // Add some sample data
        tracker.track_coding_activity("rust", 100, 500);
        tracker.track_suggestion_interaction("suggest1", true, None);
        tracker.track_suggestion_interaction("suggest2", true, None);
        tracker.track_suggestion_interaction("suggest3", false, None);
        
        let analysis = tracker.analyze_behavior();
        assert!(analysis.suggestion_feedback.acceptance_rate > 0.5);
        assert!(!analysis.context_awareness.project_context.technology_stack.is_empty());
    }

    #[test]
    fn test_personalized_insights() {
        let mut tracker = UserBehaviorTracker::new();
        tracker.start_session();
        
        // Simulate positive interaction pattern
        tracker.track_suggestion_interaction("suggest1", true, None);
        tracker.track_suggestion_interaction("suggest2", true, None);
        tracker.track_suggestion_interaction("suggest3", true, None);
        
        let insights = tracker.get_personalized_insights();
        assert!(!insights.is_empty());
    }

    #[test]
    fn test_privacy_settings() {
        let mut tracker = UserBehaviorTracker::new();
        
        // Test default privacy settings
        assert!(tracker.privacy_settings.data_collection_enabled);
        assert_eq!(tracker.privacy_settings.data_retention_days, 365);
        
        // Update privacy settings
        let new_settings = PrivacySettings {
            data_collection_enabled: false,
            anonymization_level: AnonymizationLevel::Full,
            data_retention_days: 30,
            sharing_preferences: SharingPreferences {
                share_anonymous_patterns: false,
                contribute_to_community: false,
                participate_in_research: false,
                allow_team_insights: false,
            },
            export_data_allowed: false,
        };
        
        tracker.update_privacy_settings(new_settings);
        assert!(!tracker.privacy_settings.data_collection_enabled);
    }

    #[test]
    fn test_data_export() {
        let tracker = UserBehaviorTracker::new();
        let export_result = tracker.export_user_data();
        assert!(export_result.is_ok());
        
        let json_data = export_result.unwrap();
        assert!(json_data.contains("session_data"));
        assert!(json_data.contains("privacy_settings"));
    }

    #[test]
    fn test_data_deletion() {
        let mut tracker = UserBehaviorTracker::new();
        tracker.start_session();
        tracker.track_coding_activity("python", 25, 125);
        
        // Verify data exists
        assert!(!tracker.session_data.languages_used.is_empty());
        
        // Delete data
        tracker.delete_user_data();
        
        // Verify data is cleared
        assert!(tracker.session_data.languages_used.is_empty());
        assert_eq!(tracker.session_data.lines_written, 0);
    }

    #[test]
    fn test_learning_progress_tracking() {
        let mut tracker = UserBehaviorTracker::new();
        tracker.learning_context.learning_session_count = 5;
        
        let analysis = tracker.analyze_behavior();
        assert!(analysis.learning_progress.patterns_learned > 0);
        assert!(!analysis.learning_progress.skill_improvement_areas.is_empty());
    }

    #[test]
    fn test_temporal_context_analysis() {
        let tracker = UserBehaviorTracker::new();
        let analysis = tracker.analyze_behavior();
        
        // Verify temporal context is captured
        assert!(analysis.context_awareness.temporal_context.time_of_day < 24);
        assert!(analysis.context_awareness.temporal_context.day_of_week < 7);
    }
}
