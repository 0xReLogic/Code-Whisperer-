# Code Whisperer

An intelligent IDE extension that learns your coding patterns and provides personalized suggestions based on your "coding personality" rather than just syntax.

## ✨ Features

- **Multi-Language Support**: JavaScript/TypeScript, Python, Java, C++, C#, Go, Rust, PHP, Ruby, Kotlin, Swift
- **Real-time Analysis**: Debounced code analysis with performance optimization
- **IntelliSense Integration**: Context-aware completions and hover suggestions
- **Pattern Recognition**: Advanced algorithms for detecting coding patterns and styles
- **AST-Based Analysis**: Advanced Abstract Syntax Tree parsing for accurate pattern recognition
- **WebAssembly Performance**: High-performance Rust core compiled to WebAssembly
- **Privacy-First**: All processing happens locally, no data sent to external servers
- **Extensible Architecture**: Modular design for easy addition of new languages and features
- **Rich UI Integration**: Status bar indicators, hover providers, and completion suggestions

## 🏗️ Project Structure

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
- **IDE Integration**: Comprehensive VS Code extension with hover providers and IntelliSense
- **Language Providers**: Hover suggestions, completion items, and diagnostic integration
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
