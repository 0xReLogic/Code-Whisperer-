import * as vscode from 'vscode';
import * as path from 'path';
import { FeedbackData } from './feedbackSystem';
import { LearnedPattern } from './patternAdaptationEngine';

// Interface untuk context information
export interface CodeContext {
    projectType: ProjectType;
    fileType: FileType;
    directory: DirectoryContext;
    functionality: FunctionalityContext;
    teamContext?: TeamContext;
    temporalContext: TemporalContext;
}

export interface ProjectType {
    category: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'desktop' | 'library' | 'unknown';
    framework?: string; // React, Vue, Express, Django, etc.
    buildTool?: string; // webpack, vite, gradle, etc.
    packageManager?: string; // npm, yarn, pip, etc.
    confidence: number;
}

export interface FileType {
    primary: 'source' | 'test' | 'config' | 'documentation' | 'asset';
    specific: string; // component, service, controller, model, etc.
    language: string;
    patterns: string[]; // detected patterns in file
}

export interface DirectoryContext {
    path: string;
    purpose: 'source' | 'tests' | 'components' | 'services' | 'utils' | 'config' | 'assets' | 'docs';
    depth: number; // how deep in project structure
    conventions: string[]; // naming conventions detected
}

export interface FunctionalityContext {
    domain: string; // auth, payments, ui, data, etc.
    complexity: 'simple' | 'medium' | 'complex';
    patterns: string[]; // MVC, MVP, MVVM, etc.
    dependencies: string[]; // external libraries used
}

export interface TeamContext {
    size: 'solo' | 'small' | 'medium' | 'large';
    styleguide?: string;
    conventions: string[];
    reviewPatterns: string[];
}

export interface TemporalContext {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek: 'weekday' | 'weekend';
    sessionDuration: number; // current coding session length
    recentActivity: string[]; // recent files/actions
}

// Interface untuk context-specific patterns
export interface ContextualPattern {
    patternId: string;
    basePattern: LearnedPattern;
    contextSignature: string; // hash of context conditions
    contextSpecificity: number; // how specific to this context (0-1)
    performance: {
        totalSuggestions: number;
        acceptedInContext: number;
        rejectedInContext: number;
        contextAccuracy: number;
    };
    applicableContexts: Partial<CodeContext>[];
}

export class ContextAwareLearningSystem {
    private context: vscode.ExtensionContext;
    private contextualPatterns: Map<string, ContextualPattern> = new Map();
    private projectContextCache: Map<string, ProjectType> = new Map();
    private readonly STORAGE_KEY = 'codeWhispererContextual';
    private readonly CONTEXT_CACHE_KEY = 'codeWhispererContextCache';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadContextualData();
    }

    /**
     * Analyze current code context
     */
    public async analyzeCurrentContext(editor?: vscode.TextEditor): Promise<CodeContext> {
        const activeEditor = editor || vscode.window.activeTextEditor;
        if (!activeEditor) {
            return this.getDefaultContext();
        }

        const document = activeEditor.document;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        
        const context: CodeContext = {
            projectType: await this.analyzeProjectType(workspaceFolder),
            fileType: this.analyzeFileType(document),
            directory: this.analyzeDirectoryContext(document.uri, workspaceFolder),
            functionality: await this.analyzeFunctionalityContext(document),
            temporalContext: this.analyzeTemporalContext()
        };

        // Add team context if available
        const teamContext = await this.analyzeTeamContext(workspaceFolder);
        if (teamContext) {
            context.teamContext = teamContext;
        }

        return context;
    }

    /**
     * Analyze project type from workspace
     */
    private async analyzeProjectType(workspaceFolder?: vscode.WorkspaceFolder): Promise<ProjectType> {
        if (!workspaceFolder) {
            return { category: 'unknown', confidence: 0 };
        }

        // Check cache first
        const cached = this.projectContextCache.get(workspaceFolder.uri.fsPath);
        if (cached) {
            return cached;
        }

        const projectType: ProjectType = {
            category: 'unknown',
            confidence: 0
        };

        try {
            // Check package.json for hints
            const packageJsonPath = path.join(workspaceFolder.uri.fsPath, 'package.json');
            try {
                const packageJson = JSON.parse(
                    await vscode.workspace.fs.readFile(vscode.Uri.file(packageJsonPath)).then(
                        data => Buffer.from(data).toString('utf8')
                    )
                );

                const { category, framework, confidence } = this.analyzePackageJson(packageJson);
                projectType.category = category;
                projectType.framework = framework;
                projectType.confidence = confidence;

                // Detect package manager
                if (await this.fileExists(path.join(workspaceFolder.uri.fsPath, 'yarn.lock'))) {
                    projectType.packageManager = 'yarn';
                } else if (await this.fileExists(path.join(workspaceFolder.uri.fsPath, 'package-lock.json'))) {
                    projectType.packageManager = 'npm';
                }

                // Detect build tool
                if (packageJson.devDependencies) {
                    if (packageJson.devDependencies.webpack) projectType.buildTool = 'webpack';
                    else if (packageJson.devDependencies.vite) projectType.buildTool = 'vite';
                    else if (packageJson.devDependencies.parcel) projectType.buildTool = 'parcel';
                }

            } catch (error) {
                // No package.json or invalid JSON
            }

            // Check for other project indicators
            if (projectType.category === 'unknown') {
                const indicators = await this.checkProjectIndicators(workspaceFolder.uri.fsPath);
                projectType.category = indicators.category;
                projectType.confidence = indicators.confidence;
                if (indicators.framework) {
                    projectType.framework = indicators.framework;
                }
            }

        } catch (error) {
            console.error('Error analyzing project type:', error);
        }

        // Cache the result
        this.projectContextCache.set(workspaceFolder.uri.fsPath, projectType);
        this.saveContextCache();

        return projectType;
    }

    /**
     * Analyze package.json to determine project type
     */
    private analyzePackageJson(packageJson: any): { category: ProjectType['category']; framework?: string; confidence: number } {
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Frontend indicators
        if (deps.react || deps['@types/react']) {
            return { category: 'frontend', framework: 'React', confidence: 0.9 };
        }
        if (deps.vue || deps['@vue/cli']) {
            return { category: 'frontend', framework: 'Vue', confidence: 0.9 };
        }
        if (deps.angular || deps['@angular/core']) {
            return { category: 'frontend', framework: 'Angular', confidence: 0.9 };
        }
        if (deps.svelte) {
            return { category: 'frontend', framework: 'Svelte', confidence: 0.9 };
        }

        // Backend indicators
        if (deps.express) {
            return { category: 'backend', framework: 'Express', confidence: 0.9 };
        }
        if (deps.nestjs || deps['@nestjs/core']) {
            return { category: 'backend', framework: 'NestJS', confidence: 0.9 };
        }
        if (deps.fastify) {
            return { category: 'backend', framework: 'Fastify', confidence: 0.9 };
        }
        if (deps.koa) {
            return { category: 'backend', framework: 'Koa', confidence: 0.9 };
        }

        // Fullstack indicators
        if (deps.next || deps.nuxt) {
            return { category: 'fullstack', framework: deps.next ? 'Next.js' : 'Nuxt.js', confidence: 0.9 };
        }

        // Mobile indicators
        if (deps['react-native'] || deps.expo) {
            return { category: 'mobile', framework: 'React Native', confidence: 0.9 };
        }

        // Desktop indicators
        if (deps.electron) {
            return { category: 'desktop', framework: 'Electron', confidence: 0.9 };
        }

        // Library indicators
        if (packageJson.main && !deps.express && !deps.react) {
            return { category: 'library', confidence: 0.7 };
        }

        return { category: 'unknown', confidence: 0 };
    }

    /**
     * Check for project indicators in file system
     */
    private async checkProjectIndicators(projectPath: string): Promise<{ category: ProjectType['category']; framework?: string; confidence: number }> {
        // Check for specific files/directories
        const indicators = [
            { path: 'requirements.txt', category: 'backend' as const, framework: 'Python', confidence: 0.8 },
            { path: 'Pipfile', category: 'backend' as const, framework: 'Python', confidence: 0.8 },
            { path: 'pom.xml', category: 'backend' as const, framework: 'Maven', confidence: 0.8 },
            { path: 'build.gradle', category: 'backend' as const, framework: 'Gradle', confidence: 0.8 },
            { path: 'Cargo.toml', category: 'backend' as const, framework: 'Rust', confidence: 0.8 },
            { path: 'go.mod', category: 'backend' as const, framework: 'Go', confidence: 0.8 },
            { path: 'composer.json', category: 'backend' as const, framework: 'PHP', confidence: 0.8 },
            { path: 'Gemfile', category: 'backend' as const, framework: 'Ruby', confidence: 0.8 },
        ];

        for (const indicator of indicators) {
            if (await this.fileExists(path.join(projectPath, indicator.path))) {
                return {
                    category: indicator.category,
                    framework: indicator.framework,
                    confidence: indicator.confidence
                };
            }
        }

        return { category: 'unknown', confidence: 0 };
    }

    /**
     * Analyze file type and purpose
     */
    private analyzeFileType(document: vscode.TextDocument): FileType {
        const fileName = path.basename(document.fileName);
        const extension = path.extname(fileName);
        const nameWithoutExt = path.basename(fileName, extension);
        
        const fileType: FileType = {
            primary: 'source',
            specific: 'unknown',
            language: document.languageId,
            patterns: []
        };

        // Determine primary type
        if (fileName.includes('.test.') || fileName.includes('.spec.') || nameWithoutExt.endsWith('Test')) {
            fileType.primary = 'test';
        } else if (['.config.', '.conf.', 'webpack.', 'vite.', '.env', 'tsconfig.', 'eslintrc'].some(pattern => fileName.includes(pattern))) {
            fileType.primary = 'config';
        } else if (['.md', '.txt', '.rst', '.adoc'].includes(extension)) {
            fileType.primary = 'documentation';
        } else if (['.png', '.jpg', '.svg', '.ico', '.css', '.scss', '.less'].includes(extension)) {
            fileType.primary = 'asset';
        }

        // Determine specific type based on naming patterns
        if (fileName.includes('component') || fileName.includes('Component')) {
            fileType.specific = 'component';
        } else if (fileName.includes('service') || fileName.includes('Service')) {
            fileType.specific = 'service';
        } else if (fileName.includes('controller') || fileName.includes('Controller')) {
            fileType.specific = 'controller';
        } else if (fileName.includes('model') || fileName.includes('Model')) {
            fileType.specific = 'model';
        } else if (fileName.includes('util') || fileName.includes('helper')) {
            fileType.specific = 'utility';
        } else if (fileName.includes('hook') || fileName.includes('Hook')) {
            fileType.specific = 'hook';
        } else if (fileName.includes('store') || fileName.includes('reducer')) {
            fileType.specific = 'state-management';
        }

        // Analyze patterns in file content
        fileType.patterns = this.extractFilePatterns(document);

        return fileType;
    }

    /**
     * Extract patterns from file content
     */
    private extractFilePatterns(document: vscode.TextDocument): string[] {
        const patterns: string[] = [];
        const content = document.getText();

        // Check for common patterns
        if (content.includes('class ')) patterns.push('class-based');
        if (content.includes('function ') || content.includes('=>')) patterns.push('functional');
        if (content.includes('async ') || content.includes('await ')) patterns.push('async');
        if (content.includes('import ') || content.includes('require(')) patterns.push('modular');
        if (content.includes('export ')) patterns.push('exportable');
        if (content.includes('interface ') || content.includes('type ')) patterns.push('typed');
        if (content.includes('useState') || content.includes('useEffect')) patterns.push('react-hooks');
        if (content.includes('@') && content.includes('(')) patterns.push('decorators');
        if (content.includes('describe(') || content.includes('it(') || content.includes('test(')) patterns.push('testing');

        return patterns;
    }

    /**
     * Analyze directory context
     */
    private analyzeDirectoryContext(fileUri: vscode.Uri, workspaceFolder?: vscode.WorkspaceFolder): DirectoryContext {
        const filePath = fileUri.fsPath;
        const workspacePath = workspaceFolder?.uri.fsPath || '';
        const relativePath = path.relative(workspacePath, filePath);
        const dirPath = path.dirname(relativePath);
        
        const context: DirectoryContext = {
            path: dirPath,
            purpose: 'source',
            depth: dirPath.split(path.sep).length,
            conventions: []
        };

        // Determine directory purpose
        const pathLower = dirPath.toLowerCase();
        if (pathLower.includes('test') || pathLower.includes('spec')) {
            context.purpose = 'tests';
        } else if (pathLower.includes('component')) {
            context.purpose = 'components';
        } else if (pathLower.includes('service') || pathLower.includes('api')) {
            context.purpose = 'services';
        } else if (pathLower.includes('util') || pathLower.includes('helper') || pathLower.includes('lib')) {
            context.purpose = 'utils';
        } else if (pathLower.includes('config') || pathLower.includes('setting')) {
            context.purpose = 'config';
        } else if (pathLower.includes('asset') || pathLower.includes('static') || pathLower.includes('public')) {
            context.purpose = 'assets';
        } else if (pathLower.includes('doc')) {
            context.purpose = 'docs';
        }

        // Detect naming conventions
        const pathParts = dirPath.split(path.sep);
        for (const part of pathParts) {
            if (part.includes('-')) context.conventions.push('kebab-case');
            if (part.includes('_')) context.conventions.push('snake_case');
            if (/[A-Z]/.test(part) && !/[A-Z]{2,}/.test(part)) context.conventions.push('camelCase');
            if (/^[A-Z][a-z]/.test(part)) context.conventions.push('PascalCase');
        }

        return context;
    }

    /**
     * Analyze functionality context
     */
    private async analyzeFunctionalityContext(document: vscode.TextDocument): Promise<FunctionalityContext> {
        const content = document.getText();
        const fileName = path.basename(document.fileName).toLowerCase();
        
        const context: FunctionalityContext = {
            domain: 'general',
            complexity: 'medium',
            patterns: [],
            dependencies: []
        };

        // Determine domain based on file name and content
        const domains = [
            { keywords: ['auth', 'login', 'register', 'token', 'jwt'], domain: 'authentication' },
            { keywords: ['payment', 'billing', 'stripe', 'paypal', 'checkout'], domain: 'payments' },
            { keywords: ['ui', 'component', 'render', 'view', 'template'], domain: 'ui' },
            { keywords: ['api', 'rest', 'graphql', 'endpoint', 'route'], domain: 'api' },
            { keywords: ['database', 'db', 'model', 'schema', 'migration'], domain: 'data' },
            { keywords: ['test', 'spec', 'mock', 'assert', 'expect'], domain: 'testing' },
            { keywords: ['config', 'setting', 'env', 'constant'], domain: 'configuration' },
        ];

        for (const { keywords, domain } of domains) {
            if (keywords.some(keyword => fileName.includes(keyword) || content.toLowerCase().includes(keyword))) {
                context.domain = domain;
                break;
            }
        }

        // Determine complexity
        const lines = content.split('\n').length;
        const functions = (content.match(/function\s+\w+|=>\s*{|\w+\s*\(/g) || []).length;
        const classes = (content.match(/class\s+\w+/g) || []).length;
        const imports = (content.match(/import\s+.*from|require\s*\(/g) || []).length;

        if (lines < 50 && functions < 5) {
            context.complexity = 'simple';
        } else if (lines > 200 || functions > 20 || classes > 3) {
            context.complexity = 'complex';
        }

        // Detect architectural patterns
        if (content.includes('Controller') || content.includes('Service') || content.includes('Repository')) {
            context.patterns.push('layered-architecture');
        }
        if (content.includes('useState') && content.includes('useEffect')) {
            context.patterns.push('react-hooks');
        }
        if (content.includes('@Component') || content.includes('@Injectable')) {
            context.patterns.push('dependency-injection');
        }
        if (content.includes('observer') || content.includes('subscribe') || content.includes('emit')) {
            context.patterns.push('observer');
        }

        // Extract dependencies
        const importMatches = content.match(/import\s+.*from\s+['"`]([^'"`]+)['"`]/g) || [];
        const requireMatches = content.match(/require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g) || [];
        
        for (const match of [...importMatches, ...requireMatches]) {
            const depMatch = match.match(/['"`]([^'"`]+)['"`]/);
            if (depMatch && !depMatch[1].startsWith('.')) {
                context.dependencies.push(depMatch[1]);
            }
        }

        return context;
    }

    /**
     * Analyze team context
     */
    private async analyzeTeamContext(workspaceFolder?: vscode.WorkspaceFolder): Promise<TeamContext | undefined> {
        if (!workspaceFolder) return undefined;

        const teamContext: TeamContext = {
            size: 'solo',
            conventions: [],
            reviewPatterns: []
        };

        try {
            // Check for team indicators
            const gitPath = path.join(workspaceFolder.uri.fsPath, '.git');
            if (await this.directoryExists(gitPath)) {
                // Analyze git history for team size (simplified)
                // In a real implementation, you'd run git commands
                teamContext.size = 'small'; // placeholder
            }

            // Check for style guides
            const styleguideFiles = [
                '.eslintrc.js', '.eslintrc.json', '.eslintrc.yml',
                '.prettierrc', '.prettierrc.json',
                '.stylelintrc', '.stylelintrc.json',
                'tslint.json'
            ];

            for (const file of styleguideFiles) {
                if (await this.fileExists(path.join(workspaceFolder.uri.fsPath, file))) {
                    teamContext.styleguide = file;
                    teamContext.conventions.push('linting');
                    break;
                }
            }

            // Check for PR templates
            const prTemplatePaths = [
                '.github/pull_request_template.md',
                '.github/PULL_REQUEST_TEMPLATE.md',
                'docs/pull_request_template.md'
            ];

            for (const templatePath of prTemplatePaths) {
                if (await this.fileExists(path.join(workspaceFolder.uri.fsPath, templatePath))) {
                    teamContext.reviewPatterns.push('pr-template');
                    break;
                }
            }

        } catch (error) {
            console.error('Error analyzing team context:', error);
            return undefined;
        }

        return teamContext;
    }

    /**
     * Analyze temporal context
     */
    private analyzeTemporalContext(): TemporalContext {
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();

        let timeOfDay: TemporalContext['timeOfDay'];
        if (hour >= 6 && hour < 12) timeOfDay = 'morning';
        else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
        else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
        else timeOfDay = 'night';

        return {
            timeOfDay,
            dayOfWeek: dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' : 'weekday',
            sessionDuration: 0, // Would track actual session duration
            recentActivity: [] // Would track recent file activity
        };
    }

    /**
     * Get default context when no editor is available
     */
    private getDefaultContext(): CodeContext {
        return {
            projectType: { category: 'unknown', confidence: 0 },
            fileType: { primary: 'source', specific: 'unknown', language: 'plaintext', patterns: [] },
            directory: { path: '', purpose: 'source', depth: 0, conventions: [] },
            functionality: { domain: 'general', complexity: 'medium', patterns: [], dependencies: [] },
            temporalContext: this.analyzeTemporalContext()
        };
    }

    /**
     * Learn contextual patterns from feedback
     */
    public async learnContextualPattern(
        pattern: LearnedPattern,
        context: CodeContext,
        feedback: FeedbackData
    ): Promise<void> {
        const contextSignature = this.generateContextSignature(context);
        const contextualPatternId = `${pattern.patternId}_${contextSignature}`;

        let contextualPattern = this.contextualPatterns.get(contextualPatternId);

        if (!contextualPattern) {
            contextualPattern = {
                patternId: contextualPatternId,
                basePattern: pattern,
                contextSignature,
                contextSpecificity: this.calculateContextSpecificity(context),
                performance: {
                    totalSuggestions: 0,
                    acceptedInContext: 0,
                    rejectedInContext: 0,
                    contextAccuracy: 0.5
                },
                applicableContexts: [context]
            };
            this.contextualPatterns.set(contextualPatternId, contextualPattern);
        }

        // Update performance metrics
        contextualPattern.performance.totalSuggestions++;
        
        if (feedback.action === 'accept') {
            contextualPattern.performance.acceptedInContext++;
        } else if (feedback.action === 'reject') {
            contextualPattern.performance.rejectedInContext++;
        }

        // Recalculate accuracy
        const total = contextualPattern.performance.acceptedInContext + contextualPattern.performance.rejectedInContext;
        if (total > 0) {
            contextualPattern.performance.contextAccuracy = 
                contextualPattern.performance.acceptedInContext / total;
        }

        await this.saveContextualData();
    }

    /**
     * Get context-aware suggestions
     */
    public getContextualSuggestions(
        patterns: LearnedPattern[],
        currentContext: CodeContext,
        minAccuracy: number = 0.6
    ): LearnedPattern[] {
        const contextualSuggestions: LearnedPattern[] = [];

        for (const pattern of patterns) {
            const contextScore = this.calculateContextRelevance(pattern, currentContext);
            
            if (contextScore >= minAccuracy) {
                // Adjust pattern confidence based on context
                const adjustedPattern = {
                    ...pattern,
                    confidence: pattern.confidence * contextScore
                };
                contextualSuggestions.push(adjustedPattern);
            }
        }

        return contextualSuggestions.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Calculate context relevance for a pattern
     */
    private calculateContextRelevance(pattern: LearnedPattern, currentContext: CodeContext): number {
        let relevanceScore = 0.5; // Base score
        let factors = 0;

        // Check for contextual patterns that match current context
        for (const contextualPattern of this.contextualPatterns.values()) {
            if (contextualPattern.basePattern.patternId === pattern.patternId) {
                const contextSimilarity = this.calculateContextSimilarity(
                    contextualPattern.applicableContexts[0],
                    currentContext
                );
                
                if (contextSimilarity > 0.7) {
                    relevanceScore += contextualPattern.performance.contextAccuracy * contextSimilarity;
                    factors++;
                }
            }
        }

        // Language matching
        if (pattern.language === currentContext.fileType.language) {
            relevanceScore += 0.2;
            factors++;
        }

        // Project type matching
        if (pattern.context.projectType === currentContext.projectType.category) {
            relevanceScore += 0.15;
            factors++;
        }

        // File type matching
        if (pattern.context.fileName && 
            currentContext.fileType.specific && 
            pattern.context.fileName.includes(currentContext.fileType.specific)) {
            relevanceScore += 0.1;
            factors++;
        }

        // Normalize score
        return factors > 0 ? Math.min(1, relevanceScore) : 0.5;
    }

    /**
     * Calculate similarity between two contexts
     */
    private calculateContextSimilarity(context1: Partial<CodeContext>, context2: CodeContext): number {
        let similarity = 0;
        let factors = 0;

        // Project type similarity
        if (context1.projectType && context2.projectType) {
            if (context1.projectType.category === context2.projectType.category) {
                similarity += 0.3;
            }
            if (context1.projectType.framework === context2.projectType.framework) {
                similarity += 0.2;
            }
            factors++;
        }

        // File type similarity
        if (context1.fileType && context2.fileType) {
            if (context1.fileType.primary === context2.fileType.primary) {
                similarity += 0.2;
            }
            if (context1.fileType.specific === context2.fileType.specific) {
                similarity += 0.15;
            }
            factors++;
        }

        // Directory purpose similarity
        if (context1.directory && context2.directory) {
            if (context1.directory.purpose === context2.directory.purpose) {
                similarity += 0.1;
            }
            factors++;
        }

        // Functionality domain similarity
        if (context1.functionality && context2.functionality) {
            if (context1.functionality.domain === context2.functionality.domain) {
                similarity += 0.15;
            }
            factors++;
        }

        return factors > 0 ? similarity / factors : 0;
    }

    /**
     * Generate context signature for caching
     */
    private generateContextSignature(context: CodeContext): string {
        const key = {
            projectCategory: context.projectType.category,
            framework: context.projectType.framework,
            fileType: context.fileType.primary,
            specific: context.fileType.specific,
            language: context.fileType.language,
            domain: context.functionality.domain,
            purpose: context.directory.purpose
        };
        
        return Buffer.from(JSON.stringify(key)).toString('base64').substr(0, 16);
    }

    /**
     * Calculate context specificity
     */
    private calculateContextSpecificity(context: CodeContext): number {
        let specificity = 0;
        
        // More specific contexts get higher scores
        if (context.projectType.framework) specificity += 0.2;
        if (context.fileType.specific !== 'unknown') specificity += 0.2;
        if (context.functionality.domain !== 'general') specificity += 0.2;
        if (context.teamContext) specificity += 0.1;
        if (context.functionality.patterns.length > 0) specificity += 0.1;
        if (context.fileType.patterns.length > 0) specificity += 0.1;
        if (context.directory.conventions.length > 0) specificity += 0.1;
        
        return Math.min(1, specificity);
    }

    /**
     * Helper function to check if file exists
     */
    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Helper function to check if directory exists
     */
    private async directoryExists(dirPath: string): Promise<boolean> {
        try {
            const stat = await vscode.workspace.fs.stat(vscode.Uri.file(dirPath));
            return stat.type === vscode.FileType.Directory;
        } catch {
            return false;
        }
    }

    /**
     * Load contextual data from storage
     */
    private async loadContextualData(): Promise<void> {
        try {
            const contextualData = this.context.globalState.get<{ [key: string]: ContextualPattern }>(this.STORAGE_KEY, {});
            this.contextualPatterns = new Map(Object.entries(contextualData));

            const cacheData = this.context.globalState.get<{ [key: string]: ProjectType }>(this.CONTEXT_CACHE_KEY, {});
            this.projectContextCache = new Map(Object.entries(cacheData));

            console.log(`Loaded ${this.contextualPatterns.size} contextual patterns`);
        } catch (error) {
            console.error('Error loading contextual data:', error);
        }
    }

    /**
     * Save contextual data to storage
     */
    private async saveContextualData(): Promise<void> {
        try {
            const contextualData = Object.fromEntries(this.contextualPatterns);
            await this.context.globalState.update(this.STORAGE_KEY, contextualData);
        } catch (error) {
            console.error('Error saving contextual data:', error);
        }
    }

    /**
     * Save context cache to storage
     */
    private async saveContextCache(): Promise<void> {
        try {
            const cacheData = Object.fromEntries(this.projectContextCache);
            await this.context.globalState.update(this.CONTEXT_CACHE_KEY, cacheData);
        } catch (error) {
            console.error('Error saving context cache:', error);
        }
    }

    /**
     * Get context analysis insights
     */
    public getContextInsights(): {
        mostCommonContexts: { context: string; count: number }[];
        highestPerformingContexts: { context: string; accuracy: number }[];
        contextSpecificityDistribution: { [level: string]: number };
        projectTypeDistribution: { [type: string]: number };
    } {
        const contextCounts = new Map<string, number>();
        const contextPerformance = new Map<string, number>();
        const specificityLevels = { low: 0, medium: 0, high: 0 };
        const projectTypes = new Map<string, number>();

        for (const pattern of this.contextualPatterns.values()) {
            // Count contexts
            const contextKey = pattern.contextSignature;
            contextCounts.set(contextKey, (contextCounts.get(contextKey) || 0) + 1);
            
            // Track performance
            contextPerformance.set(contextKey, pattern.performance.contextAccuracy);
            
            // Categorize specificity
            if (pattern.contextSpecificity < 0.3) {
                specificityLevels.low++;
            } else if (pattern.contextSpecificity < 0.7) {
                specificityLevels.medium++;
            } else {
                specificityLevels.high++;
            }
        }

        // Count project types
        for (const projectType of this.projectContextCache.values()) {
            const type = projectType.category;
            projectTypes.set(type, (projectTypes.get(type) || 0) + 1);
        }

        return {
            mostCommonContexts: Array.from(contextCounts.entries())
                .map(([context, count]) => ({ context, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            
            highestPerformingContexts: Array.from(contextPerformance.entries())
                .map(([context, accuracy]) => ({ context, accuracy }))
                .sort((a, b) => b.accuracy - a.accuracy)
                .slice(0, 10),
            
            contextSpecificityDistribution: specificityLevels,
            
            projectTypeDistribution: Object.fromEntries(projectTypes)
        };
    }
}
