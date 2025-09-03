# Code Whisperer API Specifications

## Overview

This document defines the API specifications for communication between the Rust/WebAssembly core and the JavaScript/TypeScript wrapper components in Code Whisperer.

## Architecture Overview

```
VS Code Extension (TypeScript)
         ↓
    JavaScript Wrapper
         ↓
   WebAssembly Module (Rust)
         ↓
   Pattern Recognition Engine
```

## Core APIs

### 1. PatternAnalyzer API

#### Constructor
```typescript
const analyzer = new PatternAnalyzer();
```

#### Methods

##### analyzeCode(code: string, language?: string): CodingPattern[]
Analyzes code and returns detected patterns.

**Parameters:**
- `code`: The source code to analyze
- `language`: Optional programming language (defaults to auto-detection)

**Returns:** Array of detected `CodingPattern` objects

**Example:**
```typescript
const patterns = analyzer.analyzeCode(`
  function calculateSum(a, b) {
    return a + b;
  }
`, 'javascript');
```

##### getPatternCount(): number
Returns the total number of patterns learned.

**Returns:** Number of patterns in the analyzer

##### getPatterns(): CodingPattern[]
Returns all learned patterns.

**Returns:** Array of all `CodingPattern` objects

##### getPatternsByLanguage(language: string): CodingPattern[]
Returns patterns for a specific programming language.

**Parameters:**
- `language`: Programming language filter

**Returns:** Array of `CodingPattern` objects for the specified language

##### getPatternsByType(patternType: string): CodingPattern[]
Returns patterns of a specific type.

**Parameters:**
- `patternType`: Pattern type filter

**Returns:** Array of `CodingPattern` objects of the specified type

##### getTopPatterns(limit: number): CodingPattern[]
Returns the top patterns by confidence score.

**Parameters:**
- `limit`: Maximum number of patterns to return

**Returns:** Array of top `CodingPattern` objects

##### getLanguageStats(): LanguageStats
Returns statistics about analyzed languages.

**Returns:** Object with language usage statistics

### 2. CodingPattern API

#### Constructor
```typescript
const pattern = new CodingPattern(id, patternType, language, confidence);
```

#### Properties

##### id: string
Unique identifier for the pattern

##### patternType: string
Type of the coding pattern (e.g., "function_definition", "loop_construct")

##### language: string
Programming language this pattern applies to

##### confidence: number
Confidence score between 0.0 and 1.0

##### frequency: number
How many times this pattern has been observed

##### sourceFiles: string[]
List of source files where this pattern was found

#### Methods

##### addSourceFile(file: string): void
Adds a source file to the pattern's source list.

**Parameters:**
- `file`: Path to the source file

##### getSourceFiles(): string[]
Returns the list of source files.

**Returns:** Array of source file paths

##### addFeedback(feedbackType: string, comments?: string): void
Adds user feedback to the pattern.

**Parameters:**
- `feedbackType`: Type of feedback ("accepted", "rejected", "modified")
- `comments`: Optional user comments

##### getFeedbackCount(): number
Returns the number of feedback events.

**Returns:** Number of feedback events

## Data Transfer Objects

### CodingPatternDTO
```typescript
interface CodingPatternDTO {
  id: string;
  patternType: string;
  language: string;
  content: PatternContentDTO;
  confidence: number;
  frequency: number;
  lastSeen: string;
  sourceFiles: string[];
  userFeedback: FeedbackDTO[];
}
```

### PatternContentDTO
```typescript
interface PatternContentDTO {
  type: 'ast' | 'tokens' | 'string';
  ast?: AstNodeDTO;
  tokens?: TokenDTO[];
  string?: StringPatternDTO;
}
```

### AstNodeDTO
```typescript
interface AstNodeDTO {
  nodeType: string;
  properties: Record<string, any>;
  children: AstNodeDTO[];
  location: SourceLocationDTO;
}
```

### SourceLocationDTO
```typescript
interface SourceLocationDTO {
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}
```

### FeedbackDTO
```typescript
interface FeedbackDTO {
  timestamp: string;
  feedbackType: 'accepted' | 'rejected' | 'modified' | 'ignored';
  comments?: string;
}
```

### LanguageStatsDTO
```typescript
interface LanguageStatsDTO {
  [language: string]: number;
}
```

## Communication Protocol

### Message Format
All communication between JS and WASM uses JSON serialization.

```typescript
interface WasmMessage {
  type: string;
  payload: any;
  id?: string;
}
```

### Error Handling
```typescript
interface WasmError {
  type: 'error';
  code: string;
  message: string;
  details?: any;
}
```

### Success Response
```typescript
interface WasmSuccess<T> {
  type: 'success';
  data: T;
  id?: string;
}
```

## VS Code Extension APIs

### Extension Commands

#### codeWhisperer.analyzeCode
Analyzes the currently selected code.

**Command:** `codeWhisperer.analyzeCode`

**When:** `editorHasSelection`

**Handler:**
```typescript
async function analyzeCode() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const selection = editor.selection;
  const code = editor.document.getText(selection);
  const language = editor.document.languageId;

  const patterns = await analyzer.analyzeCode(code, language);

  // Display results
  showPatternResults(patterns);
}
```

#### codeWhisperer.showPatterns
Shows all learned patterns.

**Command:** `codeWhisperer.showPatterns`

**Handler:**
```typescript
async function showPatterns() {
  const patterns = analyzer.getPatterns();
  const languageStats = analyzer.getLanguageStats();

  // Display in webview or output channel
  showPatternsView(patterns, languageStats);
}
```

### Configuration API

#### Extension Settings
```json
{
  "codeWhisperer.enabled": {
    "type": "boolean",
    "default": true,
    "description": "Enable Code Whisperer extension"
  },
  "codeWhisperer.confidenceThreshold": {
    "type": "number",
    "default": 0.5,
    "minimum": 0.0,
    "maximum": 1.0,
    "description": "Minimum confidence threshold for suggestions"
  },
  "codeWhisperer.maxSuggestions": {
    "type": "number",
    "default": 5,
    "minimum": 1,
    "maximum": 20,
    "description": "Maximum number of suggestions to show"
  },
  "codeWhisperer.supportedLanguages": {
    "type": "array",
    "default": ["javascript", "typescript", "python", "rust"],
    "items": {
      "type": "string"
    },
    "description": "Supported programming languages"
  }
}
```

### Webview API

#### Pattern Display Webview
```typescript
interface PatternWebviewData {
  patterns: CodingPatternDTO[];
  languageStats: LanguageStatsDTO;
  userPreferences: UserPreferencesDTO;
}
```

#### Suggestion Webview
```typescript
interface SuggestionWebviewData {
  suggestions: SuggestionDTO[];
  currentCode: string;
  cursorPosition: PositionDTO;
}
```

## WebAssembly Module Interface

### Module Initialization
```javascript
import init, { PatternAnalyzer } from './pkg/code_whisperer_core.js';

async function initializeWasm() {
  await init();
  const analyzer = new PatternAnalyzer();
  return analyzer;
}
```

### Memory Management
```javascript
// WASM memory is automatically managed by wasm-bindgen
// Large data structures are passed by reference
// Strings are copied across the boundary
```

### Error Handling
```javascript
try {
  const patterns = analyzer.analyzeCode(code, language);
} catch (error) {
  console.error('WASM Error:', error);
  // Handle error gracefully
}
```

## Performance Specifications

### Response Times
- **Pattern Analysis**: < 100ms for typical code snippets
- **Suggestion Generation**: < 50ms for cached patterns
- **Model Updates**: < 10ms for incremental updates

### Memory Usage
- **Base Memory**: ~50MB for WASM module
- **Per Pattern**: ~1KB average
- **Cache Size**: Configurable, default 100MB

### Scalability
- **Concurrent Analysis**: Support for multiple simultaneous analyses
- **Large Codebases**: Efficient processing of 100K+ lines of code
- **Pattern Database**: Support for 10K+ learned patterns

## Security Specifications

### Input Validation
- **Code Sanitization**: Remove potentially harmful code before analysis
- **Size Limits**: Maximum code snippet size (default: 10KB)
- **Language Filtering**: Only process supported languages

### Data Protection
- **Local Storage**: All data remains on user's machine
- **Encryption**: Sensitive data encrypted at rest
- **Access Control**: No external network access from WASM

### Error Isolation
- **Exception Handling**: WASM exceptions don't crash VS Code
- **Resource Limits**: CPU and memory limits for WASM execution
- **Timeout Protection**: Analysis timeouts to prevent hanging

## Testing APIs

### Unit Test Interface
```typescript
interface TestHarness {
  mockPatternAnalyzer(): MockPatternAnalyzer;
  simulateUserFeedback(feedback: FeedbackDTO): void;
  validatePatternDetection(code: string, expectedPatterns: string[]): boolean;
}
```

### Integration Test Interface
```typescript
interface IntegrationTest {
  setupTestEnvironment(): Promise<void>;
  runAnalysisTest(testCase: AnalysisTestCase): Promise<TestResult>;
  cleanupTestEnvironment(): Promise<void>;
}
```

## Versioning and Compatibility

### API Versioning
- **Semantic Versioning**: Major.Minor.Patch format
- **Backward Compatibility**: Maintain compatibility within major versions
- **Deprecation Notices**: Warn about deprecated APIs

### Migration Support
- **Migration Scripts**: Automatic data migration between versions
- **Compatibility Layer**: Support for older API versions
- **Upgrade Path**: Clear upgrade instructions for breaking changes

## Future API Extensions

### Advanced Analysis APIs
```typescript
interface AdvancedAnalyzer extends PatternAnalyzer {
  analyzeProject(projectPath: string): Promise<ProjectAnalysis>;
  findRefactoringOpportunities(code: string): Promise<Refactoring[]>;
  suggestOptimizations(code: string): Promise<Optimization[]>;
}
```

### Real-time APIs
```typescript
interface RealTimeAnalyzer extends PatternAnalyzer {
  startRealTimeAnalysis(): void;
  stopRealTimeAnalysis(): void;
  onPatternDetected(callback: (pattern: CodingPattern) => void): void;
}
```

### Collaboration APIs
```typescript
interface CollaborativeAnalyzer extends PatternAnalyzer {
  sharePatterns(teamId: string): Promise<void>;
  importTeamPatterns(teamId: string): Promise<void>;
  mergePatterns(sourcePatterns: CodingPattern[]): Promise<CodingPattern[]>;
}
```

This API specification provides a comprehensive interface for building the Code Whisperer extension with clear contracts between components, robust error handling, and room for future enhancements.
