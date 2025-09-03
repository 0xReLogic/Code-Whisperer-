#!/bin/bash

# Code Whisperer Build Script
# This script builds both the Rust core and VS Code extension

set -e

echo "🚀 Building Code Whisperer..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    print_error "wasm-pack is not installed. Please install it first:"
    echo "  cargo install wasm-pack"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install Node.js first."
    exit 1
fi

# Build Rust core
print_status "Building Rust core with WebAssembly..."
cd code-whisperer-core
wasm-pack build --target web --out-dir pkg
cd ..

# Build VS Code extension
print_status "Building VS Code extension..."
cd vscode-extension
npm install
npm run compile
cd ..

print_status "✅ Build completed successfully!"
print_status "You can now test the extension by:"
echo "  1. Opening the project in VS Code"
echo "  2. Pressing F5 to launch extension development host"
echo "  3. Testing the commands in the new window"
