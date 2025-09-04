use wasm_bindgen::prelude::*;
use std::time::Instant;
use crate::{
    ast_parser::AstParser,
    pattern_extractor::PatternExtractor,
    user_behavior_tracker::UserBehaviorTracker,
    pattern_scoring_engine::{PatternScoringEngine, ScoringContext},
    suggestion_generation_engine::SuggestionGenerationEngine,
    context_aware_filter::{ContextAwareFilter, CodingContext},
    wasm_serializer::{WasmSerializer, SerializableAnalysisResult, ComprehensiveAnalysis},
    local_storage_manager::LocalStorageManager,
};

/// Main WASM interface for Code Whisperer engine
#[wasm_bindgen]
pub struct CodeWhispererEngine {
    ast_parser: AstParser,
    pattern_extractor: PatternExtractor,
    behavior_tracker: UserBehaviorTracker,
    scoring_engine: PatternScoringEngine,
    suggestion_engine: SuggestionGenerationEngine,
    filter: ContextAwareFilter,
    storage_manager: LocalStorageManager,
}

/// Configuration for the Code Whisperer engine
#[wasm_bindgen]
pub struct EngineConfig {
    enable_learning: bool,
    enable_storage: bool,
    max_suggestions: usize,
    confidence_threshold: f32,
    enable_context_filtering: bool,
}

/// Context information from the editor
#[wasm_bindgen]
pub struct EditorContext {
    file_path: String,
    language: String,
    cursor_position: u32,
    selected_text: Option<String>,
    surrounding_context: Option<String>,
    project_type: Option<String>,
}

#[wasm_bindgen]
impl EngineConfig {
    #[wasm_bindgen(constructor)]
    pub fn new() -> EngineConfig {
        EngineConfig {
            enable_learning: true,
            enable_storage: true,
            max_suggestions: 10,
            confidence_threshold: 0.6,
            enable_context_filtering: true,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn enable_learning(&self) -> bool {
        self.enable_learning
    }

    #[wasm_bindgen(setter)]
    pub fn set_enable_learning(&mut self, value: bool) {
        self.enable_learning = value;
    }

    #[wasm_bindgen(getter)]
    pub fn enable_storage(&self) -> bool {
        self.enable_storage
    }

    #[wasm_bindgen(setter)]
    pub fn set_enable_storage(&mut self, value: bool) {
        self.enable_storage = value;
    }

    #[wasm_bindgen(getter)]
    pub fn max_suggestions(&self) -> usize {
        self.max_suggestions
    }

    #[wasm_bindgen(setter)]
    pub fn set_max_suggestions(&mut self, value: usize) {
        self.max_suggestions = value;
    }

    #[wasm_bindgen(getter)]
    pub fn confidence_threshold(&self) -> f32 {
        self.confidence_threshold
    }

    #[wasm_bindgen(setter)]
    pub fn set_confidence_threshold(&mut self, value: f32) {
        self.confidence_threshold = value;
    }

    #[wasm_bindgen(getter)]
    pub fn enable_context_filtering(&self) -> bool {
        self.enable_context_filtering
    }

    #[wasm_bindgen(setter)]
    pub fn set_enable_context_filtering(&mut self, value: bool) {
        self.enable_context_filtering = value;
    }
}

#[wasm_bindgen]
impl EditorContext {
    #[wasm_bindgen(constructor)]
    pub fn new(
        file_path: String,
        language: String,
        cursor_position: u32,
    ) -> EditorContext {
        EditorContext {
            file_path,
            language,
            cursor_position,
            selected_text: None,
            surrounding_context: None,
            project_type: None,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn file_path(&self) -> String {
        self.file_path.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_file_path(&mut self, value: String) {
        self.file_path = value;
    }

    #[wasm_bindgen(getter)]
    pub fn language(&self) -> String {
        self.language.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_language(&mut self, value: String) {
        self.language = value;
    }

    #[wasm_bindgen(getter)]
    pub fn cursor_position(&self) -> u32 {
        self.cursor_position
    }

    #[wasm_bindgen(setter)]
    pub fn set_cursor_position(&mut self, value: u32) {
        self.cursor_position = value;
    }

    #[wasm_bindgen(getter)]
    pub fn selected_text(&self) -> Option<String> {
        self.selected_text.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_selected_text(&mut self, value: Option<String>) {
        self.selected_text = value;
    }

    #[wasm_bindgen(getter)]
    pub fn surrounding_context(&self) -> Option<String> {
        self.surrounding_context.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_surrounding_context(&mut self, value: Option<String>) {
        self.surrounding_context = value;
    }

    #[wasm_bindgen(getter)]
    pub fn project_type(&self) -> Option<String> {
        self.project_type.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_project_type(&mut self, value: Option<String>) {
        self.project_type = value;
    }
}

#[wasm_bindgen]
impl CodeWhispererEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(config: &EngineConfig) -> Result<CodeWhispererEngine, JsValue> {
        // Initialize console logging for debugging
        #[cfg(feature = "console_error_panic_hook")]
        console_error_panic_hook::set_once();

        Ok(CodeWhispererEngine {
            ast_parser: AstParser::new(),
            pattern_extractor: PatternExtractor::new(),
            behavior_tracker: UserBehaviorTracker::new(),
            scoring_engine: PatternScoringEngine::new(),
            suggestion_engine: SuggestionGenerationEngine::new(),
            filter: ContextAwareFilter::new(),
            storage_manager: LocalStorageManager::new()
                .map_err(|e| JsValue::from_str(&format!("Storage initialization error: {}", e)))?,
        })
    }

    /// Analyze code and generate suggestions
    #[wasm_bindgen]
    pub fn analyze_and_suggest(
        &mut self,
        code: &str,
        editor_context: &EditorContext,
        config: &EngineConfig,
    ) -> SerializableAnalysisResult {
        let start_time = Instant::now();

        // Step 1: Parse the code
        let ast_result = match self.ast_parser.parse_code(code, &editor_context.language()) {
            Ok(ast) => ast,
            Err(e) => {
                return WasmSerializer::create_analysis_result(
                    None,
                    start_time.elapsed().as_millis() as u64,
                    &editor_context.language(),
                    code.len(),
                    Some(format!("AST parsing failed: {}", e)),
                );
            }
        };

        // Step 2: Extract patterns
        let pattern_analysis = match self.pattern_extractor.analyze_patterns(&ast_result, &editor_context.language()) {
            Ok(analysis) => analysis,
            Err(e) => {
                return WasmSerializer::create_analysis_result(
                    None,
                    start_time.elapsed().as_millis() as u64,
                    &editor_context.language(),
                    code.len(),
                    Some(format!("Pattern extraction failed: {}", e)),
                );
            }
        };

        // Step 3: Get user behavior data (if learning is enabled)
        let behavior_analysis = if config.enable_learning() {
            match self.behavior_tracker.analyze_behavior() {
                Ok(analysis) => analysis,
                Err(_) => {
                    // Continue with default behavior if tracking fails
                    Default::default()
                }
            }
        } else {
            Default::default()
        };

        // Step 4: Score patterns
        let scoring_context = ScoringContext {
            current_file_type: editor_context.language(),
            current_function_context: editor_context.surrounding_context(),
            recent_patterns: vec![], // TODO: Implement recent patterns tracking
            time_of_day: chrono::Utc::now().timestamp(),
            project_context: editor_context.project_type().unwrap_or_default(),
            user_session_data: None, // TODO: Get from behavior tracker
        };

        let scoring_result = match self.scoring_engine.score_patterns(
            &pattern_analysis,
            &behavior_analysis,
            &scoring_context,
        ) {
            Ok(result) => result,
            Err(e) => {
                return WasmSerializer::create_analysis_result(
                    None,
                    start_time.elapsed().as_millis() as u64,
                    &editor_context.language(),
                    code.len(),
                    Some(format!("Pattern scoring failed: {}", e)),
                );
            }
        };

        // Step 5: Generate suggestions
        let suggestion_result = match self.suggestion_engine.generate_suggestions(
            &pattern_analysis,
            &scoring_result,
            &behavior_analysis,
            code,
            editor_context.cursor_position() as usize,
        ) {
            Ok(result) => result,
            Err(e) => {
                return WasmSerializer::create_analysis_result(
                    None,
                    start_time.elapsed().as_millis() as u64,
                    &editor_context.language(),
                    code.len(),
                    Some(format!("Suggestion generation failed: {}", e)),
                );
            }
        };

        // Step 6: Filter suggestions (if context filtering is enabled)
        let filtered_suggestions = if config.enable_context_filtering() {
            let coding_context = CodingContext {
                file_path: editor_context.file_path(),
                file_language: editor_context.language(),
                file_content: code.to_string(),
                current_line: editor_context.surrounding_context().unwrap_or_default(),
            };

            match self.filter.filter_suggestions(
                suggestion_result.suggestions.clone(),
                &coding_context,
                &behavior_analysis,
                &pattern_analysis,
            ) {
                Ok(filtered) => Some(filtered),
                Err(_) => {
                    // Fall back to unfiltered suggestions if filtering fails
                    None
                }
            }
        } else {
            None
        };

        // Step 7: Store learned patterns (if storage is enabled)
        if config.enable_storage() {
            // TODO: Implement pattern storage
            let _ = self.storage_manager.store_user_patterns("default_user", &Default::default());
        }

        // Step 8: Create comprehensive analysis
        let suggestions_to_use = filtered_suggestions
            .as_ref()
            .map(|f| &f.suggestions)
            .unwrap_or(&suggestion_result.suggestions);

        let comprehensive_analysis = WasmSerializer::create_comprehensive_analysis(
            Some(&pattern_analysis),
            Some(&scoring_result),
            Some(suggestions_to_use),
        );

        // Step 9: Return serialized result
        WasmSerializer::create_analysis_result(
            Some(comprehensive_analysis),
            start_time.elapsed().as_millis() as u64,
            &editor_context.language(),
            code.len(),
            None,
        )
    }

    /// Provide feedback on a suggestion to improve learning
    #[wasm_bindgen]
    pub fn provide_feedback(
        &mut self,
        suggestion_id: &str,
        accepted: bool,
        user_context: Option<String>,
    ) -> bool {
        // Record user feedback for learning
        match self.behavior_tracker.record_suggestion_feedback(suggestion_id, accepted, user_context) {
            Ok(_) => true,
            Err(_) => false,
        }
    }

    /// Get analysis statistics
    #[wasm_bindgen]
    pub fn get_statistics(&self) -> String {
        // TODO: Implement comprehensive statistics
        serde_json::to_string(&serde_json::json!({
            "patterns_analyzed": 0,
            "suggestions_generated": 0,
            "user_feedback_count": 0,
            "learning_progress": 0.0
        })).unwrap_or_default()
    }

    /// Clear stored user data
    #[wasm_bindgen]
    pub fn clear_user_data(&mut self, user_id: &str) -> bool {
        match self.storage_manager.clear_user_data(user_id) {
            Ok(_) => true,
            Err(_) => false,
        }
    }

    /// Export user patterns for backup
    #[wasm_bindgen]
    pub fn export_user_patterns(&self, user_id: &str) -> Option<String> {
        match self.storage_manager.export_user_data(user_id) {
            Ok(data) => Some(data),
            Err(_) => None,
        }
    }

    /// Import user patterns from backup
    #[wasm_bindgen]
    pub fn import_user_patterns(&mut self, user_id: &str, data: &str) -> bool {
        match self.storage_manager.import_user_data(user_id, data) {
            Ok(_) => true,
            Err(_) => false,
        }
    }

    /// Update engine configuration
    #[wasm_bindgen]
    pub fn update_config(&mut self, config: &EngineConfig) {
        // TODO: Apply configuration changes to components
        web_sys::console::log_1(&format!("Configuration updated: learning={}, storage={}", 
            config.enable_learning(), config.enable_storage()).into());
    }

    /// Get engine version information
    #[wasm_bindgen]
    pub fn get_version() -> String {
        env!("CARGO_PKG_VERSION").to_string()
    }

    /// Get supported languages
    #[wasm_bindgen]
    pub fn get_supported_languages() -> Vec<String> {
        vec![
            "javascript".to_string(),
            "typescript".to_string(),
            "python".to_string(),
            "rust".to_string(),
        ]
    }

    /// Check if a language is supported
    #[wasm_bindgen]
    pub fn is_language_supported(language: &str) -> bool {
        matches!(language.to_lowercase().as_str(), "javascript" | "typescript" | "python" | "rust")
    }
}

/// Initialize the WASM module with default settings
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();

    web_sys::console::log_1(&"Code Whisperer WASM module initialized".into());
}

/// Create a default engine configuration
#[wasm_bindgen]
pub fn create_default_config() -> EngineConfig {
    EngineConfig::new()
}

/// Utility function to validate code syntax
#[wasm_bindgen]
pub fn validate_syntax(code: &str, language: &str) -> String {
    let mut parser = AstParser::new();
    match parser.parse_code(code, language) {
        Ok(_) => serde_json::to_string(&serde_json::json!({
            "valid": true,
            "message": "Syntax is valid"
        })).unwrap_or_default(),
        Err(e) => serde_json::to_string(&serde_json::json!({
            "valid": false,
            "message": format!("Syntax error: {}", e)
        })).unwrap_or_default(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_creation() {
        let config = EngineConfig::new();
        let engine = CodeWhispererEngine::new(&config);
        assert!(engine.is_ok());
    }

    #[test]
    fn test_config_defaults() {
        let config = EngineConfig::new();
        assert!(config.enable_learning());
        assert!(config.enable_storage());
        assert_eq!(config.max_suggestions(), 10);
        assert_eq!(config.confidence_threshold(), 0.6);
        assert!(config.enable_context_filtering());
    }

    #[test]
    fn test_editor_context_creation() {
        let context = EditorContext::new(
            "test.js".to_string(),
            "javascript".to_string(),
            100,
        );
        assert_eq!(context.file_path(), "test.js");
        assert_eq!(context.language(), "javascript");
        assert_eq!(context.cursor_position(), 100);
    }

    #[test]
    fn test_language_support() {
        assert!(CodeWhispererEngine::is_language_supported("javascript"));
        assert!(CodeWhispererEngine::is_language_supported("typescript"));
        assert!(CodeWhispererEngine::is_language_supported("python"));
        assert!(CodeWhispererEngine::is_language_supported("rust"));
        assert!(!CodeWhispererEngine::is_language_supported("unsupported"));
    }

    #[test]
    fn test_version_info() {
        let version = CodeWhispererEngine::get_version();
        assert!(!version.is_empty());
    }
}
