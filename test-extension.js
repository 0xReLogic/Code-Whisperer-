// Test file untuk Code Whisperer Extension
// Mari test apakah AI bisa belajar dari coding patterns

function getUserName() {
    return "testUser";
}

const userName = getUserName();

// Test variable naming patterns
let userAge = 25;
let userEmail = "test@example.com";
let isUserActive = true;

// Test function patterns
function calculateTotal(price, tax) {
    return price * (1 + tax);
}

const calculateDiscount = (price, discountPercent) => {
    return price * (discountPercent / 100);
};

// Test class patterns
class UserManager {
    constructor() {
        this.users = [];
    }
    
    addUser(user) {
        this.users.push(user);
    }
    
    getUserById(id) {
        return this.users.find(user => user.id === id);
    }
}

// Test error handling patterns
try {
    const result = calculateTotal(100, 0.1);
    console.log('Total:', result);
} catch (error) {
    console.error('Error calculating total:', error);
}

// Test async patterns
async function fetchUserData(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        return await response.json();
    } catch (error) {
        throw new Error(`Failed to fetch user data: ${error.message}`);
    }
}

// Test array methods
const numbers = [1, 2, 3, 4, 5];
const doubledNumbers = numbers.map(num => num * 2);
const evenNumbers = numbers.filter(num => num % 2 === 0);

console.log('Extension testing complete!');
