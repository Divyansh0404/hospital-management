const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Room = require('./models/Room');
const Patient = require('./models/Patient');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Sample data
const sampleUsers = [
  {
    username: 'admin',
    email: 'admin@hospital.com',
    passwordHash: 'admin123', // Will be hashed by pre-save middleware
    role: 'Admin',
    firstName: 'Hospital',
    lastName: 'Administrator',
    employeeId: 'EMP001',
    department: 'Administration',
    phone: '+1234567890',
    shift: 'Morning'
  },
  {
    username: 'doctor1',
    email: 'doctor1@hospital.com',
    passwordHash: 'doctor123',
    role: 'Doctor',
    firstName: 'Dr. Sarah',
    lastName: 'Wilson',
    employeeId: 'DOC001',
    department: 'ICU',
    phone: '+1234567891',
    shift: 'Morning'
  },
  {
    username: 'nurse1',
    email: 'nurse1@hospital.com',
    passwordHash: 'nurse123',
    role: 'Nurse',
    firstName: 'Maria',
    lastName: 'Garcia',
    employeeId: 'NUR001',
    department: 'General',
    phone: '+1234567892',
    shift: 'Evening'
  }
];

const sampleRooms = [
  // ICU Rooms
  { roomNumber: 'ICU-101', type: 'ICU', floor: 1, capacity: 1, dailyRate: 800, amenities: ['AC', 'TV', 'WiFi'] },
  { roomNumber: 'ICU-102', type: 'ICU', floor: 1, capacity: 1, dailyRate: 800, amenities: ['AC', 'TV', 'WiFi'] },
  { roomNumber: 'ICU-103', type: 'ICU', floor: 1, capacity: 1, dailyRate: 800, amenities: ['AC', 'TV', 'WiFi'] },
  
  // General Rooms
  { roomNumber: 'GEN-201', type: 'General', floor: 2, capacity: 2, dailyRate: 300, amenities: ['AC', 'TV'] },
  { roomNumber: 'GEN-202', type: 'General', floor: 2, capacity: 2, dailyRate: 300, amenities: ['AC', 'TV'] },
  { roomNumber: 'GEN-203', type: 'General', floor: 2, capacity: 2, dailyRate: 300, amenities: ['AC', 'TV'] },
  { roomNumber: 'GEN-204', type: 'General', floor: 2, capacity: 2, dailyRate: 300, amenities: ['AC', 'TV'] },
  
  // Private Rooms
  { roomNumber: 'PVT-301', type: 'Private', floor: 3, capacity: 1, dailyRate: 500, amenities: ['AC', 'TV', 'WiFi', 'Refrigerator'] },
  { roomNumber: 'PVT-302', type: 'Private', floor: 3, capacity: 1, dailyRate: 500, amenities: ['AC', 'TV', 'WiFi', 'Refrigerator'] },
  
  // Emergency Rooms
  { roomNumber: 'ER-001', type: 'Emergency', floor: 1, capacity: 1, dailyRate: 600, amenities: ['AC'] },
  { roomNumber: 'ER-002', type: 'Emergency', floor: 1, capacity: 1, dailyRate: 600, amenities: ['AC'] }
];

const samplePatients = [
  {
    name: 'John Smith',
    age: 45,
    condition: 'Critical',
    priority: 1, // Critical = priority 1
    contactNumber: '+1555000001',
    emergencyContact: {
      name: 'Jane Smith',
      phone: '+1555000002',
      relationship: 'Wife'
    },
    medicalHistory: 'Hypertension, Diabetes',
    allergies: ['Penicillin'],
    currentMedication: [
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' }
    ]
  },
  {
    name: 'Maria Rodriguez',
    age: 32,
    condition: 'Stable',
    priority: 3, // Stable = priority 3
    contactNumber: '+1555000003',
    emergencyContact: {
      name: 'Carlos Rodriguez',
      phone: '+1555000004',
      relationship: 'Husband'
    },
    medicalHistory: 'No significant history',
    allergies: [],
    currentMedication: []
  },
  {
    name: 'Robert Johnson',
    age: 67,
    condition: 'Normal',
    priority: 5, // Normal = priority 5
    contactNumber: '+1555000005',
    emergencyContact: {
      name: 'Mary Johnson',
      phone: '+1555000006',
      relationship: 'Daughter'
    },
    medicalHistory: 'Previous heart surgery',
    allergies: ['Aspirin'],
    currentMedication: [
      { name: 'Warfarin', dosage: '5mg', frequency: 'Once daily' }
    ]
  },
  {
    name: 'Emily Chen',
    age: 28,
    condition: 'Critical',
    priority: 1, // Critical = priority 1
    contactNumber: '+1555000007',
    emergencyContact: {
      name: 'David Chen',
      phone: '+1555000008',
      relationship: 'Brother'
    },
    medicalHistory: 'Asthma',
    allergies: ['Shellfish'],
    currentMedication: [
      { name: 'Albuterol', dosage: '2 puffs', frequency: 'As needed' }
    ]
  },
  {
    name: 'Michael Brown',
    age: 52,
    condition: 'Stable',
    priority: 3, // Stable = priority 3
    contactNumber: '+1555000009',
    emergencyContact: {
      name: 'Lisa Brown',
      phone: '+1555000010',
      relationship: 'Wife'
    },
    medicalHistory: 'Arthritis',
    allergies: [],
    currentMedication: [
      { name: 'Ibuprofen', dosage: '400mg', frequency: 'Three times daily' }
    ]
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data and indexes
    console.log('🗑️  Clearing existing data and indexes...');
    
    // Drop collections entirely to remove all indexes
    try {
      await mongoose.connection.db.dropCollection('users');
      console.log('✅ Dropped users collection');
    } catch (error) {
      console.log('ℹ️  Users collection did not exist');
    }
    
    try {
      await mongoose.connection.db.dropCollection('rooms');
      console.log('✅ Dropped rooms collection');
    } catch (error) {
      console.log('ℹ️  Rooms collection did not exist');
    }
    
    try {
      await mongoose.connection.db.dropCollection('patients');
      console.log('✅ Dropped patients collection');
    } catch (error) {
      console.log('ℹ️  Patients collection did not exist');
    }
    
    // Create users
    console.log('👥 Creating users...');
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${user.username} (${user.role})`);
    }
    
    // Create rooms
    console.log('🏥 Creating rooms...');
    for (const roomData of sampleRooms) {
      const room = new Room(roomData);
      await room.save();
      console.log(`✅ Created room: ${room.roomNumber} (${room.type})`);
    }
    
    // Create patients
    console.log('🧑‍⚕️ Creating patients...');
    for (const patientData of samplePatients) {
      const patient = new Patient(patientData);
      await patient.save();
      console.log(`✅ Created patient: ${patient.name} (${patient.condition})`);
    }
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Users: ${sampleUsers.length}`);
    console.log(`   Rooms: ${sampleRooms.length}`);
    console.log(`   Patients: ${samplePatients.length}`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin:  username: admin,   password: admin123');
    console.log('   Doctor: username: doctor1, password: doctor123');
    console.log('   Nurse:  username: nurse1,  password: nurse123');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();
