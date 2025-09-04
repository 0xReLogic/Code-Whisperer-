use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

// Import from other modules (simplified for now)
use crate::{
    pattern_extractor::PatternAnalysis,
    pattern_scoring_engine::{ScoringResult, PatternScore},
    suggestion_generation_engine::{SuggestionResult, CodeSuggestion},
};

/// WebAssembly bindings and serialization module for efficient JS-WASM communication
pub struct WasmSerializer;

/// Serializable metadata for analysis results
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SerializableMetadata {
    pub processing_time_ms: u64,
    pub language: String,
    pub code_length: usize,
    pub patterns_found: usize,
    pub suggestions_generated: usize,
    pub confidence_score: f32,
}

/// Main serializable analysis result for WASM export
#[wasm_bindgen]
pub struct SerializableAnalysisResult {
    success: bool,
    error_message: Option<String>,
    analysis_data: Option<String>, // JSON-serialized analysis data
    suggestions_data: Option<String>, // JSON-serialized suggestions
    metadata_json: String, // JSON-serialized metadata
}

#[wasm_bindgen]
impl SerializableAnalysisResult {
    #[wasm_bindgen(constructor)]
    pub fn new(
        success: bool,
        error_message: Option<String>,
        analysis_data: Option<String>,
        suggestions_data: Option<String>,
        metadata_json: String,
    ) -> SerializableAnalysisResult {
        SerializableAnalysisResult {
            success,
            error_message,
            analysis_data,
            suggestions_data,
            metadata_json,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn success(&self) -> bool {
        self.success
    }

    #[wasm_bindgen(getter)]
    pub fn error_message(&self) -> Option<String> {
        self.error_message.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn analysis_data(&self) -> Option<String> {
        self.analysis_data.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn suggestions_data(&self) -> Option<String> {
        self.suggestions_data.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn metadata_json(&self) -> String {
        self.metadata_json.clone()
    }

    #[wasm_bindgen]
    pub fn has_error(&self) -> bool {
        self.error_message.is_some()
    }

    #[wasm_bindgen]
    pub fn has_analysis(&self) -> bool {
        self.analysis_data.is_some()
    }

    #[wasm_bindgen]
    pub fn has_suggestions(&self) -> bool {
        self.suggestions_data.is_some()
    }
}

/// Comprehensive analysis result that combines all analysis types
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ComprehensiveAnalysis {
    pub patterns: Option<PatternAnalysis>,
    pub scoring: Option<ScoringResult>,
    pub suggestions: Option<Vec<CodeSuggestion>>,
    pub metadata: SerializableMetadata,
}

/// Serializable suggestion for JavaScript consumption
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SerializableSuggestion {
    pub id: String,
    pub suggestion_type: String,
    pub content: String,
    pub description: String,
    pub confidence: f32,
    pub context_score: f32,
    pub metadata: HashMap<String, String>,
}

impl WasmSerializer {
    /// Create a serializable analysis result with error handling
    pub fn create_analysis_result(
        comprehensive_analysis: Option<ComprehensiveAnalysis>,
        processing_time_ms: u64,
        language: &str,
        code_length: usize,
        error_message: Option<String>,
    ) -> SerializableAnalysisResult {
        let metadata = SerializableMetadata {
            processing_time_ms,
            language: language.to_string(),
            code_length,
            patterns_found: comprehensive_analysis
                .as_ref()
                .and_then(|a| a.patterns.as_ref())
                .map(|p| p.patterns.len())
                .unwrap_or(0),
            suggestions_generated: comprehensive_analysis
                .as_ref()
                .and_then(|a| a.suggestions.as_ref())
                .map(|s| s.len())
                .unwrap_or(0),
            confidence_score: comprehensive_analysis
                .as_ref()
                .and_then(|a| a.suggestions.as_ref())
                .map(|suggestions| {
                    if suggestions.is_empty() {
                        0.0
                    } else {
                        suggestions.iter().map(|s| s.confidence_score).sum::<f32>() / suggestions.len() as f32
                    }
                })
                .unwrap_or(0.0),
        };

        let metadata_json = serde_json::to_string(&metadata).unwrap_or_default();

        let analysis_data = comprehensive_analysis
            .as_ref()
            .and_then(|analysis| serde_json::to_string(analysis).ok());

        let suggestions_data = comprehensive_analysis
            .as_ref()
            .and_then(|analysis| analysis.suggestions.as_ref())
            .and_then(|suggestions| {
                let serializable_suggestions: Vec<SerializableSuggestion> = suggestions
                    .iter()
                    .map(|s| SerializableSuggestion {
                        id: s.id.clone(),
                        suggestion_type: format!("{:?}", s.suggestion_type),
                        content: s.suggested_code.clone(),
                        description: s.description.clone(),
                        confidence: s.confidence_score,
                        context_score: s.context_relevance,
                        metadata: {
                            let mut map = HashMap::new();
                            map.insert("reasoning".to_string(), s.reasoning.clone());
                            map
                        },
                    })
                    .collect();
                serde_json::to_string(&serializable_suggestions).ok()
            });

        SerializableAnalysisResult::new(
            error_message.is_none(),
            error_message,
            analysis_data,
            suggestions_data,
            metadata_json,
        )
    }

    /// Create a comprehensive analysis from individual components
    pub fn create_comprehensive_analysis(
        patterns: Option<&PatternAnalysis>,
        scoring: Option<&ScoringResult>,
        suggestions: Option<&Vec<CodeSuggestion>>,
    ) -> ComprehensiveAnalysis {
        let metadata = SerializableMetadata {
            processing_time_ms: 0, // Will be set by the caller
            language: "unknown".to_string(), // Will be set by the caller
            code_length: 0, // Will be set by the caller
            patterns_found: patterns
                .map(|p| p.patterns.len())
                .unwrap_or(0),
            suggestions_generated: suggestions.map(|s| s.len()).unwrap_or(0),
            confidence_score: suggestions
                .map(|suggestions| {
                    if suggestions.is_empty() {
                        0.0
                    } else {
                        suggestions.iter().map(|s| s.confidence_score).sum::<f32>() / suggestions.len() as f32
                    }
                })
                .unwrap_or(0.0),
        };

        ComprehensiveAnalysis {
            patterns: patterns.cloned(),
            scoring: scoring.cloned(),
            suggestions: suggestions.cloned(),
            metadata,
        }
    }
}

/// Utility functions for WASM integration
#[wasm_bindgen]
pub fn serialize_json(data: &str) -> Result<String, JsValue> {
    // Validate and re-serialize JSON to ensure it's properly formatted
    match serde_json::from_str::<serde_json::Value>(data) {
        Ok(value) => serde_json::to_string(&value)
            .map_err(|e| JsValue::from_str(&format!("JSON serialization error: {}", e))),
        Err(e) => Err(JsValue::from_str(&format!("JSON parsing error: {}", e))),
    }
}

/// Validate JSON structure for WASM compatibility
#[wasm_bindgen]
pub fn validate_json_structure(data: &str) -> bool {
    serde_json::from_str::<serde_json::Value>(data).is_ok()
}
