// TypeScript test file untuk Code Whisperer
// Test apakah extension bisa detect TypeScript patterns

interface User {
    id: number;
    name: string;
    email: string;
    isActive: boolean;
}

interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
}

class UserService {
    private users: User[] = [];
    
    constructor(private apiUrl: string) {}
    
    async createUser(userData: Omit<User, 'id'>): Promise<User> {
        const newUser: User = {
            id: Date.now(),
            ...userData
        };
        
        this.users.push(newUser);
        return newUser;
    }
    
    async getUserById(id: number): Promise<User | null> {
        return this.users.find(user => user.id === id) || null;
    }
    
    async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
        const userIndex = this.users.findIndex(user => user.id === id);
        
        if (userIndex === -1) {
            return null;
        }
        
        this.users[userIndex] = { ...this.users[userIndex], ...updates };
        return this.users[userIndex];
    }
}

// Test generic functions
function processApiResponse<T>(response: ApiResponse<T>): T | null {
    if (response.status === 200) {
        return response.data;
    }
    
    console.error(`API Error: ${response.message}`);
    return null;
}

// Test type guards
function isUser(obj: any): obj is User {
    return obj && 
           typeof obj.id === 'number' &&
           typeof obj.name === 'string' &&
           typeof obj.email === 'string' &&
           typeof obj.isActive === 'boolean';
}

// Test utility types
type UserUpdate = Pick<User, 'name' | 'email'>;
type UserSummary = Omit<User, 'email'>;

const userService = new UserService('https://api.example.com');

// Test async/await patterns
async function testUserOperations(): Promise<void> {
    try {
        const newUser = await userService.createUser({
            name: 'John Doe',
            email: 'john@example.com',
            isActive: true
        });
        
        console.log('Created user:', newUser);
        
        const fetchedUser = await userService.getUserById(newUser.id);
        console.log('Fetched user:', fetchedUser);
        
    } catch (error) {
        console.error('Error in user operations:', error);
    }
}

testUserOperations();
