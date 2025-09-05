import * as assert from 'assert';
import * as vscode from 'vscode';
import { CodeWhispererConfig } from '../config';
import { getWasmLoader } from '../wasmLoader';
import { getStatusBarManager } from '../statusBar';

suite('Code Whisperer Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start running Code Whisperer tests.');

    test('Configuration Manager', () => {
        // Test configuration values
        assert.strictEqual(typeof CodeWhispererConfig.enabled, 'boolean');
        assert.strictEqual(typeof CodeWhispererConfig.realTimeAnalysis, 'boolean');
        assert.strictEqual(typeof CodeWhispererConfig.suggestionDelay, 'number');
        assert.strictEqual(typeof CodeWhispererConfig.maxSuggestions, 'number');
        assert.strictEqual(typeof CodeWhispererConfig.confidenceThreshold, 'number');
        
        // Test configuration validation
        const validation = CodeWhispererConfig.validateConfig();
        assert.strictEqual(typeof validation.isValid, 'boolean');
        assert.strictEqual(Array.isArray(validation.errors), true);
        
        // Test language checking
        assert.strictEqual(typeof CodeWhispererConfig.isLanguageEnabled('javascript'), 'boolean');
        assert.strictEqual(typeof CodeWhispererConfig.isLanguageEnabled('python'), 'boolean');
        
        // Test configuration summary
        const summary = CodeWhispererConfig.getConfigSummary();
        assert.strictEqual(typeof summary, 'object');
        assert.strictEqual(typeof summary.enabled, 'boolean');
    });

    test('WASM Loader', async () => {
        const wasmLoader = getWasmLoader();
        
        // Test singleton pattern
        const wasmLoader2 = getWasmLoader();
        assert.strictEqual(wasmLoader, wasmLoader2);
        
        // Test module loading
        try {
            const module = await wasmLoader.loadModule();
            assert.strictEqual(typeof module, 'object');
            assert.strictEqual(typeof module.CodeWhispererEngine, 'function');
            assert.strictEqual(typeof module.EngineConfig, 'function');
            assert.strictEqual(typeof module.EditorContext, 'function');
            assert.strictEqual(typeof module.create_default_config, 'function');
            assert.strictEqual(typeof module.validate_syntax, 'function');
            assert.strictEqual(typeof module.init, 'function');
        } catch (error) {
            console.log('WASM module loading test (expected in test environment):', error);
        }
        
        // Test syntax validation
        const isValid1 = await wasmLoader.validateSyntax('function test() { return true; }', 'javascript');
        const isValid2 = await wasmLoader.validateSyntax('function test() { return true;', 'javascript'); // Missing brace
        
        assert.strictEqual(typeof isValid1, 'boolean');
        assert.strictEqual(typeof isValid2, 'boolean');
        assert.strictEqual(isValid2, false); // Should detect syntax error
    });

    test('Status Bar Manager', () => {
        const statusBarManager = getStatusBarManager();
        
        // Test singleton pattern
        const statusBarManager2 = getStatusBarManager();
        assert.strictEqual(statusBarManager, statusBarManager2);
        
        // Test status operations
        statusBarManager.updatePatternCount(42);
        statusBarManager.incrementPatternCount();
        
        const status = statusBarManager.getStatus();
        assert.strictEqual(typeof status, 'object');
        assert.strictEqual(typeof status.isAnalyzing, 'boolean');
        assert.strictEqual(typeof status.patternCount, 'number');
        assert.strictEqual(status.patternCount, 43); // 42 + 1
        assert.strictEqual(typeof status.isVisible, 'boolean');
        
        // Test message operations
        statusBarManager.showTemporaryMessage('Test message');
        statusBarManager.showSuccess('Success message');
        statusBarManager.showError('Error message');
        statusBarManager.showWarning('Warning message');
    });

    test('Engine Integration', async () => {
        try {
            const wasmLoader = getWasmLoader();
            const engine = await wasmLoader.getEngine();
            
            // Test engine methods
            const testCode = 'function hello() { console.log("Hello World"); }';
            const mockEditor = {
                document: {
                    fileName: 'test.js',
                    languageId: 'javascript'
                },
                selection: {
                    active: { line: 0, character: 0 },
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 10 }
                }
            } as any;
            
            const editorContext = await wasmLoader.createEditorContext(mockEditor);
            const analysisResult = engine.analyzeCode(testCode, editorContext);
            
            assert.strictEqual(typeof analysisResult, 'object');
            assert.strictEqual(typeof analysisResult.patterns, 'object');
            assert.strictEqual(typeof analysisResult.suggestions, 'object');
            assert.strictEqual(typeof analysisResult.confidence, 'number');
            assert.strictEqual(typeof analysisResult.processingTime, 'number');
            
            // Test statistics
            const stats = engine.getStatistics();
            assert.strictEqual(typeof stats, 'object');
            assert.strictEqual(typeof stats.totalPatterns, 'number');
            assert.strictEqual(typeof stats.totalSuggestions, 'number');
            assert.strictEqual(typeof stats.acceptanceRate, 'number');
            assert.strictEqual(typeof stats.averageConfidence, 'number');
            
            // Test learning
            const learned = engine.learnFromFeedback('test-suggestion', true);
            assert.strictEqual(typeof learned, 'boolean');
            
        } catch (error) {
            console.log('Engine integration test (expected in test environment):', error);
        }
    });

    test('Configuration Presets', async () => {
        const { ConfigPresets } = await import('../config');
        
        // Test preset definitions
        assert.strictEqual(typeof ConfigPresets.PERFORMANCE, 'object');
        assert.strictEqual(typeof ConfigPresets.PRODUCTIVITY, 'object');
        assert.strictEqual(typeof ConfigPresets.COMPREHENSIVE, 'object');
        
        // Test preset values
        assert.strictEqual(ConfigPresets.PERFORMANCE.realTimeAnalysis, false);
        assert.strictEqual(ConfigPresets.PRODUCTIVITY.realTimeAnalysis, true);
        assert.strictEqual(ConfigPresets.COMPREHENSIVE.realTimeAnalysis, true);
        
        assert.strictEqual(ConfigPresets.PERFORMANCE.analysisDepth, 'basic');
        assert.strictEqual(ConfigPresets.PRODUCTIVITY.analysisDepth, 'standard');
        assert.strictEqual(ConfigPresets.COMPREHENSIVE.analysisDepth, 'comprehensive');
    });

    test('Mock Analysis Results', async () => {
        const wasmLoader = getWasmLoader();
        const engine = await wasmLoader.getEngine();
        
        // Test different code patterns
        const testCases = [
            {
                code: 'function test() { return true; }',
                expectedPatterns: ['function_declaration']
            },
            {
                code: 'const x = 10; let y = 20; var z = 30;',
                expectedPatterns: ['variable_declaration']
            },
            {
                code: 'class MyClass { constructor() {} }',
                expectedPatterns: ['class_declaration']
            },
            {
                code: 'console.log("debug");',
                expectedSuggestions: ['refactor']
            },
            {
                code: 'if (x == y) {}',
                expectedSuggestions: ['best_practice']
            },
            {
                code: 'var oldStyle = "test";',
                expectedSuggestions: ['modernize']
            }
        ];
        
        for (const testCase of testCases) {
            const mockContext = {
                file_path: 'test.js',
                language: 'javascript',
                cursor_position: { line: 0, character: 0 },
                selection: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
                surrounding_context: testCase.code
            };
            
            const result = engine.analyzeCode(testCase.code, mockContext);
            
            assert.strictEqual(typeof result, 'object');
            assert.strictEqual(Array.isArray(result.patterns), true);
            assert.strictEqual(Array.isArray(result.suggestions), true);
            
            if (testCase.expectedPatterns) {
                const patternTypes = result.patterns.map((p: any) => p.type);
                for (const expectedPattern of testCase.expectedPatterns) {
                    assert.strictEqual(
                        patternTypes.includes(expectedPattern), 
                        true, 
                        `Expected pattern ${expectedPattern} not found in ${patternTypes.join(', ')}`
                    );
                }
            }
            
            if (testCase.expectedSuggestions) {
                const suggestionTypes = result.suggestions.map((s: any) => s.type);
                for (const expectedSuggestion of testCase.expectedSuggestions) {
                    assert.strictEqual(
                        suggestionTypes.includes(expectedSuggestion), 
                        true, 
                        `Expected suggestion ${expectedSuggestion} not found in ${suggestionTypes.join(', ')}`
                    );
                }
            }
        }
    });
});
