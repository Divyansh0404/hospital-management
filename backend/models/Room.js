const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: [true, 'Room number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9\-]+$/, 'Room number can only contain letters, numbers, and hyphens']
  },
  type: {
    type: String,
    required: [true, 'Room type is required'],
    enum: {
      values: ['ICU', 'General', 'Private', 'Emergency', 'Surgery'],
      message: 'Room type must be ICU, General, Private, Emergency, or Surgery'
    }
  },
  floor: {
    type: Number,
    required: [true, 'Floor number is required'],
    min: [1, 'Floor must be at least 1'],
    max: [20, 'Floor cannot exceed 20']
  },
  capacity: {
    type: Number,
    required: [true, 'Room capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [4, 'Capacity cannot exceed 4'],
    default: 1
  },
  occupied: {
    type: Boolean,
    default: false
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null
  },
  status: {
    type: String,
    enum: {
      values: ['Available', 'Occupied', 'Maintenance', 'Cleaning'],
      message: 'Status must be Available, Occupied, Maintenance, or Cleaning'
    },
    default: 'Available'
  },
  equipment: [{
    name: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Working', 'Faulty', 'Under Maintenance'],
      default: 'Working'
    },
    lastChecked: {
      type: Date,
      default: Date.now
    }
  }],
  dailyRate: {
    type: Number,
    required: [true, 'Daily rate is required'],
    min: [0, 'Daily rate cannot be negative']
  },
  amenities: [{
    type: String,
    enum: ['AC', 'TV', 'WiFi', 'Bathroom', 'Balcony', 'Refrigerator']
  }],
  lastCleaned: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for efficient queries
roomSchema.index({ type: 1, status: 1 });
roomSchema.index({ floor: 1 });
roomSchema.index({ roomNumber: 1 });

// Virtual for room availability
roomSchema.virtual('isAvailable').get(function() {
  return this.status === 'Available' && !this.occupied;
});

// Pre-save middleware to update occupied status
roomSchema.pre('save', function(next) {
  if (this.isModified('patientId')) {
    this.occupied = !!this.patientId;
    this.status = this.patientId ? 'Occupied' : 'Available';
  }
  next();
});

// Static method to find available rooms by type
roomSchema.statics.findAvailableByType = function(roomType) {
  return this.find({
    type: roomType,
    status: 'Available',
    occupied: false
  }).sort({ floor: 1, roomNumber: 1 });
};

// Static method to get room statistics
roomSchema.statics.getRoomStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$type',
        total: { $sum: 1 },
        available: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$status', 'Available'] }, { $eq: ['$occupied', false] }] },
              1,
              0
            ]
          }
        },
        occupied: {
          $sum: {
            $cond: [{ $eq: ['$occupied', true] }, 1, 0]
          }
        },
        maintenance: {
          $sum: {
            $cond: [{ $eq: ['$status', 'Maintenance'] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  return stats;
};

// Add pagination plugin
roomSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Room', roomSchema);
