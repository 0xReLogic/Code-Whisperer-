# Code Whisperer

An intelligent IDE extension that learns your coding patterns and provides personalized suggestions based on your "coding personality" rather than just syntax.

## Project Structure

```
code-whisperer/
├── code-whisperer-core/     # Rust core library (WASM)
├── vscode-extension/        # VS Code extension (TypeScript)
├── Cargo.toml              # Workspace configuration
├── LICENSE                 # MIT License
└── README.md              # This file
```

## Architecture

- **Core Engine**: Rust + WebAssembly for high-performance pattern recognition
- **IDE Integration**: VS Code extension for seamless user experience
- **Learning System**: Machine learning algorithms for user behavior analysis
- **Privacy-Focused**: All processing happens locally, no cloud dependencies

## Development Setup

### Prerequisites
- Rust (latest stable)
- Node.js 16+
- wasm-pack
- VS Code

### Building

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

3. **Test the extension:**
   - Open in VS Code
   - Press F5 to launch extension development host
   - Test commands in the new window

## Current Status

This project is in Phase 1 (Foundation & Setup). The basic project structure and development environment are now ready for Phase 2 development.

## Roadmap

- **Phase 1**: Foundation & Setup ✅
- **Phase 2**: Core Engine Development (Pattern Recognition)
- **Phase 3**: WebAssembly Integration
- **Phase 4**: VS Code Extension Development
- **Phase 5**: Intelligence Features
- **Phase 6**: Testing & Quality Assurance
- **Phase 7**: Deployment & Distribution
- **Phase 8**: Maintenance & Evolution

## Contributing

This is an open-source project. Contributions are welcome!

## License

MIT License - see LICENSE file for details.
