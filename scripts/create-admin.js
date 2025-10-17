#!/usr/bin/env node

/**
 * Script to create a new administrator account
 * Usage: node scripts/create-admin.js
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

async function createAdminAccount() {
  console.log('🏥 Hospital Management System - Admin Account Creator\n');
  
  try {
    // Get admin details
    const email = await promptUser('Enter admin email: ');
    const username = await promptUser('Enter admin username: ');
    const password = await promptPassword('Enter admin password: ');
    const firstName = await promptUser('Enter first name: ');
    const lastName = await promptUser('Enter last name: ');
    const employeeId = await promptUser('Enter employee ID: ');
    const phone = await promptUser('Enter phone number: ');
    
    console.log('\n📝 Creating admin account...');
    
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
      shift: 'Day'
    };
    
    // Make API request
    const API_BASE_URL = process.env.API_BASE_URL || 'https://web-production-68a4f3.up.railway.app/api';
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('\n✅ Admin account created successfully!');
      console.log(`📧 Email: ${result.data.user.email}`);
      console.log(`👤 Username: ${result.data.user.username}`);
      console.log(`🔑 Role: ${result.data.user.role}`);
      console.log(`🆔 Employee ID: ${result.data.user.employeeId}`);
    } else {
      console.log('\n❌ Failed to create admin account:');
      console.log(result.message);
      if (result.errors) {
        result.errors.forEach(error => console.log(`  - ${error.msg}`));
      }
    }
    
  } catch (error) {
    console.log('\n❌ Error creating admin account:');
    console.log(error.message);
  }
  
  rl.close();
}

// Alternative: Create admin with provided credentials
async function createAdminWithCredentials(credentials) {
  try {
    const API_BASE_URL = process.env.API_BASE_URL || 'https://web-production-68a4f3.up.railway.app/api';
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}

// If running directly
if (require.main === module) {
  createAdminAccount();
}

module.exports = { createAdminWithCredentials };