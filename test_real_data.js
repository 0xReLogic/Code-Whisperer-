// REAL DATA TEST - Should start with 0 patterns and increment ONLY on actual usage

function testRealDataTracking() {
    console.log('This should be tracked as REAL usage!');
    
    // Select this code and run "Code Whisperer: Analyze Code"
    // Dashboard should show REAL increments
    
    const patterns = ['real', 'data', 'tracking'];
    
    for (let i = 0; i < patterns.length; i++) {
        console.log(`Pattern ${i}: ${patterns[i]}`);
    }
    
    return {
        message: 'Real data test complete',
        timestamp: new Date().toISOString()
    };
}

// Test different patterns for real analysis
const arrowFunction = () => 'arrow function pattern';
const asyncFunction = async () => await Promise.resolve('async pattern');

class TestClass {
    constructor(name) {
        this.name = name;
    }
    
    getName() {
        return this.name;
    }
}

module.exports = { testRealDataTracking, arrowFunction, asyncFunction, TestClass };
