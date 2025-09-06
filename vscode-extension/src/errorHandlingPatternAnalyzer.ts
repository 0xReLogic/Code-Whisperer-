import * as vscode from 'vscode';
import { FeedbackData } from './feedbackSystem';
import { LearnedPattern } from './patternAdaptationEngine';

// Interface untuk error handling pattern
export interface ErrorHandlingPattern {
    patternId: string;
    name: string;
    type: ErrorHandlingType;
    language: string;
    approach: ErrorHandlingApproach;
    strategy: ErrorHandlingStrategy;
    context: ErrorHandlingContext;
    template: string;
    examples: ErrorHandlingExample[];
    userPreference: number;
    confidence: number;
    metrics: ErrorHandlingMetrics;
}

export type ErrorHandlingType =
    | 'try_catch'
    | 'early_return'
    | 'result_type'
    | 'option_type'
    | 'callback_error'
    | 'promise_rejection'
    | 'exception_throwing'
    | 'error_propagation'
    | 'defensive_programming'
    | 'fail_fast';

export type ErrorHandlingApproach =
    | 'defensive'         // Validate everything, prevent errors
    | 'optimistic'        // Assume success, handle failures
    | 'pragmatic'         // Balance between defensive and optimistic
    | 'fail_fast'         // Immediate failure on first error
    | 'graceful_degradation' // Continue operation with reduced functionality
    | 'resilient';        // Retry and recover from errors

export type ErrorHandlingStrategy =
    | 'centralized'       // All errors handled in one place
    | 'localized'         // Handle errors where they occur
    | 'bubbling'          // Let errors bubble up the call stack
    | 'transformation'    // Transform errors into domain-specific types
    | 'logging_only'      // Log errors but continue execution
    | 'user_notification'; // Notify user of errors

export type ErrorHandlingContext =
    | 'io_operations'
    | 'network_requests'
    | 'database_operations'
    | 'user_input_validation'
    | 'api_calls'
    | 'file_processing'
    | 'business_logic'
    | 'ui_interactions'
    | 'background_tasks'
    | 'system_integration';

export interface ErrorHandlingExample {
    code: string;
    errorHandling: string;
    context: string;
    errorType: string;
    recoveryStrategy: string;
    explanation: string;
}

export interface ErrorHandlingMetrics {
    tryDepthPreference: number; // How deep nested try-catch blocks
    errorSpecificity: 'generic' | 'specific' | 'domain_specific';
    loggingFrequency: number; // 0-1
    recoveryAttempts: number; // Average number of retry attempts
    userNotificationLevel: 'none' | 'minimal' | 'verbose';
    performanceImpact: 'low' | 'medium' | 'high';
}

// Interface untuk user error handling behavior
export interface ErrorHandlingBehavior {
    userId: string;
    primaryApproach: ErrorHandlingApproach;
    preferredStrategies: { [strategy in ErrorHandlingStrategy]?: number };
    contextPreferences: { [context in ErrorHandlingContext]?: ErrorContextPreference };
    languageSpecificPatterns: { [language: string]: ErrorHandlingType[] };
    errorTypeMapping: { [errorType: string]: ErrorHandlingPattern[] };
    recoveryPatterns: RecoveryPattern[];
    loggingPreferences: LoggingPreferences;
}

export interface ErrorContextPreference {
    preferredTypes: ErrorHandlingType[];
    tolerance: 'strict' | 'moderate' | 'lenient';
    recoveryStrategy: string;
    monitoringLevel: number;
}

export interface RecoveryPattern {
    pattern: string;
    context: ErrorHandlingContext;
    frequency: number;
    successRate: number;
    examples: string[];
}

export interface LoggingPreferences {
    logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    includeStackTrace: boolean;
    includeContext: boolean;
    structuredLogging: boolean;
    logRotation: boolean;
}

// Interface untuk error handling suggestion
export interface ErrorHandlingSuggestion {
    id: string;
    type: 'missing_error_handling' | 'improve_error_handling' | 'add_recovery' | 'optimize_pattern';
    targetCode: string;
    currentErrorHandling?: string;
    suggestedErrorHandling: string;
    pattern: ErrorHandlingPattern;
    priority: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    estimatedBenefit: number;
    riskLevel: 'low' | 'medium' | 'high';
}

export class ErrorHandlingPatternAnalyzer {
    private context: vscode.ExtensionContext;
    private errorPatterns: Map<string, ErrorHandlingPattern> = new Map();
    private userBehavior: ErrorHandlingBehavior;
    private recentAnalysis: Map<string, any> = new Map();
    private readonly STORAGE_KEY_PATTERNS = 'codeWhispererErrorPatterns';
    private readonly STORAGE_KEY_BEHAVIOR = 'codeWhispererErrorBehavior';

    // Predefined error handling patterns
    private readonly PREDEFINED_PATTERNS: Partial<ErrorHandlingPattern>[] = [
        {
            name: 'JavaScript Try-Catch with Async/Await',
            type: 'try_catch',
            language: 'javascript',
            approach: 'optimistic',
            strategy: 'localized',
            context: 'api_calls',
            template: 'try {\n  const result = await ${operation};\n  return result;\n} catch (error) {\n  console.error("${operation} failed:", error);\n  throw new ${ErrorType}("${errorMessage}", error);\n}',
            examples: [{
                code: 'async function fetchUser(id) {\n  const response = await fetch(`/api/users/${id}`);\n  return response.json();\n}',
                errorHandling: 'try {\n  const result = await fetchUser(userId);\n  setUser(result);\n} catch (error) {\n  console.error("Failed to fetch user:", error);\n  setError("Could not load user data");\n}',
                context: 'API call with user feedback',
                errorType: 'NetworkError',
                recoveryStrategy: 'Show error message to user',
                explanation: 'Async/await with try-catch for API calls'
            }]
        },
        {
            name: 'Python Exception Handling with Specific Types',
            type: 'try_catch',
            language: 'python',
            approach: 'defensive',
            strategy: 'localized',
            context: 'file_processing',
            template: 'try:\n    ${operation}\nexcept ${SpecificError} as e:\n    logger.error(f"${operation} failed: {e}")\n    ${recovery_action}\nexcept Exception as e:\n    logger.critical(f"Unexpected error: {e}")\n    raise',
            examples: [{
                code: 'def read_config_file(path):\n    with open(path, "r") as f:\n        return json.load(f)',
                errorHandling: 'try:\n    config = read_config_file("config.json")\nexcept FileNotFoundError:\n    logger.warning("Config file not found, using defaults")\n    config = get_default_config()\nexcept json.JSONDecodeError as e:\n    logger.error(f"Invalid JSON in config: {e}")\n    raise ConfigurationError("Invalid configuration file")',
                context: 'Configuration file processing',
                errorType: 'FileNotFoundError, JSONDecodeError',
                recoveryStrategy: 'Use default configuration or fail gracefully',
                explanation: 'Specific exception handling with recovery for file operations'
            }]
        },
        {
            name: 'Early Return Pattern',
            type: 'early_return',
            language: 'any',
            approach: 'defensive',
            strategy: 'localized',
            context: 'user_input_validation',
            template: 'if (!${condition}) {\n  ${errorLogging}\n  return ${errorResponse};\n}\n\n// Continue with normal flow',
            examples: [{
                code: 'function processOrder(order) {\n  // Process the order\n  return result;\n}',
                errorHandling: 'function processOrder(order) {\n  if (!order) {\n    logger.warn("Order is null or undefined");\n    return { success: false, error: "Invalid order" };\n  }\n  \n  if (!order.items || order.items.length === 0) {\n    logger.warn("Order has no items");\n    return { success: false, error: "Order must have items" };\n  }\n  \n  // Continue with normal processing\n  return { success: true, result: processOrderItems(order.items) };\n}',
                context: 'Input validation for business logic',
                errorType: 'ValidationError',
                recoveryStrategy: 'Return error response immediately',
                explanation: 'Early return pattern for validation with detailed error responses'
            }]
        },
        {
            name: 'Result Type Pattern (Rust-style)',
            type: 'result_type',
            language: 'typescript',
            approach: 'pragmatic',
            strategy: 'transformation',
            context: 'business_logic',
            template: 'type Result<T, E> = { success: true; data: T } | { success: false; error: E };\n\nfunction ${functionName}(): Result<${SuccessType}, ${ErrorType}> {\n  try {\n    ${operation}\n    return { success: true, data: result };\n  } catch (error) {\n    return { success: false, error: error.message };\n  }\n}',
            examples: [{
                code: 'function divide(a: number, b: number): number {\n  return a / b;\n}',
                errorHandling: 'type DivisionResult = Result<number, string>;\n\nfunction safeDivide(a: number, b: number): DivisionResult {\n  if (b === 0) {\n    return { success: false, error: "Division by zero" };\n  }\n  \n  return { success: true, data: a / b };\n}',
                context: 'Mathematical operations',
                errorType: 'DivisionError',
                recoveryStrategy: 'Return explicit error state',
                explanation: 'Result type pattern for explicit error handling without exceptions'
            }]
        },
        {
            name: 'Promise Chain Error Handling',
            type: 'promise_rejection',
            language: 'javascript',
            approach: 'optimistic',
            strategy: 'bubbling',
            context: 'network_requests',
            template: '${promiseChain}\n  .then(result => {\n    ${successHandler}\n  })\n  .catch(error => {\n    if (error instanceof ${SpecificError}) {\n      ${specificErrorHandler}\n    } else {\n      ${genericErrorHandler}\n    }\n  });',
            examples: [{
                code: 'fetch("/api/data")\n  .then(response => response.json())\n  .then(data => updateUI(data));',
                errorHandling: 'fetch("/api/data")\n  .then(response => {\n    if (!response.ok) {\n      throw new HTTPError(`HTTP ${response.status}: ${response.statusText}`);\n    }\n    return response.json();\n  })\n  .then(data => updateUI(data))\n  .catch(error => {\n    if (error instanceof HTTPError) {\n      showNotification("Server error occurred", "error");\n    } else if (error instanceof TypeError) {\n      showNotification("Network error - check connection", "warning");\n    } else {\n      console.error("Unexpected error:", error);\n      showNotification("An unexpected error occurred", "error");\n    }\n  });',
                context: 'HTTP API calls',
                errorType: 'HTTPError, TypeError',
                recoveryStrategy: 'User notification based on error type',
                explanation: 'Promise chain with specific error type handling and user feedback'
            }]
        }
    ];

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.userBehavior = this.initializeUserBehavior();
        this.loadData();
        this.initializePredefinedPatterns();
    }

    /**
     * Initialize user error handling behavior
     */
    private initializeUserBehavior(): ErrorHandlingBehavior {
        return {
            userId: 'user',
            primaryApproach: 'pragmatic',
            preferredStrategies: {},
            contextPreferences: {},
            languageSpecificPatterns: {},
            errorTypeMapping: {},
            recoveryPatterns: [],
            loggingPreferences: {
                logLevel: 'error',
                includeStackTrace: true,
                includeContext: true,
                structuredLogging: false,
                logRotation: false
            }
        };
    }

    /**
     * Initialize predefined error handling patterns
     */
    private initializePredefinedPatterns(): void {
        for (const pattern of this.PREDEFINED_PATTERNS) {
            const fullPattern: ErrorHandlingPattern = {
                patternId: `predefined_${pattern.type}_${pattern.language}_${pattern.context}`,
                name: pattern.name!,
                type: pattern.type!,
                language: pattern.language!,
                approach: pattern.approach!,
                strategy: pattern.strategy!,
                context: pattern.context!,
                template: pattern.template!,
                examples: pattern.examples!,
                userPreference: 0.5,
                confidence: 0.8,
                metrics: {
                    tryDepthPreference: 1,
                    errorSpecificity: 'specific',
                    loggingFrequency: 0.8,
                    recoveryAttempts: 1,
                    userNotificationLevel: 'minimal',
                    performanceImpact: 'low'
                }
            };
            
            this.errorPatterns.set(fullPattern.patternId, fullPattern);
        }
    }

    /**
     * Analyze error handling in code
     */
    public async analyzeErrorHandling(document: vscode.TextDocument): Promise<void> {
        const content = document.getText();
        const language = document.languageId;
        const fileName = document.fileName;
        
        // Extract error handling patterns
        const errorHandlingBlocks = this.extractErrorHandlingBlocks(content, language);
        
        // Analyze patterns
        const analysis = await this.analyzeErrorHandlingPatterns(errorHandlingBlocks, language);
        
        // Update user behavior
        await this.updateUserBehavior(analysis, language);
        
        // Store analysis results
        this.recentAnalysis.set(fileName, {
            timestamp: Date.now(),
            errorHandlingBlocks: errorHandlingBlocks.length,
            analysis,
            language,
            riskLevel: this.calculateRiskLevel(content, errorHandlingBlocks)
        });
        
        await this.saveData();
    }

    /**
     * Extract error handling blocks from code
     */
    private extractErrorHandlingBlocks(content: string, language: string): any[] {
        const blocks: any[] = [];
        const lines = content.split('\n');
        
        // Error handling patterns for different languages
        const patterns = this.getErrorHandlingPatterns(language);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]?.trim() || '';
            
            // Try-catch blocks
            if (patterns.tryStart.some((pattern: string) => line.includes(pattern))) {
                const block = this.extractTryCatchBlock(lines, i, language);
                if (block) {
                    blocks.push(block);
                }
            }
            
            // Early return patterns
            if (patterns.earlyReturn.some((pattern: string) => new RegExp(pattern).test(line))) {
                blocks.push({
                    type: 'early_return',
                    startLine: i,
                    endLine: i,
                    content: line,
                    context: this.inferErrorContext(lines, i),
                    errorType: this.detectErrorType(line, language)
                });
            }
            
            // Error throwing
            if (patterns.errorThrow.some((pattern: string) => line.includes(pattern))) {
                blocks.push({
                    type: 'exception_throwing',
                    startLine: i,
                    endLine: i,
                    content: line,
                    context: this.inferErrorContext(lines, i),
                    errorType: this.extractThrownErrorType(line, language)
                });
            }
            
            // Callback error patterns
            if (patterns.callbackError.some((pattern: string) => line.includes(pattern))) {
                blocks.push({
                    type: 'callback_error',
                    startLine: i,
                    endLine: i,
                    content: line,
                    context: this.inferErrorContext(lines, i)
                });
            }
        }
        
        return blocks;
    }

    /**
     * Get error handling patterns for language
     */
    private getErrorHandlingPatterns(language: string): any {
        const patterns: { [key: string]: any } = {
            javascript: {
                tryStart: ['try {', 'try{'],
                catchStart: ['catch (', 'catch('],
                finallyStart: ['finally {', 'finally{'],
                earlyReturn: ['if.*return', 'if.*throw'],
                errorThrow: ['throw new', 'throw ', 'reject('],
                callbackError: ['callback(error', 'callback(err', '(err,']
            },
            typescript: {
                tryStart: ['try {', 'try{'],
                catchStart: ['catch (', 'catch('],
                finallyStart: ['finally {', 'finally{'],
                earlyReturn: ['if.*return', 'if.*throw'],
                errorThrow: ['throw new', 'throw ', 'reject('],
                callbackError: ['callback(error', 'callback(err', '(err,']
            },
            python: {
                tryStart: ['try:'],
                catchStart: ['except'],
                finallyStart: ['finally:'],
                earlyReturn: ['if.*return', 'if.*raise'],
                errorThrow: ['raise ', 'raise\\('],
                callbackError: ['callback(error', 'callback(err']
            },
            java: {
                tryStart: ['try {', 'try{'],
                catchStart: ['catch (', 'catch('],
                finallyStart: ['finally {', 'finally{'],
                earlyReturn: ['if.*return', 'if.*throw'],
                errorThrow: ['throw new', 'throw '],
                callbackError: []
            }
        };
        
        return patterns[language] || patterns.javascript;
    }

    /**
     * Extract try-catch block details
     */
    private extractTryCatchBlock(lines: string[], startIndex: number, language: string): any | null {
        let depth = 0;
        let tryStartFound = false;
        let catchBlocks: any[] = [];
        let finallyBlock: any = null;
        let currentBlock = '';
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i]?.trim() || '';
            currentBlock += line + '\n';
            
            if (line.includes('try')) {
                tryStartFound = true;
            }
            
            if (line.includes('{')) depth++;
            if (line.includes('}')) depth--;
            
            // Detect catch blocks
            if (language === 'python') {
                if (line.startsWith('except')) {
                    catchBlocks.push({
                        type: this.extractExceptionType(line, language),
                        variable: this.extractExceptionVariable(line, language),
                        content: line
                    });
                }
                if (line.startsWith('finally:')) {
                    finallyBlock = { content: line };
                }
            } else {
                if (line.includes('catch (') || line.includes('catch(')) {
                    catchBlocks.push({
                        type: this.extractExceptionType(line, language),
                        variable: this.extractExceptionVariable(line, language),
                        content: line
                    });
                }
                if (line.includes('finally')) {
                    finallyBlock = { content: line };
                }
            }
            
            // End of block
            if (tryStartFound && depth === 0 && (line.includes('}') || (language === 'python' && !line.startsWith(' ')))) {
                return {
                    type: 'try_catch',
                    startLine: startIndex,
                    endLine: i,
                    content: currentBlock,
                    catchBlocks,
                    finallyBlock,
                    context: this.inferErrorContext(lines, startIndex),
                    complexity: this.calculateComplexity(currentBlock)
                };
            }
        }
        
        return null;
    }

    /**
     * Extract exception type from catch clause
     */
    private extractExceptionType(line: string, language: string): string {
        if (language === 'python') {
            const match = line.match(/except\s+(\w+)/);
            return match?.[1] || 'Exception';
        } else {
            const match = line.match(/catch\s*\(\s*(\w+)/);
            return match?.[1] || 'Error';
        }
    }

    /**
     * Extract exception variable from catch clause
     */
    private extractExceptionVariable(line: string, language: string): string {
        if (language === 'python') {
            const match = line.match(/except\s+\w+\s+as\s+(\w+)/);
            return match?.[1] || 'e';
        } else {
            const match = line.match(/catch\s*\(\s*\w+\s+(\w+)/);
            return match?.[1] || 'error';
        }
    }

    /**
     * Infer error context from surrounding code
     */
    private inferErrorContext(lines: string[], lineIndex: number): ErrorHandlingContext {
        const surroundingCode = lines.slice(
            Math.max(0, lineIndex - 3), 
            Math.min(lines.length, lineIndex + 3)
        ).join(' ').toLowerCase();
        
        if (surroundingCode.includes('fetch') || surroundingCode.includes('axios') || surroundingCode.includes('request')) {
            return 'network_requests';
        } else if (surroundingCode.includes('fs.') || surroundingCode.includes('file') || surroundingCode.includes('read') || surroundingCode.includes('write')) {
            return 'io_operations';
        } else if (surroundingCode.includes('database') || surroundingCode.includes('query') || surroundingCode.includes('sql')) {
            return 'database_operations';
        } else if (surroundingCode.includes('validate') || surroundingCode.includes('input') || surroundingCode.includes('form')) {
            return 'user_input_validation';
        } else if (surroundingCode.includes('api') || surroundingCode.includes('endpoint')) {
            return 'api_calls';
        } else if (surroundingCode.includes('ui') || surroundingCode.includes('component') || surroundingCode.includes('render')) {
            return 'ui_interactions';
        }
        
        return 'business_logic';
    }

    /**
     * Detect error type from line
     */
    private detectErrorType(line: string, language: string): string {
        if (line.includes('Error') || line.includes('Exception')) {
            const match = line.match(/(\w*Error|\w*Exception)/);
            return match?.[1] || 'Error';
        }
        
        return 'Generic';
    }

    /**
     * Extract thrown error type
     */
    private extractThrownErrorType(line: string, language: string): string {
        if (language === 'python') {
            const match = line.match(/raise\s+(\w+)/);
            return match?.[1] || 'Exception';
        } else {
            const match = line.match(/throw\s+new\s+(\w+)/);
            return match?.[1] || 'Error';
        }
    }

    /**
     * Calculate complexity of error handling block
     */
    private calculateComplexity(content: string): number {
        let complexity = 1;
        
        // Count catch blocks
        complexity += (content.match(/catch|except/g) || []).length;
        
        // Count nested conditions
        complexity += (content.match(/if|switch|case/g) || []).length * 0.5;
        
        // Count logging statements
        complexity += (content.match(/log|console|print/g) || []).length * 0.2;
        
        return Math.round(complexity * 10) / 10;
    }

    /**
     * Analyze error handling patterns
     */
    private async analyzeErrorHandlingPatterns(blocks: any[], language: string): Promise<any> {
        const analysis = {
            totalBlocks: blocks.length,
            typeDistribution: {} as { [type: string]: number },
            contextDistribution: {} as { [context: string]: number },
            averageComplexity: 0,
            errorSpecificity: this.calculateErrorSpecificity(blocks),
            recoveryPatterns: this.extractRecoveryPatterns(blocks),
            loggingFrequency: this.calculateLoggingFrequency(blocks),
            riskCoverage: this.calculateRiskCoverage(blocks)
        };
        
        let totalComplexity = 0;
        
        for (const block of blocks) {
            // Type distribution
            analysis.typeDistribution[block.type] = 
                (analysis.typeDistribution[block.type] || 0) + 1;
            
            // Context distribution  
            analysis.contextDistribution[block.context] = 
                (analysis.contextDistribution[block.context] || 0) + 1;
            
            // Complexity
            if (block.complexity) {
                totalComplexity += block.complexity;
            }
        }
        
        analysis.averageComplexity = blocks.length > 0 ? totalComplexity / blocks.length : 0;
        
        return analysis;
    }

    /**
     * Calculate error specificity level
     */
    private calculateErrorSpecificity(blocks: any[]): 'generic' | 'specific' | 'domain_specific' {
        let specificCount = 0;
        let domainSpecificCount = 0;
        
        for (const block of blocks) {
            if (block.catchBlocks) {
                for (const catchBlock of block.catchBlocks) {
                    if (catchBlock.type && catchBlock.type !== 'Error' && catchBlock.type !== 'Exception') {
                        if (this.isDomainSpecificError(catchBlock.type)) {
                            domainSpecificCount++;
                        } else {
                            specificCount++;
                        }
                    }
                }
            }
        }
        
        const total = blocks.length;
        if (domainSpecificCount / total > 0.3) return 'domain_specific';
        if (specificCount / total > 0.5) return 'specific';
        return 'generic';
    }

    /**
     * Check if error type is domain-specific
     */
    private isDomainSpecificError(errorType: string): boolean {
        const domainPatterns = [
            'ValidationError', 'AuthenticationError', 'AuthorizationError',
            'BusinessRuleError', 'ConfigurationError', 'DataIntegrityError',
            'NetworkTimeoutError', 'ResourceNotFoundError'
        ];
        
        return domainPatterns.some(pattern => errorType.includes(pattern.replace('Error', '')));
    }

    /**
     * Extract recovery patterns from error handling blocks
     */
    private extractRecoveryPatterns(blocks: any[]): string[] {
        const patterns: string[] = [];
        
        for (const block of blocks) {
            const content = block.content?.toLowerCase() || '';
            
            if (content.includes('retry') || content.includes('attempt')) {
                patterns.push('retry_mechanism');
            }
            if (content.includes('fallback') || content.includes('default')) {
                patterns.push('fallback_strategy');
            }
            if (content.includes('notify') || content.includes('alert') || content.includes('toast')) {
                patterns.push('user_notification');
            }
            if (content.includes('log') || content.includes('console') || content.includes('report')) {
                patterns.push('error_logging');
            }
            if (content.includes('recover') || content.includes('continue')) {
                patterns.push('graceful_degradation');
            }
        }
        
        return [...new Set(patterns)];
    }

    /**
     * Calculate logging frequency
     */
    private calculateLoggingFrequency(blocks: any[]): number {
        let loggingCount = 0;
        
        for (const block of blocks) {
            const content = block.content?.toLowerCase() || '';
            if (content.includes('log') || content.includes('console') || content.includes('print')) {
                loggingCount++;
            }
        }
        
        return blocks.length > 0 ? loggingCount / blocks.length : 0;
    }

    /**
     * Calculate risk coverage
     */
    private calculateRiskCoverage(blocks: any[]): number {
        // This is a simplified calculation - in reality would be more sophisticated
        const highRiskContexts = ['network_requests', 'database_operations', 'file_processing'];
        let coveredRiskContexts = 0;
        
        const contexts = new Set(blocks.map(block => block.context));
        for (const context of highRiskContexts) {
            if (contexts.has(context)) {
                coveredRiskContexts++;
            }
        }
        
        return coveredRiskContexts / highRiskContexts.length;
    }

    /**
     * Calculate risk level of code
     */
    private calculateRiskLevel(content: string, errorBlocks: any[]): 'low' | 'medium' | 'high' {
        let riskScore = 0;
        
        // High-risk operations without error handling
        const highRiskPatterns = [
            'fetch(', 'axios.', 'fs.', 'JSON.parse(', 'parseInt(',
            'eval(', 'localStorage.', 'sessionStorage.'
        ];
        
        for (const pattern of highRiskPatterns) {
            const matches = (content.match(new RegExp(pattern, 'g')) || []).length;
            riskScore += matches;
        }
        
        // Reduce risk score based on error handling coverage
        const errorHandlingRatio = errorBlocks.length / Math.max(riskScore, 1);
        riskScore *= (1 - Math.min(errorHandlingRatio, 0.8));
        
        if (riskScore > 5) return 'high';
        if (riskScore > 2) return 'medium';
        return 'low';
    }

    /**
     * Update user behavior based on analysis
     */
    private async updateUserBehavior(analysis: any, language: string): Promise<void> {
        // Update type preferences
        for (const [type, count] of Object.entries(analysis.typeDistribution)) {
            const existingPatterns = this.userBehavior.languageSpecificPatterns[language] || [];
            if (!existingPatterns.includes(type as ErrorHandlingType)) {
                existingPatterns.push(type as ErrorHandlingType);
                this.userBehavior.languageSpecificPatterns[language] = existingPatterns;
            }
        }
        
        // Update context preferences
        for (const [context, count] of Object.entries(analysis.contextDistribution)) {
            if (!this.userBehavior.contextPreferences[context as ErrorHandlingContext]) {
                this.userBehavior.contextPreferences[context as ErrorHandlingContext] = {
                    preferredTypes: [],
                    tolerance: 'moderate',
                    recoveryStrategy: 'graceful_degradation',
                    monitoringLevel: 0.5
                };
            }
        }
        
        // Update recovery patterns
        for (const pattern of analysis.recoveryPatterns) {
            const existing = this.userBehavior.recoveryPatterns.find(p => p.pattern === pattern);
            if (existing) {
                existing.frequency++;
            } else {
                this.userBehavior.recoveryPatterns.push({
                    pattern,
                    context: 'business_logic',
                    frequency: 1,
                    successRate: 0.8,
                    examples: []
                });
            }
        }
        
        // Update logging preferences
        this.userBehavior.loggingPreferences.includeStackTrace = analysis.loggingFrequency > 0.5;
    }

    /**
     * Generate error handling suggestions
     */
    public async generateErrorHandlingSuggestions(
        document: vscode.TextDocument,
        selection?: vscode.Selection
    ): Promise<ErrorHandlingSuggestion[]> {
        const suggestions: ErrorHandlingSuggestion[] = [];
        const content = selection ? document.getText(selection) : document.getText();
        const language = document.languageId;
        
        // Find risky operations without error handling
        const riskyOperations = this.findRiskyOperations(content, language);
        
        // Generate suggestions for each risky operation
        for (const operation of riskyOperations) {
            const suggestion = await this.createErrorHandlingSuggestion(operation, language);
            if (suggestion) {
                suggestions.push(suggestion);
            }
        }
        
        // Find existing error handling that could be improved
        const improvementSuggestions = await this.findErrorHandlingImprovements(content, language);
        suggestions.push(...improvementSuggestions);
        
        return this.prioritizeErrorHandlingSuggestions(suggestions);
    }

    /**
     * Find risky operations that lack error handling
     */
    private findRiskyOperations(content: string, language: string): any[] {
        const operations: any[] = [];
        const lines = content.split('\n');
        
        const riskyPatterns = this.getRiskyPatterns(language);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]?.trim() || '';
            
            for (const [pattern, riskLevel] of Object.entries(riskyPatterns)) {
                if (new RegExp(pattern).test(line)) {
                    // Check if this line is already within error handling
                    if (!this.isWithinErrorHandling(lines, i)) {
                        operations.push({
                            line: i,
                            content: line,
                            pattern,
                            riskLevel,
                            context: this.inferErrorContext(lines, i),
                            suggestedHandling: this.suggestErrorHandling(pattern, language)
                        });
                    }
                }
            }
        }
        
        return operations;
    }

    /**
     * Get risky patterns for language
     */
    private getRiskyPatterns(language: string): { [pattern: string]: 'high' | 'medium' | 'low' } {
        const patterns: { [key: string]: { [pattern: string]: 'high' | 'medium' | 'low' } } = {
            javascript: {
                'fetch\\(': 'high',
                'axios\\.(get|post|put|delete)': 'high',
                'JSON\\.parse\\(': 'medium',
                'parseInt\\(': 'medium',
                'localStorage\\.(getItem|setItem)': 'medium',
                'eval\\(': 'high',
                'new\\s+WebSocket': 'high',
                'fs\\.(readFile|writeFile)': 'high'
            },
            python: {
                'open\\(': 'medium',
                'json\\.loads\\(': 'medium',
                'requests\\.(get|post)': 'high',
                'subprocess\\.(run|call)': 'high',
                'eval\\(': 'high',
                'exec\\(': 'high',
                'int\\(': 'low',
                'float\\(': 'low'
            },
            java: {
                'new\\s+FileInputStream': 'medium',
                'Integer\\.parseInt': 'medium',
                'Class\\.forName': 'high',
                'Thread\\.sleep': 'low',
                'System\\.getProperty': 'low'
            }
        };
        
        return patterns[language] || patterns.javascript || {};
    }

    /**
     * Check if line is within existing error handling
     */
    private isWithinErrorHandling(lines: string[], lineIndex: number): boolean {
        // Look backwards for try/catch blocks
        for (let i = lineIndex; i >= 0; i--) {
            const line = lines[i]?.trim() || '';
            if (line.includes('try') || line.includes('try:')) {
                // Found try block, now look for matching catch/except
                for (let j = i + 1; j < lines.length; j++) {
                    const catchLine = lines[j]?.trim() || '';
                    if (catchLine.includes('catch') || catchLine.includes('except')) {
                        if (j > lineIndex) {
                            return true; // Line is between try and catch
                        }
                    }
                }
            }
        }
        
        return false;
    }

    /**
     * Suggest appropriate error handling for pattern
     */
    private suggestErrorHandling(pattern: string, language: string): string {
        const suggestions: { [key: string]: { [pattern: string]: string } } = {
            javascript: {
                'fetch\\(': 'try_catch',
                'JSON\\.parse\\(': 'try_catch',
                'parseInt\\(': 'early_return',
                'localStorage': 'try_catch'
            },
            python: {
                'open\\(': 'try_catch',
                'json\\.loads\\(': 'try_catch',
                'requests': 'try_catch',
                'int\\(': 'try_catch'
            }
        };
        
        const languageSuggestions = suggestions[language] || suggestions.javascript;
        return languageSuggestions?.[pattern] || 'try_catch';
    }

    /**
     * Create error handling suggestion
     */
    private async createErrorHandlingSuggestion(
        operation: any,
        language: string
    ): Promise<ErrorHandlingSuggestion | null> {
        const pattern = this.findBestMatchingPattern(operation.suggestedHandling, language, operation.context);
        if (!pattern) return null;
        
        const errorHandling = this.generateErrorHandlingCode(operation, pattern);
        
        return {
            id: `error_suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'missing_error_handling',
            targetCode: operation.content,
            suggestedErrorHandling: errorHandling,
            pattern,
            priority: this.mapRiskToPriority(operation.riskLevel),
            reason: `Risky operation "${operation.pattern}" needs error handling`,
            estimatedBenefit: this.calculateBenefit(operation, pattern),
            riskLevel: operation.riskLevel
        };
    }

    /**
     * Find best matching error pattern
     */
    private findBestMatchingPattern(
        suggestedType: string,
        language: string,
        context: ErrorHandlingContext
    ): ErrorHandlingPattern | null {
        let bestPattern: ErrorHandlingPattern | null = null;
        let bestScore = 0;
        
        for (const pattern of this.errorPatterns.values()) {
            let score = 0;
            
            // Type match
            if (pattern.type === suggestedType) score += 0.4;
            
            // Language match
            if (pattern.language === language || pattern.language === 'any') score += 0.3;
            
            // Context match
            if (pattern.context === context) score += 0.2;
            
            // User preference
            score *= pattern.userPreference;
            
            if (score > bestScore) {
                bestScore = score;
                bestPattern = pattern;
            }
        }
        
        return bestPattern;
    }

    /**
     * Generate error handling code
     */
    private generateErrorHandlingCode(operation: any, pattern: ErrorHandlingPattern): string {
        let code = pattern.template;
        
        // Replace template variables
        code = code.replace(/\$\{operation\}/g, operation.content);
        code = code.replace(/\$\{ErrorType\}/g, this.getAppropriateErrorType(operation.pattern));
        code = code.replace(/\$\{errorMessage\}/g, `Failed to execute ${operation.pattern}`);
        
        return code;
    }

    /**
     * Get appropriate error type for operation
     */
    private getAppropriateErrorType(pattern: string): string {
        const errorTypeMap: { [key: string]: string } = {
            'fetch': 'NetworkError',
            'JSON.parse': 'ParseError',
            'parseInt': 'ValidationError',
            'localStorage': 'StorageError',
            'open': 'FileError',
            'requests': 'NetworkError'
        };
        
        for (const [op, errorType] of Object.entries(errorTypeMap)) {
            if (pattern.includes(op)) {
                return errorType;
            }
        }
        
        return 'Error';
    }

    /**
     * Map risk level to priority
     */
    private mapRiskToPriority(riskLevel: string): 'low' | 'medium' | 'high' | 'critical' {
        switch (riskLevel) {
            case 'high': return 'critical';
            case 'medium': return 'high';
            case 'low': return 'medium';
            default: return 'low';
        }
    }

    /**
     * Calculate benefit of error handling
     */
    private calculateBenefit(operation: any, pattern: ErrorHandlingPattern): number {
        let benefit = 0.5;
        
        // Risk-based benefit
        switch (operation.riskLevel) {
            case 'high': benefit += 0.4; break;
            case 'medium': benefit += 0.3; break;
            case 'low': benefit += 0.1; break;
        }
        
        // Pattern confidence
        benefit *= pattern.confidence;
        
        return Math.min(1, benefit);
    }

    /**
     * Find error handling improvements
     */
    private async findErrorHandlingImprovements(
        content: string,
        language: string
    ): Promise<ErrorHandlingSuggestion[]> {
        const improvements: ErrorHandlingSuggestion[] = [];
        const existingHandling = this.extractErrorHandlingBlocks(content, language);
        
        for (const block of existingHandling) {
            const blockImprovements = this.evaluateErrorHandlingQuality(block, language);
            improvements.push(...blockImprovements);
        }
        
        return improvements;
    }

    /**
     * Evaluate error handling quality
     */
    private evaluateErrorHandlingQuality(block: any, language: string): ErrorHandlingSuggestion[] {
        const suggestions: ErrorHandlingSuggestion[] = [];
        const content = block.content?.toLowerCase() || '';
        
        // Check for generic error handling
        if (block.type === 'try_catch' && block.catchBlocks) {
            for (const catchBlock of block.catchBlocks) {
                if (catchBlock.type === 'Error' || catchBlock.type === 'Exception') {
                    const defaultPattern = Array.from(this.errorPatterns.values())[0];
                    if (defaultPattern) {
                        suggestions.push({
                            id: `improve_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            type: 'improve_error_handling',
                            targetCode: block.content,
                            currentErrorHandling: catchBlock.content,
                            suggestedErrorHandling: `catch (${this.getSpecificErrorType(block.context)}) { /* handle specific error */ }`,
                            pattern: defaultPattern,
                            priority: 'medium',
                            reason: 'Generic error handling could be more specific',
                            estimatedBenefit: 0.6,
                            riskLevel: 'medium'
                        });
                    }
                }
            }
        }
        
        // Check for missing logging
        if (!content.includes('log') && !content.includes('console')) {
            const defaultPattern = Array.from(this.errorPatterns.values())[0];
            if (defaultPattern) {
                suggestions.push({
                    id: `logging_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'improve_error_handling',
                    targetCode: block.content,
                    currentErrorHandling: block.content,
                    suggestedErrorHandling: block.content + '\n  console.error("Error occurred:", error);',
                    pattern: defaultPattern,
                    priority: 'low',
                    reason: 'Error handling should include logging for debugging',
                    estimatedBenefit: 0.4,
                    riskLevel: 'low'
                });
            }
        }
        
        return suggestions;
    }

    /**
     * Get specific error type for context
     */
    private getSpecificErrorType(context: ErrorHandlingContext): string {
        const contextErrorMap: { [key in ErrorHandlingContext]: string } = {
            'io_operations': 'FileError',
            'network_requests': 'NetworkError',
            'database_operations': 'DatabaseError',
            'user_input_validation': 'ValidationError',
            'api_calls': 'APIError',
            'file_processing': 'FileProcessingError',
            'business_logic': 'BusinessRuleError',
            'ui_interactions': 'UIError',
            'background_tasks': 'TaskError',
            'system_integration': 'IntegrationError'
        };
        
        return contextErrorMap[context] || 'SpecificError';
    }

    /**
     * Prioritize error handling suggestions
     */
    private prioritizeErrorHandlingSuggestions(
        suggestions: ErrorHandlingSuggestion[]
    ): ErrorHandlingSuggestion[] {
        return suggestions.sort((a, b) => {
            // Priority order
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            
            if (priorityDiff !== 0) return priorityDiff;
            
            // Risk level
            const riskOrder = { high: 3, medium: 2, low: 1 };
            const riskDiff = riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
            
            if (riskDiff !== 0) return riskDiff;
            
            // Estimated benefit
            return b.estimatedBenefit - a.estimatedBenefit;
        });
    }

    /**
     * Learn from error handling feedback
     */
    public async learnFromErrorHandlingFeedback(
        suggestion: ErrorHandlingSuggestion,
        feedback: FeedbackData
    ): Promise<void> {
        const pattern = suggestion.pattern;
        
        if (feedback.action === 'accept') {
            pattern.userPreference = Math.min(1, pattern.userPreference + 0.1);
            pattern.confidence = Math.min(1, pattern.confidence + 0.05);
            
            // Update strategy preferences
            this.userBehavior.preferredStrategies[pattern.strategy] = 
                (this.userBehavior.preferredStrategies[pattern.strategy] || 0) + 1;
                
        } else if (feedback.action === 'reject') {
            pattern.userPreference = Math.max(0, pattern.userPreference - 0.1);
            pattern.confidence = Math.max(0.1, pattern.confidence - 0.05);
        }
        
        await this.saveData();
    }

    /**
     * Get error handling insights
     */
    public getErrorHandlingInsights(): {
        primaryApproach: ErrorHandlingApproach;
        preferredStrategies: ErrorHandlingStrategy[];
        riskTolerance: string;
        errorSpecificity: string;
        loggingHabits: string;
        improvementSuggestions: string[];
    } {
        // Get preferred strategies
        const preferredStrategies = Object.entries(this.userBehavior.preferredStrategies)
            .filter(([_, score]) => score > 2)
            .sort(([_, a], [__, b]) => b - a)
            .map(([strategy, _]) => strategy as ErrorHandlingStrategy);
        
        // Calculate risk tolerance
        const riskTolerance = this.calculateRiskTolerance();
        
        // Generate improvement suggestions
        const improvements = this.generateErrorHandlingImprovements();
        
        return {
            primaryApproach: this.userBehavior.primaryApproach,
            preferredStrategies,
            riskTolerance,
            errorSpecificity: 'specific',
            loggingHabits: this.userBehavior.loggingPreferences.includeStackTrace ? 'comprehensive' : 'basic',
            improvementSuggestions: improvements
        };
    }

    /**
     * Calculate risk tolerance
     */
    private calculateRiskTolerance(): string {
        const contextCount = Object.keys(this.userBehavior.contextPreferences).length;
        const recoveryPatternCount = this.userBehavior.recoveryPatterns.length;
        
        if (contextCount > 5 && recoveryPatternCount > 3) return 'conservative';
        if (contextCount > 2 && recoveryPatternCount > 1) return 'moderate';
        return 'aggressive';
    }

    /**
     * Generate error handling improvement suggestions
     */
    private generateErrorHandlingImprovements(): string[] {
        const suggestions: string[] = [];
        
        // Check strategy diversity
        const strategyCount = Object.keys(this.userBehavior.preferredStrategies).length;
        if (strategyCount < 2) {
            suggestions.push('Consider using different error handling strategies for different contexts');
        }
        
        // Check logging preferences
        if (!this.userBehavior.loggingPreferences.includeStackTrace) {
            suggestions.push('Including stack traces in error logs can significantly improve debugging');
        }
        
        // Check recovery patterns
        if (this.userBehavior.recoveryPatterns.length === 0) {
            suggestions.push('Implement recovery patterns to make your application more resilient');
        }
        
        return suggestions;
    }

    /**
     * Load data from storage
     */
    private async loadData(): Promise<void> {
        try {
            const patternsData = this.context.globalState.get<{ [key: string]: ErrorHandlingPattern }>(this.STORAGE_KEY_PATTERNS, {});
            this.errorPatterns = new Map(Object.entries(patternsData));
            
            const behaviorData = this.context.globalState.get<ErrorHandlingBehavior>(this.STORAGE_KEY_BEHAVIOR);
            if (behaviorData) {
                this.userBehavior = behaviorData;
            }
            
            console.log(`Loaded ${this.errorPatterns.size} error handling patterns`);
        } catch (error) {
            console.error('Error loading error handling data:', error);
        }
    }

    /**
     * Save data to storage
     */
    private async saveData(): Promise<void> {
        try {
            const patternsData = Object.fromEntries(this.errorPatterns);
            await this.context.globalState.update(this.STORAGE_KEY_PATTERNS, patternsData);
            
            await this.context.globalState.update(this.STORAGE_KEY_BEHAVIOR, this.userBehavior);
        } catch (error) {
            console.error('Error saving error handling data:', error);
        }
    }
}
