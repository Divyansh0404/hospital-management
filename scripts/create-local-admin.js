#!/usr/bin/env node

/**
 * Local Admin Account Creator
 * Works with local backend development server
 * Usage: node scripts/create-local-admin.js
 */

async function createLocalAdmin() {
  const API_BASE_URL = 'http://localhost:3001/api';
  
  // Your personal admin credentials
  const adminData = {
    username: 'Divyansh97',
    email: 'divyanshrustagi@gmail.com',
    password: '#Dr97*2004',
    firstName: 'Divyansh',
    lastName: 'Rustagi',
    employeeId: 'ADM001',
    department: 'Administration',
    role: 'Admin',
    phone: '555-0123',
    shift: 'Day'
  };
  
  console.log('🏥 Creating Local Admin Account');
  console.log('===============================');
  console.log(`📧 Email: ${adminData.email}`);
  console.log(`👤 Username: ${adminData.username}`);
  console.log('');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Admin account created successfully!');
      console.log(`🆔 User ID: ${result.data.user._id}`);
      console.log(`🔑 Role: ${result.data.user.role}`);
      console.log(`🎫 Token: ${result.data.token.substring(0, 20)}...`);
      console.log('');
      console.log('🎉 You can now log in with:');
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Password: ${adminData.password}`);
    } else {
      console.log('❌ Failed to create admin account:');
      console.log(result.message);
      if (result.errors) {
        result.errors.forEach(error => console.log(`  - ${error.msg}`));
      }
    }
  } catch (error) {
    console.log('❌ Error connecting to local backend:');
    console.log(error.message);
    console.log('');
    console.log('💡 Make sure your local backend is running on port 3001');
    console.log('   Run: npm run dev (in the backend directory)');
  }
}

// Run the function
createLocalAdmin();