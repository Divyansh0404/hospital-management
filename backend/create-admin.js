const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://divyansh:divyansh123@cluster0.ocrrs4m.mongodb.net/hospital_management?retryWrites=true&w=majority';

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingUser = await User.findOne({ email: 'admin@hospital.com' });
    if (existingUser) {
      console.log('Admin user already exists!');
      console.log('Email: admin@hospital.com');
      console.log('Password: admin123');
      return;
    }

    // Create admin user
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    const adminUser = new User({
      username: 'admin',
      email: 'admin@hospital.com',
      password: hashedPassword,
      employeeId: 'EMP001',
      role: 'Admin'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@hospital.com');
    console.log('🔒 Password: admin123');
    console.log('👤 Role: Admin');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createAdminUser();
