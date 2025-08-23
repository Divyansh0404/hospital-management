const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: {
      values: ['Admin', 'Staff', 'Doctor', 'Nurse'],
      message: 'Role must be Admin, Staff, Doctor, or Nurse'
    },
    default: 'Staff'
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    uppercase: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['Emergency', 'ICU', 'General', 'Surgery', 'Pediatrics', 'Cardiology', 'Neurology', 'Administration']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  permissions: [{
    module: {
      type: String,
      enum: ['patients', 'rooms', 'users', 'reports', 'settings']
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete']
    }]
  }],
  profileImage: {
    type: String,
    default: null
  },
  shift: {
    type: String,
    enum: ['Morning', 'Evening', 'Night'],
    required: [true, 'Shift is required']
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ role: 1, isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) return next();
  
  try {
    // Hash password with cost of 12
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.passwordHash = await bcrypt.hash(this.passwordHash, rounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Static method to find active users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true }).select('-passwordHash');
};

// Static method to get user statistics
userSchema.statics.getUserStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$role',
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats;
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
