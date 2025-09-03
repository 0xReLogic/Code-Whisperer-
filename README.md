# Code Whisperer

An intelligent IDE extension that learns your coding patterns and provides personalized suggestions based on your "coding personality" rather than just syntax.

## ✨ Features

- **Multi-Language Support**: JavaScript/TypeScript, Python, and Rust
- **AST-Based Analysis**: Advanced Abstract Syntax Tree parsing for accurate pattern recognition
- **WebAssembly Performance**: High-performance Rust core compiled to WebAssembly
- **Privacy-First**: All processing happens locally, no data sent to external servers
- **Extensible Architecture**: Modular design for easy addition of new languages and features

## 🏗️ Project Structure

```
code-whisperer/
├── code-whisperer-core/     # Rust core library (WASM)
│   ├── src/
│   │   ├── lib.rs          # Core data structures and WASM bindings
│   │   └── ast_parser.rs   # Multi-language AST parser
│   └── pkg/                # Generated WebAssembly package
├── vscode-extension/        # VS Code extension (TypeScript)
│   ├── src/extension.ts    # Extension entry point
│   └── package.json        # Extension manifest
├── Cargo.toml              # Workspace configuration
├── LICENSE                 # MIT License
└── README.md              # This file
```

## 🏛️ Architecture

- **Core Engine**: Rust + WebAssembly for high-performance pattern recognition
- **AST Parser**: Multi-language parser supporting JavaScript/TypeScript, Python, and Rust
- **Pattern Extraction**: Advanced algorithms for identifying coding patterns
- **IDE Integration**: VS Code extension for seamless user experience
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
   wasm-pack build --target web
   ```

2. **Build the VS Code extension:**
   ```bash
   cd vscode-extension
   npm install
   npm run compile
   ```

3. **Run tests:**
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
- **Phase 3**: Advanced Machine Learning Features
- **Phase 4**: VS Code Extension Enhancement
- **Phase 5**: Performance Optimization
- **Phase 6**: Testing & Quality Assurance
- **Phase 7**: Deployment & Distribution
- **Phase 8**: Maintenance & Evolution

## Contributing

This is an open-source project. Contributions are welcome!

## License

MIT License - see LICENSE file for details.
