use crate::{CodingPattern, ast_parser::{AstParser, ParsedAst}};
use std::collections::HashMap;
use regex::Regex;
use lazy_static::lazy_static;
use serde::{Serialize, Deserialize}; // Tambah ini

/// Pattern extraction engine that analyzes code to identify coding patterns
pub struct PatternExtractor {
    parser: AstParser,
}

#[derive(Debug, Clone, Serialize, Deserialize)] // Tambah Serialize, Deserialize
pub struct PatternAnalysis {
    pub patterns: Vec<CodingPattern>,
    pub style_metrics: StyleMetrics,
    pub naming_conventions: NamingConventions,
    pub structure_patterns: StructurePatterns,
}

#[derive(Debug, Clone, Serialize, Deserialize)] // Tambah Serialize, Deserialize
pub struct StyleMetrics {
    pub indentation_type: IndentationType,
    pub indentation_size: u32,
    pub brace_style: BraceStyle,
    pub line_length_preference: u32,
    pub space_around_operators: bool,
    pub trailing_commas: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IndentationType {
    Spaces,
    Tabs,
    Mixed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BraceStyle {
    SameLine,    // K&R style: if (condition) {
    NextLine,    // Allman style: if (condition)\n{
    Mixed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NamingConventions {
    pub function_naming: NamingStyle,
    pub variable_naming: NamingStyle,
    pub class_naming: NamingStyle,
    pub constant_naming: NamingStyle,
    pub file_naming: NamingStyle,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NamingStyle {
    CamelCase,      // myFunction
    PascalCase,     // MyFunction
    SnakeCase,      // my_function
    KebabCase,      // my-function
    ScreamingSnake, // MY_FUNCTION
    Mixed,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StructurePatterns {
    pub preferred_file_organization: FileOrganization,
    pub function_length_preference: u32,
    pub class_structure_preference: ClassStructure,
    pub import_organization: ImportStyle,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FileOrganization {
    ImportsFirst,
    ClassesFirst,
    FunctionsFirst,
    Mixed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClassStructure {
    PropertiesFirst,
    ConstructorFirst,
    PublicMethodsFirst,
    Mixed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ImportStyle {
    Grouped,
    Alphabetical,
    ByType,
    Mixed,
}

lazy_static! {
    // Naming pattern regex
    static ref CAMEL_CASE: Regex = Regex::new(r"^[a-z][a-zA-Z0-9]*$").unwrap();
    static ref PASCAL_CASE: Regex = Regex::new(r"^[A-Z][a-zA-Z0-9]*$").unwrap();
    static ref SNAKE_CASE: Regex = Regex::new(r"^[a-z][a-z0-9_]*$").unwrap();
    static ref KEBAB_CASE: Regex = Regex::new(r"^[a-z][a-z0-9-]*$").unwrap();
    static ref SCREAMING_SNAKE: Regex = Regex::new(r"^[A-Z][A-Z0-9_]*$").unwrap();
    
    // Indentation detection
    static ref SPACES_INDENT: Regex = Regex::new(r"^( +)").unwrap();
    static ref TABS_INDENT: Regex = Regex::new(r"^(\t+)").unwrap();
    
    // Common function patterns
    static ref GETTER_PATTERN: Regex = Regex::new(r"^(get|fetch|retrieve|load)[A-Z]").unwrap();
    static ref SETTER_PATTERN: Regex = Regex::new(r"^(set|update|modify|change)[A-Z]").unwrap();
    static ref BOOLEAN_GETTER: Regex = Regex::new(r"^(is|has|can|should|will)[A-Z]").unwrap();
    static ref ACTION_PATTERN: Regex = Regex::new(r"^(create|delete|remove|add|insert|process|handle|execute|run|perform)").unwrap();
}

impl PatternExtractor {
    pub fn new() -> Self {
        Self {
            parser: AstParser::new(),
        }
    }

    /// Extract comprehensive patterns from source code
    pub fn extract_patterns(&self, code: &str, language: &str) -> Result<PatternAnalysis, String> {
        let ast = self.parser.parse_code(code, language)?;
        
        let mut analysis = PatternAnalysis {
            patterns: Vec::new(),
            style_metrics: self.analyze_style_metrics(code),
            naming_conventions: self.analyze_naming_conventions(&ast, language),
            structure_patterns: self.analyze_structure_patterns(&ast, code, language),
        };

        // Extract different types of patterns
        analysis.patterns.extend(self.extract_function_patterns(&ast, language)?);
        analysis.patterns.extend(self.extract_class_patterns(&ast, language)?);
        analysis.patterns.extend(self.extract_variable_patterns(&ast, language)?);
        analysis.patterns.extend(self.extract_control_flow_patterns(&ast, language)?);
        analysis.patterns.extend(self.extract_error_handling_patterns(&ast, language)?);

        Ok(analysis)
    }

    /// Analyze coding style metrics from raw source code
    fn analyze_style_metrics(&self, code: &str) -> StyleMetrics {
        let lines: Vec<&str> = code.lines().collect();
        
        let indentation = self.detect_indentation(&lines);
        let brace_style = self.detect_brace_style(&lines);
        let avg_line_length = self.calculate_average_line_length(&lines);
        let space_around_operators = self.detect_space_around_operators(code);
        let trailing_commas = self.detect_trailing_commas(code);

        StyleMetrics {
            indentation_type: indentation.0,
            indentation_size: indentation.1,
            brace_style,
            line_length_preference: avg_line_length,
            space_around_operators,
            trailing_commas,
        }
    }

    /// Detect indentation style and size
    fn detect_indentation(&self, lines: &[&str]) -> (IndentationType, u32) {
        let mut space_indents = 0;
        let mut tab_indents = 0;
        let mut space_sizes = Vec::new();

        for line in lines {
            if let Some(caps) = SPACES_INDENT.captures(line) {
                space_indents += 1;
                space_sizes.push(caps[1].len() as u32);
            } else if TABS_INDENT.is_match(line) {
                tab_indents += 1;
            }
        }

        let indent_type = if space_indents > tab_indents {
            IndentationType::Spaces
        } else if tab_indents > space_indents {
            IndentationType::Tabs
        } else {
            IndentationType::Mixed
        };

        let indent_size = if !space_sizes.is_empty() {
            // Find the most common indentation size
            space_sizes.sort();
            let mut counts = HashMap::new();
            for &size in &space_sizes {
                *counts.entry(size).or_insert(0) += 1;
            }
            counts.iter().max_by_key(|(_, &count)| count).map(|(&size, _)| size).unwrap_or(4)
        } else {
            4 // Default to 4 spaces
        };

        (indent_type, indent_size)
    }

    /// Detect brace style preference
    fn detect_brace_style(&self, lines: &[&str]) -> BraceStyle {
        let mut same_line_count = 0;
        let mut next_line_count = 0;

        for i in 0..lines.len().saturating_sub(1) {
            let current_line = lines[i].trim();
            let next_line = lines[i + 1].trim();

            // Check for opening braces - prioritize next-line detection
            if next_line == "{" && !current_line.is_empty() && !current_line.ends_with('{') {
                next_line_count += 1;
            } else if current_line.ends_with('{') && !current_line.trim_end_matches('{').trim().is_empty() {
                same_line_count += 1;
            }
        }

        if next_line_count > same_line_count {
            BraceStyle::NextLine
        } else if same_line_count > next_line_count {
            BraceStyle::SameLine
        } else {
            BraceStyle::Mixed
        }
    }

    /// Calculate average line length
    fn calculate_average_line_length(&self, lines: &[&str]) -> u32 {
        if lines.is_empty() {
            return 80;
        }

        let total_length: usize = lines.iter().map(|line| line.len()).sum();
        (total_length / lines.len()) as u32
    }

    /// Detect space around operators preference
    fn detect_space_around_operators(&self, code: &str) -> bool {
        let spaced_operators = Regex::new(r"\s[+\-*/=<>!]+\s").unwrap();
        let unspaced_operators = Regex::new(r"[^\s][+\-*/=<>!]+[^\s]").unwrap();

        let spaced_count = spaced_operators.find_iter(code).count();
        let unspaced_count = unspaced_operators.find_iter(code).count();

        spaced_count > unspaced_count
    }

    /// Detect trailing comma preference
    fn detect_trailing_commas(&self, code: &str) -> bool {
        let trailing_comma = Regex::new(r",\s*\n\s*[}\]]").unwrap();
        trailing_comma.is_match(code)
    }

    /// Analyze naming conventions from AST
    fn analyze_naming_conventions(&self, _ast: &ParsedAst, _language: &str) -> NamingConventions {
        let mut function_names = Vec::new();
        let mut variable_names = Vec::new();
        let mut class_names = Vec::new();
        let mut constant_names = Vec::new();

        // Extract names based on language and AST structure
        match _ast {
            ParsedAst::JavaScript(module) => {
                self.extract_js_names(module, &mut function_names, &mut variable_names, &mut class_names, &mut constant_names);
            },
            ParsedAst::Python(module) => {
                self.extract_python_names(module, &mut function_names, &mut variable_names, &mut class_names, &mut constant_names);
            },
            ParsedAst::Rust(items) => {
                self.extract_rust_names(items, &mut function_names, &mut variable_names, &mut class_names, &mut constant_names);
            },
            ParsedAst::Generic(_) => {
                // For generic parsing, we can't extract specific naming patterns
            }
        }

        NamingConventions {
            function_naming: self.detect_naming_style(&function_names),
            variable_naming: self.detect_naming_style(&variable_names),
            class_naming: self.detect_naming_style(&class_names),
            constant_naming: self.detect_naming_style(&constant_names),
            file_naming: NamingStyle::Unknown, // Would need file names to analyze
        }
    }

    /// Detect naming style from a collection of names
    fn detect_naming_style(&self, names: &[String]) -> NamingStyle {
        if names.is_empty() {
            return NamingStyle::Unknown;
        }

        let mut camel_count = 0;
        let mut pascal_count = 0;
        let mut snake_count = 0;
        let mut kebab_count = 0;
        let mut screaming_count = 0;

        for name in names {
            if CAMEL_CASE.is_match(name) {
                camel_count += 1;
            } else if PASCAL_CASE.is_match(name) {
                pascal_count += 1;
            } else if SNAKE_CASE.is_match(name) {
                snake_count += 1;
            } else if KEBAB_CASE.is_match(name) {
                kebab_count += 1;
            } else if SCREAMING_SNAKE.is_match(name) {
                screaming_count += 1;
            }
        }

        let counts = [camel_count, pascal_count, snake_count, kebab_count, screaming_count];
        let max_count = counts.iter().max().unwrap();

        if camel_count == *max_count {
            NamingStyle::CamelCase
        } else if pascal_count == *max_count {
            NamingStyle::PascalCase
        } else if snake_count == *max_count {
            NamingStyle::SnakeCase
        } else if kebab_count == *max_count {
            NamingStyle::KebabCase
        } else if screaming_count == *max_count {
            NamingStyle::ScreamingSnake
        } else {
            NamingStyle::Mixed
        }
    }

    // Placeholder implementations for name extraction - these would be filled out
    // based on the actual AST structure for each language
    fn extract_js_names(&self, _module: &swc_ecma_ast::Module, _functions: &mut Vec<String>, _variables: &mut Vec<String>, _classes: &mut Vec<String>, _constants: &mut Vec<String>) {
        // TODO: Implement JavaScript name extraction
    }

    fn extract_python_names(&self, _module: &rustpython_parser::ast::Suite, _functions: &mut Vec<String>, _variables: &mut Vec<String>, _classes: &mut Vec<String>, _constants: &mut Vec<String>) {
        // TODO: Implement Python name extraction
    }

    fn extract_rust_names(&self, _items: &[syn::Item], _functions: &mut Vec<String>, _variables: &mut Vec<String>, _classes: &mut Vec<String>, _constants: &mut Vec<String>) {
        // TODO: Implement Rust name extraction
    }

    /// Analyze structure patterns
    fn analyze_structure_patterns(&self, _ast: &ParsedAst, _code: &str, _language: &str) -> StructurePatterns {
        StructurePatterns {
            preferred_file_organization: FileOrganization::Mixed,
            function_length_preference: 20, // Default
            class_structure_preference: ClassStructure::Mixed,
            import_organization: ImportStyle::Mixed,
        }
    }

    /// Extract function-related patterns
    fn extract_function_patterns(&self, _ast: &ParsedAst, _language: &str) -> Result<Vec<CodingPattern>, String> {
        // TODO: Implement function pattern extraction
        Ok(Vec::new())
    }

    /// Extract class-related patterns
    fn extract_class_patterns(&self, _ast: &ParsedAst, _language: &str) -> Result<Vec<CodingPattern>, String> {
        // TODO: Implement class pattern extraction
        Ok(Vec::new())
    }

    /// Extract variable-related patterns
    fn extract_variable_patterns(&self, _ast: &ParsedAst, _language: &str) -> Result<Vec<CodingPattern>, String> {
        // TODO: Implement variable pattern extraction
        Ok(Vec::new())
    }

    /// Extract control flow patterns
    fn extract_control_flow_patterns(&self, _ast: &ParsedAst, _language: &str) -> Result<Vec<CodingPattern>, String> {
        // TODO: Implement control flow pattern extraction
        Ok(Vec::new())
    }

    /// Extract error handling patterns
    fn extract_error_handling_patterns(&self, _ast: &ParsedAst, _language: &str) -> Result<Vec<CodingPattern>, String> {
        // TODO: Implement error handling pattern extraction
        Ok(Vec::new())
    }
}

impl Default for PatternExtractor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pattern_extractor_creation() {
        let extractor = PatternExtractor::new();
        // Basic smoke test
        assert!(true);
    }

    #[test]
    fn test_indentation_detection_spaces() {
        let extractor = PatternExtractor::new();
        let code_lines = vec![
            "function test() {",
            "    let x = 1;",
            "    let y = 2;",
            "}",
        ];
        
        let (indent_type, indent_size) = extractor.detect_indentation(&code_lines);
        assert!(matches!(indent_type, IndentationType::Spaces));
        assert_eq!(indent_size, 4);
    }

    #[test]
    fn test_indentation_detection_tabs() {
        let extractor = PatternExtractor::new();
        let code_lines = vec![
            "function test() {",
            "\tlet x = 1;",
            "\tlet y = 2;",
            "}",
        ];
        
        let (indent_type, _) = extractor.detect_indentation(&code_lines);
        assert!(matches!(indent_type, IndentationType::Tabs));
    }

    #[test]
    fn test_brace_style_detection_same_line() {
        let extractor = PatternExtractor::new();
        let code_lines = vec![
            "function test() {",
            "    if (condition) {",
            "        return true;",
            "    }",
            "}",
        ];
        
        let brace_style = extractor.detect_brace_style(&code_lines);
        assert!(matches!(brace_style, BraceStyle::SameLine));
    }

    #[test]
    fn test_brace_style_detection_next_line() {
        let extractor = PatternExtractor::new();
        let code_lines = vec![
            "function test()",
            "{",
            "    if (condition)",
            "    {",
            "        return true;",
            "    }",
            "}",
        ];
        
        let brace_style = extractor.detect_brace_style(&code_lines);
        assert!(matches!(brace_style, BraceStyle::NextLine));
    }

    #[test]
    fn test_naming_style_detection() {
        let extractor = PatternExtractor::new();
        
        let camel_names = vec!["myFunction".to_string(), "calculateSum".to_string(), "getData".to_string()];
        assert!(matches!(extractor.detect_naming_style(&camel_names), NamingStyle::CamelCase));
        
        let snake_names = vec!["my_function".to_string(), "calculate_sum".to_string(), "get_data".to_string()];
        assert!(matches!(extractor.detect_naming_style(&snake_names), NamingStyle::SnakeCase));
        
        let pascal_names = vec!["MyClass".to_string(), "DataProcessor".to_string(), "UserManager".to_string()];
        assert!(matches!(extractor.detect_naming_style(&pascal_names), NamingStyle::PascalCase));
    }

    #[test]
    fn test_space_around_operators() {
        let extractor = PatternExtractor::new();
        
        let spaced_code = "let x = a + b;\nlet y = c * d;";
        assert!(extractor.detect_space_around_operators(spaced_code));
        
        let unspaced_code = "let x=a+b;\nlet y=c*d;";
        assert!(!extractor.detect_space_around_operators(unspaced_code));
    }

    #[test]
    fn test_comprehensive_pattern_extraction() {
        let extractor = PatternExtractor::new();
        let js_code = r#"
function calculateSum(firstNumber, secondNumber) {
    if (firstNumber === null || secondNumber === null) {
        return 0;
    }
    return firstNumber + secondNumber;
}

class DataProcessor {
    constructor(inputData) {
        this.data = inputData;
        this.processedCount = 0;
    }

    processData() {
        return this.data.map(item => item * 2);
    }
}

const myProcessor = new DataProcessor([1, 2, 3]);
const result = myProcessor.processData();
        "#;

        let analysis = extractor.extract_patterns(js_code, "javascript");
        assert!(analysis.is_ok());

        let pattern_analysis = analysis.unwrap();
        
        // Check style metrics
        assert!(matches!(pattern_analysis.style_metrics.indentation_type, IndentationType::Spaces));
        assert_eq!(pattern_analysis.style_metrics.indentation_size, 4);
        assert!(matches!(pattern_analysis.style_metrics.brace_style, BraceStyle::SameLine));
        assert!(pattern_analysis.style_metrics.space_around_operators);

        // Check naming conventions
        assert!(matches!(pattern_analysis.naming_conventions.function_naming, NamingStyle::CamelCase | NamingStyle::Mixed | NamingStyle::Unknown));
        assert!(matches!(pattern_analysis.naming_conventions.variable_naming, NamingStyle::CamelCase | NamingStyle::Mixed | NamingStyle::Unknown));
        assert!(matches!(pattern_analysis.naming_conventions.class_naming, NamingStyle::PascalCase | NamingStyle::Mixed | NamingStyle::Unknown));
    }

    #[test]
    fn test_pattern_extraction_with_empty_code() {
        let extractor = PatternExtractor::new();
        let empty_code = "";

        let analysis = extractor.extract_patterns(empty_code, "javascript");
        assert!(analysis.is_ok());

        let pattern_analysis = analysis.unwrap();
        assert_eq!(pattern_analysis.style_metrics.indentation_size, 4); // Default
        assert!(pattern_analysis.patterns.is_empty());
    }
}
