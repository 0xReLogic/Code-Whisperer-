#!/bin/bash

# Build script for Code Whisperer WASM module
# Optimizes for production deployment

set -e

echo "🚀 Building Code Whisperer WASM module..."

# Navigate to WASM package directory
cd "$(dirname "$0")"

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack is not installed. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf pkg/
rm -rf target/

# Development build (faster compilation)
echo "🔨 Building development version..."
wasm-pack build --target web --out-dir pkg-dev --dev

# Production build (optimized)
echo "🏗️ Building production version..."
wasm-pack build --target web --out-dir pkg --release

# Bundle for different targets
echo "📦 Building for additional targets..."

# Node.js target
wasm-pack build --target nodejs --out-dir pkg-node --release

# Bundler target (for webpack/rollup)
wasm-pack build --target bundler --out-dir pkg-bundler --release

# Check if wasm-opt is available for further optimization
if command -v wasm-opt &> /dev/null; then
    echo "⚡ Running additional optimizations with wasm-opt..."
    
    # Optimize the production build further
    wasm-opt -Oz --enable-mutable-globals pkg/code_whisperer_wasm_bg.wasm -o pkg/code_whisperer_wasm_bg.wasm
    wasm-opt -Oz --enable-mutable-globals pkg-bundler/code_whisperer_wasm_bg.wasm -o pkg-bundler/code_whisperer_wasm_bg.wasm
    wasm-opt -Oz --enable-mutable-globals pkg-node/code_whisperer_wasm_bg.wasm -o pkg-node/code_whisperer_wasm_bg.wasm
else
    echo "⚠️ wasm-opt not found. Install it for better optimization:"
    echo "   npm install -g wasm-opt"
fi

# Generate size report
echo "📊 Generating size report..."
echo "=== WASM Module Sizes ==="
if [ -f pkg/code_whisperer_wasm_bg.wasm ]; then
    echo "Production (web): $(du -h pkg/code_whisperer_wasm_bg.wasm | cut -f1)"
fi
if [ -f pkg-dev/code_whisperer_wasm_bg.wasm ]; then
    echo "Development (web): $(du -h pkg-dev/code_whisperer_wasm_bg.wasm | cut -f1)"
fi
if [ -f pkg-bundler/code_whisperer_wasm_bg.wasm ]; then
    echo "Production (bundler): $(du -h pkg-bundler/code_whisperer_wasm_bg.wasm | cut -f1)"
fi
if [ -f pkg-node/code_whisperer_wasm_bg.wasm ]; then
    echo "Production (node): $(du -h pkg-node/code_whisperer_wasm_bg.wasm | cut -f1)"
fi

# Validate the builds
echo "✅ Validating builds..."

for target_dir in pkg pkg-dev pkg-bundler pkg-node; do
    if [ -d "$target_dir" ]; then
        echo "Validating $target_dir..."
        if [ -f "$target_dir/code_whisperer_wasm.js" ] && [ -f "$target_dir/code_whisperer_wasm_bg.wasm" ]; then
            echo "  ✅ $target_dir build is valid"
        else
            echo "  ❌ $target_dir build is missing files"
            exit 1
        fi
    fi
done

# Create a comprehensive package info
echo "📋 Creating package information..."
cat > pkg/BUILD_INFO.json << EOF
{
  "build_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "targets": {
    "web": {
      "path": "pkg/",
      "optimized": true,
      "target": "web"
    },
    "bundler": {
      "path": "pkg-bundler/",
      "optimized": true,
      "target": "bundler"
    },
    "nodejs": {
      "path": "pkg-node/",
      "optimized": true,
      "target": "nodejs"
    },
    "development": {
      "path": "pkg-dev/",
      "optimized": false,
      "target": "web"
    }
  },
  "optimization_features": [
    "wasm-opt -Oz",
    "mutable-globals",
    "lto",
    "size-optimized"
  ],
  "supported_features": [
    "pattern-analysis",
    "suggestion-generation",
    "user-behavior-tracking",
    "context-filtering",
    "performance-monitoring",
    "memory-optimization",
    "worker-threading",
    "lazy-loading"
  ]
}
EOF

echo "✨ Build completed successfully!"
echo ""
echo "📁 Output directories:"
echo "  - pkg/          (production web build)"
echo "  - pkg-dev/      (development web build)"
echo "  - pkg-bundler/  (production bundler build)"
echo "  - pkg-node/     (production Node.js build)"
echo ""
echo "🎯 Next steps:"
echo "  1. Test the builds with your JavaScript integration"
echo "  2. Deploy the appropriate package for your target environment"
echo "  3. Monitor performance and memory usage in production"
