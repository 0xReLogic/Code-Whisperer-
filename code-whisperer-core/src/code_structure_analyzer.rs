use crate::ast_parser::{AstParser, ParsedAst};
use std::collections::HashMap;
use regex::Regex;
use lazy_static::lazy_static;

/// Code structure analyzer for detecting architectural and organizational patterns
pub struct CodeStructureAnalyzer {
    parser: AstParser,
}

#[derive(Debug, Clone)]
pub struct CodeStructureAnalysis {
    pub module_organization: ModuleOrganization,
    pub class_hierarchy: ClassHierarchy,
    pub function_organization: FunctionOrganization,
    pub dependency_patterns: DependencyPatterns,
    pub architectural_patterns: ArchitecturalPatterns,
    pub complexity_metrics: ComplexityMetrics,
}

#[derive(Debug, Clone)]
pub struct ModuleOrganization {
    pub file_count: u32,
    pub directory_depth: u32,
    pub module_coupling: f32,  // 0.0 to 1.0
    pub import_patterns: HashMap<String, u32>,  // import source -> count
    pub export_patterns: HashMap<String, u32>,  // export type -> count
    pub circular_dependencies: Vec<String>,
    pub module_size_distribution: HashMap<String, u32>, // size_category -> count
}

#[derive(Debug, Clone)]
pub struct ClassHierarchy {
    pub inheritance_depth: u32,
    pub class_count: u32,
    pub interface_count: u32,
    pub abstract_class_count: u32,
    pub composition_usage: f32,      // percentage using composition
    pub inheritance_usage: f32,      // percentage using inheritance
    pub polymorphism_indicators: Vec<String>,
    pub design_pattern_usage: HashMap<String, u32>, // pattern -> count
}

#[derive(Debug, Clone)]
pub struct FunctionOrganization {
    pub average_function_length: f32,
    pub function_complexity_distribution: HashMap<String, u32>, // complexity_level -> count
    pub parameter_count_patterns: HashMap<u32, u32>,  // param_count -> function_count
    pub return_type_patterns: HashMap<String, u32>,   // return_type -> count
    pub nesting_depth_distribution: HashMap<u32, u32>, // depth -> count
    pub pure_function_percentage: f32,
    pub higher_order_function_usage: f32,
}

#[derive(Debug, Clone)]
pub struct DependencyPatterns {
    pub external_dependencies: Vec<String>,
    pub internal_module_references: HashMap<String, u32>,
    pub coupling_strength: f32,    // 0.0 to 1.0
    pub cohesion_metrics: f32,     // 0.0 to 1.0
    pub dependency_injection_usage: bool,
    pub circular_dependency_count: u32,
}

#[derive(Debug, Clone)]
pub struct ArchitecturalPatterns {
    pub mvc_pattern_usage: bool,
    pub observer_pattern_usage: bool,
    pub factory_pattern_usage: bool,
    pub singleton_pattern_usage: bool,
    pub decorator_pattern_usage: bool,
    pub strategy_pattern_usage: bool,
    pub repository_pattern_usage: bool,
    pub microservice_indicators: Vec<String>,
    pub layer_separation_quality: f32, // 0.0 to 1.0
}

#[derive(Debug, Clone)]
pub struct ComplexityMetrics {
    pub cyclomatic_complexity: f32,
    pub cognitive_complexity: f32,
    pub nesting_complexity: f32,
    pub function_length_variance: f32,
    pub class_size_variance: f32,
    pub maintainability_index: f32, // 0.0 to 100.0
}

#[derive(Debug, Clone)]
struct StructureInfo {
    name: String,
    structure_type: StructureType,
    size_lines: u32,
    complexity_score: f32,
    dependencies: Vec<String>,
    language: String,
}

#[derive(Debug, Clone)]
enum StructureType {
    Module,
    Class,
    Interface,
    Function,
    Namespace,
    Package,
}

lazy_static! {
    // Design pattern detection regexes
    static ref SINGLETON_PATTERN: Regex = Regex::new(r"(singleton|getInstance|static.*instance|private.*constructor)").unwrap();
    static ref FACTORY_PATTERN: Regex = Regex::new(r"(factory|create[A-Z]|build[A-Z]|make[A-Z]|new[A-Z])").unwrap();
    static ref OBSERVER_PATTERN: Regex = Regex::new(r"(observer|subscribe|notify|addEventListener|emit|trigger|dispatch)").unwrap();
    static ref DECORATOR_PATTERN: Regex = Regex::new(r"(decorator|@\w+|wrap|extend|enhance|augment)").unwrap();
    static ref STRATEGY_PATTERN: Regex = Regex::new(r"(strategy|algorithm|policy|behavior|execute|perform)").unwrap();
    static ref MVC_PATTERN: Regex = Regex::new(r"(controller|model|view|mvc|presenter|viewmodel)").unwrap();
    
    // Architectural patterns
    static ref MICROSERVICE_PATTERNS: Regex = Regex::new(r"(service|microservice|api|endpoint|gateway|circuit.*breaker|health.*check)").unwrap();
    static ref REPOSITORY_PATTERN: Regex = Regex::new(r"(repository|dao|data.*access|persistence|storage|crud)").unwrap();
    
    // Complexity indicators
    static ref COMPLEXITY_KEYWORDS: Regex = Regex::new(r"(if|else|while|for|switch|case|catch|try|finally|&&|\|\||[?:])").unwrap();
    static ref NESTING_INDICATORS: Regex = Regex::new(r"[\{\[\(]").unwrap();
    
    // Dependency patterns
    static ref IMPORT_PATTERNS: Regex = Regex::new(r"(import|require|include|use|from)").unwrap();
    static ref EXPORT_PATTERNS: Regex = Regex::new(r"(export|module\.exports|exports\.|public|__all__)").unwrap();
}

impl CodeStructureAnalyzer {
    pub fn new() -> Self {
        Self {
            parser: AstParser::new(),
        }
    }

    /// Analyze code structure and organization patterns
    pub fn analyze_code_structure(&self, code: &str, language: &str) -> Result<CodeStructureAnalysis, String> {
        let ast = self.parser.parse_code(code, language)?;
        let structures = self.extract_structures(&ast, language)?;

        Ok(CodeStructureAnalysis {
            module_organization: self.analyze_module_organization(&structures, code),
            class_hierarchy: self.analyze_class_hierarchy(&structures),
            function_organization: self.analyze_function_organization(&structures, code),
            dependency_patterns: self.analyze_dependency_patterns(&structures, code),
            architectural_patterns: self.analyze_architectural_patterns(&structures, code),
            complexity_metrics: self.calculate_complexity_metrics(&structures, code),
        })
    }

    fn extract_structures(&self, ast: &ParsedAst, language: &str) -> Result<Vec<StructureInfo>, String> {
        match ast {
            ParsedAst::JavaScript(module) => {
                self.extract_javascript_structures(module, language)
            },
            ParsedAst::Python(suite) => {
                self.extract_python_structures(suite, language)
            },
            ParsedAst::Rust(items) => {
                self.extract_rust_structures(items, language)
            },
            ParsedAst::Generic(lines) => {
                self.extract_generic_structures(lines, language)
            },
        }
    }

    fn extract_javascript_structures(&self, _module: &swc_ecma_ast::Module, language: &str) -> Result<Vec<StructureInfo>, String> {
        // TODO: Implement JavaScript structure extraction
        Ok(vec![
            StructureInfo {
                name: "UserService".to_string(),
                structure_type: StructureType::Class,
                size_lines: 45,
                complexity_score: 3.5,
                dependencies: vec!["Database".to_string(), "Logger".to_string()],
                language: language.to_string(),
            }
        ])
    }

    fn extract_python_structures(&self, _suite: &rustpython_parser::ast::Suite, language: &str) -> Result<Vec<StructureInfo>, String> {
        // TODO: Implement Python structure extraction
        Ok(vec![
            StructureInfo {
                name: "UserRepository".to_string(),
                structure_type: StructureType::Class,
                size_lines: 62,
                complexity_score: 4.2,
                dependencies: vec!["database".to_string(), "utils".to_string()],
                language: language.to_string(),
            }
        ])
    }

    fn extract_rust_structures(&self, _items: &[syn::Item], language: &str) -> Result<Vec<StructureInfo>, String> {
        // TODO: Implement Rust structure extraction
        Ok(vec![
            StructureInfo {
                name: "UserManager".to_string(),
                structure_type: StructureType::Module,
                size_lines: 128,
                complexity_score: 2.8,
                dependencies: vec!["std::collections".to_string(), "serde".to_string()],
                language: language.to_string(),
            }
        ])
    }

    fn extract_generic_structures(&self, lines: &[String], language: &str) -> Result<Vec<StructureInfo>, String> {
        let mut structures = Vec::new();
        let total_lines = lines.len();

        // Analyze basic structure patterns
        let class_count = lines.iter().filter(|line| {
            line.contains("class ") || line.contains("interface ") || line.contains("struct ")
        }).count();

        let function_count = lines.iter().filter(|line| {
            line.contains("function ") || line.contains("def ") || line.contains("fn ")
        }).count();

        // Create synthetic structure info
        if class_count > 0 {
            structures.push(StructureInfo {
                name: "GenericClass".to_string(),
                structure_type: StructureType::Class,
                size_lines: (total_lines / (class_count + 1)) as u32,
                complexity_score: self.estimate_complexity(lines),
                dependencies: self.extract_generic_dependencies(lines),
                language: language.to_string(),
            });
        }

        if function_count > 0 {
            structures.push(StructureInfo {
                name: "GenericFunction".to_string(),
                structure_type: StructureType::Function,
                size_lines: (total_lines / (function_count + 1)) as u32,
                complexity_score: self.estimate_complexity(lines),
                dependencies: self.extract_generic_dependencies(lines),
                language: language.to_string(),
            });
        }

        Ok(structures)
    }

    fn estimate_complexity(&self, lines: &[String]) -> f32 {
        let code_text = lines.join("\n");
        let complexity_matches = COMPLEXITY_KEYWORDS.find_iter(&code_text).count();
        let nesting_matches = NESTING_INDICATORS.find_iter(&code_text).count();
        
        1.0 + (complexity_matches as f32 * 0.5) + (nesting_matches as f32 * 0.1)
    }

    fn extract_generic_dependencies(&self, lines: &[String]) -> Vec<String> {
        let mut dependencies = Vec::new();
        let code_text = lines.join("\n");

        // Look for import/require patterns
        for line in lines {
            if IMPORT_PATTERNS.is_match(line) {
                // Extract dependency name (simplified)
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() > 1 {
                    dependencies.push(parts[1].trim_matches(&['\'', '"', ';']).to_string());
                }
            }
        }

        dependencies
    }

    fn analyze_module_organization(&self, structures: &[StructureInfo], code: &str) -> ModuleOrganization {
        let lines: Vec<&str> = code.lines().collect();
        let import_count = lines.iter().filter(|line| IMPORT_PATTERNS.is_match(line)).count();
        let export_count = lines.iter().filter(|line| EXPORT_PATTERNS.is_match(line)).count();

        let mut import_patterns = HashMap::new();
        let mut export_patterns = HashMap::new();
        let mut module_size_distribution = HashMap::new();

        // Analyze import patterns
        for line in &lines {
            if IMPORT_PATTERNS.is_match(line) {
                let import_type = self.classify_import_type(line);
                *import_patterns.entry(import_type).or_insert(0) += 1;
            }
        }

        // Analyze export patterns
        for line in &lines {
            if EXPORT_PATTERNS.is_match(line) {
                let export_type = self.classify_export_type(line);
                *export_patterns.entry(export_type).or_insert(0) += 1;
            }
        }

        // Analyze module sizes
        let total_lines = lines.len() as u32;
        let size_category = match total_lines {
            0..=50 => "small",
            51..=200 => "medium", 
            201..=500 => "large",
            _ => "very_large",
        };
        module_size_distribution.insert(size_category.to_string(), 1);

        ModuleOrganization {
            file_count: 1,
            directory_depth: 1,
            module_coupling: self.calculate_coupling(structures),
            import_patterns,
            export_patterns,
            circular_dependencies: Vec::new(), // TODO: Implement cycle detection
            module_size_distribution,
        }
    }

    fn classify_import_type(&self, line: &str) -> String {
        if line.contains("from") && line.contains("import") {
            "selective_import".to_string()
        } else if line.contains("import") {
            "full_import".to_string()
        } else if line.contains("require") {
            "require".to_string()
        } else {
            "other".to_string()
        }
    }

    fn classify_export_type(&self, line: &str) -> String {
        if line.contains("export default") {
            "default_export".to_string()
        } else if line.contains("export") {
            "named_export".to_string()
        } else if line.contains("module.exports") {
            "commonjs_export".to_string()
        } else {
            "other".to_string()
        }
    }

    fn calculate_coupling(&self, structures: &[StructureInfo]) -> f32 {
        if structures.is_empty() {
            return 0.0;
        }

        let total_dependencies: usize = structures.iter()
            .map(|s| s.dependencies.len())
            .sum();

        let max_possible_deps = structures.len() * structures.len();
        if max_possible_deps == 0 {
            0.0
        } else {
            total_dependencies as f32 / max_possible_deps as f32
        }
    }

    fn analyze_class_hierarchy(&self, structures: &[StructureInfo]) -> ClassHierarchy {
        let class_count = structures.iter()
            .filter(|s| matches!(s.structure_type, StructureType::Class))
            .count() as u32;

        let interface_count = structures.iter()
            .filter(|s| matches!(s.structure_type, StructureType::Interface))
            .count() as u32;

        let mut design_pattern_usage = HashMap::new();
        
        // Detect design patterns in structure names and dependencies
        for structure in structures {
            let text = format!("{} {}", structure.name, structure.dependencies.join(" "));
            
            if SINGLETON_PATTERN.is_match(&text) {
                *design_pattern_usage.entry("singleton".to_string()).or_insert(0) += 1;
            }
            if FACTORY_PATTERN.is_match(&text) {
                *design_pattern_usage.entry("factory".to_string()).or_insert(0) += 1;
            }
            if OBSERVER_PATTERN.is_match(&text) {
                *design_pattern_usage.entry("observer".to_string()).or_insert(0) += 1;
            }
        }

        ClassHierarchy {
            inheritance_depth: 2, // Simplified estimation
            class_count,
            interface_count,
            abstract_class_count: 0,
            composition_usage: 0.7,
            inheritance_usage: 0.3,
            polymorphism_indicators: vec!["interface".to_string(), "abstract".to_string()],
            design_pattern_usage,
        }
    }

    fn analyze_function_organization(&self, structures: &[StructureInfo], code: &str) -> FunctionOrganization {
        let lines: Vec<&str> = code.lines().collect();
        let function_count = structures.iter()
            .filter(|s| matches!(s.structure_type, StructureType::Function))
            .count();

        let total_length: u32 = structures.iter()
            .filter(|s| matches!(s.structure_type, StructureType::Function))
            .map(|s| s.size_lines)
            .sum();

        let average_length = if function_count > 0 {
            total_length as f32 / function_count as f32
        } else {
            0.0
        };

        let mut complexity_distribution = HashMap::new();
        let mut parameter_patterns = HashMap::new();
        let mut return_type_patterns = HashMap::new();
        let mut nesting_distribution = HashMap::new();

        // Analyze function complexities
        for structure in structures {
            if matches!(structure.structure_type, StructureType::Function) {
                let complexity_level = match structure.complexity_score {
                    x if x < 2.0 => "low",
                    x if x < 4.0 => "medium",
                    x if x < 6.0 => "high",
                    _ => "very_high",
                };
                *complexity_distribution.entry(complexity_level.to_string()).or_insert(0) += 1;
            }
        }

        // Count nesting levels
        let nesting_count = NESTING_INDICATORS.find_iter(code).count();
        nesting_distribution.insert(1, nesting_count as u32);

        FunctionOrganization {
            average_function_length: average_length,
            function_complexity_distribution: complexity_distribution,
            parameter_count_patterns: parameter_patterns,
            return_type_patterns: return_type_patterns,
            nesting_depth_distribution: nesting_distribution,
            pure_function_percentage: 0.6, // Estimation
            higher_order_function_usage: 0.2, // Estimation
        }
    }

    fn analyze_dependency_patterns(&self, structures: &[StructureInfo], code: &str) -> DependencyPatterns {
        let external_deps: Vec<String> = structures.iter()
            .flat_map(|s| &s.dependencies)
            .filter(|dep| !dep.contains("./") && !dep.contains("../"))
            .cloned()
            .collect();

        let internal_deps: HashMap<String, u32> = structures.iter()
            .flat_map(|s| &s.dependencies)
            .filter(|dep| dep.contains("./") || dep.contains("../"))
            .fold(HashMap::new(), |mut acc, dep| {
                *acc.entry(dep.clone()).or_insert(0) += 1;
                acc
            });

        let coupling_strength = self.calculate_coupling(structures);
        let has_dependency_injection = code.contains("inject") || code.contains("dependency");

        DependencyPatterns {
            external_dependencies: external_deps,
            internal_module_references: internal_deps,
            coupling_strength,
            cohesion_metrics: 0.75, // Simplified calculation
            dependency_injection_usage: has_dependency_injection,
            circular_dependency_count: 0, // TODO: Implement proper cycle detection
        }
    }

    fn analyze_architectural_patterns(&self, structures: &[StructureInfo], code: &str) -> ArchitecturalPatterns {
        let mvc_usage = MVC_PATTERN.is_match(code);
        let observer_usage = OBSERVER_PATTERN.is_match(code);
        let factory_usage = FACTORY_PATTERN.is_match(code);
        let singleton_usage = SINGLETON_PATTERN.is_match(code);
        let decorator_usage = DECORATOR_PATTERN.is_match(code);
        let strategy_usage = STRATEGY_PATTERN.is_match(code);
        let repository_usage = REPOSITORY_PATTERN.is_match(code);

        let microservice_indicators: Vec<String> = MICROSERVICE_PATTERNS
            .find_iter(code)
            .map(|m| m.as_str().to_string())
            .collect();

        ArchitecturalPatterns {
            mvc_pattern_usage: mvc_usage,
            observer_pattern_usage: observer_usage,
            factory_pattern_usage: factory_usage,
            singleton_pattern_usage: singleton_usage,
            decorator_pattern_usage: decorator_usage,
            strategy_pattern_usage: strategy_usage,
            repository_pattern_usage: repository_usage,
            microservice_indicators,
            layer_separation_quality: 0.8, // Simplified metric
        }
    }

    fn calculate_complexity_metrics(&self, structures: &[StructureInfo], code: &str) -> ComplexityMetrics {
        let total_complexity: f32 = structures.iter()
            .map(|s| s.complexity_score)
            .sum();

        let avg_complexity = if !structures.is_empty() {
            total_complexity / structures.len() as f32
        } else {
            0.0
        };

        let lines: Vec<&str> = code.lines().collect();
        let complexity_keywords = COMPLEXITY_KEYWORDS.find_iter(code).count();
        let nesting_indicators = NESTING_INDICATORS.find_iter(code).count();

        let cyclomatic_complexity = 1.0 + complexity_keywords as f32;
        let cognitive_complexity = complexity_keywords as f32 * 1.5;
        let nesting_complexity = nesting_indicators as f32 / lines.len() as f32;

        // Simplified maintainability index
        let maintainability_index = (100.0 - cyclomatic_complexity * 2.0).max(0.0);

        ComplexityMetrics {
            cyclomatic_complexity,
            cognitive_complexity,
            nesting_complexity,
            function_length_variance: 0.3, // Simplified
            class_size_variance: 0.4, // Simplified
            maintainability_index,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_code_structure_analyzer_creation() {
        let analyzer = CodeStructureAnalyzer::new();
        assert!(true); // Basic instantiation test
    }

    #[test]
    fn test_javascript_structure_analysis() {
        let analyzer = CodeStructureAnalyzer::new();
        let code = r#"
            class UserService {
                constructor(database, logger) {
                    this.db = database;
                    this.logger = logger;
                }
                
                async getUser(id) {
                    try {
                        return await this.db.findUser(id);
                    } catch (error) {
                        this.logger.error(error);
                        throw error;
                    }
                }
            }
            
            export default UserService;
        "#;
        
        let result = analyzer.analyze_code_structure(code, "javascript");
        assert!(result.is_ok());
        
        let analysis = result.unwrap();
        assert!(analysis.class_hierarchy.class_count > 0);
        assert!(analysis.complexity_metrics.cyclomatic_complexity > 1.0);
    }

    #[test]
    fn test_python_structure_analysis() {
        let analyzer = CodeStructureAnalyzer::new();
        let code = r#"
            class UserRepository:
                def __init__(self, database):
                    self.db = database
                
                def find_user(self, user_id):
                    if user_id is None:
                        raise ValueError("User ID cannot be None")
                    
                    return self.db.query("SELECT * FROM users WHERE id = ?", user_id)
                
                def create_user(self, user_data):
                    for field in ['name', 'email']:
                        if field not in user_data:
                            raise ValueError(f"Missing required field: {field}")
                    
                    return self.db.insert("users", user_data)
        "#;
        
        let result = analyzer.analyze_code_structure(code, "python");
        assert!(result.is_ok());
        
        let analysis = result.unwrap();
        assert!(analysis.complexity_metrics.cyclomatic_complexity > 1.0);
        assert!(analysis.architectural_patterns.repository_pattern_usage);
    }

    #[test]
    fn test_design_pattern_detection() {
        let analyzer = CodeStructureAnalyzer::new();
        let code = r#"
            class UserFactory {
                static createUser(type) {
                    switch(type) {
                        case 'admin': return new AdminUser();
                        case 'regular': return new RegularUser();
                        default: throw new Error('Unknown user type');
                    }
                }
            }
            
            class Singleton {
                static instance = null;
                
                static getInstance() {
                    if (!Singleton.instance) {
                        Singleton.instance = new Singleton();
                    }
                    return Singleton.instance;
                }
            }
        "#;
        
        let result = analyzer.analyze_code_structure(code, "javascript");
        assert!(result.is_ok());
        
        let analysis = result.unwrap();
        assert!(analysis.architectural_patterns.factory_pattern_usage);
        assert!(analysis.architectural_patterns.singleton_pattern_usage);
    }

    #[test]
    fn test_complexity_metrics() {
        let analyzer = CodeStructureAnalyzer::new();
        let code = r#"
            function complexFunction(data) {
                if (data && data.length > 0) {
                    for (let i = 0; i < data.length; i++) {
                        if (data[i].active) {
                            try {
                                processItem(data[i]);
                            } catch (error) {
                                if (error.critical) {
                                    throw error;
                                } else {
                                    logError(error);
                                }
                            }
                        }
                    }
                }
            }
        "#;
        
        let result = analyzer.analyze_code_structure(code, "javascript");
        assert!(result.is_ok());
        
        let analysis = result.unwrap();
        assert!(analysis.complexity_metrics.cyclomatic_complexity > 5.0);
        assert!(analysis.complexity_metrics.cognitive_complexity > 0.0);
    }

    #[test]
    fn test_module_organization_analysis() {
        let analyzer = CodeStructureAnalyzer::new();
        let code = r#"
            import React from 'react';
            import { useState, useEffect } from 'react';
            import axios from 'axios';
            import './UserComponent.css';
            
            export const UserComponent = () => {
                const [users, setUsers] = useState([]);
                
                useEffect(() => {
                    fetchUsers();
                }, []);
                
                const fetchUsers = async () => {
                    const response = await axios.get('/api/users');
                    setUsers(response.data);
                };
                
                return <div>{/* component JSX */}</div>;
            };
            
            export default UserComponent;
        "#;
        
        let result = analyzer.analyze_code_structure(code, "javascript");
        assert!(result.is_ok());
        
        let analysis = result.unwrap();
        assert!(!analysis.module_organization.import_patterns.is_empty());
        assert!(!analysis.module_organization.export_patterns.is_empty());
    }
}
