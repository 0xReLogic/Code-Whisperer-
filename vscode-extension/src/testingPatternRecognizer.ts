import * as vscode from 'vscode';
import { FeedbackData } from './feedbackSystem';
import { LearnedPattern } from './patternAdaptationEngine';

// Interface untuk testing pattern
export interface TestingPattern {
    patternId: string;
    name: string;
    testingType: TestingType;
    language: string;
    framework?: string; // Jest, Mocha, Pytest, etc.
    approach: TestingApproach;
    characteristics: string[];
    confidence: number;
    userPreference: number;
    examples: TestingExample[];
    metrics: TestingMetrics;
}

export type TestingType = 
    | 'unit_test'
    | 'integration_test' 
    | 'end_to_end_test'
    | 'snapshot_test'
    | 'performance_test'
    | 'security_test'
    | 'component_test'
    | 'api_test';

export type TestingApproach = 
    | 'tdd' // Test-Driven Development
    | 'bdd' // Behavior-Driven Development  
    | 'traditional' // Write tests after code
    | 'exploratory' // Manual exploratory testing
    | 'property_based' // Property-based testing
    | 'mutation_testing';

export interface TestingExample {
    testCode: string;
    productionCode: string;
    context: string;
    explanation: string;
    testingFramework: string;
}

export interface TestingMetrics {
    averageTestLength: number;
    complexityPreference: 'simple' | 'medium' | 'complex';
    coverageExpectation: number; // 0-100
    mockingFrequency: number; // 0-1
    assertionStyle: 'expect' | 'assert' | 'should';
    testStructure: 'arrange_act_assert' | 'given_when_then' | 'freestyle';
}

// Interface untuk testing behavior
export interface TestingBehavior {
    userId: string;
    primaryApproach: TestingApproach;
    typePreferences: { [type in TestingType]?: number };
    frameworkPreferences: { [framework: string]: number };
    mockingPatterns: MockingPattern[];
    testNamingConventions: string[];
    testOrganization: TestOrganization;
    qualityMetrics: TestQualityMetrics;
}

export interface MockingPattern {
    pattern: string;
    frequency: number;
    context: string[];
    confidence: number;
    examples: string[];
}

export interface TestOrganization {
    fileStructure: 'separate_files' | 'adjacent_files' | 'same_file';
    directoryStructure: 'mirrored' | 'flat' | 'grouped_by_type';
    namingPattern: string;
    groupingStrategy: 'by_feature' | 'by_layer' | 'by_type';
}

export interface TestQualityMetrics {
    averageAssertionsPerTest: number;
    testComplexityScore: number;
    duplicateTestPatterns: string[];
    testCoverageAwareness: number;
    testMaintenanceFrequency: number;
}

// Interface untuk testing suggestion
export interface TestingSuggestion {
    id: string;
    type: 'test_creation' | 'test_improvement' | 'pattern_suggestion' | 'coverage_gap';
    pattern: TestingPattern;
    targetCode: string;
    suggestedTest: string;
    priority: 'low' | 'medium' | 'high';
    reason: string;
    estimatedBenefit: number;
}

export class TestingPatternRecognizer {
    private context: vscode.ExtensionContext;
    private testingPatterns: Map<string, TestingPattern> = new Map();
    private userBehavior: TestingBehavior;
    private recentAnalysis: Map<string, any> = new Map();
    private readonly STORAGE_KEY_PATTERNS = 'codeWhispererTestingPatterns';
    private readonly STORAGE_KEY_BEHAVIOR = 'codeWhispererTestingBehavior';

    // Predefined testing patterns
    private readonly PREDEFINED_PATTERNS: Partial<TestingPattern>[] = [
        {
            name: 'Jest Unit Test with Mocking',
            testingType: 'unit_test',
            language: 'javascript',
            framework: 'jest',
            approach: 'traditional',
            characteristics: ['mocking', 'isolated', 'fast'],
            examples: [{
                testCode: 'describe("UserService", () => {\n  it("should create user", async () => {\n    const mockRepository = jest.fn();\n    const result = await userService.createUser(userData);\n    expect(result).toBeDefined();\n  });\n});',
                productionCode: 'class UserService {\n  async createUser(data) {\n    return this.repository.save(data);\n  }\n}',
                context: 'Service layer unit testing',
                explanation: 'Unit test with dependency mocking using Jest',
                testingFramework: 'jest'
            }]
        },
        {
            name: 'React Component Testing',
            testingType: 'component_test',
            language: 'javascript',
            framework: 'testing-library',
            approach: 'bdd',
            characteristics: ['user_focused', 'behavior_driven', 'integration'],
            examples: [{
                testCode: 'test("renders login button and handles click", () => {\n  render(<LoginComponent />);\n  const button = screen.getByRole("button", { name: /login/i });\n  fireEvent.click(button);\n  expect(screen.getByText("Welcome")).toBeInTheDocument();\n});',
                productionCode: 'function LoginComponent() {\n  return <button onClick={handleLogin}>Login</button>;\n}',
                context: 'React component behavior testing',
                explanation: 'User-focused component testing with React Testing Library',
                testingFramework: 'testing-library'
            }]
        },
        {
            name: 'Python Pytest with Fixtures',
            testingType: 'unit_test',
            language: 'python',
            framework: 'pytest',
            approach: 'tdd',
            characteristics: ['fixtures', 'parametrized', 'clean'],
            examples: [{
                testCode: '@pytest.fixture\ndef user_data():\n    return {"name": "John", "email": "john@test.com"}\n\ndef test_create_user(user_data):\n    user = create_user(user_data)\n    assert user.name == "John"\n    assert user.email == "john@test.com"',
                productionCode: 'def create_user(data):\n    return User(name=data["name"], email=data["email"])',
                context: 'Python function testing with fixtures',
                explanation: 'Clean test setup using pytest fixtures',
                testingFramework: 'pytest'
            }]
        },
        {
            name: 'API Integration Test',
            testingType: 'integration_test',
            language: 'javascript',
            framework: 'supertest',
            approach: 'traditional',
            characteristics: ['api_testing', 'http_requests', 'database'],
            examples: [{
                testCode: 'describe("POST /users", () => {\n  it("should create user and return 201", async () => {\n    const response = await request(app)\n      .post("/users")\n      .send(userData)\n      .expect(201);\n    expect(response.body).toHaveProperty("id");\n  });\n});',
                productionCode: 'app.post("/users", async (req, res) => {\n  const user = await User.create(req.body);\n  res.status(201).json(user);\n});',
                context: 'API endpoint integration testing',
                explanation: 'Full API integration test with database',
                testingFramework: 'supertest'
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
     * Initialize user testing behavior
     */
    private initializeUserBehavior(): TestingBehavior {
        return {
            userId: 'user',
            primaryApproach: 'traditional',
            typePreferences: {},
            frameworkPreferences: {},
            mockingPatterns: [],
            testNamingConventions: [],
            testOrganization: {
                fileStructure: 'separate_files',
                directoryStructure: 'mirrored',
                namingPattern: '*.test.js',
                groupingStrategy: 'by_feature'
            },
            qualityMetrics: {
                averageAssertionsPerTest: 1,
                testComplexityScore: 0.5,
                duplicateTestPatterns: [],
                testCoverageAwareness: 0.5,
                testMaintenanceFrequency: 0.5
            }
        };
    }

    /**
     * Initialize predefined testing patterns
     */
    private initializePredefinedPatterns(): void {
        for (const pattern of this.PREDEFINED_PATTERNS) {
            const fullPattern: TestingPattern = {
                patternId: `predefined_${pattern.testingType}_${pattern.language}_${pattern.framework}`,
                name: pattern.name!,
                testingType: pattern.testingType!,
                language: pattern.language!,
                framework: pattern.framework,
                approach: pattern.approach!,
                characteristics: pattern.characteristics!,
                confidence: 0.8,
                userPreference: 0.5,
                examples: pattern.examples!,
                metrics: {
                    averageTestLength: 10,
                    complexityPreference: 'medium',
                    coverageExpectation: 80,
                    mockingFrequency: 0.5,
                    assertionStyle: 'expect',
                    testStructure: 'arrange_act_assert'
                }
            };
            
            this.testingPatterns.set(fullPattern.patternId, fullPattern);
        }
    }

    /**
     * Analyze test files to learn user patterns
     */
    public async analyzeTestFile(document: vscode.TextDocument): Promise<void> {
        if (!this.isTestFile(document)) {
            return;
        }

        const content = document.getText();
        const language = document.languageId;
        const fileName = document.fileName;
        
        // Detect testing framework
        const framework = this.detectTestingFramework(content, language);
        
        // Analyze testing patterns
        const patterns = await this.extractTestingPatterns(content, language, framework);
        
        // Update user behavior
        await this.updateUserBehavior(patterns, document);
        
        // Store analysis results
        this.recentAnalysis.set(fileName, {
            timestamp: Date.now(),
            patterns,
            framework,
            metrics: this.calculateTestMetrics(content)
        });
        
        await this.saveData();
    }

    /**
     * Check if file is a test file
     */
    private isTestFile(document: vscode.TextDocument): boolean {
        const fileName = document.fileName.toLowerCase();
        const testPatterns = [
            '.test.',
            '.spec.',
            '_test.',
            '_spec.',
            '/test/',
            '/tests/',
            '/spec/',
            '__tests__'
        ];
        
        return testPatterns.some(pattern => fileName.includes(pattern));
    }

    /**
     * Detect testing framework being used
     */
    private detectTestingFramework(content: string, language: string): string {
        const frameworks: { [key: string]: string[] } = {
            'jest': ['describe(', 'it(', 'test(', 'expect(', 'jest.'],
            'mocha': ['describe(', 'it(', 'before(', 'after(', 'chai'],
            'jasmine': ['describe(', 'it(', 'expect(', 'spyOn('],
            'pytest': ['def test_', '@pytest.', 'assert ', 'fixture'],
            'unittest': ['class.*TestCase', 'def test_', 'self.assert'],
            'junit': ['@Test', '@Before', '@After', 'Assert.'],
            'testng': ['@Test', '@BeforeMethod', '@AfterMethod'],
            'rspec': ['describe ', 'it ', 'expect(', 'context '],
            'minitest': ['class.*Test', 'def test_', 'assert_'],
            'testing-library': ['render(', 'screen.', 'fireEvent', 'waitFor']
        };
        
        for (const [framework, patterns] of Object.entries(frameworks)) {
            if (patterns.some(pattern => new RegExp(pattern).test(content))) {
                return framework;
            }
        }
        
        return 'unknown';
    }

    /**
     * Extract testing patterns from code
     */
    private async extractTestingPatterns(
        content: string,
        language: string,
        framework: string
    ): Promise<string[]> {
        const patterns: string[] = [];
        
        // Test structure patterns
        if (content.includes('describe(') && content.includes('it(')) {
            patterns.push('nested_describe_it');
        }
        
        if (content.includes('beforeEach') || content.includes('before(')) {
            patterns.push('setup_teardown');
        }
        
        // Mocking patterns
        if (content.includes('mock') || content.includes('jest.fn()') || content.includes('sinon.')) {
            patterns.push('mocking');
        }
        
        if (content.includes('spy') || content.includes('spyOn')) {
            patterns.push('spying');
        }
        
        // Assertion patterns
        if (content.includes('expect(') && content.includes('.toBe')) {
            patterns.push('expect_assertion');
        }
        
        if (content.includes('assert ') || content.includes('assert.')) {
            patterns.push('assert_statement');
        }
        
        // Async testing patterns
        if (content.includes('async ') && content.includes('await ')) {
            patterns.push('async_testing');
        }
        
        if (content.includes('done()') || content.includes('done.')) {
            patterns.push('callback_testing');
        }
        
        // Parametrized testing
        if (content.includes('@pytest.mark.parametrize') || content.includes('test.each')) {
            patterns.push('parametrized_testing');
        }
        
        // Component testing patterns
        if (content.includes('render(') && content.includes('screen.')) {
            patterns.push('component_testing');
        }
        
        if (content.includes('fireEvent') || content.includes('userEvent')) {
            patterns.push('user_interaction_testing');
        }
        
        // Test data patterns
        if (content.includes('fixture') || content.includes('@fixture')) {
            patterns.push('fixture_usage');
        }
        
        if (content.includes('factory') || content.includes('Factory')) {
            patterns.push('test_factory');
        }
        
        return patterns;
    }

    /**
     * Calculate test file metrics
     */
    private calculateTestMetrics(content: string): TestingMetrics {
        const lines = content.split('\n');
        const testCases = (content.match(/it\(|test\(|def test_/g) || []).length;
        const assertions = (content.match(/expect\(|assert |assert\./g) || []).length;
        
        let assertionStyle: 'expect' | 'assert' | 'should' = 'expect';
        if (content.includes('assert ') && !content.includes('expect(')) {
            assertionStyle = 'assert';
        } else if (content.includes('.should.')) {
            assertionStyle = 'should';
        }
        
        let testStructure: 'arrange_act_assert' | 'given_when_then' | 'freestyle' = 'freestyle';
        if (content.includes('// Arrange') || content.includes('// Act') || content.includes('// Assert')) {
            testStructure = 'arrange_act_assert';
        } else if (content.includes('given(') || content.includes('when(') || content.includes('then(')) {
            testStructure = 'given_when_then';
        }
        
        return {
            averageTestLength: testCases > 0 ? lines.length / testCases : 0,
            complexityPreference: 'medium',
            coverageExpectation: 80,
            mockingFrequency: (content.match(/mock|spy/g) || []).length / Math.max(testCases, 1),
            assertionStyle,
            testStructure
        };
    }

    /**
     * Update user behavior based on analyzed patterns
     */
    private async updateUserBehavior(
        patterns: string[],
        document: vscode.TextDocument
    ): Promise<void> {
        const content = document.getText();
        const framework = this.detectTestingFramework(content, document.languageId);
        
        // Update framework preferences
        this.userBehavior.frameworkPreferences[framework] = 
            (this.userBehavior.frameworkPreferences[framework] || 0) + 1;
        
        // Update testing type preferences based on patterns
        if (patterns.includes('component_testing')) {
            this.userBehavior.typePreferences.component_test = 
                (this.userBehavior.typePreferences.component_test || 0) + 0.1;
        }
        
        if (patterns.includes('mocking') || patterns.includes('spying')) {
            this.userBehavior.typePreferences.unit_test = 
                (this.userBehavior.typePreferences.unit_test || 0) + 0.1;
        }
        
        // Update mocking patterns
        if (patterns.includes('mocking')) {
            const existingPattern = this.userBehavior.mockingPatterns.find(p => p.pattern === 'jest_mocking');
            if (existingPattern) {
                existingPattern.frequency++;
            } else {
                this.userBehavior.mockingPatterns.push({
                    pattern: 'jest_mocking',
                    frequency: 1,
                    context: ['unit_test'],
                    confidence: 0.7,
                    examples: ['jest.fn()', 'jest.mock()']
                });
            }
        }
        
        // Update test organization patterns
        const fileName = document.fileName;
        if (fileName.includes('.test.')) {
            this.userBehavior.testOrganization.namingPattern = '*.test.*';
        } else if (fileName.includes('.spec.')) {
            this.userBehavior.testOrganization.namingPattern = '*.spec.*';
        }
        
        // Update quality metrics
        const metrics = this.calculateTestMetrics(content);
        this.userBehavior.qualityMetrics.averageAssertionsPerTest = 
            (this.userBehavior.qualityMetrics.averageAssertionsPerTest + metrics.averageTestLength) / 2;
    }

    /**
     * Generate testing suggestions for production code
     */
    public async generateTestingSuggestions(
        document: vscode.TextDocument,
        selection?: vscode.Selection
    ): Promise<TestingSuggestion[]> {
        if (this.isTestFile(document)) {
            return []; // Don't suggest tests for test files
        }
        
        const suggestions: TestingSuggestion[] = [];
        const code = selection ? document.getText(selection) : document.getText();
        const language = document.languageId;
        
        // Analyze code to determine what tests are needed
        const analysis = this.analyzeProductionCode(code, language);
        
        // Generate suggestions based on user preferences
        for (const pattern of this.testingPatterns.values()) {
            if (pattern.language === language || pattern.language === 'any') {
                const suggestion = await this.evaluateTestingNeed(pattern, analysis, code);
                if (suggestion) {
                    suggestions.push(suggestion);
                }
            }
        }
        
        return this.prioritizeTestingSuggestions(suggestions);
    }

    /**
     * Analyze production code to determine testing needs
     */
    private analyzeProductionCode(code: string, language: string): any {
        const analysis: {
            functions: { name: string; isAsync: boolean; }[];
            classes: string[];
            complexity: number;
            dependencies: string[];
            asyncOperations: boolean;
            errorHandling: boolean;
            userInterface: boolean;
        } = {
            functions: [],
            classes: [],
            complexity: 0,
            dependencies: [],
            asyncOperations: false,
            errorHandling: false,
            userInterface: false
        };
        
        // Find functions
        const functionMatches = code.match(/function\s+(\w+)|const\s+(\w+)\s*=.*=>|def\s+(\w+)/g) || [];
        analysis.functions = functionMatches.map(match => {
            const name = match.match(/\w+/g)?.slice(-1)[0] || 'anonymous';
            return { name, isAsync: match.includes('async') };
        });
        
        // Find classes
        const classMatches = code.match(/class\s+(\w+)/g) || [];
        analysis.classes = classMatches.map(match => match.split(' ')[1]).filter((cls): cls is string => cls !== undefined);
        
        // Detect async operations
        analysis.asyncOperations = /async|await|Promise|\.then\(/.test(code);
        
        // Detect error handling
        analysis.errorHandling = /try|catch|throw|raise|except/.test(code);
        
        // Detect UI components
        analysis.userInterface = /render|component|jsx|tsx|html/.test(code.toLowerCase());
        
        // Calculate complexity (simplified)
        analysis.complexity = (code.match(/if|for|while|switch|case/g) || []).length;
        
        return analysis;
    }

    /**
     * Evaluate if a testing pattern applies to current code
     */
    private async evaluateTestingNeed(
        pattern: TestingPattern,
        analysis: any,
        code: string
    ): Promise<TestingSuggestion | null> {
        let score = 0;
        let reason = '';
        
        // Check if pattern matches code characteristics
        if (pattern.testingType === 'unit_test' && analysis.functions.length > 0) {
            score += 0.4;
            reason += 'Functions detected that need unit testing. ';
        }
        
        if (pattern.testingType === 'component_test' && analysis.userInterface) {
            score += 0.5;
            reason += 'UI components detected that need component testing. ';
        }
        
        if (pattern.characteristics.includes('mocking') && analysis.dependencies.length > 0) {
            score += 0.3;
            reason += 'Dependencies detected that could benefit from mocking. ';
        }
        
        if (pattern.characteristics.includes('async') && analysis.asyncOperations) {
            score += 0.3;
            reason += 'Async operations detected that need testing. ';
        }
        
        // Apply user preferences
        const userPref = this.userBehavior.typePreferences[pattern.testingType] || 0.5;
        score *= userPref;
        
        // Check framework preference
        const frameworkPref = pattern.framework ? 
            this.userBehavior.frameworkPreferences[pattern.framework] || 0 : 0.5;
        score *= (1 + frameworkPref * 0.2);
        
        if (score >= 0.4) {
            return {
                id: `test_suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'test_creation',
                pattern,
                targetCode: code,
                suggestedTest: await this.generateTestCode(pattern, analysis),
                priority: score > 0.7 ? 'high' : score > 0.5 ? 'medium' : 'low',
                reason: reason.trim(),
                estimatedBenefit: score
            };
        }
        
        return null;
    }

    /**
     * Generate test code based on pattern and analysis
     */
    private async generateTestCode(pattern: TestingPattern, analysis: any): Promise<string> {
        const example = pattern.examples[0];
        if (example) {
            return example.testCode;
        }
        
        // Generate basic test template based on pattern type
        let testCode = '';
        
        switch (pattern.testingType) {
            case 'unit_test':
                testCode = this.generateUnitTestTemplate(pattern, analysis);
                break;
            case 'component_test':
                testCode = this.generateComponentTestTemplate(pattern, analysis);
                break;
            case 'integration_test':
                testCode = this.generateIntegrationTestTemplate(pattern, analysis);
                break;
            default:
                testCode = '// Generated test template\n// TODO: Implement test cases';
        }
        
        return testCode;
    }

    /**
     * Generate unit test template
     */
    private generateUnitTestTemplate(pattern: TestingPattern, analysis: any): string {
        const functionName = analysis.functions[0]?.name || 'targetFunction';
        
        if (pattern.framework === 'jest') {
            return `describe('${functionName}', () => {\n  it('should work correctly', () => {\n    // Arrange\n    const input = {};\n    \n    // Act\n    const result = ${functionName}(input);\n    \n    // Assert\n    expect(result).toBeDefined();\n  });\n});`;
        } else if (pattern.framework === 'pytest') {
            return `def test_${functionName}():\n    # Arrange\n    input_data = {}\n    \n    # Act\n    result = ${functionName}(input_data)\n    \n    # Assert\n    assert result is not None`;
        }
        
        return `// Unit test for ${functionName}\n// TODO: Implement test cases`;
    }

    /**
     * Generate component test template
     */
    private generateComponentTestTemplate(pattern: TestingPattern, analysis: any): string {
        const componentName = analysis.classes[0] || 'Component';
        
        return `test('${componentName} renders correctly', () => {\n  render(<${componentName} />);\n  \n  // Add assertions here\n  expect(screen.getByRole('button')).toBeInTheDocument();\n});`;
    }

    /**
     * Generate integration test template
     */
    private generateIntegrationTestTemplate(pattern: TestingPattern, analysis: any): string {
        return `describe('Integration Test', () => {\n  it('should integrate components correctly', async () => {\n    // Setup integration environment\n    \n    // Execute integration scenario\n    \n    // Verify integration results\n    expect(true).toBe(true); // Replace with actual assertions\n  });\n});`;
    }

    /**
     * Prioritize testing suggestions
     */
    private prioritizeTestingSuggestions(suggestions: TestingSuggestion[]): TestingSuggestion[] {
        return suggestions.sort((a, b) => {
            // Priority order
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            
            if (priorityDiff !== 0) return priorityDiff;
            
            // Then by estimated benefit
            return b.estimatedBenefit - a.estimatedBenefit;
        });
    }

    /**
     * Learn from testing feedback
     */
    public async learnFromTestingFeedback(
        suggestion: TestingSuggestion,
        feedback: FeedbackData
    ): Promise<void> {
        const pattern = suggestion.pattern;
        
        if (feedback.action === 'accept') {
            pattern.userPreference = Math.min(1, pattern.userPreference + 0.1);
            pattern.confidence = Math.min(1, pattern.confidence + 0.05);
            
            // Update type preferences
            this.userBehavior.typePreferences[pattern.testingType] = Math.min(1,
                (this.userBehavior.typePreferences[pattern.testingType] || 0.5) + 0.1
            );
            
            // Update framework preferences
            if (pattern.framework) {
                this.userBehavior.frameworkPreferences[pattern.framework] = 
                    (this.userBehavior.frameworkPreferences[pattern.framework] || 0) + 1;
            }
            
        } else if (feedback.action === 'reject') {
            pattern.userPreference = Math.max(0, pattern.userPreference - 0.1);
            pattern.confidence = Math.max(0.1, pattern.confidence - 0.05);
            
            // Update type preferences
            this.userBehavior.typePreferences[pattern.testingType] = Math.max(0,
                (this.userBehavior.typePreferences[pattern.testingType] || 0.5) - 0.1
            );
        }
        
        await this.saveData();
    }

    /**
     * Get testing insights
     */
    public getTestingInsights(): {
        preferredTestingTypes: TestingType[];
        preferredFrameworks: string[];
        testingApproach: TestingApproach;
        mockingPreference: number;
        testQualityScore: number;
        improvementSuggestions: string[];
    } {
        // Get preferred testing types
        const preferredTypes = Object.entries(this.userBehavior.typePreferences)
            .filter(([_, score]) => score > 0.6)
            .map(([type, _]) => type as TestingType);
        
        // Get preferred frameworks
        const preferredFrameworks = Object.entries(this.userBehavior.frameworkPreferences)
            .sort(([_, a], [__, b]) => b - a)
            .slice(0, 3)
            .map(([framework, _]) => framework);
        
        // Calculate mocking preference
        const mockingPreference = this.userBehavior.mockingPatterns.reduce((sum, pattern) => 
            sum + pattern.frequency, 0) / Math.max(this.userBehavior.mockingPatterns.length, 1);
        
        // Calculate test quality score
        const qualityScore = (
            this.userBehavior.qualityMetrics.testCoverageAwareness +
            this.userBehavior.qualityMetrics.testMaintenanceFrequency +
            (this.userBehavior.qualityMetrics.averageAssertionsPerTest > 0 ? 1 : 0)
        ) / 3;
        
        // Generate improvement suggestions
        const improvements = this.generateTestingImprovements();
        
        return {
            preferredTestingTypes: preferredTypes,
            preferredFrameworks,
            testingApproach: this.userBehavior.primaryApproach,
            mockingPreference,
            testQualityScore: qualityScore,
            improvementSuggestions: improvements
        };
    }

    /**
     * Generate testing improvement suggestions
     */
    private generateTestingImprovements(): string[] {
        const suggestions: string[] = [];
        
        // Check test coverage
        if (this.userBehavior.qualityMetrics.testCoverageAwareness < 0.5) {
            suggestions.push('Consider increasing test coverage awareness - aim for 80% code coverage');
        }
        
        // Check testing variety
        const typeCount = Object.keys(this.userBehavior.typePreferences).length;
        if (typeCount < 3) {
            suggestions.push('Try different testing types - unit, integration, and component tests each have unique benefits');
        }
        
        // Check mocking usage
        const mockingUsage = this.userBehavior.mockingPatterns.length;
        if (mockingUsage === 0) {
            suggestions.push('Consider using mocking to isolate units under test and improve test reliability');
        }
        
        return suggestions;
    }

    /**
     * Load data from storage
     */
    private async loadData(): Promise<void> {
        try {
            const patternsData = this.context.globalState.get<{ [key: string]: TestingPattern }>(this.STORAGE_KEY_PATTERNS, {});
            this.testingPatterns = new Map(Object.entries(patternsData));
            
            const behaviorData = this.context.globalState.get<TestingBehavior>(this.STORAGE_KEY_BEHAVIOR);
            if (behaviorData) {
                this.userBehavior = behaviorData;
            }
            
            console.log(`Loaded ${this.testingPatterns.size} testing patterns`);
        } catch (error) {
            console.error('Error loading testing data:', error);
        }
    }

    /**
     * Save data to storage
     */
    private async saveData(): Promise<void> {
        try {
            const patternsData = Object.fromEntries(this.testingPatterns);
            await this.context.globalState.update(this.STORAGE_KEY_PATTERNS, patternsData);
            
            await this.context.globalState.update(this.STORAGE_KEY_BEHAVIOR, this.userBehavior);
        } catch (error) {
            console.error('Error saving testing data:', error);
        }
    }
}
