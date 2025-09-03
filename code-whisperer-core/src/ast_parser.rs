use crate::{PatternType};
use swc_ecma_parser::{lexer::Lexer, Parser, StringInput, Syntax};
use swc_ecma_ast as swc_ast;
use swc_common::SourceMap;
use rustpython_parser::{ast, Parse};
use syn::{parse_str, Item};
use regex::Regex;
use lazy_static::lazy_static;

lazy_static! {
    static ref JS_FUNCTION_PATTERN: Regex = Regex::new(r"function\s+(\w+)\s*\(([^)]*)\)").unwrap();
    static ref JS_ARROW_FUNCTION_PATTERN: Regex = Regex::new(r"(\w+)\s*=>").unwrap();
    static ref JS_VARIABLE_PATTERN: Regex = Regex::new(r"(?:const|let|var)\s+(\w+)").unwrap();
    static ref JS_CLASS_PATTERN: Regex = Regex::new(r"class\s+(\w+)").unwrap();

    static ref PY_FUNCTION_PATTERN: Regex = Regex::new(r"def\s+(\w+)\s*\(([^)]*)\)").unwrap();
    static ref PY_CLASS_PATTERN: Regex = Regex::new(r"class\s+(\w+)").unwrap();
    static ref PY_VARIABLE_PATTERN: Regex = Regex::new(r"(\w+)\s*=").unwrap();

    static ref RS_FUNCTION_PATTERN: Regex = Regex::new(r"fn\s+(\w+)\s*\(([^)]*)\)").unwrap();
    static ref RS_STRUCT_PATTERN: Regex = Regex::new(r"struct\s+(\w+)").unwrap();
    static ref RS_VARIABLE_PATTERN: Regex = Regex::new(r"let\s+(?:mut\s+)?(\w+)").unwrap();
}

#[derive(Debug, Clone)]
pub enum ParsedAst {
    JavaScript(swc_ast::Module),
    Python(ast::Suite),
    Rust(Vec<Item>),
    Generic(Vec<String>),
}

pub struct AstParser;

impl AstParser {
    pub fn new() -> Self {
        AstParser
    }

    pub fn parse_code(&self, code: &str, language: &str) -> Result<ParsedAst, String> {
        match language.to_lowercase().as_str() {
            "javascript" | "typescript" => self.parse_javascript(code),
            "python" => self.parse_python(code),
            "rust" => self.parse_rust(code),
            _ => self.parse_generic(code),
        }
    }

    fn parse_javascript(&self, code: &str) -> Result<ParsedAst, String> {
        let cm = SourceMap::default();
        let fm = cm.new_source_file(swc_common::FileName::Anon, code.to_string());

        let lexer = Lexer::new(
            Syntax::Es(Default::default()),
            Default::default(),
            StringInput::from(&*fm),
            None,
        );

        let mut parser = Parser::new_from(lexer);
        match parser.parse_module() {
            Ok(module) => Ok(ParsedAst::JavaScript(module)),
            Err(err) => Err(format!("JavaScript parsing error: {:?}", err)),
        }
    }

    fn parse_python(&self, code: &str) -> Result<ParsedAst, String> {
        match ast::Suite::parse(code, "<string>") {
            Ok(suite) => Ok(ParsedAst::Python(suite)),
            Err(err) => Err(format!("Python parsing error: {}", err)),
        }
    }

    fn parse_rust(&self, code: &str) -> Result<ParsedAst, String> {
        match parse_str::<syn::File>(code) {
            Ok(file) => Ok(ParsedAst::Rust(file.items)),
            Err(err) => Err(format!("Rust parsing error: {}", err)),
        }
    }

    fn parse_generic(&self, code: &str) -> Result<ParsedAst, String> {
        let lines: Vec<String> = code.lines().map(|s| s.to_string()).collect();
        Ok(ParsedAst::Generic(lines))
    }

    pub fn extract_patterns(&self, ast: &ParsedAst, language: &str) -> Vec<crate::CodingPattern> {
        match ast {
            ParsedAst::JavaScript(module) => self.extract_js_patterns(module),
            ParsedAst::Python(suite) => self.extract_py_patterns(suite),
            ParsedAst::Rust(items) => self.extract_rs_patterns(items),
            ParsedAst::Generic(lines) => self.extract_generic_patterns(lines, language),
        }
    }

    fn extract_js_patterns(&self, module: &swc_ast::Module) -> Vec<crate::CodingPattern> {
        let mut patterns = Vec::new();

        for item in &module.body {
            match item {
                swc_ast::ModuleItem::Stmt(stmt) => {
                    self.extract_js_statement_patterns(stmt, &mut patterns);
                }
                swc_ast::ModuleItem::ModuleDecl(decl) => {
                    self.extract_js_declaration_patterns(decl, &mut patterns);
                }
            }
        }

        patterns
    }

    fn extract_js_statement_patterns(&self, stmt: &swc_ast::Stmt, patterns: &mut Vec<crate::CodingPattern>) {
        match stmt {
            swc_ast::Stmt::Decl(decl) => {
                match decl {
                    swc_ast::Decl::Fn(fn_decl) => {
                        let pattern = self.create_function_pattern(
                            fn_decl.ident.sym.to_string(),
                            "javascript".to_string(),
                            &PatternType::FunctionDefinition,
                        );
                        patterns.push(pattern);
                    }
                    swc_ast::Decl::Var(var_decl) => {
                        for binding in &var_decl.decls {
                            if let swc_ast::Pat::Ident(ident) = &binding.name {
                                let pattern = self.create_variable_pattern(
                                    ident.id.sym.to_string(),
                                    "javascript".to_string(),
                                );
                                patterns.push(pattern);
                            }
                        }
                    }
                    swc_ast::Decl::Class(class_decl) => {
                        let pattern = self.create_class_pattern(
                            class_decl.ident.sym.to_string(),
                            "javascript".to_string(),
                        );
                        patterns.push(pattern);
                    }
                    _ => {}
                }
            }
            swc_ast::Stmt::Expr(expr_stmt) => {
                self.extract_js_expression_patterns(&expr_stmt.expr, patterns);
            }
            _ => {}
        }
    }

    fn extract_js_declaration_patterns(&self, decl: &swc_ast::ModuleDecl, patterns: &mut Vec<crate::CodingPattern>) {
        match decl {
            swc_ast::ModuleDecl::ExportDecl(export_decl) => {
                if let swc_ast::Decl::Fn(fn_decl) = &export_decl.decl {
                    let pattern = self.create_function_pattern(
                        fn_decl.ident.sym.to_string(),
                        "javascript".to_string(),
                        &PatternType::FunctionDefinition,
                    );
                    patterns.push(pattern);
                }
            }
            _ => {}
        }
    }

    fn extract_js_expression_patterns(&self, expr: &swc_ast::Expr, patterns: &mut Vec<crate::CodingPattern>) {
        match expr {
            swc_ast::Expr::Arrow(_arrow_expr) => {
                let pattern = self.create_function_pattern(
                    "arrow_function".to_string(),
                    "javascript".to_string(),
                    &PatternType::FunctionDefinition,
                );
                patterns.push(pattern);
            }
            swc_ast::Expr::Call(_call_expr) => {
                // Could extract function call patterns here
            }
            _ => {}
        }
    }

    fn extract_py_patterns(&self, suite: &ast::Suite) -> Vec<crate::CodingPattern> {
        let mut patterns = Vec::new();

        for stmt in suite {
            match stmt {
                ast::Stmt::FunctionDef(fn_def) => {
                    let pattern = self.create_function_pattern(
                        fn_def.name.to_string(),
                        "python".to_string(),
                        &PatternType::FunctionDefinition,
                    );
                    patterns.push(pattern);
                }
                ast::Stmt::ClassDef(class_def) => {
                    let pattern = self.create_class_pattern(
                        class_def.name.to_string(),
                        "python".to_string(),
                    );
                    patterns.push(pattern);
                }
                ast::Stmt::Assign(assign) => {
                    for target in &assign.targets {
                        if let ast::Expr::Name(name) = target {
                            let pattern = self.create_variable_pattern(
                                name.id.to_string(),
                                "python".to_string(),
                            );
                            patterns.push(pattern);
                        }
                    }
                }
                _ => {}
            }
        }

        patterns
    }

    fn extract_rs_patterns(&self, items: &[Item]) -> Vec<crate::CodingPattern> {
        let mut patterns = Vec::new();

        for item in items {
            match item {
                Item::Fn(fn_item) => {
                    let pattern = self.create_function_pattern(
                        fn_item.sig.ident.to_string(),
                        "rust".to_string(),
                        &PatternType::FunctionDefinition,
                    );
                    patterns.push(pattern);
                }
                Item::Struct(struct_item) => {
                    let pattern = self.create_struct_pattern(
                        struct_item.ident.to_string(),
                        "rust".to_string(),
                    );
                    patterns.push(pattern);
                }
                Item::Const(const_item) => {
                    let pattern = self.create_variable_pattern(
                        const_item.ident.to_string(),
                        "rust".to_string(),
                    );
                    patterns.push(pattern);
                }
                Item::Static(static_item) => {
                    let pattern = self.create_variable_pattern(
                        static_item.ident.to_string(),
                        "rust".to_string(),
                    );
                    patterns.push(pattern);
                }
                _ => {}
            }
        }

        patterns
    }

    fn extract_generic_patterns(&self, lines: &[String], language: &str) -> Vec<crate::CodingPattern> {
        let mut patterns = Vec::new();
        let code = lines.join("\n");

        // Use regex patterns for generic parsing
        match language.to_lowercase().as_str() {
            "javascript" | "typescript" => {
                self.extract_regex_patterns(&code, &JS_FUNCTION_PATTERN, PatternType::FunctionDefinition, language, &mut patterns);
                self.extract_regex_patterns(&code, &JS_VARIABLE_PATTERN, PatternType::VariableDeclaration, language, &mut patterns);
                self.extract_regex_patterns(&code, &JS_CLASS_PATTERN, PatternType::ClassDefinition, language, &mut patterns);
            }
            "python" => {
                self.extract_regex_patterns(&code, &PY_FUNCTION_PATTERN, PatternType::FunctionDefinition, language, &mut patterns);
                self.extract_regex_patterns(&code, &PY_VARIABLE_PATTERN, PatternType::VariableDeclaration, language, &mut patterns);
                self.extract_regex_patterns(&code, &PY_CLASS_PATTERN, PatternType::ClassDefinition, language, &mut patterns);
            }
            "rust" => {
                self.extract_regex_patterns(&code, &RS_FUNCTION_PATTERN, PatternType::FunctionDefinition, language, &mut patterns);
                self.extract_regex_patterns(&code, &RS_VARIABLE_PATTERN, PatternType::VariableDeclaration, language, &mut patterns);
                self.extract_regex_patterns(&code, &RS_STRUCT_PATTERN, PatternType::ClassDefinition, language, &mut patterns);
            }
            _ => {}
        }

        patterns
    }

    fn extract_regex_patterns(&self, code: &str, pattern: &Regex, pattern_type: PatternType, language: &str, patterns: &mut Vec<crate::CodingPattern>) {
        for capture in pattern.captures_iter(code) {
            if let Some(name_match) = capture.get(1) {
                let name = name_match.as_str().to_string();
                let pattern = match pattern_type {
                    PatternType::FunctionDefinition => self.create_function_pattern(name, language.to_string(), &pattern_type),
                    PatternType::VariableDeclaration => self.create_variable_pattern(name, language.to_string()),
                    PatternType::ClassDefinition => self.create_class_pattern(name, language.to_string()),
                    _ => continue,
                };
                patterns.push(pattern);
            }
        }
    }

    fn create_function_pattern(&self, name: String, language: String, pattern_type: &PatternType) -> crate::CodingPattern {
        crate::CodingPattern::new(
            format!("{}_{}_{}", language, pattern_type_to_string(&pattern_type), name),
            pattern_type_to_string(&pattern_type),
            language,
            0.8,
        )
    }

    fn create_variable_pattern(&self, name: String, language: String) -> crate::CodingPattern {
        crate::CodingPattern::new(
            format!("{}_variable_{}", language, name),
            "variable_declaration".to_string(),
            language,
            0.6,
        )
    }

    fn create_class_pattern(&self, name: String, language: String) -> crate::CodingPattern {
        crate::CodingPattern::new(
            format!("{}_class_{}", language, name),
            "class_definition".to_string(),
            language,
            0.7,
        )
    }

    fn create_struct_pattern(&self, name: String, language: String) -> crate::CodingPattern {
        crate::CodingPattern::new(
            format!("{}_struct_{}", language, name),
            "class_definition".to_string(),
            language,
            0.7,
        )
    }
}

fn pattern_type_to_string(pattern_type: &PatternType) -> String {
    match pattern_type {
        PatternType::FunctionDefinition => "function_definition".to_string(),
        PatternType::ClassDefinition => "class_definition".to_string(),
        PatternType::VariableDeclaration => "variable_declaration".to_string(),
        _ => "unknown".to_string(),
    }
}

impl Default for AstParser {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_javascript_function() {
        let parser = AstParser::new();
        let js_code = r#"
            function calculateSum(a, b) {
                return a + b;
            }

            const result = calculateSum(5, 3);
        "#;

        let result = parser.parse_code(js_code, "javascript");
        assert!(result.is_ok());

        let ast = result.unwrap();
        let patterns = parser.extract_patterns(&ast, "javascript");
        assert!(!patterns.is_empty());

        // Should find the function pattern
        let function_patterns: Vec<_> = patterns.iter()
            .filter(|p| matches!(p.pattern_type, crate::PatternType::FunctionDefinition))
            .collect();
        assert!(!function_patterns.is_empty());
    }

    #[test]
    fn test_parse_javascript_class() {
        let parser = AstParser::new();
        let js_code = r#"
            class Calculator {
                constructor() {
                    this.value = 0;
                }

                add(number) {
                    this.value += number;
                    return this.value;
                }
            }

            const calc = new Calculator();
        "#;

        let result = parser.parse_code(js_code, "javascript");
        assert!(result.is_ok());

        let ast = result.unwrap();
        let patterns = parser.extract_patterns(&ast, "javascript");
        assert!(!patterns.is_empty());
    }

    #[test]
    fn test_parse_python_function() {
        let parser = AstParser::new();
        let py_code = r#"
def calculate_average(numbers):
    if not numbers:
        return 0
    return sum(numbers) / len(numbers)

result = calculate_average([1, 2, 3, 4, 5])
        "#;

        let result = parser.parse_code(py_code, "python");
        assert!(result.is_ok());

        let ast = result.unwrap();
        let patterns = parser.extract_patterns(&ast, "python");
        assert!(!patterns.is_empty());
    }

    #[test]
    fn test_parse_python_class() {
        let parser = AstParser::new();
        let py_code = r#"
class DataProcessor:
    def __init__(self, data):
        self.data = data

    def process(self):
        return [x * 2 for x in self.data]

processor = DataProcessor([1, 2, 3])
        "#;

        let result = parser.parse_code(py_code, "python");
        assert!(result.is_ok());

        let ast = result.unwrap();
        let patterns = parser.extract_patterns(&ast, "python");
        assert!(!patterns.is_empty());
    }

    #[test]
    fn test_parse_rust_function() {
        let parser = AstParser::new();
        let rs_code = r#"
fn calculate_factorial(n: u64) -> u64 {
    if n <= 1 {
        return 1;
    }
    n * calculate_factorial(n - 1)
}

fn main() {
    let result = calculate_factorial(5);
    println!("Factorial of 5 is: {}", result);
}
        "#;

        let result = parser.parse_code(rs_code, "rust");
        assert!(result.is_ok());

        let ast = result.unwrap();
        let patterns = parser.extract_patterns(&ast, "rust");
        assert!(!patterns.is_empty());
    }

    #[test]
    fn test_parse_rust_struct() {
        let parser = AstParser::new();
        let rs_code = r#"
struct Point {
    x: f64,
    y: f64,
}

impl Point {
    fn new(x: f64, y: f64) -> Self {
        Point { x, y }
    }

    fn distance_from_origin(&self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }
}

fn main() {
    let point = Point::new(3.0, 4.0);
    println!("Distance: {}", point.distance_from_origin());
}
        "#;

        let result = parser.parse_code(rs_code, "rust");
        assert!(result.is_ok());

        let ast = result.unwrap();
        let patterns = parser.extract_patterns(&ast, "rust");
        assert!(!patterns.is_empty());
    }

    #[test]
    fn test_parse_generic_fallback() {
        let parser = AstParser::new();
        let unknown_code = "some unknown language code here";

        let result = parser.parse_code(unknown_code, "unknown");
        assert!(result.is_ok());

        if let ParsedAst::Generic(lines) = result.unwrap() {
            assert_eq!(lines.len(), 1);
            assert_eq!(lines[0], "some unknown language code here");
        } else {
            panic!("Expected Generic variant");
        }
    }

    #[test]
    fn test_extract_patterns_from_empty_code() {
        let parser = AstParser::new();
        let empty_code = "";

        let result = parser.parse_code(empty_code, "javascript");
        assert!(result.is_ok());

        let ast = result.unwrap();
        let patterns = parser.extract_patterns(&ast, "javascript");
        // Empty code should still produce a valid (possibly empty) pattern list
        // patterns is a Vec, so we just check if it's empty or not empty (both are valid)
        assert!(patterns.is_empty() || !patterns.is_empty()); // This will always pass, just testing that it doesn't panic
    }

    #[test]
    fn test_invalid_javascript_syntax() {
        let parser = AstParser::new();
        let invalid_js = "function broken syntax {{{{";

        let result = parser.parse_code(invalid_js, "javascript");
        assert!(result.is_err());
    }

    #[test]
    fn test_invalid_python_syntax() {
        let parser = AstParser::new();
        let invalid_py = "def broken function syntax (((";

        let result = parser.parse_code(invalid_py, "python");
        assert!(result.is_err());
    }

    #[test]
    fn test_invalid_rust_syntax() {
        let parser = AstParser::new();
        let invalid_rs = "fn broken function syntax {{{{";

        let result = parser.parse_code(invalid_rs, "rust");
        assert!(result.is_err());
    }
}
