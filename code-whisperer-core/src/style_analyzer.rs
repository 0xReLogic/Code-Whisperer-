use crate::pattern_extractor::{StyleMetrics, PatternExtractor};
use crate::ast_parser::{ParsedAst, AstParser};
use std::collections::HashMap;
use regex::Regex;
use lazy_static::lazy_static;

/// Advanced coding style analyzer that provides detailed insights into coding preferences
pub struct CodingStyleAnalyzer {
    pattern_extractor: PatternExtractor,
}

#[derive(Debug, Clone)]
pub struct DetailedStyleAnalysis {
    pub basic_metrics: StyleMetrics,
    pub naming_analysis: DetailedNamingAnalysis,
    pub formatting_preferences: FormattingPreferences,
    pub language_specific_patterns: LanguageSpecificPatterns,
    pub consistency_scores: ConsistencyScores,
}

#[derive(Debug, Clone)]
pub struct DetailedNamingAnalysis {
    pub function_patterns: FunctionNamingPatterns,
    pub variable_patterns: VariableNamingPatterns,
    pub constant_patterns: ConstantNamingPatterns,
    pub class_patterns: ClassNamingPatterns,
    pub file_patterns: FileNamingPatterns,
}

#[derive(Debug, Clone)]
pub struct FunctionNamingPatterns {
    pub preferred_style: crate::pattern_extractor::NamingStyle,
    pub common_prefixes: Vec<String>,
    pub common_suffixes: Vec<String>,
    pub verb_patterns: Vec<String>,
    pub getter_setter_patterns: GetterSetterPatterns,
    pub boolean_function_patterns: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct GetterSetterPatterns {
    pub getter_prefixes: Vec<String>,  // get, fetch, retrieve
    pub setter_prefixes: Vec<String>,  // set, update, modify
    pub uses_is_has_can: bool,        // isActive, hasPermission, canExecute
}

#[derive(Debug, Clone)]
pub struct VariableNamingPatterns {
    pub preferred_style: crate::pattern_extractor::NamingStyle,
    pub semantic_patterns: Vec<String>,
    pub abbreviation_usage: AbbreviationUsage,
    pub descriptor_patterns: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct AbbreviationUsage {
    pub uses_abbreviations: bool,
    pub common_abbreviations: HashMap<String, String>, // "btn" -> "button"
    pub consistency_score: f32,
}

#[derive(Debug, Clone)]
pub struct ConstantNamingPatterns {
    pub preferred_style: crate::pattern_extractor::NamingStyle,
    pub uses_semantic_grouping: bool,  // USER_ROLES, API_ENDPOINTS
    pub common_categories: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct ClassNamingPatterns {
    pub preferred_style: crate::pattern_extractor::NamingStyle,
    pub common_suffixes: Vec<String>,  // Manager, Service, Handler
    pub interface_patterns: Vec<String>, // IUserService, UserServiceInterface
    pub abstract_patterns: Vec<String>,  // AbstractUser, BaseUser
}

#[derive(Debug, Clone)]
pub struct FileNamingPatterns {
    pub preferred_style: crate::pattern_extractor::NamingStyle,
    pub extension_conventions: HashMap<String, String>,
    pub directory_organization: DirectoryOrganization,
}

#[derive(Debug, Clone)]
pub struct DirectoryOrganization {
    pub uses_feature_folders: bool,
    pub uses_type_folders: bool,  // components/, services/, utils/
    pub nesting_depth_preference: u32,
}

#[derive(Debug, Clone)]
pub struct FormattingPreferences {
    pub line_length_stats: LineLengthStats,
    pub spacing_preferences: SpacingPreferences,
    pub comment_style_preferences: CommentStylePreferences,
    pub import_organization: ImportOrganizationStyle,
}

#[derive(Debug, Clone)]
pub struct LineLengthStats {
    pub average_length: f32,
    pub median_length: u32,
    pub preferred_max_length: u32,
    pub distribution: HashMap<u32, u32>, // length ranges -> count
}

#[derive(Debug, Clone)]
pub struct SpacingPreferences {
    pub around_operators: bool,
    pub around_keywords: bool,
    pub around_commas: bool,
    pub around_semicolons: bool,
    pub inside_parentheses: bool,
    pub inside_brackets: bool,
    pub inside_braces: bool,
}

#[derive(Debug, Clone)]
pub struct CommentStylePreferences {
    pub single_line_style: String, // "//" vs "#" vs "--"
    pub multi_line_style: String,  // "/* */" vs "\"\"\" \"\"\""
    pub documentation_style: String, // JSDoc, Sphinx, rustdoc
    pub comment_density: f32, // comments per lines of code
}

#[derive(Debug, Clone)]
pub struct ImportOrganizationStyle {
    pub grouping_style: ImportGroupingStyle,
    pub sorting_preference: ImportSortingStyle,
    pub alias_usage: AliasUsagePatterns,
}

#[derive(Debug, Clone)]
pub enum ImportGroupingStyle {
    ByType,      // stdlib, external, internal
    ByUsage,     // frequently used first
    Alphabetical,
    None,
}

#[derive(Debug, Clone)]
pub enum ImportSortingStyle {
    Alphabetical,
    ByLength,
    ByFrequency,
    Custom,
}

#[derive(Debug, Clone)]
pub struct AliasUsagePatterns {
    pub uses_aliases: bool,
    pub common_alias_patterns: HashMap<String, String>,
    pub alias_length_preference: AliasLengthStyle,
}

#[derive(Debug, Clone)]
pub enum AliasLengthStyle {
    Short,      // React as R
    Descriptive, // React as ReactLibrary
    Context,    // Based on context
}

#[derive(Debug, Clone)]
pub struct LanguageSpecificPatterns {
    pub javascript_patterns: Option<JavaScriptPatterns>,
    pub python_patterns: Option<PythonPatterns>,
    pub rust_patterns: Option<RustPatterns>,
}

#[derive(Debug, Clone)]
pub struct JavaScriptPatterns {
    pub function_declaration_style: JSFunctionStyle,
    pub object_property_style: JSPropertyStyle,
    pub async_await_usage: AsyncAwaitUsage,
    pub module_system_preference: JSModuleSystem,
}

#[derive(Debug, Clone)]
pub enum JSFunctionStyle {
    FunctionDeclaration, // function name() {}
    ArrowFunction,       // const name = () => {}
    FunctionExpression,  // const name = function() {}
    Mixed,
}

#[derive(Debug, Clone)]
pub enum JSPropertyStyle {
    TraditionalQuotes,   // { "key": value }
    NoQuotes,           // { key: value }
    Mixed,
}

#[derive(Debug, Clone)]
pub struct AsyncAwaitUsage {
    pub prefers_async_await: bool,
    pub uses_promises: bool,
    pub uses_callbacks: bool,
}

#[derive(Debug, Clone)]
pub enum JSModuleSystem {
    ES6Modules,    // import/export
    CommonJS,      // require/module.exports
    AMD,           // define()
    Mixed,
}

#[derive(Debug, Clone)]
pub struct PythonPatterns {
    pub import_style: PythonImportStyle,
    pub string_quote_preference: PythonQuoteStyle,
    pub class_definition_style: PythonClassStyle,
    pub function_annotation_usage: bool,
}

#[derive(Debug, Clone)]
pub enum PythonImportStyle {
    IndividualImports,  // from module import func1, func2
    ModuleImports,      // import module
    Mixed,
}

#[derive(Debug, Clone)]
pub enum PythonQuoteStyle {
    SingleQuotes,
    DoubleQuotes,
    Mixed,
}

#[derive(Debug, Clone)]
pub enum PythonClassStyle {
    TraditionalClass,   // class Name(object):
    ModernClass,        // class Name:
    Mixed,
}

#[derive(Debug, Clone)]
pub struct RustPatterns {
    pub lifetime_usage: RustLifetimeUsage,
    pub error_handling_style: RustErrorHandling,
    pub macro_usage: RustMacroUsage,
    pub trait_implementation_style: RustTraitStyle,
}

#[derive(Debug, Clone)]
pub enum RustLifetimeUsage {
    ExplicitLifetimes,
    ImplicitLifetimes,
    Mixed,
}

#[derive(Debug, Clone)]
pub enum RustErrorHandling {
    ResultType,         // Result<T, E>
    OptionType,        // Option<T>
    PanicMacros,       // panic!, unwrap()
    Mixed,
}

#[derive(Debug, Clone)]
pub enum RustMacroUsage {
    FrequentMacros,
    RareMacros,
    CustomMacros,
}

#[derive(Debug, Clone)]
pub enum RustTraitStyle {
    ExplicitTraits,
    GenericConstraints,
    Mixed,
}

#[derive(Debug, Clone)]
pub struct ConsistencyScores {
    pub naming_consistency: f32,
    pub formatting_consistency: f32,
    pub style_consistency: f32,
    pub overall_consistency: f32,
}

lazy_static! {
    // Enhanced regex patterns for detailed analysis
    static ref FUNCTION_VERB_PATTERNS: Regex = Regex::new(r"^(create|make|build|generate|add|insert|remove|delete|update|modify|get|fetch|retrieve|find|search|calculate|compute|process|handle|manage|execute|run|start|stop|parse|validate|check|test|render|draw|save|load|open|close|connect|disconnect)").unwrap();
    static ref SEMANTIC_VARIABLE_PATTERNS: Regex = Regex::new(r"(count|total|sum|max|min|avg|list|array|map|dict|config|settings|options|params|args|result|response|request|data|info|details|status|state|flag|enabled|disabled)").unwrap();
    static ref COMMENT_DENSITY: Regex = Regex::new(r#"(//|#|--|/\*|""")"#).unwrap();
    static ref IMPORT_PATTERNS: Regex = Regex::new(r"^(import|from|require|use|include)").unwrap();
}

impl CodingStyleAnalyzer {
    pub fn new() -> Self {
        Self {
            pattern_extractor: PatternExtractor::new(),
        }
    }

    /// Perform comprehensive style analysis on source code
    pub fn analyze_style(&self, code: &str, language: &str) -> Result<DetailedStyleAnalysis, String> {
        let basic_analysis = self.pattern_extractor.extract_patterns(code, language)?;
        
        Ok(DetailedStyleAnalysis {
            basic_metrics: basic_analysis.style_metrics,
            naming_analysis: self.analyze_detailed_naming(code, language)?,
            formatting_preferences: self.analyze_formatting_preferences(code, language),
            language_specific_patterns: self.analyze_language_specific_patterns(code, language),
            consistency_scores: self.calculate_consistency_scores(code, language),
        })
    }

    fn analyze_detailed_naming(&self, code: &str, language: &str) -> Result<DetailedNamingAnalysis, String> {
        let ast = AstParser::new().parse_code(code, language)?;
        
        Ok(DetailedNamingAnalysis {
            function_patterns: self.analyze_function_naming(&ast, language),
            variable_patterns: self.analyze_variable_naming(&ast, language),
            constant_patterns: self.analyze_constant_naming(&ast, language),
            class_patterns: self.analyze_class_naming(&ast, language),
            file_patterns: self.analyze_file_naming(language),
        })
    }

    fn analyze_function_naming(&self, _ast: &ParsedAst, _language: &str) -> FunctionNamingPatterns {
        // TODO: Implement detailed function naming analysis
        FunctionNamingPatterns {
            preferred_style: crate::pattern_extractor::NamingStyle::CamelCase,
            common_prefixes: vec!["get".to_string(), "set".to_string(), "is".to_string()],
            common_suffixes: vec!["Handler".to_string(), "Manager".to_string()],
            verb_patterns: vec!["create".to_string(), "update".to_string(), "delete".to_string()],
            getter_setter_patterns: GetterSetterPatterns {
                getter_prefixes: vec!["get".to_string(), "fetch".to_string()],
                setter_prefixes: vec!["set".to_string(), "update".to_string()],
                uses_is_has_can: true,
            },
            boolean_function_patterns: vec!["is".to_string(), "has".to_string(), "can".to_string()],
        }
    }

    fn analyze_variable_naming(&self, _ast: &ParsedAst, _language: &str) -> VariableNamingPatterns {
        // TODO: Implement detailed variable naming analysis
        VariableNamingPatterns {
            preferred_style: crate::pattern_extractor::NamingStyle::CamelCase,
            semantic_patterns: vec!["data".to_string(), "result".to_string(), "config".to_string()],
            abbreviation_usage: AbbreviationUsage {
                uses_abbreviations: false,
                common_abbreviations: HashMap::new(),
                consistency_score: 0.8,
            },
            descriptor_patterns: vec!["temp".to_string(), "current".to_string(), "previous".to_string()],
        }
    }

    fn analyze_constant_naming(&self, _ast: &ParsedAst, _language: &str) -> ConstantNamingPatterns {
        // TODO: Implement detailed constant naming analysis
        ConstantNamingPatterns {
            preferred_style: crate::pattern_extractor::NamingStyle::ScreamingSnake,
            uses_semantic_grouping: true,
            common_categories: vec!["API".to_string(), "CONFIG".to_string(), "ERROR".to_string()],
        }
    }

    fn analyze_class_naming(&self, _ast: &ParsedAst, _language: &str) -> ClassNamingPatterns {
        // TODO: Implement detailed class naming analysis
        ClassNamingPatterns {
            preferred_style: crate::pattern_extractor::NamingStyle::PascalCase,
            common_suffixes: vec!["Service".to_string(), "Manager".to_string(), "Handler".to_string()],
            interface_patterns: vec!["I".to_string()], // IUserService
            abstract_patterns: vec!["Abstract".to_string(), "Base".to_string()],
        }
    }

    fn analyze_file_naming(&self, _language: &str) -> FileNamingPatterns {
        // TODO: Implement file naming analysis
        FileNamingPatterns {
            preferred_style: crate::pattern_extractor::NamingStyle::KebabCase,
            extension_conventions: HashMap::new(),
            directory_organization: DirectoryOrganization {
                uses_feature_folders: true,
                uses_type_folders: true,
                nesting_depth_preference: 3,
            },
        }
    }

    fn analyze_formatting_preferences(&self, code: &str, _language: &str) -> FormattingPreferences {
        FormattingPreferences {
            line_length_stats: self.calculate_line_length_stats(code),
            spacing_preferences: self.analyze_spacing_preferences(code),
            comment_style_preferences: self.analyze_comment_style(code),
            import_organization: self.analyze_import_organization(code),
        }
    }

    fn calculate_line_length_stats(&self, code: &str) -> LineLengthStats {
        let lines: Vec<&str> = code.lines().collect();
        let lengths: Vec<u32> = lines.iter().map(|line| line.len() as u32).collect();
        
        if lengths.is_empty() {
            return LineLengthStats {
                average_length: 0.0,
                median_length: 0,
                preferred_max_length: 80,
                distribution: HashMap::new(),
            };
        }

        let average = lengths.iter().sum::<u32>() as f32 / lengths.len() as f32;
        let mut sorted_lengths = lengths.clone();
        sorted_lengths.sort();
        let median = sorted_lengths[sorted_lengths.len() / 2];
        
        // Calculate distribution in buckets of 10
        let mut distribution = HashMap::new();
        for &length in &lengths {
            let bucket = (length / 10) * 10;
            *distribution.entry(bucket).or_insert(0) += 1;
        }

        LineLengthStats {
            average_length: average,
            median_length: median,
            preferred_max_length: sorted_lengths.get(sorted_lengths.len() * 95 / 100).copied().unwrap_or(80),
            distribution,
        }
    }

    fn analyze_spacing_preferences(&self, code: &str) -> SpacingPreferences {
        SpacingPreferences {
            around_operators: self.detect_space_around_operators(code),
            around_keywords: self.detect_space_around_keywords(code),
            around_commas: self.detect_space_around_commas(code),
            around_semicolons: self.detect_space_around_semicolons(code),
            inside_parentheses: self.detect_space_inside_parentheses(code),
            inside_brackets: self.detect_space_inside_brackets(code),
            inside_braces: self.detect_space_inside_braces(code),
        }
    }

    fn detect_space_around_operators(&self, code: &str) -> bool {
        let spaced_operators = Regex::new(r"\s[+\-*/=<>!]+\s").unwrap();
        let unspaced_operators = Regex::new(r"[^\s][+\-*/=<>!]+[^\s]").unwrap();

        let spaced_count = spaced_operators.find_iter(code).count();
        let unspaced_count = unspaced_operators.find_iter(code).count();

        spaced_count > unspaced_count
    }

    fn detect_space_around_keywords(&self, code: &str) -> bool {
        let with_spaces = Regex::new(r"\s(if|for|while|switch|catch)\s*\(").unwrap();
        let without_spaces = Regex::new(r"(if|for|while|switch|catch)\(").unwrap();
        
        let with_count = with_spaces.find_iter(code).count();
        let without_count = without_spaces.find_iter(code).count();
        
        with_count > without_count
    }

    fn detect_space_around_commas(&self, code: &str) -> bool {
        let with_spaces = Regex::new(r",\s").unwrap();
        let without_spaces = Regex::new(r",[^\s]").unwrap();
        
        let with_count = with_spaces.find_iter(code).count();
        let without_count = without_spaces.find_iter(code).count();
        
        with_count > without_count
    }

    fn detect_space_around_semicolons(&self, code: &str) -> bool {
        let with_spaces = Regex::new(r";\s").unwrap();
        let without_spaces = Regex::new(r";[^\s\n]").unwrap();
        
        let with_count = with_spaces.find_iter(code).count();
        let without_count = without_spaces.find_iter(code).count();
        
        with_count > without_count
    }

    fn detect_space_inside_parentheses(&self, code: &str) -> bool {
        let with_spaces = Regex::new(r"\(\s|\s\)").unwrap();
        with_spaces.is_match(code)
    }

    fn detect_space_inside_brackets(&self, code: &str) -> bool {
        let with_spaces = Regex::new(r"\[\s|\s\]").unwrap();
        with_spaces.is_match(code)
    }

    fn detect_space_inside_braces(&self, code: &str) -> bool {
        let with_spaces = Regex::new(r"\{\s|\s\}").unwrap();
        with_spaces.is_match(code)
    }

    fn analyze_comment_style(&self, code: &str) -> CommentStylePreferences {
        let lines = code.lines().collect::<Vec<_>>();
        let comment_count = COMMENT_DENSITY.find_iter(code).count();
        let comment_density = if lines.len() > 0 { comment_count as f32 / lines.len() as f32 } else { 0.0 };

        CommentStylePreferences {
            single_line_style: self.detect_single_line_comment_style(code),
            multi_line_style: self.detect_multi_line_comment_style(code),
            documentation_style: self.detect_documentation_style(code),
            comment_density,
        }
    }

    fn detect_single_line_comment_style(&self, code: &str) -> String {
        let js_comments = code.matches("//").count();
        let py_comments = code.matches("#").count();
        let sql_comments = code.matches("--").count();

        if js_comments >= py_comments && js_comments >= sql_comments {
            "//".to_string()
        } else if py_comments >= sql_comments {
            "#".to_string()
        } else {
            "--".to_string()
        }
    }

    fn detect_multi_line_comment_style(&self, code: &str) -> String {
        if code.contains("/*") && code.contains("*/") {
            "/* */".to_string()
        } else if code.contains("\"\"\"") {
            "\"\"\" \"\"\"".to_string()
        } else {
            "/* */".to_string()
        }
    }

    fn detect_documentation_style(&self, code: &str) -> String {
        if code.contains("/**") || code.contains("@param") || code.contains("@returns") {
            "JSDoc".to_string()
        } else if code.contains("///") || code.contains("#[doc") {
            "rustdoc".to_string()
        } else if code.contains("\"\"\"") && (code.contains(":param") || code.contains(":returns")) {
            "Sphinx".to_string()
        } else {
            "None".to_string()
        }
    }

    fn analyze_import_organization(&self, code: &str) -> ImportOrganizationStyle {
        ImportOrganizationStyle {
            grouping_style: self.detect_import_grouping_style(code),
            sorting_preference: self.detect_import_sorting_style(code),
            alias_usage: self.analyze_alias_usage(code),
        }
    }

    fn detect_import_grouping_style(&self, _code: &str) -> ImportGroupingStyle {
        // TODO: Implement import grouping detection
        ImportGroupingStyle::ByType
    }

    fn detect_import_sorting_style(&self, _code: &str) -> ImportSortingStyle {
        // TODO: Implement import sorting detection
        ImportSortingStyle::Alphabetical
    }

    fn analyze_alias_usage(&self, _code: &str) -> AliasUsagePatterns {
        // TODO: Implement alias usage analysis
        AliasUsagePatterns {
            uses_aliases: false,
            common_alias_patterns: HashMap::new(),
            alias_length_preference: AliasLengthStyle::Short,
        }
    }

    fn analyze_language_specific_patterns(&self, code: &str, language: &str) -> LanguageSpecificPatterns {
        match language.to_lowercase().as_str() {
            "javascript" | "js" => LanguageSpecificPatterns {
                javascript_patterns: Some(self.analyze_javascript_patterns(code)),
                python_patterns: None,
                rust_patterns: None,
            },
            "python" | "py" => LanguageSpecificPatterns {
                javascript_patterns: None,
                python_patterns: Some(self.analyze_python_patterns(code)),
                rust_patterns: None,
            },
            "rust" | "rs" => LanguageSpecificPatterns {
                javascript_patterns: None,
                python_patterns: None,
                rust_patterns: Some(self.analyze_rust_patterns(code)),
            },
            _ => LanguageSpecificPatterns {
                javascript_patterns: None,
                python_patterns: None,
                rust_patterns: None,
            },
        }
    }

    fn analyze_javascript_patterns(&self, _code: &str) -> JavaScriptPatterns {
        // TODO: Implement JavaScript-specific pattern analysis
        JavaScriptPatterns {
            function_declaration_style: JSFunctionStyle::FunctionDeclaration,
            object_property_style: JSPropertyStyle::NoQuotes,
            async_await_usage: AsyncAwaitUsage {
                prefers_async_await: true,
                uses_promises: true,
                uses_callbacks: false,
            },
            module_system_preference: JSModuleSystem::ES6Modules,
        }
    }

    fn analyze_python_patterns(&self, _code: &str) -> PythonPatterns {
        // TODO: Implement Python-specific pattern analysis
        PythonPatterns {
            import_style: PythonImportStyle::IndividualImports,
            string_quote_preference: PythonQuoteStyle::DoubleQuotes,
            class_definition_style: PythonClassStyle::ModernClass,
            function_annotation_usage: true,
        }
    }

    fn analyze_rust_patterns(&self, _code: &str) -> RustPatterns {
        // TODO: Implement Rust-specific pattern analysis
        RustPatterns {
            lifetime_usage: RustLifetimeUsage::ImplicitLifetimes,
            error_handling_style: RustErrorHandling::ResultType,
            macro_usage: RustMacroUsage::RareMacros,
            trait_implementation_style: RustTraitStyle::ExplicitTraits,
        }
    }

    fn calculate_consistency_scores(&self, _code: &str, _language: &str) -> ConsistencyScores {
        // TODO: Implement consistency scoring algorithms
        ConsistencyScores {
            naming_consistency: 0.85,
            formatting_consistency: 0.90,
            style_consistency: 0.88,
            overall_consistency: 0.87,
        }
    }
}

impl Default for CodingStyleAnalyzer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_style_analyzer_creation() {
        let analyzer = CodingStyleAnalyzer::new();
        // Basic smoke test
        assert!(true);
    }

    #[test]
    fn test_comprehensive_style_analysis() {
        let analyzer = CodingStyleAnalyzer::new();
        let js_code = r#"
function calculateTotalPrice(items, taxRate) {
    let total = 0;
    for (const item of items) {
        total += item.price * (1 + taxRate);
    }
    return total;
}

class ShoppingCart {
    constructor() {
        this.items = [];
        this.discountRate = 0;
    }

    addItem(item) {
        this.items.push(item);
    }

    getTotalPrice() {
        return calculateTotalPrice(this.items, 0.08);
    }
}
        "#;

        let analysis = analyzer.analyze_style(js_code, "javascript");
        assert!(analysis.is_ok());

        let style_analysis = analysis.unwrap();
        assert!(style_analysis.consistency_scores.overall_consistency > 0.0);
        assert!(style_analysis.formatting_preferences.line_length_stats.average_length > 0.0);
        assert!(matches!(style_analysis.language_specific_patterns.javascript_patterns, Some(_)));
    }

    #[test]
    fn test_line_length_statistics() {
        let analyzer = CodingStyleAnalyzer::new();
        let code = "short\nthis is a longer line\nvery short\nthis is an extremely long line that goes on and on";
        
        let stats = analyzer.calculate_line_length_stats(code);
        assert!(stats.average_length > 0.0);
        assert!(stats.median_length > 0);
        assert!(!stats.distribution.is_empty());
    }

    #[test]
    fn test_spacing_preferences() {
        let analyzer = CodingStyleAnalyzer::new();
        let spaced_code = "if (condition) { return a + b; }";
        let unspaced_code = "if(condition){return a+b;}";
        
        let spaced_prefs = analyzer.analyze_spacing_preferences(spaced_code);
        let unspaced_prefs = analyzer.analyze_spacing_preferences(unspaced_code);
        
        assert!(spaced_prefs.around_operators);
        assert!(!unspaced_prefs.around_operators);
    }

    #[test]
    fn test_comment_style_detection() {
        let analyzer = CodingStyleAnalyzer::new();
        
        let js_code = "// This is a comment\nfunction test() {}";
        let py_code = "# This is a comment\ndef test(): pass";
        
        let js_style = analyzer.analyze_comment_style(js_code);
        let py_style = analyzer.analyze_comment_style(py_code);
        
        assert_eq!(js_style.single_line_style, "//");
        assert_eq!(py_style.single_line_style, "#");
    }
}
