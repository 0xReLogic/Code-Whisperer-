use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc::INIT;

// This is like the `main` function, except for JavaScript.
#[wasm_bindgen(start)]
pub fn main() {
    // This provides better error messages in debug mode.
    // It's disabled in release mode so it doesn't bloat up the file size.
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

// Macro for console logging
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Module declarations
mod ast_parser;
mod pattern_extractor;
mod style_analyzer;
mod function_signature_detector;

// Re-export for easier access
pub use ast_parser::AstParser;
pub use pattern_extractor::{PatternExtractor, PatternAnalysis, StyleMetrics, NamingConventions, StructurePatterns};
pub use style_analyzer::{CodingStyleAnalyzer, DetailedStyleAnalysis};
pub use function_signature_detector::{FunctionSignatureDetector, FunctionSignatureAnalysis, FunctionPattern};

// Core data structures for Code Whisperer

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum PatternType {
    FunctionDefinition,
    ClassDefinition,
    LoopConstruct,
    ConditionalStatement,
    VariableDeclaration,
    ImportStatement,
    VariableNaming,
    FunctionNaming,
    ClassNaming,
    ConstantNaming,
    IndentationStyle,
    BraceStyle,
    CommentStyle,
    DocumentationStyle,
    ExceptionHandling,
    ErrorChecking,
    ResourceManagement,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceLocation {
    pub file: String,
    pub start_line: u32,
    pub start_column: u32,
    pub end_line: u32,
    pub end_column: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AstNode {
    pub node_type: String,
    pub properties: HashMap<String, serde_json::Value>,
    pub children: Vec<AstNode>,
    pub location: SourceLocation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariableInfo {
    pub name: String,
    pub var_type: Option<String>,
    pub possible_values: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PatternContent {
    Ast {
        nodes: Vec<AstNode>,
        variables: HashMap<String, VariableInfo>,
    },
    Tokens {
        tokens: Vec<String>,
        metadata: HashMap<usize, String>,
    },
    String {
        pattern: String,
        placeholders: Vec<String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FeedbackType {
    Accepted,
    Rejected,
    Modified,
    Ignored,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternFeedback {
    pub timestamp: String, // ISO 8601 format
    pub feedback_type: FeedbackType,
    pub comments: Option<String>,
}

#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodingPattern {
    id: String,
    pattern_type: PatternType,
    language: String,
    content: PatternContent,
    confidence: f64,
    frequency: u32,
    last_seen: String,
    source_files: Vec<String>,
    user_feedback: Vec<PatternFeedback>,
}

#[wasm_bindgen]
impl CodingPattern {
    #[wasm_bindgen(constructor)]
    pub fn new(id: String, pattern_type_str: String, language: String, confidence: f64) -> CodingPattern {
        let pattern_type = match pattern_type_str.as_str() {
            "function_definition" => PatternType::FunctionDefinition,
            "class_definition" => PatternType::ClassDefinition,
            "loop_construct" => PatternType::LoopConstruct,
            "conditional_statement" => PatternType::ConditionalStatement,
            "variable_declaration" => PatternType::VariableDeclaration,
            _ => PatternType::Custom(pattern_type_str),
        };

        CodingPattern {
            id,
            pattern_type,
            language,
            content: PatternContent::String {
                pattern: "".to_string(),
                placeholders: vec![],
            },
            confidence,
            frequency: 1,
            last_seen: {
                #[cfg(target_arch = "wasm32")]
                {
                    js_sys::Date::now().to_string()
                }
                #[cfg(not(target_arch = "wasm32"))]
                {
                    std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_millis()
                        .to_string()
                }
            },
            source_files: vec![],
            user_feedback: vec![],
        }
    }

    #[wasm_bindgen(getter)]
    pub fn id(&self) -> String {
        self.id.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn pattern_type(&self) -> String {
        match &self.pattern_type {
            PatternType::FunctionDefinition => "function_definition".to_string(),
            PatternType::ClassDefinition => "class_definition".to_string(),
            PatternType::LoopConstruct => "loop_construct".to_string(),
            PatternType::ConditionalStatement => "conditional_statement".to_string(),
            PatternType::VariableDeclaration => "variable_declaration".to_string(),
            PatternType::Custom(s) => s.clone(),
            _ => "unknown".to_string(),
        }
    }

    #[wasm_bindgen(getter)]
    pub fn language(&self) -> String {
        self.language.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn confidence(&self) -> f64 {
        self.confidence
    }

    #[wasm_bindgen(getter)]
    pub fn frequency(&self) -> u32 {
        self.frequency
    }

    #[wasm_bindgen]
    pub fn add_source_file(&mut self, file: String) {
        if !self.source_files.contains(&file) {
            self.source_files.push(file);
        }
    }

    #[wasm_bindgen]
    pub fn get_source_files(&self) -> Vec<String> {
        self.source_files.clone()
    }

    #[wasm_bindgen]
    pub fn add_feedback(&mut self, feedback_type_str: String, comments: Option<String>) {
        let feedback_type = match feedback_type_str.as_str() {
            "accepted" => FeedbackType::Accepted,
            "rejected" => FeedbackType::Rejected,
            "modified" => FeedbackType::Modified,
            _ => FeedbackType::Ignored,
        };

        self.user_feedback.push(PatternFeedback {
            timestamp: js_sys::Date::now().to_string(),
            feedback_type,
            comments,
        });
    }

    #[wasm_bindgen]
    pub fn get_feedback_count(&self) -> usize {
        self.user_feedback.len()
    }
}

#[wasm_bindgen]
pub struct PatternAnalyzer {
    patterns: Vec<CodingPattern>,
    language_stats: HashMap<String, u32>,
    ast_parser: AstParser,
}

#[wasm_bindgen]
impl PatternAnalyzer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> PatternAnalyzer {
        console_log!("Pattern Analyzer initialized with enhanced AST parsing capabilities");
        PatternAnalyzer {
            patterns: Vec::new(),
            language_stats: HashMap::new(),
            ast_parser: AstParser::new(),
        }
    }

    #[wasm_bindgen]
    pub fn analyze_code(&mut self, code: &str, language: &str) -> Vec<CodingPattern> {
        console_log!("Analyzing {} characters of {} code using AST parser", code.len(), language);

        let mut detected_patterns = Vec::new();

        // Update language statistics
        *self.language_stats.entry(language.to_string()).or_insert(0) += 1;

        // Try AST-based parsing first
        match self.ast_parser.parse_code(code, language) {
            Ok(ast) => {
                console_log!("Successfully parsed {} code with AST", language);
                let ast_patterns = self.ast_parser.extract_patterns(&ast, language);
                detected_patterns.extend(ast_patterns);
            }
            Err(err) => {
                console_log!("AST parsing failed for {}: {}, falling back to regex", language, err);
                // Fallback to regex-based parsing
                detected_patterns.extend(self.analyze_with_regex(code, language));
            }
        }

        // Add detected patterns to our collection
        for pattern in &detected_patterns {
            self.patterns.push(pattern.clone());
        }

        console_log!("Detected {} patterns", detected_patterns.len());
        detected_patterns
    }

    fn analyze_with_regex(&self, code: &str, language: &str) -> Vec<CodingPattern> {
        let mut patterns = Vec::new();

        match language.to_lowercase().as_str() {
            "javascript" | "typescript" => {
                patterns.extend(self.analyze_javascript_regex(code));
            },
            "python" => {
                patterns.extend(self.analyze_python_regex(code));
            },
            "rust" => {
                patterns.extend(self.analyze_rust_regex(code));
            },
            _ => {
                patterns.extend(self.analyze_generic_regex(code));
            }
        }

        patterns
    }

    fn analyze_javascript_regex(&self, code: &str) -> Vec<CodingPattern> {
        let mut patterns = Vec::new();

        // Function patterns
        if code.contains("function") || code.contains("=>") {
            let pattern = CodingPattern::new(
                format!("js_func_{}", js_sys::Date::now() as u64),
                "function_definition".to_string(),
                "javascript".to_string(),
                0.8,
            );
            patterns.push(pattern);
        }

        // Variable patterns
        if code.contains("const ") || code.contains("let ") || code.contains("var ") {
            let pattern = CodingPattern::new(
                format!("js_var_{}", js_sys::Date::now() as u64),
                "variable_declaration".to_string(),
                "javascript".to_string(),
                0.6,
            );
            patterns.push(pattern);
        }

        // Class patterns
        if code.contains("class ") {
            let pattern = CodingPattern::new(
                format!("js_class_{}", js_sys::Date::now() as u64),
                "class_definition".to_string(),
                "javascript".to_string(),
                0.7,
            );
            patterns.push(pattern);
        }

        patterns
    }

    fn analyze_python_regex(&self, code: &str) -> Vec<CodingPattern> {
        let mut patterns = Vec::new();

        if code.contains("def ") {
            let pattern = CodingPattern::new(
                format!("py_func_{}", js_sys::Date::now() as u64),
                "function_definition".to_string(),
                "python".to_string(),
                0.8,
            );
            patterns.push(pattern);
        }

        if code.contains("class ") {
            let pattern = CodingPattern::new(
                format!("py_class_{}", js_sys::Date::now() as u64),
                "class_definition".to_string(),
                "python".to_string(),
                0.7,
            );
            patterns.push(pattern);
        }

        patterns
    }

    fn analyze_rust_regex(&self, code: &str) -> Vec<CodingPattern> {
        let mut patterns = Vec::new();

        if code.contains("fn ") {
            let pattern = CodingPattern::new(
                format!("rs_func_{}", js_sys::Date::now() as u64),
                "function_definition".to_string(),
                "rust".to_string(),
                0.8,
            );
            patterns.push(pattern);
        }

        if code.contains("struct ") {
            let pattern = CodingPattern::new(
                format!("rs_struct_{}", js_sys::Date::now() as u64),
                "class_definition".to_string(),
                "rust".to_string(),
                0.7,
            );
            patterns.push(pattern);
        }

        patterns
    }

    fn analyze_generic_regex(&self, code: &str) -> Vec<CodingPattern> {
        let mut patterns = Vec::new();

        // Generic pattern detection
        if code.contains("function") || code.contains("def ") || code.contains("fn ") {
            let pattern = CodingPattern::new(
                format!("gen_func_{}", js_sys::Date::now() as u64),
                "function_definition".to_string(),
                "generic".to_string(),
                0.5,
            );
            patterns.push(pattern);
        }

        patterns
    }

    #[wasm_bindgen]
    pub fn get_pattern_count(&self) -> usize {
        self.patterns.len()
    }

    #[wasm_bindgen]
    pub fn get_patterns(&self) -> Vec<CodingPattern> {
        self.patterns.clone()
    }

    #[wasm_bindgen]
    pub fn get_language_stats(&self) -> String {
        serde_json::to_string(&self.language_stats).unwrap_or("{}".to_string())
    }

    #[wasm_bindgen]
    pub fn get_patterns_by_language(&self, language: &str) -> Vec<CodingPattern> {
        self.patterns
            .iter()
            .filter(|p| p.language == language)
            .cloned()
            .collect()
    }

    #[wasm_bindgen]
    pub fn get_patterns_by_type(&self, pattern_type: &str) -> Vec<CodingPattern> {
        self.patterns
            .iter()
            .filter(|p| p.pattern_type() == pattern_type)
            .cloned()
            .collect()
    }

    #[wasm_bindgen]
    pub fn get_top_patterns(&self, limit: usize) -> Vec<CodingPattern> {
        let mut sorted_patterns = self.patterns.clone();
        sorted_patterns.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
        sorted_patterns.into_iter().take(limit).collect()
    }
}
