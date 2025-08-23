const Patient = require('../models/Patient');
const Room = require('../models/Room');

class PriorityAllocator {
  
  /**
   * Automatically assign the highest priority patient to an available room
   * @param {String} roomType - Optional room type filter
   * @returns {Object} - Allocation result
   */
  static async autoAllocateRoom(roomType = null) {
    try {
      // Find highest priority unassigned patient
      const patient = await this.getHighestPriorityPatient();
      
      if (!patient) {
        return {
          success: false,
          message: 'No unassigned patients found'
        };
      }

      // Determine required room type based on patient condition
      const requiredRoomType = roomType || this.determineRoomType(patient.condition);
      
      // Find available room
      const room = await this.findBestAvailableRoom(requiredRoomType, patient);
      
      if (!room) {
        return {
          success: false,
          message: `No available ${requiredRoomType} rooms found`,
          patient: patient
        };
      }

      // Assign patient to room
      const allocation = await this.assignPatientToRoom(patient._id, room._id);
      
      return {
        success: true,
        message: 'Patient successfully allocated to room',
        allocation: allocation
      };

    } catch (error) {
      console.error('Auto allocation error:', error);
      return {
        success: false,
        message: 'Error during auto allocation',
        error: error.message
      };
    }
  }

  /**
   * Get the highest priority unassigned patient
   * @returns {Object} - Patient object
   */
  static async getHighestPriorityPatient() {
    return await Patient.findOne({
      status: { $in: ['Admitted', 'Pending'] },
      assignedRoom: null
    })
    .sort({ priority: 1, admissionDate: 1 }) // Lower priority number = higher priority
    .exec();
  }

  /**
   * Get all unassigned patients sorted by priority
   * @returns {Array} - Array of patients
   */
  static async getAllUnassignedPatients() {
    return await Patient.find({
      status: { $in: ['Admitted', 'Pending'] },
      assignedRoom: null
    })
    .sort({ priority: 1, admissionDate: 1 })
    .exec();
  }

  /**
   * Determine appropriate room type based on patient condition
   * @param {String} condition - Patient condition
   * @returns {String} - Room type
   */
  static determineRoomType(condition) {
    const roomTypeMap = {
      'Critical': 'ICU',
      'Stable': 'General',
      'Normal': 'General'
    };

    return roomTypeMap[condition] || 'General';
  }

  /**
   * Find the best available room for a patient
   * @param {String} roomType - Required room type
   * @param {Object} patient - Patient object
   * @returns {Object} - Room object
   */
  static async findBestAvailableRoom(roomType, patient) {
    // First try to find exact room type match
    let room = await Room.findOne({
      type: roomType,
      status: 'Available',
      occupied: false
    })
    .sort({ floor: 1, roomNumber: 1 })
    .exec();

    // If no exact match and patient is critical, try ICU
    if (!room && patient.condition === 'Critical') {
      room = await Room.findOne({
        type: 'ICU',
        status: 'Available',
        occupied: false
      })
      .sort({ floor: 1, roomNumber: 1 })
      .exec();
    }

    // If still no room, try any available room for non-critical patients
    if (!room && patient.condition !== 'Critical') {
      room = await Room.findOne({
        type: { $in: ['General', 'Private'] },
        status: 'Available',
        occupied: false
      })
      .sort({ floor: 1, roomNumber: 1 })
      .exec();
    }

    return room;
  }

  /**
   * Assign a patient to a specific room
   * @param {String} patientId - Patient ID
   * @param {String} roomId - Room ID
   * @returns {Object} - Updated patient and room
   */
  static async assignPatientToRoom(patientId, roomId) {
    try {
      // Update patient
      await Patient.findByIdAndUpdate(
        patientId,
        { 
          assignedRoom: roomId,
          status: 'Admitted'
        }
      );

      // Update room
      await Room.findByIdAndUpdate(
        roomId,
        { 
          patientId: patientId,
          occupied: true,
          status: 'Occupied'
        }
      );

      // Fetch updated documents
      const updatedPatient = await Patient.findById(patientId).populate('assignedRoom');
      const updatedRoom = await Room.findById(roomId).populate('patientId');

      return {
        patient: updatedPatient,
        room: updatedRoom
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Release a patient from their room
   * @param {String} patientId - Patient ID
   * @returns {Object} - Updated patient and room
   */
  static async releasePatientFromRoom(patientId) {
    try {
      const patient = await Patient.findById(patientId);
      
      if (!patient || !patient.assignedRoom) {
        throw new Error('Patient not found or not assigned to a room');
      }

      const roomId = patient.assignedRoom;

      // Update patient
      await Patient.findByIdAndUpdate(
        patientId,
        { 
          assignedRoom: null,
          status: 'Discharged',
          dischargeDate: new Date()
        }
      );

      // Update room
      await Room.findByIdAndUpdate(
        roomId,
        { 
          patientId: null,
          occupied: false,
          status: 'Cleaning', // Set to cleaning for housekeeping
          lastCleaned: new Date()
        }
      );

      // Fetch updated documents
      const updatedPatient = await Patient.findById(patientId);
      const updatedRoom = await Room.findById(roomId);

      return {
        patient: updatedPatient,
        room: updatedRoom
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get allocation statistics
   * @returns {Object} - Statistics object
   */
  static async getAllocationStats() {
    try {
      const [patientStats, roomStats] = await Promise.all([
        Patient.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]),
        Room.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      const unassignedPatients = await Patient.countDocuments({
        status: { $in: ['Admitted', 'Pending'] },
        assignedRoom: null
      });

      const criticalPatients = await Patient.countDocuments({
        condition: 'Critical',
        status: { $in: ['Admitted', 'Pending'] }
      });

      return {
        patients: patientStats,
        rooms: roomStats,
        unassignedPatients,
        criticalPatients
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Suggest room transfers for optimization
   * @returns {Array} - Array of transfer suggestions
   */
  static async suggestRoomTransfers() {
    try {
      // Find patients in wrong room types
      const patientsInWrongRooms = await Patient.aggregate([
        {
          $lookup: {
            from: 'rooms',
            localField: 'assignedRoom',
            foreignField: '_id',
            as: 'room'
          }
        },
        {
          $unwind: '$room'
        },
        {
          $addFields: {
            idealRoomType: {
              $switch: {
                branches: [
                  { case: { $eq: ['$condition', 'Critical'] }, then: 'ICU' },
                  { case: { $eq: ['$condition', 'Stable'] }, then: 'General' },
                  { case: { $eq: ['$condition', 'Normal'] }, then: 'General' }
                ],
                default: 'General'
              }
            }
          }
        },
        {
          $match: {
            $expr: { $ne: ['$room.type', '$idealRoomType'] }
          }
        }
      ]);

      return patientsInWrongRooms;

    } catch (error) {
      throw error;
    }
  }
}

module.exports = PriorityAllocator;
