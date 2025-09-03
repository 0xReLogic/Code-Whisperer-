use crate::ast_parser::{AstParser, ParsedAst};
use std::collections::HashMap;
use regex::Regex;
use lazy_static::lazy_static;

/// Variable naming pattern recognition system
pub struct VariableNamingRecognizer {
    parser: AstParser,
}

#[derive(Debug, Clone)]
pub struct VariableNamingAnalysis {
    pub naming_patterns: VariableNamingPatterns,
    pub semantic_categories: SemanticCategories,
    pub abbreviation_patterns: AbbreviationPatterns,
    pub scope_based_patterns: ScopeBasedPatterns,
    pub type_based_patterns: TypeBasedPatterns,
    pub consistency_metrics: NamingConsistencyMetrics,
}

#[derive(Debug, Clone)]
pub struct VariableNamingPatterns {
    pub primary_style: crate::pattern_extractor::NamingStyle,
    pub style_distribution: HashMap<String, f32>, // style -> percentage
    pub prefix_patterns: HashMap<String, u32>,    // prefix -> count
    pub suffix_patterns: HashMap<String, u32>,    // suffix -> count
    pub length_preferences: LengthPreferences,
    pub compound_word_usage: bool,
}

#[derive(Debug, Clone)]
pub struct SemanticCategories {
    pub data_containers: HashMap<String, u32>,    // list, array, map, set
    pub state_variables: HashMap<String, u32>,    // current, previous, next, temp
    pub counters_iterators: HashMap<String, u32>, // count, index, iterator, i, j, k
    pub flags_booleans: HashMap<String, u32>,     // enabled, active, valid, ready
    pub configuration: HashMap<String, u32>,      // config, settings, options, params
    pub identifiers: HashMap<String, u32>,        // id, key, name, title, label
    pub temporal_variables: HashMap<String, u32>, // start, end, duration, timeout
    pub size_dimensions: HashMap<String, u32>,    // width, height, size, length, count
}

#[derive(Debug, Clone)]
pub struct AbbreviationPatterns {
    pub common_abbreviations: HashMap<String, String>, // btn -> button
    pub domain_abbreviations: HashMap<String, String>, // usr -> user, cfg -> config
    pub length_thresholds: AbbreviationThresholds,
    pub consistency_score: f32,
}

#[derive(Debug, Clone)]
pub struct AbbreviationThresholds {
    pub min_word_length_for_abbreviation: u32,
    pub max_abbreviation_length: u32,
    pub abbreviation_percentage: f32, // % of variables that use abbreviations
}

#[derive(Debug, Clone)]
pub struct ScopeBasedPatterns {
    pub local_variable_patterns: VariableStylePreferences,
    pub class_field_patterns: VariableStylePreferences,
    pub global_variable_patterns: VariableStylePreferences,
    pub constant_patterns: VariableStylePreferences,
    pub parameter_patterns: VariableStylePreferences,
}

#[derive(Debug, Clone)]
pub struct VariableStylePreferences {
    pub naming_style: crate::pattern_extractor::NamingStyle,
    pub common_prefixes: Vec<String>,
    pub common_suffixes: Vec<String>,
    pub average_length: f32,
    pub descriptiveness_score: f32, // how descriptive vs abbreviated
}

#[derive(Debug, Clone)]
pub struct TypeBasedPatterns {
    pub string_variable_patterns: TypeSpecificPatterns,
    pub number_variable_patterns: TypeSpecificPatterns,
    pub boolean_variable_patterns: TypeSpecificPatterns,
    pub array_variable_patterns: TypeSpecificPatterns,
    pub object_variable_patterns: TypeSpecificPatterns,
    pub function_variable_patterns: TypeSpecificPatterns,
}

#[derive(Debug, Clone)]
pub struct TypeSpecificPatterns {
    pub common_names: HashMap<String, u32>,
    pub naming_conventions: Vec<String>, // patterns like "is*", "has*", "*List"
    pub prefix_usage: HashMap<String, u32>,
    pub suffix_usage: HashMap<String, u32>,
}

#[derive(Debug, Clone)]
pub struct LengthPreferences {
    pub average_length: f32,
    pub min_preferred_length: u32,
    pub max_preferred_length: u32,
    pub single_letter_usage: f32, // percentage using single letters (i, j, k)
    pub very_long_names_usage: f32, // percentage > 20 characters
}

#[derive(Debug, Clone)]
pub struct NamingConsistencyMetrics {
    pub style_consistency: f32,        // 0-1, how consistent naming style is
    pub semantic_consistency: f32,     // 0-1, how consistent semantic patterns are
    pub abbreviation_consistency: f32, // 0-1, consistency in abbreviation usage
    pub scope_consistency: f32,        // 0-1, consistency across different scopes
    pub overall_consistency: f32,      // 0-1, overall naming consistency
}

lazy_static! {
    // Semantic pattern regexes
    static ref DATA_CONTAINER_PATTERNS: Regex = Regex::new(r"(list|array|collection|set|map|dict|vector|queue|stack|buffer|cache|pool|batch|group|series|sequence)").unwrap();
    static ref STATE_PATTERNS: Regex = Regex::new(r"(current|previous|next|last|first|initial|final|temp|temporary|old|new|original|updated|modified|cached|stored|loaded|saved)").unwrap();
    static ref COUNTER_PATTERNS: Regex = Regex::new(r"(count|counter|index|idx|iterator|iter|position|pos|offset|step|page|limit|size|length|len|total|sum|max|min|avg|mean)").unwrap();
    static ref FLAG_PATTERNS: Regex = Regex::new(r"(flag|enabled|disabled|active|inactive|valid|invalid|ready|busy|loading|loaded|error|success|complete|finished|started|stopped|paused|running|waiting|pending|cancelled|expired|locked|unlocked)").unwrap();
    static ref CONFIG_PATTERNS: Regex = Regex::new(r"(config|configuration|settings|options|params|parameters|args|arguments|props|properties|attributes|metadata|data|info|details|spec|specification)").unwrap();
    static ref ID_PATTERNS: Regex = Regex::new(r"(id|identifier|key|name|title|label|tag|code|token|hash|uuid|guid|slug|handle|reference|ref|link|url|uri|path|address)").unwrap();
    static ref TEMPORAL_PATTERNS: Regex = Regex::new(r"(time|timestamp|date|datetime|start|end|begin|finish|duration|timeout|interval|delay|period|schedule|deadline|created|updated|modified|deleted|expired)").unwrap();
    static ref SIZE_PATTERNS: Regex = Regex::new(r"(width|height|size|length|count|total|amount|quantity|volume|capacity|limit|max|min|range|scale|ratio|percentage|percent|factor|multiplier|weight|mass|area|radius|diameter)").unwrap();
    
    // Boolean variable patterns
    static ref BOOLEAN_PATTERNS: Regex = Regex::new(r"^(is|has|can|should|will|could|would|might|may|must|need|want|allow|permit|enable|disable|check|test|verify|validate|confirm|ensure)").unwrap();
    
    // Array/list patterns
    static ref PLURAL_PATTERNS: Regex = Regex::new(r"(s|es|ies|ves|children|people|data|items)$").unwrap();
    
    // Common abbreviations
    static ref COMMON_ABBREVIATIONS: [(&'static str, &'static str); 50] = [
        ("btn", "button"), ("cfg", "config"), ("ctx", "context"), ("db", "database"),
        ("doc", "document"), ("elem", "element"), ("err", "error"), ("evt", "event"),
        ("fn", "function"), ("img", "image"), ("idx", "index"), ("len", "length"),
        ("max", "maximum"), ("min", "minimum"), ("msg", "message"), ("num", "number"),
        ("obj", "object"), ("opt", "option"), ("pwd", "password"), ("qty", "quantity"),
        ("req", "request"), ("res", "response"), ("src", "source"), ("str", "string"),
        ("tmp", "temporary"), ("url", "uniform_resource_locator"), ("usr", "user"),
        ("val", "value"), ("var", "variable"), ("win", "window"), ("pos", "position"),
        ("prev", "previous"), ("curr", "current"), ("next", "next"), ("temp", "temporary"),
        ("info", "information"), ("data", "data"), ("util", "utility"), ("mgr", "manager"),
        ("svc", "service"), ("api", "application_programming_interface"), ("ui", "user_interface"),
        ("id", "identifier"), ("ref", "reference"), ("addr", "address"), ("auth", "authentication"),
        ("lang", "language"), ("desc", "description"), ("spec", "specification"), ("attr", "attribute")
    ];
}

impl VariableNamingRecognizer {
    pub fn new() -> Self {
        Self {
            parser: AstParser::new(),
        }
    }

    /// Analyze variable naming patterns in source code
    pub fn analyze_variable_naming(&self, code: &str, language: &str) -> Result<VariableNamingAnalysis, String> {
        let ast = self.parser.parse_code(code, language)?;
        let variables = self.extract_variables(&ast, language)?;

        Ok(VariableNamingAnalysis {
            naming_patterns: self.analyze_naming_patterns(&variables),
            semantic_categories: self.categorize_semantics(&variables),
            abbreviation_patterns: self.analyze_abbreviations(&variables),
            scope_based_patterns: self.analyze_scope_patterns(&variables),
            type_based_patterns: self.analyze_type_patterns(&variables),
            consistency_metrics: self.calculate_consistency_metrics(&variables),
        })
    }

    fn extract_variables(&self, ast: &ParsedAst, language: &str) -> Result<Vec<VariableInfo>, String> {
        match ast {
            ParsedAst::JavaScript(module) => {
                self.extract_javascript_variables(module, language)
            },
            ParsedAst::Python(suite) => {
                self.extract_python_variables(suite, language)
            },
            ParsedAst::Rust(items) => {
                self.extract_rust_variables(items, language)
            },
            ParsedAst::Generic(lines) => {
                self.extract_generic_variables(lines, language)
            },
        }
    }

    fn extract_javascript_variables(&self, _module: &swc_ecma_ast::Module, language: &str) -> Result<Vec<VariableInfo>, String> {
        // TODO: Implement JavaScript variable extraction
        Ok(vec![
            VariableInfo {
                name: "userCount".to_string(),
                var_type: Some("number".to_string()),
                scope: VariableScope::Local,
                line_number: 1,
                is_constant: false,
                language: language.to_string(),
            }
        ])
    }

    fn extract_python_variables(&self, _suite: &rustpython_parser::ast::Suite, language: &str) -> Result<Vec<VariableInfo>, String> {
        // TODO: Implement Python variable extraction
        Ok(vec![
            VariableInfo {
                name: "user_count".to_string(),
                var_type: Some("int".to_string()),
                scope: VariableScope::Local,
                line_number: 1,
                is_constant: false,
                language: language.to_string(),
            }
        ])
    }

    fn extract_rust_variables(&self, _items: &[syn::Item], language: &str) -> Result<Vec<VariableInfo>, String> {
        // TODO: Implement Rust variable extraction
        Ok(vec![
            VariableInfo {
                name: "user_count".to_string(),
                var_type: Some("usize".to_string()),
                scope: VariableScope::Local,
                line_number: 1,
                is_constant: false,
                language: language.to_string(),
            }
        ])
    }

    fn extract_generic_variables(&self, lines: &[String], language: &str) -> Result<Vec<VariableInfo>, String> {
        let mut variables = Vec::new();
        
        // Simple regex patterns for common variable declarations
        let var_patterns = [
            r"(?:let|const|var)\s+(\w+)",     // JavaScript
            r"(\w+)\s*=",                     // General assignment
            r"(\w+)\s*:",                     // Type annotation
            r"for\s+(\w+)\s+in",             // Loop variables
            r"def\s+\w+\([^)]*(\w+)",        // Function parameters
        ];

        for (line_num, line) in lines.iter().enumerate() {
            for pattern in &var_patterns {
                let regex = Regex::new(pattern).unwrap();
                for capture in regex.captures_iter(line) {
                    if let Some(var_name) = capture.get(1) {
                        let name = var_name.as_str().to_string();
                        if name.len() > 1 && name.chars().all(|c| c.is_alphanumeric() || c == '_') {
                            variables.push(VariableInfo {
                                name,
                                var_type: None,
                                scope: VariableScope::Local,
                                line_number: line_num as u32 + 1,
                                is_constant: line.contains("const"),
                                language: language.to_string(),
                            });
                        }
                    }
                }
            }
        }

        Ok(variables)
    }

    fn analyze_naming_patterns(&self, variables: &[VariableInfo]) -> VariableNamingPatterns {
        let names: Vec<String> = variables.iter().map(|v| v.name.clone()).collect();
        let primary_style = self.detect_primary_naming_style(&names);
        
        let style_distribution = self.calculate_style_distribution(&names);
        let (prefix_patterns, suffix_patterns) = self.extract_prefix_suffix_patterns(&names);
        let length_preferences = self.analyze_length_preferences(&names);
        let compound_word_usage = self.detect_compound_word_usage(&names);

        VariableNamingPatterns {
            primary_style,
            style_distribution,
            prefix_patterns,
            suffix_patterns,
            length_preferences,
            compound_word_usage,
        }
    }

    fn detect_primary_naming_style(&self, names: &[String]) -> crate::pattern_extractor::NamingStyle {
        if names.is_empty() {
            return crate::pattern_extractor::NamingStyle::Unknown;
        }

        let camel_case = Regex::new(r"^[a-z][a-zA-Z0-9]*$").unwrap();
        let pascal_case = Regex::new(r"^[A-Z][a-zA-Z0-9]*$").unwrap();
        let snake_case = Regex::new(r"^[a-z][a-z0-9_]*$").unwrap();
        let screaming_snake = Regex::new(r"^[A-Z][A-Z0-9_]*$").unwrap();

        let mut counts = HashMap::new();
        
        for name in names {
            if camel_case.is_match(name) {
                *counts.entry("camel").or_insert(0) += 1;
            } else if pascal_case.is_match(name) {
                *counts.entry("pascal").or_insert(0) += 1;
            } else if screaming_snake.is_match(name) {
                *counts.entry("screaming").or_insert(0) += 1;
            } else if snake_case.is_match(name) {
                *counts.entry("snake").or_insert(0) += 1;
            }
        }

        let max_style = counts.iter().max_by_key(|(_, &count)| count);
        
        match max_style {
            Some((style, _)) if *style == "camel" => crate::pattern_extractor::NamingStyle::CamelCase,
            Some((style, _)) if *style == "pascal" => crate::pattern_extractor::NamingStyle::PascalCase,
            Some((style, _)) if *style == "snake" => crate::pattern_extractor::NamingStyle::SnakeCase,
            Some((style, _)) if *style == "screaming" => crate::pattern_extractor::NamingStyle::ScreamingSnake,
            _ => crate::pattern_extractor::NamingStyle::Mixed,
        }
    }

    fn calculate_style_distribution(&self, names: &[String]) -> HashMap<String, f32> {
        let mut distribution = HashMap::new();
        if names.is_empty() {
            return distribution;
        }

        let camel_case = Regex::new(r"^[a-z][a-zA-Z0-9]*$").unwrap();
        let pascal_case = Regex::new(r"^[A-Z][a-zA-Z0-9]*$").unwrap();
        let snake_case = Regex::new(r"^[a-z][a-z0-9_]*$").unwrap();
        let screaming_snake = Regex::new(r"^[A-Z][A-Z0-9_]*$").unwrap();

        let mut counts = HashMap::new();
        
        for name in names {
            if camel_case.is_match(name) {
                *counts.entry("camelCase").or_insert(0) += 1;
            } else if pascal_case.is_match(name) {
                *counts.entry("PascalCase").or_insert(0) += 1;
            } else if screaming_snake.is_match(name) {
                *counts.entry("SCREAMING_SNAKE").or_insert(0) += 1;
            } else if snake_case.is_match(name) {
                *counts.entry("snake_case").or_insert(0) += 1;
            } else {
                *counts.entry("mixed").or_insert(0) += 1;
            }
        }

        let total = names.len() as f32;
        for (style, count) in counts {
            distribution.insert(style.to_string(), count as f32 / total);
        }

        distribution
    }

    fn extract_prefix_suffix_patterns(&self, names: &[String]) -> (HashMap<String, u32>, HashMap<String, u32>) {
        let mut prefixes = HashMap::new();
        let mut suffixes = HashMap::new();

        for name in names {
            // Extract potential prefixes (first 2-4 characters if followed by uppercase or underscore)
            if name.len() > 3 {
                for len in 2..=4.min(name.len() - 1) {
                    let prefix = &name[..len];
                    let remaining = &name[len..];
                    
                    if remaining.chars().next().map_or(false, |c| c.is_uppercase() || c == '_') {
                        *prefixes.entry(prefix.to_lowercase()).or_insert(0) += 1;
                    }
                }
            }

            // Extract potential suffixes (last 2-6 characters if preceded by lowercase or underscore)
            if name.len() > 3 {
                for len in 2..=6.min(name.len() - 1) {
                    let suffix = &name[name.len() - len..];
                    let preceding = &name[..name.len() - len];
                    
                    if preceding.chars().last().map_or(false, |c| c.is_lowercase() || c == '_') {
                        *suffixes.entry(suffix.to_lowercase()).or_insert(0) += 1;
                    }
                }
            }
        }

        // Filter out patterns that appear only once
        prefixes.retain(|_, &mut count| count > 1);
        suffixes.retain(|_, &mut count| count > 1);

        (prefixes, suffixes)
    }

    fn analyze_length_preferences(&self, names: &[String]) -> LengthPreferences {
        if names.is_empty() {
            return LengthPreferences {
                average_length: 0.0,
                min_preferred_length: 1,
                max_preferred_length: 50,
                single_letter_usage: 0.0,
                very_long_names_usage: 0.0,
            };
        }

        let lengths: Vec<usize> = names.iter().map(|name| name.len()).collect();
        let total_length: usize = lengths.iter().sum();
        let average_length = total_length as f32 / names.len() as f32;

        let single_letter_count = names.iter().filter(|name| name.len() == 1).count();
        let very_long_count = names.iter().filter(|name| name.len() > 20).count();

        let single_letter_usage = single_letter_count as f32 / names.len() as f32;
        let very_long_names_usage = very_long_count as f32 / names.len() as f32;

        let mut sorted_lengths = lengths.clone();
        sorted_lengths.sort();
        
        let min_preferred_length = sorted_lengths.get(sorted_lengths.len() / 10).copied().unwrap_or(1) as u32;
        let max_preferred_length = sorted_lengths.get(sorted_lengths.len() * 9 / 10).copied().unwrap_or(50) as u32;

        LengthPreferences {
            average_length,
            min_preferred_length,
            max_preferred_length,
            single_letter_usage,
            very_long_names_usage,
        }
    }

    fn detect_compound_word_usage(&self, names: &[String]) -> bool {
        let compound_indicators = ["_", "And", "Or", "Of", "To", "From", "With", "Without"];
        
        names.iter().any(|name| {
            compound_indicators.iter().any(|indicator| name.contains(indicator))
        })
    }

    fn categorize_semantics(&self, variables: &[VariableInfo]) -> SemanticCategories {
        let mut categories = SemanticCategories {
            data_containers: HashMap::new(),
            state_variables: HashMap::new(),
            counters_iterators: HashMap::new(),
            flags_booleans: HashMap::new(),
            configuration: HashMap::new(),
            identifiers: HashMap::new(),
            temporal_variables: HashMap::new(),
            size_dimensions: HashMap::new(),
        };

        for var in variables {
            let name_lower = var.name.to_lowercase();
            
            if DATA_CONTAINER_PATTERNS.is_match(&name_lower) {
                *categories.data_containers.entry(var.name.clone()).or_insert(0) += 1;
            }
            if STATE_PATTERNS.is_match(&name_lower) {
                *categories.state_variables.entry(var.name.clone()).or_insert(0) += 1;
            }
            if COUNTER_PATTERNS.is_match(&name_lower) {
                *categories.counters_iterators.entry(var.name.clone()).or_insert(0) += 1;
            }
            if FLAG_PATTERNS.is_match(&name_lower) || BOOLEAN_PATTERNS.is_match(&name_lower) {
                *categories.flags_booleans.entry(var.name.clone()).or_insert(0) += 1;
            }
            if CONFIG_PATTERNS.is_match(&name_lower) {
                *categories.configuration.entry(var.name.clone()).or_insert(0) += 1;
            }
            if ID_PATTERNS.is_match(&name_lower) {
                *categories.identifiers.entry(var.name.clone()).or_insert(0) += 1;
            }
            if TEMPORAL_PATTERNS.is_match(&name_lower) {
                *categories.temporal_variables.entry(var.name.clone()).or_insert(0) += 1;
            }
            if SIZE_PATTERNS.is_match(&name_lower) {
                *categories.size_dimensions.entry(var.name.clone()).or_insert(0) += 1;
            }
        }

        categories
    }

    fn analyze_abbreviations(&self, variables: &[VariableInfo]) -> AbbreviationPatterns {
        let mut common_abbreviations = HashMap::new();
        let domain_abbreviations = HashMap::new();
        
        // Populate with detected abbreviations
        for &(abbr, full) in COMMON_ABBREVIATIONS.iter() {
            for var in variables {
                if var.name.to_lowercase().contains(abbr) {
                    common_abbreviations.insert(abbr.to_string(), full.to_string());
                }
            }
        }

        let total_vars = variables.len() as f32;
        let abbreviated_count = variables.iter()
            .filter(|var| var.name.len() <= 4 || COMMON_ABBREVIATIONS.iter().any(|(abbr, _)| var.name.to_lowercase().contains(abbr)))
            .count() as f32;
        
        let abbreviation_percentage = if total_vars > 0.0 { abbreviated_count / total_vars } else { 0.0 };

        AbbreviationPatterns {
            common_abbreviations,
            domain_abbreviations,
            length_thresholds: AbbreviationThresholds {
                min_word_length_for_abbreviation: 6,
                max_abbreviation_length: 4,
                abbreviation_percentage,
            },
            consistency_score: 0.8, // Placeholder - would need more sophisticated analysis
        }
    }

    fn analyze_scope_patterns(&self, variables: &[VariableInfo]) -> ScopeBasedPatterns {
        let local_vars: Vec<_> = variables.iter().filter(|v| matches!(v.scope, VariableScope::Local)).collect();
        let global_vars: Vec<_> = variables.iter().filter(|v| matches!(v.scope, VariableScope::Global)).collect();
        let field_vars: Vec<_> = variables.iter().filter(|v| matches!(v.scope, VariableScope::Field)).collect();
        let const_vars: Vec<_> = variables.iter().filter(|v| v.is_constant).collect();
        let param_vars: Vec<_> = variables.iter().filter(|v| matches!(v.scope, VariableScope::Parameter)).collect();

        ScopeBasedPatterns {
            local_variable_patterns: self.analyze_scope_style(&local_vars),
            class_field_patterns: self.analyze_scope_style(&field_vars),
            global_variable_patterns: self.analyze_scope_style(&global_vars),
            constant_patterns: self.analyze_scope_style(&const_vars),
            parameter_patterns: self.analyze_scope_style(&param_vars),
        }
    }

    fn analyze_scope_style(&self, variables: &[&VariableInfo]) -> VariableStylePreferences {
        let names: Vec<String> = variables.iter().map(|v| v.name.clone()).collect();
        let naming_style = self.detect_primary_naming_style(&names);
        
        let (prefixes, suffixes) = self.extract_prefix_suffix_patterns(&names);
        let common_prefixes: Vec<String> = prefixes.into_keys().collect();
        let common_suffixes: Vec<String> = suffixes.into_keys().collect();
        
        let average_length = if names.is_empty() {
            0.0
        } else {
            names.iter().map(|n| n.len()).sum::<usize>() as f32 / names.len() as f32
        };

        // Simple descriptiveness score based on average length and common patterns
        let descriptiveness_score = (average_length / 20.0).min(1.0);

        VariableStylePreferences {
            naming_style,
            common_prefixes,
            common_suffixes,
            average_length,
            descriptiveness_score,
        }
    }

    fn analyze_type_patterns(&self, variables: &[VariableInfo]) -> TypeBasedPatterns {
        // Group variables by inferred type
        let string_vars: Vec<_> = variables.iter().filter(|v| 
            v.var_type.as_ref().map_or(false, |t| t.to_lowercase().contains("string") || t.to_lowercase().contains("str"))
        ).collect();
        
        let number_vars: Vec<_> = variables.iter().filter(|v|
            v.var_type.as_ref().map_or(false, |t| 
                t.to_lowercase().contains("number") || t.to_lowercase().contains("int") || 
                t.to_lowercase().contains("float") || t.to_lowercase().contains("double")
            )
        ).collect();

        let boolean_vars: Vec<_> = variables.iter().filter(|v|
            v.var_type.as_ref().map_or(false, |t| t.to_lowercase().contains("bool")) ||
            BOOLEAN_PATTERNS.is_match(&v.name.to_lowercase())
        ).collect();

        TypeBasedPatterns {
            string_variable_patterns: self.analyze_type_specific_patterns(&string_vars),
            number_variable_patterns: self.analyze_type_specific_patterns(&number_vars),
            boolean_variable_patterns: self.analyze_type_specific_patterns(&boolean_vars),
            array_variable_patterns: self.analyze_type_specific_patterns(&[]), // TODO: Detect arrays
            object_variable_patterns: self.analyze_type_specific_patterns(&[]), // TODO: Detect objects
            function_variable_patterns: self.analyze_type_specific_patterns(&[]), // TODO: Detect function variables
        }
    }

    fn analyze_type_specific_patterns(&self, variables: &[&VariableInfo]) -> TypeSpecificPatterns {
        let mut common_names = HashMap::new();
        let mut prefix_usage = HashMap::new();
        let mut suffix_usage = HashMap::new();

        for var in variables {
            common_names.insert(var.name.clone(), 1);
            
            // Extract prefixes and suffixes
            if var.name.len() > 3 {
                let prefix = &var.name[..3];
                *prefix_usage.entry(prefix.to_string()).or_insert(0) += 1;
                
                let suffix = &var.name[var.name.len().saturating_sub(3)..];
                *suffix_usage.entry(suffix.to_string()).or_insert(0) += 1;
            }
        }

        TypeSpecificPatterns {
            common_names,
            naming_conventions: vec![], // TODO: Implement pattern detection
            prefix_usage,
            suffix_usage,
        }
    }

    fn calculate_consistency_metrics(&self, variables: &[VariableInfo]) -> NamingConsistencyMetrics {
        let names: Vec<String> = variables.iter().map(|v| v.name.clone()).collect();
        
        // Calculate style consistency
        let style_distribution = self.calculate_style_distribution(&names);
        let max_style_percentage = style_distribution.values().fold(0.0f32, |max, &val| max.max(val));
        let style_consistency = max_style_percentage;

        // Placeholder calculations for other metrics
        let semantic_consistency = 0.8;
        let abbreviation_consistency = 0.75;
        let scope_consistency = 0.85;
        
        let overall_consistency = (style_consistency + semantic_consistency + abbreviation_consistency + scope_consistency) / 4.0;

        NamingConsistencyMetrics {
            style_consistency,
            semantic_consistency,
            abbreviation_consistency,
            scope_consistency,
            overall_consistency,
        }
    }
}

#[derive(Debug, Clone)]
pub struct VariableInfo {
    pub name: String,
    pub var_type: Option<String>,
    pub scope: VariableScope,
    pub line_number: u32,
    pub is_constant: bool,
    pub language: String,
}

#[derive(Debug, Clone)]
pub enum VariableScope {
    Local,
    Global,
    Field,
    Parameter,
    Static,
}

impl Default for VariableNamingRecognizer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_variable_naming_recognizer_creation() {
        let recognizer = VariableNamingRecognizer::new();
        // Basic smoke test
        assert!(true);
    }

    #[test]
    fn test_naming_style_detection() {
        let recognizer = VariableNamingRecognizer::new();
        
        let camel_names = vec!["userName".to_string(), "isActive".to_string(), "maxCount".to_string()];
        let style = recognizer.detect_primary_naming_style(&camel_names);
        assert!(matches!(style, crate::pattern_extractor::NamingStyle::CamelCase));
        
        let snake_names = vec!["user_name".to_string(), "is_active".to_string(), "max_count".to_string()];
        let style = recognizer.detect_primary_naming_style(&snake_names);
        assert!(matches!(style, crate::pattern_extractor::NamingStyle::SnakeCase));
    }

    #[test]
    fn test_prefix_suffix_extraction() {
        let recognizer = VariableNamingRecognizer::new();
        let names = vec![
            "getUserData".to_string(),
            "setUserProfile".to_string(),
            "isUserActive".to_string(),
            "hasUserPermission".to_string(),
        ];
        
        let (prefixes, _suffixes) = recognizer.extract_prefix_suffix_patterns(&names);
        assert!(prefixes.contains_key("get") || prefixes.contains_key("set") || prefixes.contains_key("is") || prefixes.contains_key("has"));
    }

    #[test]
    fn test_semantic_categorization() {
        let recognizer = VariableNamingRecognizer::new();
        let variables = vec![
            VariableInfo {
                name: "userList".to_string(),
                var_type: Some("Array".to_string()),
                scope: VariableScope::Local,
                line_number: 1,
                is_constant: false,
                language: "javascript".to_string(),
            },
            VariableInfo {
                name: "currentUser".to_string(),
                var_type: Some("Object".to_string()),
                scope: VariableScope::Local,
                line_number: 2,
                is_constant: false,
                language: "javascript".to_string(),
            },
            VariableInfo {
                name: "itemCount".to_string(),
                var_type: Some("number".to_string()),
                scope: VariableScope::Local,
                line_number: 3,
                is_constant: false,
                language: "javascript".to_string(),
            },
        ];
        
        let categories = recognizer.categorize_semantics(&variables);
        
        assert!(!categories.data_containers.is_empty() || 
                !categories.state_variables.is_empty() || 
                !categories.counters_iterators.is_empty());
    }

    #[test]
    fn test_abbreviation_analysis() {
        let recognizer = VariableNamingRecognizer::new();
        let variables = vec![
            VariableInfo {
                name: "btn".to_string(),
                var_type: None,
                scope: VariableScope::Local,
                line_number: 1,
                is_constant: false,
                language: "javascript".to_string(),
            },
            VariableInfo {
                name: "cfg".to_string(),
                var_type: None,
                scope: VariableScope::Local,
                line_number: 2,
                is_constant: false,
                language: "javascript".to_string(),
            },
        ];
        
        let abbreviations = recognizer.analyze_abbreviations(&variables);
        assert!(abbreviations.length_thresholds.abbreviation_percentage > 0.0);
    }

    #[test]
    fn test_generic_variable_extraction() {
        let recognizer = VariableNamingRecognizer::new();
        let code_lines = vec![
            "let userName = 'John';".to_string(),
            "const maxRetries = 3;".to_string(),
            "var isActive = true;".to_string(),
        ];
        
        let variables = recognizer.extract_generic_variables(&code_lines, "javascript").unwrap();
        assert_eq!(variables.len(), 3);
        assert_eq!(variables[0].name, "userName");
        assert_eq!(variables[1].name, "maxRetries");
        assert!(variables[1].is_constant);
    }
}
