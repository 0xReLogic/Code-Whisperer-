#!/bin/bash

# Code Whisperer Development Script
# This script sets up the development environment and starts development servers

set -e

echo "🛠️  Setting up Code Whisperer development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v rustc &> /dev/null; then
    print_error "Rust is not installed. Please install Rust first:"
    echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

if ! command -v wasm-pack &> /dev/null; then
    print_error "wasm-pack is not installed. Please install it:"
    echo "  cargo install wasm-pack"
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install Node.js first."
    exit 1
fi

print_status "✅ All prerequisites are installed"

# Install VS Code extension dependencies
print_status "Installing VS Code extension dependencies..."
cd vscode-extension
npm install
cd ..

# Build initial version
print_status "Building initial version..."
./build.sh

print_status "🎉 Development environment is ready!"
print_status "Next steps:"
echo "  1. Open the project in VS Code"
echo "  2. Press F5 to launch extension development host"
echo "  3. Make changes and test them"
echo ""
print_status "Available commands:"
echo "  ./build.sh          - Build the entire project"
echo "  ./dev.sh           - Set up development environment (this script)"
echo "  cd vscode-extension && npm run watch  - Watch TypeScript changes"
echo "  cd code-whisperer-core && cargo watch - Watch Rust changes"
