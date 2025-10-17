#!/usr/bin/env node

/**
 * Script to clean up test accounts
 * Usage: node scripts/cleanup-test-accounts.js [admin-token]
 */

const testEmails = [
  'test@hospital.com',
  'testadmin@hospital.com',
  'testdoctor@hospital.com',
  'admin@hospital.com',
  'demo@hospital.com'
];

async function cleanupTestAccounts(adminToken) {
  const API_BASE_URL = process.env.API_BASE_URL || 'https://web-production-68a4f3.up.railway.app/api';
  
  console.log('🧹 Hospital Management System - Test Account Cleanup');
  console.log('===================================================');
  console.log('');
  console.log('🎯 Target test accounts:');
  testEmails.forEach(email => console.log(`   - ${email}`));
  console.log('');
  
  if (!adminToken) {
    console.log('❌ Admin token required for cleanup operations');
    console.log('💡 Usage: node scripts/cleanup-test-accounts.js [admin-token]');
    console.log('');
    console.log('📋 To get admin token:');
    console.log('1. Log in with your admin account');
    console.log('2. Check localStorage for hospital_auth_token');
    console.log('3. Or use the token from account creation response');
    return;
  }
  
  console.log('🔍 Note: This script provides guidance for test account cleanup.');
  console.log('Since direct user deletion requires backend implementation,');
  console.log('here are the recommended approaches:');
  console.log('');
  
  console.log('📝 Option 1: Database Direct Access (MongoDB)');
  console.log('```javascript');
  console.log('// Connect to your MongoDB database');
  console.log('use hospital_management;');
  console.log('');
  console.log('// Find test accounts');
  console.log('db.users.find({');
  console.log('  email: {');
  console.log('    $in: [');
  testEmails.forEach((email, index) => {
    const comma = index < testEmails.length - 1 ? ',' : '';
    console.log(`      "${email}"${comma}`);
  });
  console.log('    ]');
  console.log('  }');
  console.log('});');
  console.log('');
  console.log('// Delete test accounts');
  console.log('db.users.deleteMany({');
  console.log('  email: {');
  console.log('    $in: [');
  testEmails.forEach((email, index) => {
    const comma = index < testEmails.length - 1 ? ',' : '';
    console.log(`      "${email}"${comma}`);
  });
  console.log('    ]');
  console.log('  }');
  console.log('});');
  console.log('```');
  console.log('');
  
  console.log('📝 Option 2: Backend Endpoint (Requires Implementation)');
  console.log('Add a DELETE /api/users/:id endpoint with admin authorization');
  console.log('');
  
  console.log('📝 Option 3: Admin Dashboard (Future Feature)');
  console.log('Implement user management in the admin dashboard');
  console.log('');
  
  // Try to check if any test accounts exist (if backend has user listing)
  try {
    console.log('🔍 Checking for test accounts...');
    
    // This would require a GET /api/users endpoint
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data.users) {
        const testUsers = result.data.users.filter(user => 
          testEmails.includes(user.email)
        );
        
        if (testUsers.length > 0) {
          console.log(`📋 Found ${testUsers.length} test accounts:`);
          testUsers.forEach(user => {
            console.log(`   - ${user.email} (${user.role})`);
          });
        } else {
          console.log('✅ No test accounts found in the database');
        }
      }
    }
  } catch (error) {
    console.log('ℹ️  Cannot automatically check for test accounts');
    console.log('   (User listing endpoint may not be available)');
  }
  
  console.log('');
  console.log('✅ Cleanup guidance provided!');
  console.log('💡 Choose the method that works best for your setup.');
}

// Get admin token from command line or prompt
const adminToken = process.argv[2];
cleanupTestAccounts(adminToken);