#!/usr/bin/env node

/**
 * Script to create a new secure administrator account
 * Usage: node scripts/create-secure-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

const createSecureAdmin = async () => {
  try {
    await connectDB();
    
    console.log('🔐 Creating New Secure Administrator Account');
    console.log('==========================================');
    
    // Your secure admin credentials
    const adminData = {
      username: 'SecureAdmin2024',
      email: 'admin@medcarehospital.com',
      passwordHash: 'SecureHospital2024!@#',  // Will be hashed by pre-save middleware
      firstName: 'System',
      lastName: 'Administrator', 
      employeeId: 'ADM002',
      role: 'Admin',
      department: 'Administration',
      phone: '+1555000001',
      shift: 'Morning',
      isActive: true,
      permissions: [
        {
          module: 'patients',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          module: 'rooms', 
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          module: 'users',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          module: 'reports',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          module: 'settings',
          actions: ['create', 'read', 'update', 'delete']
        }
      ]
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { email: adminData.email },
        { username: adminData.username },
        { employeeId: adminData.employeeId }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Administrator account already exists!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Employee ID: ${existingAdmin.employeeId}`);
      console.log('');
      console.log('🔑 Use existing credentials to login');
      process.exit(0);
    }

    // Create new admin user (password will be automatically hashed by pre-save middleware)
    const newAdmin = new User(adminData);
    await newAdmin.save();

    console.log('✅ Secure Administrator Account Created Successfully!');
    console.log('');
    console.log('📋 Account Details:');
    console.log(`   👤 Username: ${adminData.username}`);
    console.log(`   📧 Email: ${adminData.email}`);
    console.log(`   🔒 Password: ${adminData.passwordHash.substring(0, 8)}...`);
    console.log(`   🆔 Employee ID: ${adminData.employeeId}`);
    console.log(`   🎭 Role: ${adminData.role}`);
    console.log(`   🏢 Department: ${adminData.department}`);
    console.log(`   ⏰ Shift: ${adminData.shift}`);
    console.log('');
    console.log('🎉 You can now login with either:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Username: ${adminData.username}`);
    console.log(`   Password: SecureHospital2024!@#`);
    console.log('');
    console.log('🔐 Security Features:');
    console.log('   ✅ Password hashed with bcrypt (12 rounds)');
    console.log('   ✅ Full administrative permissions');
    console.log('   ✅ Secure employee ID assigned');
    console.log('   ✅ Account active and ready to use');

  } catch (error) {
    console.error('❌ Error creating secure admin:', error.message);
    if (error.code === 11000) {
      console.log('💡 Duplicate key error - account may already exist');
    }
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
createSecureAdmin();