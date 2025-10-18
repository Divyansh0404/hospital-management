#!/usr/bin/env node

/**
 * Script to set up a new personal admin account and clean up test accounts
 * Usage: node scripts/setup-admin.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function promptPassword(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let password = '';
    
    stdin.on('data', function(key) {
      if (key === '\u0003') { // Ctrl+C
        process.exit();
      } else if (key === '\r' || key === '\n') { // Enter
        stdin.setRawMode(false);
        stdin.pause();
        stdout.write('\n');
        resolve(password);
      } else if (key === '\u0008' || key === '\u007f') { // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          stdout.write('\b \b');
        }
      } else {
        password += key;
        stdout.write('*');
      }
    });
  });
}

async function makeAPIRequest(endpoint, options = {}) {
  const API_BASE_URL = process.env.API_BASE_URL || 'https://web-production-68a4f3.up.railway.app/api';
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    const result = await response.json();
    return { response, result };
  } catch (error) {
    throw error;
  }
}

async function createPersonalAdminAccount() {
  console.log('🏥 Hospital Management System - Personal Admin Setup\n');
  
  try {
    console.log('📝 Setting up your personal administrator account...\n');
    
    // Get personal admin details
    const email = await promptUser('Enter your email address: ');
    const username = await promptUser('Enter preferred username: ');
    const password = await promptPassword('Enter secure password: ');
    const confirmPassword = await promptPassword('Confirm password: ');
    
    if (password !== confirmPassword) {
      console.log('\n❌ Passwords do not match. Please try again.');
      return await createPersonalAdminAccount();
    }
    
    const firstName = await promptUser('Enter your first name: ');
    const lastName = await promptUser('Enter your last name: ');
    const employeeId = await promptUser('Enter your employee ID (e.g., ADM001): ');
    const phone = await promptUser('Enter your phone number: ');
    
    console.log('\n🔧 Creating your admin account...');
    
    // Prepare the request data
    const adminData = {
      username,
      email,
      password,
      firstName,
      lastName,
      employeeId,
      department: 'Administration',
      role: 'Admin',
      phone,
      shift: 'Morning'
    };
    
    // Create the admin account
    const { response, result } = await makeAPIRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
    
    if (result.success) {
      console.log('\n✅ Personal admin account created successfully!');
      console.log(`📧 Email: ${result.data.user.email}`);
      console.log(`👤 Username: ${result.data.user.username}`);
      console.log(`🔑 Role: ${result.data.user.role}`);
      console.log(`🆔 Employee ID: ${result.data.user.employeeId}`);
      
      // Store the token for cleanup operations
      const adminToken = result.data.token;
      return adminToken;
    } else {
      console.log('\n❌ Failed to create admin account:');
      console.log(result.message);
      if (result.errors) {
        result.errors.forEach(error => console.log(`  - ${error.msg}`));
      }
      return null;
    }
    
  } catch (error) {
    console.log('\n❌ Error creating admin account:');
    console.log(error.message);
    return null;
  }
}

async function cleanupTestAccounts(adminToken) {
  console.log('\n🧹 Cleaning up test accounts...');
  
  try {
    // First, try to get a list of users (if endpoint exists)
    // This would require a users endpoint in the backend
    console.log('📋 Note: To remove test accounts, you may need to:');
    console.log('1. Access your database directly (MongoDB Atlas)');
    console.log('2. Or implement a user management endpoint in the backend');
    console.log('3. Remove users with test emails like:');
    console.log('   - testadmin@hospital.com');
    console.log('   - testdoctor@hospital.com');
    console.log('   - admin@hospital.com');
    console.log('   - test@hospital.com');
    
    // For now, let's provide MongoDB commands to run manually
    console.log('\n📝 MongoDB commands to clean up test accounts:');
    console.log('```');
    console.log('// Connect to your MongoDB database');
    console.log('use hospital_management');
    console.log('');
    console.log('// Remove test accounts');
    console.log('db.users.deleteMany({');
    console.log('  email: {');
    console.log('    $in: [');
    console.log('      "testadmin@hospital.com",');
    console.log('      "testdoctor@hospital.com",');
    console.log('      "admin@hospital.com",');
    console.log('      "test@hospital.com"');
    console.log('    ]');
    console.log('  }');
    console.log('});');
    console.log('```');
    
  } catch (error) {
    console.log('\n⚠️  Could not automatically clean up test accounts:');
    console.log(error.message);
  }
}

async function setupPersonalAdmin() {
  const adminToken = await createPersonalAdminAccount();
  
  if (adminToken) {
    await cleanupTestAccounts(adminToken);
    
    console.log('\n🎉 Setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Log in with your new credentials');
    console.log('2. Manually remove test accounts from the database if needed');
    console.log('3. Update any deployment documentation with your new admin credentials');
  }
  
  rl.close();
}

// Quick setup with provided credentials (alternative method)
async function quickSetup() {
  console.log('🏥 Quick Admin Setup\n');
  
  // You can modify these credentials before running
  const personalAdmin = {
    username: 'your_username',  // CHANGE THIS
    email: 'your.email@example.com',  // CHANGE THIS
    password: 'your_secure_password',  // CHANGE THIS
    firstName: 'Your',  // CHANGE THIS
    lastName: 'Name',  // CHANGE THIS
    employeeId: 'ADM001',
    department: 'Administration',
    role: 'Admin',
    phone: '555-0123',  // CHANGE THIS
    shift: 'Morning'
  };
  
  console.log('⚠️  Please modify the personalAdmin object in this script with your actual credentials before running quickSetup()');
  console.log('📧 Current email:', personalAdmin.email);
  
  if (personalAdmin.email === 'your.email@example.com') {
    console.log('\n❌ Please update the credentials in the script first!');
    return;
  }
  
  try {
    const { response, result } = await makeAPIRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(personalAdmin),
    });
    
    if (result.success) {
      console.log('\n✅ Quick admin setup successful!');
      console.log(`📧 Email: ${result.data.user.email}`);
      console.log(`👤 Username: ${result.data.user.username}`);
    } else {
      console.log('\n❌ Quick setup failed:');
      console.log(result.message);
    }
  } catch (error) {
    console.log('\n❌ Error in quick setup:');
    console.log(error.message);
  }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--quick')) {
  quickSetup();
} else {
  setupPersonalAdmin();
}

module.exports = { setupPersonalAdmin, quickSetup };