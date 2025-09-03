use crate::ast_parser::{AstParser, ParsedAst};
use std::collections::HashMap;
use regex::Regex;
use lazy_static::lazy_static;

/// Function signature pattern detector that analyzes function definitions and usage patterns
pub struct FunctionSignatureDetector {
    parser: AstParser,
}

#[derive(Debug, Clone)]
pub struct FunctionSignatureAnalysis {
    pub function_patterns: Vec<FunctionPattern>,
    pub parameter_patterns: ParameterPatterns,
    pub return_type_patterns: ReturnTypePatterns,
    pub naming_conventions: FunctionNamingConventions,
    pub signature_complexity: SignatureComplexity,
}

#[derive(Debug, Clone)]
pub struct FunctionPattern {
    pub name: String,
    pub parameters: Vec<ParameterInfo>,
    pub return_type: Option<String>,
    pub visibility: Visibility,
    pub function_type: FunctionType,
    pub documentation: Option<String>,
    pub language: String,
    pub line_number: u32,
}

#[derive(Debug, Clone)]
pub struct ParameterInfo {
    pub name: String,
    pub param_type: Option<String>,
    pub default_value: Option<String>,
    pub is_optional: bool,
    pub is_rest_parameter: bool,
    pub annotation: Option<String>,
}

#[derive(Debug, Clone)]
pub enum Visibility {
    Public,
    Private,
    Protected,
    Internal,
    Unknown,
}

#[derive(Debug, Clone)]
pub enum FunctionType {
    Regular,
    Arrow,
    Anonymous,
    Async,
    Generator,
    Method,
    Constructor,
    StaticMethod,
    Getter,
    Setter,
}

#[derive(Debug, Clone)]
pub struct ParameterPatterns {
    pub common_parameter_names: HashMap<String, u32>,
    pub parameter_naming_style: crate::pattern_extractor::NamingStyle,
    pub average_parameter_count: f32,
    pub type_annotation_usage: f32, // percentage of parameters with type annotations
    pub default_value_usage: f32,   // percentage with default values
    pub rest_parameter_usage: bool,
}

#[derive(Debug, Clone)]
pub struct ReturnTypePatterns {
    pub explicit_return_types: f32, // percentage with explicit return types
    pub common_return_types: HashMap<String, u32>,
    pub void_function_percentage: f32,
    pub async_function_percentage: f32,
}

#[derive(Debug, Clone)]
pub struct FunctionNamingConventions {
    pub naming_style: crate::pattern_extractor::NamingStyle,
    pub verb_usage: VerbUsagePatterns,
    pub semantic_patterns: SemanticPatterns,
    pub length_preferences: LengthPreferences,
}

#[derive(Debug, Clone)]
pub struct VerbUsagePatterns {
    pub action_verbs: HashMap<String, u32>, // "create", "update", "delete"
    pub getter_patterns: HashMap<String, u32>, // "get", "fetch", "retrieve"
    pub setter_patterns: HashMap<String, u32>, // "set", "update", "modify"
    pub boolean_patterns: HashMap<String, u32>, // "is", "has", "can", "should"
    pub utility_patterns: HashMap<String, u32>, // "parse", "validate", "format"
}

#[derive(Debug, Clone)]
pub struct SemanticPatterns {
    pub domain_specific_prefixes: HashMap<String, u32>, // "user", "auth", "api"
    pub layer_specific_prefixes: HashMap<String, u32>,  // "db", "ui", "service"
    pub common_suffixes: HashMap<String, u32>,          // "Handler", "Manager", "Service"
}

#[derive(Debug, Clone)]
pub struct LengthPreferences {
    pub average_length: f32,
    pub preferred_min_length: u32,
    pub preferred_max_length: u32,
    pub abbreviation_usage: bool,
}

#[derive(Debug, Clone)]
pub struct SignatureComplexity {
    pub average_parameters: f32,
    pub max_parameters_seen: u32,
    pub cyclomatic_complexity_preference: u32,
    pub nesting_depth_tolerance: u32,
}

lazy_static! {
    // Function naming pattern regexes
    static ref VERB_PATTERNS: Regex = Regex::new(r"^(get|set|is|has|can|should|will|create|make|build|add|remove|delete|update|modify|fetch|retrieve|find|search|calculate|compute|process|handle|execute|run|start|stop|parse|validate|format|convert|transform|render|draw|save|load|open|close|connect|disconnect|send|receive|emit|listen|subscribe|publish|register|unregister|enable|disable|activate|deactivate|initialize|destroy|reset|clear|copy|clone|merge|split|join|sort|filter|map|reduce|forEach|iterate|traverse|visit|compare|equals|contains|includes|indexOf|lastIndexOf|push|pop|shift|unshift|slice|splice|substring|replace|trim|padStart|padEnd|toUpperCase|toLowerCase|toString|valueOf|hasOwnProperty|isPrototypeOf|propertyIsEnumerable)").unwrap();
    
    static ref GETTER_PATTERNS: Regex = Regex::new(r"^(get|fetch|retrieve|obtain|acquire|read|load|find|search|query|select|extract|derive|compute|calculate)").unwrap();
    
    static ref SETTER_PATTERNS: Regex = Regex::new(r"^(set|update|modify|change|alter|assign|write|save|store|put|insert|add|append|prepend|push|unshift)").unwrap();
    
    static ref BOOLEAN_PATTERNS: Regex = Regex::new(r"^(is|has|can|should|will|could|would|might|may|must|need|want|allow|permit|enable|disable|check|test|verify|validate|confirm|ensure)").unwrap();
    
    static ref UTILITY_PATTERNS: Regex = Regex::new(r"^(parse|format|convert|transform|map|filter|reduce|sort|group|aggregate|summarize|normalize|sanitize|validate|verify|authenticate|authorize|encrypt|decrypt|encode|decode|compress|decompress|serialize|deserialize|stringify|jsonify|xmlify|htmlify|escape|unescape|trim|pad|truncate|wrap|unwrap|clone|copy|merge|extend|assign|pick|omit|pluck|flatten|unflatten|chunk|partition|zip|unzip|intersection|union|difference|unique|distinct|compact|reverse|shuffle|sample|range|sequence|generate|create|build|make|construct|instantiate|initialize|setup|configure|prepare|finalize|cleanup|destroy|dispose|release|free|clear|reset|restart|reload|refresh|sync|async|defer|delay|debounce|throttle|memoize|cache)").unwrap();
}

impl FunctionSignatureDetector {
    pub fn new() -> Self {
        Self {
            parser: AstParser::new(),
        }
    }

    /// Analyze function signatures in the given code
    pub fn analyze_signatures(&self, code: &str, language: &str) -> Result<FunctionSignatureAnalysis, String> {
        let ast = self.parser.parse_code(code, language)?;
        
        let function_patterns = self.extract_function_patterns(&ast, language)?;
        
        Ok(FunctionSignatureAnalysis {
            parameter_patterns: self.analyze_parameter_patterns(&function_patterns),
            return_type_patterns: self.analyze_return_type_patterns(&function_patterns),
            naming_conventions: self.analyze_naming_conventions(&function_patterns),
            signature_complexity: self.analyze_signature_complexity(&function_patterns),
            function_patterns,
        })
    }

    fn extract_function_patterns(&self, ast: &ParsedAst, language: &str) -> Result<Vec<FunctionPattern>, String> {
        match ast {
            ParsedAst::JavaScript(module) => {
                self.extract_javascript_functions(module, language)
            },
            ParsedAst::Python(suite) => {
                self.extract_python_functions(suite, language)
            },
            ParsedAst::Rust(items) => {
                self.extract_rust_functions(items, language)
            },
            ParsedAst::Generic(lines) => {
                self.extract_generic_functions(lines, language)
            },
        }
    }

    fn extract_javascript_functions(&self, _module: &swc_ecma_ast::Module, language: &str) -> Result<Vec<FunctionPattern>, String> {
        // TODO: Implement JavaScript function extraction using SWC AST
        Ok(vec![
            FunctionPattern {
                name: "exampleFunction".to_string(),
                parameters: vec![
                    ParameterInfo {
                        name: "param1".to_string(),
                        param_type: Some("string".to_string()),
                        default_value: None,
                        is_optional: false,
                        is_rest_parameter: false,
                        annotation: None,
                    }
                ],
                return_type: Some("number".to_string()),
                visibility: Visibility::Public,
                function_type: FunctionType::Regular,
                documentation: None,
                language: language.to_string(),
                line_number: 1,
            }
        ])
    }

    fn extract_python_functions(&self, _suite: &rustpython_parser::ast::Suite, language: &str) -> Result<Vec<FunctionPattern>, String> {
        // TODO: Implement Python function extraction using rustpython AST
        Ok(vec![
            FunctionPattern {
                name: "example_function".to_string(),
                parameters: vec![
                    ParameterInfo {
                        name: "param1".to_string(),
                        param_type: Some("str".to_string()),
                        default_value: None,
                        is_optional: false,
                        is_rest_parameter: false,
                        annotation: None,
                    }
                ],
                return_type: Some("int".to_string()),
                visibility: Visibility::Public,
                function_type: FunctionType::Regular,
                documentation: None,
                language: language.to_string(),
                line_number: 1,
            }
        ])
    }

    fn extract_rust_functions(&self, _items: &[syn::Item], language: &str) -> Result<Vec<FunctionPattern>, String> {
        // TODO: Implement Rust function extraction using syn AST
        Ok(vec![
            FunctionPattern {
                name: "example_function".to_string(),
                parameters: vec![
                    ParameterInfo {
                        name: "param1".to_string(),
                        param_type: Some("String".to_string()),
                        default_value: None,
                        is_optional: false,
                        is_rest_parameter: false,
                        annotation: None,
                    }
                ],
                return_type: Some("i32".to_string()),
                visibility: Visibility::Public,
                function_type: FunctionType::Regular,
                documentation: None,
                language: language.to_string(),
                line_number: 1,
            }
        ])
    }

    fn extract_generic_functions(&self, lines: &[String], language: &str) -> Result<Vec<FunctionPattern>, String> {
        let mut functions = Vec::new();
        
        for (line_num, line) in lines.iter().enumerate() {
            if let Some(function) = self.parse_generic_function_line(line, language, line_num as u32 + 1) {
                functions.push(function);
            }
        }
        
        Ok(functions)
    }

    fn parse_generic_function_line(&self, line: &str, language: &str, line_number: u32) -> Option<FunctionPattern> {
        // Simple regex-based function detection for unknown languages
        let function_regex = Regex::new(r"(?:function|def|fn|func)\s+(\w+)\s*\(([^)]*)\)").unwrap();
        
        if let Some(captures) = function_regex.captures(line) {
            let name = captures.get(1)?.as_str().to_string();
            let params_str = captures.get(2)?.as_str();
            
            let parameters = self.parse_generic_parameters(params_str);
            
            Some(FunctionPattern {
                name,
                parameters,
                return_type: None,
                visibility: Visibility::Unknown,
                function_type: FunctionType::Regular,
                documentation: None,
                language: language.to_string(),
                line_number,
            })
        } else {
            None
        }
    }

    fn parse_generic_parameters(&self, params_str: &str) -> Vec<ParameterInfo> {
        if params_str.trim().is_empty() {
            return Vec::new();
        }

        params_str
            .split(',')
            .map(|param| {
                let param = param.trim();
                let parts: Vec<&str> = param.split(':').collect();
                
                let name = parts[0].trim().to_string();
                let param_type = if parts.len() > 1 {
                    Some(parts[1].trim().to_string())
                } else {
                    None
                };

                ParameterInfo {
                    name,
                    param_type,
                    default_value: None,
                    is_optional: false,
                    is_rest_parameter: false,
                    annotation: None,
                }
            })
            .collect()
    }

    fn analyze_parameter_patterns(&self, functions: &[FunctionPattern]) -> ParameterPatterns {
        let mut common_names = HashMap::new();
        let mut total_params = 0;
        let mut typed_params = 0;
        let mut default_value_params = 0;
        let mut has_rest_param = false;

        for function in functions {
            for param in &function.parameters {
                *common_names.entry(param.name.clone()).or_insert(0) += 1;
                total_params += 1;

                if param.param_type.is_some() {
                    typed_params += 1;
                }

                if param.default_value.is_some() {
                    default_value_params += 1;
                }

                if param.is_rest_parameter {
                    has_rest_param = true;
                }
            }
        }

        let avg_param_count = if functions.is_empty() {
            0.0
        } else {
            total_params as f32 / functions.len() as f32
        };

        let type_annotation_usage = if total_params == 0 {
            0.0
        } else {
            typed_params as f32 / total_params as f32
        };

        let default_value_usage = if total_params == 0 {
            0.0
        } else {
            default_value_params as f32 / total_params as f32
        };

        // Determine naming style from parameter names
        let param_names: Vec<String> = common_names.keys().cloned().collect();
        let naming_style = self.detect_naming_style(&param_names);

        ParameterPatterns {
            common_parameter_names: common_names,
            parameter_naming_style: naming_style,
            average_parameter_count: avg_param_count,
            type_annotation_usage,
            default_value_usage,
            rest_parameter_usage: has_rest_param,
        }
    }

    fn analyze_return_type_patterns(&self, functions: &[FunctionPattern]) -> ReturnTypePatterns {
        let mut return_types = HashMap::new();
        let mut explicit_types = 0;
        let mut void_functions = 0;
        let mut async_functions = 0;

        for function in functions {
            if let Some(ref return_type) = function.return_type {
                *return_types.entry(return_type.clone()).or_insert(0) += 1;
                explicit_types += 1;

                if return_type.to_lowercase().contains("void") || return_type.to_lowercase().contains("none") {
                    void_functions += 1;
                }
            }

            if matches!(function.function_type, FunctionType::Async) {
                async_functions += 1;
            }
        }

        let total_functions = functions.len() as f32;
        
        ReturnTypePatterns {
            explicit_return_types: if total_functions == 0.0 { 0.0 } else { explicit_types as f32 / total_functions },
            common_return_types: return_types,
            void_function_percentage: if total_functions == 0.0 { 0.0 } else { void_functions as f32 / total_functions },
            async_function_percentage: if total_functions == 0.0 { 0.0 } else { async_functions as f32 / total_functions },
        }
    }

    fn analyze_naming_conventions(&self, functions: &[FunctionPattern]) -> FunctionNamingConventions {
        let function_names: Vec<String> = functions.iter().map(|f| f.name.clone()).collect();
        let naming_style = self.detect_naming_style(&function_names);

        let verb_usage = self.analyze_verb_usage(&function_names);
        let semantic_patterns = self.analyze_semantic_patterns(&function_names);
        let length_preferences = self.analyze_length_preferences(&function_names);

        FunctionNamingConventions {
            naming_style,
            verb_usage,
            semantic_patterns,
            length_preferences,
        }
    }

    fn analyze_verb_usage(&self, function_names: &[String]) -> VerbUsagePatterns {
        let mut action_verbs = HashMap::new();
        let mut getter_patterns = HashMap::new();
        let mut setter_patterns = HashMap::new();
        let mut boolean_patterns = HashMap::new();
        let mut utility_patterns = HashMap::new();

        for name in function_names {
            let lower_name = name.to_lowercase();

            if let Some(caps) = GETTER_PATTERNS.captures(&lower_name) {
                if let Some(verb) = caps.get(1) {
                    *getter_patterns.entry(verb.as_str().to_string()).or_insert(0) += 1;
                }
            }

            if let Some(caps) = SETTER_PATTERNS.captures(&lower_name) {
                if let Some(verb) = caps.get(1) {
                    *setter_patterns.entry(verb.as_str().to_string()).or_insert(0) += 1;
                }
            }

            if let Some(caps) = BOOLEAN_PATTERNS.captures(&lower_name) {
                if let Some(verb) = caps.get(1) {
                    *boolean_patterns.entry(verb.as_str().to_string()).or_insert(0) += 1;
                }
            }

            if let Some(caps) = UTILITY_PATTERNS.captures(&lower_name) {
                if let Some(verb) = caps.get(1) {
                    *utility_patterns.entry(verb.as_str().to_string()).or_insert(0) += 1;
                }
            }

            if let Some(caps) = VERB_PATTERNS.captures(&lower_name) {
                if let Some(verb) = caps.get(1) {
                    *action_verbs.entry(verb.as_str().to_string()).or_insert(0) += 1;
                }
            }
        }

        VerbUsagePatterns {
            action_verbs,
            getter_patterns,
            setter_patterns,
            boolean_patterns,
            utility_patterns,
        }
    }

    fn analyze_semantic_patterns(&self, function_names: &[String]) -> SemanticPatterns {
        // TODO: Implement more sophisticated semantic analysis
        SemanticPatterns {
            domain_specific_prefixes: HashMap::new(),
            layer_specific_prefixes: HashMap::new(),
            common_suffixes: HashMap::new(),
        }
    }

    fn analyze_length_preferences(&self, function_names: &[String]) -> LengthPreferences {
        if function_names.is_empty() {
            return LengthPreferences {
                average_length: 0.0,
                preferred_min_length: 3,
                preferred_max_length: 20,
                abbreviation_usage: false,
            };
        }

        let lengths: Vec<usize> = function_names.iter().map(|name| name.len()).collect();
        let total_length: usize = lengths.iter().sum();
        let average_length = total_length as f32 / function_names.len() as f32;
        
        let min_length = *lengths.iter().min().unwrap_or(&3) as u32;
        let max_length = *lengths.iter().max().unwrap_or(&20) as u32;

        // Simple abbreviation detection
        let abbreviation_usage = function_names.iter().any(|name| {
            name.len() <= 3 || name.chars().filter(|&c| c.is_uppercase()).count() > name.len() / 2
        });

        LengthPreferences {
            average_length,
            preferred_min_length: min_length,
            preferred_max_length: max_length,
            abbreviation_usage,
        }
    }

    fn analyze_signature_complexity(&self, functions: &[FunctionPattern]) -> SignatureComplexity {
        if functions.is_empty() {
            return SignatureComplexity {
                average_parameters: 0.0,
                max_parameters_seen: 0,
                cyclomatic_complexity_preference: 5,
                nesting_depth_tolerance: 3,
            };
        }

        let param_counts: Vec<usize> = functions.iter().map(|f| f.parameters.len()).collect();
        let total_params: usize = param_counts.iter().sum();
        let average_parameters = total_params as f32 / functions.len() as f32;
        let max_parameters_seen = *param_counts.iter().max().unwrap_or(&0) as u32;

        SignatureComplexity {
            average_parameters,
            max_parameters_seen,
            cyclomatic_complexity_preference: 5, // Default values - would need more analysis
            nesting_depth_tolerance: 3,
        }
    }

    fn detect_naming_style(&self, names: &[String]) -> crate::pattern_extractor::NamingStyle {
        if names.is_empty() {
            return crate::pattern_extractor::NamingStyle::Unknown;
        }

        let camel_case = Regex::new(r"^[a-z][a-zA-Z0-9]*$").unwrap();
        let pascal_case = Regex::new(r"^[A-Z][a-zA-Z0-9]*$").unwrap();
        let snake_case = Regex::new(r"^[a-z][a-z0-9_]*$").unwrap();

        let mut camel_count = 0;
        let mut pascal_count = 0;
        let mut snake_count = 0;

        for name in names {
            if camel_case.is_match(name) {
                camel_count += 1;
            } else if pascal_case.is_match(name) {
                pascal_count += 1;
            } else if snake_case.is_match(name) {
                snake_count += 1;
            }
        }

        if camel_count > pascal_count && camel_count > snake_count {
            crate::pattern_extractor::NamingStyle::CamelCase
        } else if pascal_count > snake_count {
            crate::pattern_extractor::NamingStyle::PascalCase
        } else if snake_count > 0 {
            crate::pattern_extractor::NamingStyle::SnakeCase
        } else {
            crate::pattern_extractor::NamingStyle::Mixed
        }
    }
}

impl Default for FunctionSignatureDetector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_function_signature_detector_creation() {
        let detector = FunctionSignatureDetector::new();
        // Basic smoke test
        assert!(true);
    }

    #[test]
    fn test_generic_function_parsing() {
        let detector = FunctionSignatureDetector::new();
        let code = "function calculateSum(a, b) {\n    return a + b;\n}";
        
        let analysis = detector.analyze_signatures(code, "unknown");
        assert!(analysis.is_ok());

        let result = analysis.unwrap();
        assert_eq!(result.function_patterns.len(), 1);
        assert_eq!(result.function_patterns[0].name, "calculateSum");
        assert_eq!(result.function_patterns[0].parameters.len(), 2);
    }

    #[test]
    fn test_parameter_pattern_analysis() {
        let detector = FunctionSignatureDetector::new();
        let functions = vec![
            FunctionPattern {
                name: "testFunc1".to_string(),
                parameters: vec![
                    ParameterInfo {
                        name: "userId".to_string(),
                        param_type: Some("string".to_string()),
                        default_value: None,
                        is_optional: false,
                        is_rest_parameter: false,
                        annotation: None,
                    },
                    ParameterInfo {
                        name: "callback".to_string(),
                        param_type: None,
                        default_value: Some("null".to_string()),
                        is_optional: true,
                        is_rest_parameter: false,
                        annotation: None,
                    },
                ],
                return_type: Some("Promise".to_string()),
                visibility: Visibility::Public,
                function_type: FunctionType::Async,
                documentation: None,
                language: "javascript".to_string(),
                line_number: 1,
            }
        ];

        let patterns = detector.analyze_parameter_patterns(&functions);
        assert_eq!(patterns.average_parameter_count, 2.0);
        assert_eq!(patterns.type_annotation_usage, 0.5); // 1 out of 2 params
        assert_eq!(patterns.default_value_usage, 0.5);   // 1 out of 2 params
    }

    #[test]
    fn test_verb_usage_analysis() {
        let detector = FunctionSignatureDetector::new();
        let function_names = vec![
            "getUserData".to_string(),
            "setUserProfile".to_string(),
            "isUserActive".to_string(),
            "validateInput".to_string(),
            "createNewUser".to_string(),
        ];

        let verb_patterns = detector.analyze_verb_usage(&function_names);
        
        assert!(!verb_patterns.getter_patterns.is_empty());
        assert!(!verb_patterns.setter_patterns.is_empty());
        assert!(!verb_patterns.boolean_patterns.is_empty());
        assert!(!verb_patterns.utility_patterns.is_empty());
        assert!(!verb_patterns.action_verbs.is_empty());
    }

    #[test]
    fn test_naming_style_detection() {
        let detector = FunctionSignatureDetector::new();
        
        let camel_names = vec!["getUserData".to_string(), "calculateSum".to_string()];
        assert!(matches!(detector.detect_naming_style(&camel_names), crate::pattern_extractor::NamingStyle::CamelCase));
        
        let snake_names = vec!["get_user_data".to_string(), "calculate_sum".to_string()];
        assert!(matches!(detector.detect_naming_style(&snake_names), crate::pattern_extractor::NamingStyle::SnakeCase));
        
        let pascal_names = vec!["GetUserData".to_string(), "CalculateSum".to_string()];
        assert!(matches!(detector.detect_naming_style(&pascal_names), crate::pattern_extractor::NamingStyle::PascalCase));
    }

    #[test]
    fn test_signature_complexity_analysis() {
        let detector = FunctionSignatureDetector::new();
        let functions = vec![
            FunctionPattern {
                name: "simpleFunc".to_string(),
                parameters: vec![
                    ParameterInfo {
                        name: "param1".to_string(),
                        param_type: None,
                        default_value: None,
                        is_optional: false,
                        is_rest_parameter: false,
                        annotation: None,
                    }
                ],
                return_type: None,
                visibility: Visibility::Public,
                function_type: FunctionType::Regular,
                documentation: None,
                language: "javascript".to_string(),
                line_number: 1,
            },
            FunctionPattern {
                name: "complexFunc".to_string(),
                parameters: vec![
                    ParameterInfo { name: "p1".to_string(), param_type: None, default_value: None, is_optional: false, is_rest_parameter: false, annotation: None },
                    ParameterInfo { name: "p2".to_string(), param_type: None, default_value: None, is_optional: false, is_rest_parameter: false, annotation: None },
                    ParameterInfo { name: "p3".to_string(), param_type: None, default_value: None, is_optional: false, is_rest_parameter: false, annotation: None },
                ],
                return_type: None,
                visibility: Visibility::Public,
                function_type: FunctionType::Regular,
                documentation: None,
                language: "javascript".to_string(),
                line_number: 5,
            }
        ];

        let complexity = detector.analyze_signature_complexity(&functions);
        assert_eq!(complexity.average_parameters, 2.0);
        assert_eq!(complexity.max_parameters_seen, 3);
    }
}
