const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  age: {
    type: Number,
    required: [true, 'Patient age is required'],
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age cannot exceed 150']
  },
  condition: {
    type: String,
    required: [true, 'Patient condition is required'],
    enum: {
      values: ['Critical', 'Stable', 'Normal'],
      message: 'Condition must be Critical, Stable, or Normal'
    }
  },
  priority: {
    type: Number,
    required: [true, 'Priority is required'],
    min: [1, 'Priority must be at least 1'],
    max: [5, 'Priority cannot exceed 5']
  },
  status: {
    type: String,
    enum: {
      values: ['Admitted', 'Discharged', 'Pending'],
      message: 'Status must be Admitted, Discharged, or Pending'
    },
    default: 'Admitted'
  },
  assignedRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  dischargeDate: {
    type: Date,
    default: null
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid contact number']
  },
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required']
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required']
    },
    relationship: {
      type: String,
      required: [true, 'Emergency contact relationship is required']
    }
  },
  medicalHistory: {
    type: String,
    maxlength: [1000, 'Medical history cannot exceed 1000 characters']
  },
  allergies: [{
    type: String,
    trim: true
  }],
  currentMedication: [{
    name: String,
    dosage: String,
    frequency: String
  }]
}, {
  timestamps: true
});

// Index for efficient queries
patientSchema.index({ priority: 1 });
patientSchema.index({ status: 1 });
patientSchema.index({ admissionDate: -1 });

// Virtual for calculating length of stay
patientSchema.virtual('lengthOfStay').get(function() {
  const endDate = this.dischargeDate || new Date();
  const diffTime = Math.abs(endDate - this.admissionDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
});

// Pre-save middleware to set priority based on condition
patientSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('condition')) {
    switch (this.condition) {
      case 'Critical':
        this.priority = 1;
        break;
      case 'Stable':
        this.priority = 3;
        break;
      case 'Normal':
        this.priority = 5;
        break;
    }
  }
  next();
});

// Add pagination plugin
patientSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Patient', patientSchema);
