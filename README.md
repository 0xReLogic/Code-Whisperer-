# Code Whisperer

An intelligent IDE extension that learns your coding patterns and provides personalized suggestions based on your "coding personality" rather than just syntax.

## ✨ Features

- **Multi-Language Support**: JavaScript/TypeScript, Python, Java, C++, C#, Go, Rust, PHP, Ruby, Kotlin, Swift
- **Real-time Analysis**: Debounced code analysis with performance optimization
- **IntelliSense Integration**: Context-aware completions and hover suggestions
- **Problems Panel Integration**: Diagnostic providers for code quality analysis
- **Quick Fixes & Refactoring**: Code action providers for automatic improvements
- **Advanced Learning System**: AI that adapts to your coding patterns and preferences
- **Temporal Pattern Analysis**: Tracks coding habit evolution over time
- **Context-Aware Intelligence**: Different suggestions based on project type and context
- **Multi-Language Correlation**: Suggests patterns across programming languages
- **Refactoring Intelligence**: Learns your refactoring preferences and suggests improvements
- **Pattern Recognition**: Advanced algorithms for detecting coding patterns and styles
- **AST-Based Analysis**: Advanced Abstract Syntax Tree parsing for accurate pattern recognition
- **WebAssembly Performance**: High-performance Rust core compiled to WebAssembly
- **Privacy-First**: All processing happens locally, no data sent to external servers
- **Extensible Architecture**: Modular design for easy addition of new languages and features
- **Rich UI Integration**: Status bar indicators, hover providers, completion suggestions, and code actions
- **🎉 Fully Integrated**: All Phase 5 Advanced Intelligence Features are now active and integrated into the VS Code extension

## � Available Commands

Access these commands through the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

### Core Features
- **Code Whisperer: Analyze Code** - Analyze selected code for patterns
- **Code Whisperer: Show Learned Patterns** - View all learned patterns
- **Code Whisperer: Toggle Pattern Suggestions** - Enable/disable suggestions
- **Code Whisperer: Open Pattern Statistics Dashboard** - View learning statistics

### Phase 5: Advanced Intelligence
- **Code Whisperer: Show Your Coding Personality Profile** - View detailed coding DNA analysis
- **Code Whisperer: Show Learning Insights** - View feedback and learning analytics
- **Code Whisperer: Analyze Coding Habit Evolution** - See how your coding habits change over time
- **Code Whisperer: Generate Test Suggestions** - Get AI-powered testing recommendations
- **Code Whisperer: Analyze Error Handling** - Get intelligent error handling suggestions

### Data Management
- **Code Whisperer: Export Learned Patterns** - Export your patterns to JSON
- **Code Whisperer: Import Learned Patterns** - Import patterns from JSON
- **Code Whisperer: Reset Learned Patterns** - Clear all learned data

## �🏗️ Project Structure

```
code-whisperer/
├── code-whisperer-core/     # Rust core library
│   ├── src/
│   │   ├── lib.rs          # Core data structures and exports
│   │   ├── ast_parser.rs   # Multi-language AST parser
│   │   ├── pattern_extractor.rs      # Pattern extraction algorithms
│   │   ├── coding_style_analyzer.rs  # Coding style analysis
│   │   ├── variable_naming_recognizer.rs  # Variable naming patterns
│   │   ├── code_structure_analyzer.rs     # Code structure analysis
│   │   ├── user_behavior_tracker.rs       # User behavior tracking
│   │   ├── local_storage_manager.rs       # Local storage system
│   │   ├── pattern_scoring_engine.rs      # Pattern scoring algorithms
│   │   ├── suggestion_generation_engine.rs # Suggestion generation
│   │   ├── context_aware_filter.rs        # Context-aware filtering
│   │   ├── wasm_interface.rs              # WASM interface layer
│   │   └── wasm_serializer.rs             # WASM data serialization
├── code-whisperer-wasm/     # WebAssembly module
│   ├── src/lib.rs          # WASM-specific optimizations
│   ├── pkg/                # Generated WebAssembly package
│   └── demo.html          # Browser integration demo
├── vscode-extension/        # VS Code extension (TypeScript)
│   ├── src/
│   │   ├── extension.ts    # Extension entry point and lifecycle management
│   │   ├── config.ts       # Comprehensive configuration system
│   │   ├── wasmLoader.ts   # WASM module loading and management
│   │   ├── statusBar.ts    # Status bar integration and progress indicators
│   │   ├── realTimeAnalyzer.ts    # Real-time code analysis engine
│   │   ├── hoverProvider.ts       # Hover suggestions and pattern display
│   │   ├── completionProvider.ts  # IntelliSense completion integration
│   │   ├── diagnosticProvider.ts  # Problems panel diagnostic integration
│   │   ├── codeActionProvider.ts  # Quick fixes and refactoring actions
│   │   ├── feedbackSystem.ts      # User feedback collection and analytics
│   │   ├── patternAdaptationEngine.ts  # AI pattern learning and adaptation
│   │   ├── temporalPatternAnalyzer.ts  # Temporal pattern analysis and habit tracking
│   │   ├── contextAwareLearning.ts     # Context-aware learning system
│   │   ├── multiLanguageCorrelator.ts  # Cross-language pattern correlation
│   │   ├── refactoringPatternDetector.ts  # Refactoring intelligence and suggestions
│   │   └── test/          # Comprehensive test suite
│   └── package.json        # Extension manifest with 15+ configuration options
├── Cargo.toml              # Workspace configuration
├── LICENSE                 # MIT License
└── README.md              # This file
```

## 🏛️ Architecture

- **Core Engine**: Rust + WebAssembly for high-performance pattern recognition
- **AST Parser**: Multi-language parser supporting JavaScript/TypeScript, Python, and Rust
- **Pattern Extraction**: Advanced algorithms for identifying coding patterns
- **Real-time Analysis**: Debounced analysis engine with background processing
- **IDE Integration**: Comprehensive VS Code extension with full language service providers
- **Language Providers**: Hover suggestions, completion items, diagnostic integration, and code actions
- **Configuration System**: 15+ customizable settings with validation and presets
- **Learning System**: Machine learning algorithms for user behavior analysis
- **Privacy-Focused**: All processing happens locally, no cloud dependencies

## 🚀 Development Setup

### Prerequisites
- Rust (latest stable) - `rustc --version`
- Node.js 16+ - `node --version`
- wasm-pack - `cargo install wasm-pack`
- VS Code

### Quick Start

1. **Clone and setup:**
   ```bash
   git clone https://github.com/0xReLogic/Code-Whisperer-
   cd Code-Whisperer-
   ```

2. **Build everything:**
   ```bash
   ./build.sh
   ```

3. **Test the extension:**
   - Open the project in VS Code
   - Press F5 to launch extension development host
   - Select some code and run "Code Whisperer: Analyze Code" from command palette

### Manual Building

1. **Build the Rust core:**
   ```bash
   cd code-whisperer-core
   cargo build --release
   ```

2. **Build the WebAssembly package:**
   ```bash
   cd code-whisperer-wasm
   wasm-pack build --target web --out-dir pkg
   ```

3. **Test WebAssembly in browser:**
   ```bash
   cd code-whisperer-wasm
   python3 -m http.server 8000
   # Open http://localhost:8000/demo.html
   ```

4. **Build the VS Code extension:**
   ```bash
   cd vscode-extension
   npm install
   npm run compile
   ```

5. **Run tests:**
   ```bash
   cargo test --lib
   ```

## 📊 Development Status

### ✅ Completed Phases

**Phase 1: Foundation & Setup** - Complete infrastructure and project setup
**Phase 2: Core Engine Development** - Rust/WebAssembly pattern recognition engine
**Phase 3: WebAssembly Integration** - High-performance WASM modules with browser compatibility
**Phase 4: VS Code Extension Development** - Complete language service providers integration
**Phase 5: Advanced Intelligence Features** - ✅ **COMPLETED** - AI learning system with comprehensive adaptive pattern recognition

### 🎉 Phase 5 Achievements - Advanced Intelligence Features (100% Complete!)

**10 Advanced AI Components Successfully Implemented:**

1. **User Feedback System** (`feedbackSystem.ts`) - Comprehensive feedback collection and learning adaptation
2. **Pattern Adaptation Engine** (`patternAdaptationEngine.ts`) - Dynamic pattern evolution based on user preferences  
3. **Temporal Analysis** (`temporalPatternAnalyzer.ts`) - Time-based coding habit tracking and prediction
4. **Context-Aware Learning** (`contextAwareLearning.ts`) - Project and domain-specific intelligence
5. **Multi-Language Correlation** (`multiLanguageCorrelator.ts`) - Cross-language pattern recognition and suggestions
6. **Refactoring Detection** (`refactoringPatternDetector.ts`) - Intelligent refactoring pattern analysis and recommendations
7. **Testing Pattern Recognition** (`testingPatternRecognizer.ts`) - Advanced testing framework and preference learning
8. **Documentation Style Learning** (`documentationStyleLearner.ts`) - Writing style analysis and consistency improvement
9. **Error Handling Pattern Analysis** (`errorHandlingPatternAnalyzer.ts`) - Risk assessment and recovery pattern suggestions
10. **Coding Personality Profiling** (`codingPersonalityProfiler.ts`) - Comprehensive coding DNA analysis and personalization

**🔧 TypeScript Compilation**: ✅ All compilation errors resolved and code ready for production deployment!

### 🚀 Current Features

- **Real-time Code Analysis**: Monitors code changes with debounced processing
- **Hover Information**: Rich pattern suggestions and code insights on hover
- **IntelliSense Integration**: Context-aware completions for multiple languages
- **Problems Panel**: Diagnostic providers showing code quality issues and suggestions
- **Quick Fixes**: Code action providers for automatic refactoring and improvements
- **🧠 Advanced Intelligence (Phase 5)**: Complete AI learning system with 10 sophisticated components
- **👤 Coding Personality Profiling**: Analyzes your coding DNA and provides personalized recommendations
- **⏰ Temporal Analysis**: Tracks how your coding habits evolve over time with predictive insights
- **🌐 Context Intelligence**: Project-aware suggestions that adapt to your current context and domain
- **🔗 Multi-Language Correlation**: Suggests equivalent patterns across different programming languages
- **🔧 Refactoring Intelligence**: Learns your refactoring preferences and suggests code improvements
- **🧪 Testing Pattern Recognition**: Advanced testing framework detection and preference learning
- **📝 Documentation Style Learning**: Analyzes and improves documentation consistency
- **⚠️ Error Handling Pattern Analysis**: Intelligent risk assessment and recovery suggestions
- **💡 User Feedback System**: Accept/reject suggestions to train the AI to your specific preferences
- **Multi-language Support**: JavaScript/TypeScript, Python, Java with extensible architecture
- **Configuration System**: 15+ customizable settings with validation and presets

### 🔧 Technical Achievements

- High-performance Rust core compiled to WebAssembly
- Comprehensive VS Code language service provider integration
- Real-time pattern recognition with AST-based analysis
- Advanced AI learning algorithms with temporal pattern analysis
- Multi-language pattern correlation and cross-language suggestions
- Context-aware learning system with project type detection
- Intelligent refactoring pattern detection with code smell analysis
- Local-first privacy approach with no external dependencies
- Extensible architecture supporting multiple programming languages

## 🧪 Testing

The project includes comprehensive unit tests for all core components:

```bash
# Run all tests
cargo test

# Run specific test
cargo test test_parse_javascript_function

# Run with verbose output
cargo test -- --nocapture
```

### Test Coverage
- ✅ JavaScript/TypeScript AST parsing
- ✅ Python AST parsing
- ✅ Rust AST parsing
- ✅ Error handling for invalid syntax
- ✅ Generic fallback for unknown languages
- ✅ Pattern extraction validation
- ✅ Coding style analysis
- ✅ Function signature detection
- ✅ Variable naming recognition
- ✅ Code structure analysis
- ✅ Pattern scoring algorithms
- ✅ Suggestion generation
- ✅ Context-aware filtering
- ✅ WebAssembly compilation and optimization
- ✅ WASM-JavaScript data serialization
- ✅ Browser integration and performance monitoring
- ✅ Memory optimization and caching strategies

## 🔧 Core Features

### AST Parser
- **JavaScript/TypeScript**: SWC-based parsing with full ES2020+ support
- **Python**: rustpython-parser for comprehensive Python AST analysis
- **Rust**: syn-based parsing for complete Rust syntax support
- **Error Recovery**: Graceful handling of syntax errors
- **Performance**: Optimized for real-time code analysis

### Pattern Recognition
- Function definition patterns
- Class/struct definition patterns
- Variable declaration patterns
- Import statement analysis
- Coding style detection (indentation, naming conventions)
- Advanced semantic analysis
- User behavior tracking
- Context-aware pattern scoring
- Intelligent suggestion generation
- Multi-layered filtering system

## 📊 Current Status

**Phase 1: Foundation & Setup** ✅ **COMPLETED**
- ✅ Rust development environment
- ✅ WebAssembly compilation setup
- ✅ VS Code extension framework
- ✅ Project structure and build pipeline
- ✅ Core architecture design

**Phase 2: Core Engine Development** ✅ **COMPLETED**
- ✅ Multi-language AST parser (JavaScript/TypeScript, Python, Rust)
- ✅ WebAssembly integration and bindings
- ✅ Unit tests and error handling
- ✅ Basic VS Code extension integration
- ✅ Pattern extraction algorithms
- ✅ Advanced pattern recognition features
- ✅ Coding style analyzer
- ✅ Function signature detection
- ✅ Variable naming recognition
- ✅ Code structure analyzer
- ✅ User behavior tracking system
- ✅ Local storage manager
- ✅ Pattern scoring engine
- ✅ Suggestion generation engine
- ✅ Context-aware filtering system

**Phase 3: WebAssembly Integration** ✅ **COMPLETED**
- ✅ WASM module compilation and optimization
- ✅ Efficient data serialization for JS-WASM communication
- ✅ Performance monitoring and memory optimization
- ✅ Caching strategies and lazy loading infrastructure
- ✅ Worker thread integration foundation
- ✅ Browser compatibility and HTTP server demo
- ✅ Clean compilation with zero errors
- ✅ Generated optimized WASM package ready for deployment

**Phase 4: VS Code Extension Enhancement** ✅ **MAJOR PROGRESS**
- ✅ Comprehensive configuration system with 15+ settings
- ✅ Real-time code analysis with debounced processing
- ✅ Status bar integration with progress indicators
- ✅ Hover providers for pattern suggestions and analysis
- ✅ IntelliSense completion providers with language-specific suggestions
- ✅ Pattern-based completions from real-time analysis
- ✅ Event-driven architecture for document changes
- ✅ Background processing with queue management
- ✅ Rich markdown formatting with examples and metrics
- ✅ Smart ranking with confidence-based sorting

## 🗺️ Roadmap

- **Phase 1**: Foundation & Setup ✅ **COMPLETED**
- **Phase 2**: Core Engine Development ✅ **COMPLETED**
  - ✅ Pattern extraction algorithms
  - ✅ Coding style analysis
  - ✅ Function signature patterns
  - ✅ Variable naming patterns
  - ✅ User behavior tracking
  - ✅ Local storage system
  - ✅ Pattern scoring algorithms
  - ✅ Suggestion generation
  - ✅ Context-aware filtering
- **Phase 3**: WebAssembly Integration ✅ **COMPLETED**
  - ✅ WASM module compilation and optimization
  - ✅ Efficient data serialization
  - ✅ Performance monitoring and memory optimization
  - ✅ Caching strategies and browser compatibility
- **Phase 4**: VS Code Extension Enhancement ✅ **MAJOR PROGRESS**
  - ✅ Comprehensive configuration system with validation and presets
  - ✅ Real-time analysis with debounced processing and queue management
  - ✅ Status bar integration with progress indicators and metrics
  - ✅ Hover providers for pattern suggestions and detailed analysis
  - ✅ IntelliSense completion providers with language-specific suggestions
  - ✅ Pattern-based completions and smart confidence-based ranking
  - 🔄 Diagnostic providers for code issues and improvements (in progress)
  - 🔄 Code action providers for quick fixes and refactoring (in progress)
- **Phase 5**: Advanced Intelligence Features
- **Phase 6**: Testing & Quality Assurance
- **Phase 7**: Deployment & Distribution
- **Phase 8**: Maintenance & Evolution

## Contributing

This is an open-source project. Contributions are welcome!

## License

MIT License - see LICENSE file for details.
