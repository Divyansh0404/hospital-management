const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Try different environment variable names that Railway might use
    let mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;
    
    // Fallback for Railway deployment issues
    if (!mongoUri && process.env.NODE_ENV === 'production') {
      // Use the connection string directly for Railway deployment
      mongoUri = 'mongodb+srv://hospital-admin:%23Dr972004@cluster0.ocrrs4m.mongodb.net/hospital-management?retryWrites=true&w=majority&appName=Cluster0';
      console.log('⚠️  Using fallback MongoDB URI for Railway deployment');
    }
    
    console.log('🔍 Database URI Check:');
    console.log('MONGODB_URI:', !!process.env.MONGODB_URI);
    console.log('DATABASE_URL:', !!process.env.DATABASE_URL);
    console.log('MONGO_URL:', !!process.env.MONGO_URL);
    console.log('Using URI:', mongoUri ? 'Found' : 'NOT FOUND');
    console.log('Environment:', process.env.NODE_ENV);
    
    if (!mongoUri) {
      throw new Error('No MongoDB URI found in environment variables');
    }
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.log('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });

    // Close connection on app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Mongoose connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
