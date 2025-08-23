const { validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const Room = require('../models/Room');
const PriorityAllocator = require('../utils/priorityAllocator');

class PatientController {

  /**
   * Create a new patient
   */
  static async createPatient(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const patientData = req.body;
      const patient = new Patient(patientData);
      await patient.save();

      // Try to auto-allocate room if patient is admitted
      if (patient.status === 'Admitted') {
        const allocation = await PriorityAllocator.autoAllocateRoom();
        if (allocation.success) {
          // Emit socket event for real-time updates
          req.app.get('io').emit('patientAdmitted', {
            patient: allocation.allocation.patient,
            room: allocation.allocation.room
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: {
          patient: await Patient.findById(patient._id).populate('assignedRoom')
        }
      });

    } catch (error) {
      console.error('Create patient error:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get all patients with filtering and sorting
   */
  static async getAllPatients(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        condition,
        priority,
        sortBy = 'admissionDate',
        sortOrder = 'desc',
        search
      } = req.query;

      // Build filter object
      const filter = {};
      
      if (status) filter.status = status;
      if (condition) filter.condition = condition;
      if (priority) filter.priority = priority;
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { contactNumber: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // If sorting by priority, add secondary sort by admission date
      if (sortBy === 'priority') {
        sort.admissionDate = 1;
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        populate: {
          path: 'assignedRoom',
          select: 'roomNumber type floor'
        }
      };

      const result = await Patient.paginate(filter, options);

      res.json({
        success: true,
        data: {
          patients: result.docs,
          pagination: {
            currentPage: result.page,
            totalPages: result.totalPages,
            totalPatients: result.totalDocs,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage
          }
        }
      });

    } catch (error) {
      console.error('Get patients error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get patient by ID
   */
  static async getPatientById(req, res) {
    try {
      const { id } = req.params;

      const patient = await Patient.findById(id)
        .populate('assignedRoom')
        .exec();

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      res.json({
        success: true,
        data: {
          patient
        }
      });

    } catch (error) {
      console.error('Get patient error:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid patient ID'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update patient
   */
  static async updatePatient(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updates = req.body;

      // Prevent direct room assignment through update
      delete updates.assignedRoom;

      const patient = await Patient.findByIdAndUpdate(
        id,
        updates,
        { 
          new: true, 
          runValidators: true 
        }
      ).populate('assignedRoom');

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Emit socket event for real-time updates
      req.app.get('io').emit('patientUpdated', { patient });

      res.json({
        success: true,
        message: 'Patient updated successfully',
        data: {
          patient
        }
      });

    } catch (error) {
      console.error('Update patient error:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid patient ID'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Discharge patient
   */
  static async dischargePatient(req, res) {
    try {
      const { id } = req.params;
      const { dischargeNotes } = req.body;

      const patient = await Patient.findById(id);

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      if (patient.status === 'Discharged') {
        return res.status(400).json({
          success: false,
          message: 'Patient is already discharged'
        });
      }

      // Release patient from room if assigned
      let roomReleased = null;
      if (patient.assignedRoom) {
        const result = await PriorityAllocator.releasePatientFromRoom(id);
        roomReleased = result.room;
      } else {
        // Just update patient status
        patient.status = 'Discharged';
        patient.dischargeDate = new Date();
        if (dischargeNotes) {
          patient.medicalHistory = patient.medicalHistory 
            ? `${patient.medicalHistory}\n\nDischarge Notes: ${dischargeNotes}`
            : `Discharge Notes: ${dischargeNotes}`;
        }
        await patient.save();
      }

      const updatedPatient = await Patient.findById(id).populate('assignedRoom');

      // Emit socket event for real-time updates
      req.app.get('io').emit('patientDischarged', { 
        patient: updatedPatient,
        room: roomReleased 
      });

      res.json({
        success: true,
        message: 'Patient discharged successfully',
        data: {
          patient: updatedPatient,
          roomReleased
        }
      });

    } catch (error) {
      console.error('Discharge patient error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Assign patient to room
   */
  static async assignRoom(req, res) {
    try {
      const { id } = req.params;
      const { roomId } = req.body;

      if (!roomId) {
        return res.status(400).json({
          success: false,
          message: 'Room ID is required'
        });
      }

      // Check if patient exists
      const patient = await Patient.findById(id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Check if room exists and is available
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      if (room.occupied || room.status !== 'Available') {
        return res.status(400).json({
          success: false,
          message: 'Room is not available'
        });
      }

      // If patient already has a room, release it first
      if (patient.assignedRoom) {
        await PriorityAllocator.releasePatientFromRoom(id);
      }

      // Assign patient to new room
      const allocation = await PriorityAllocator.assignPatientToRoom(id, roomId);

      // Emit socket event for real-time updates
      req.app.get('io').emit('roomAssigned', {
        patient: allocation.patient,
        room: allocation.room
      });

      res.json({
        success: true,
        message: 'Patient assigned to room successfully',
        data: allocation
      });

    } catch (error) {
      console.error('Assign room error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get patients by priority (for queue management)
   */
  static async getPatientsByPriority(req, res) {
    try {
      const { unassignedOnly = true } = req.query;

      const filter = { status: { $in: ['Admitted', 'Pending'] } };
      
      if (unassignedOnly === 'true') {
        filter.assignedRoom = null;
      }

      const patients = await Patient.find(filter)
        .sort({ priority: 1, admissionDate: 1 })
        .populate('assignedRoom')
        .exec();

      res.json({
        success: true,
        data: {
          patients,
          totalCount: patients.length
        }
      });

    } catch (error) {
      console.error('Get patients by priority error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Auto-allocate rooms to waiting patients
   */
  static async autoAllocateRooms(req, res) {
    try {
      const allocation = await PriorityAllocator.autoAllocateRoom();

      if (allocation.success) {
        // Emit socket event for real-time updates
        req.app.get('io').emit('autoAllocationComplete', allocation);
      }

      res.json({
        success: allocation.success,
        message: allocation.message,
        data: allocation.allocation || null
      });

    } catch (error) {
      console.error('Auto allocate error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get patient statistics
   */
  static async getPatientStats(req, res) {
    try {
      const stats = await Patient.aggregate([
        {
          $group: {
            _id: null,
            totalPatients: { $sum: 1 },
            admittedPatients: {
              $sum: { $cond: [{ $eq: ['$status', 'Admitted'] }, 1, 0] }
            },
            dischargedPatients: {
              $sum: { $cond: [{ $eq: ['$status', 'Discharged'] }, 1, 0] }
            },
            pendingPatients: {
              $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
            },
            criticalPatients: {
              $sum: { $cond: [{ $eq: ['$condition', 'Critical'] }, 1, 0] }
            },
            stablePatients: {
              $sum: { $cond: [{ $eq: ['$condition', 'Stable'] }, 1, 0] }
            },
            normalPatients: {
              $sum: { $cond: [{ $eq: ['$condition', 'Normal'] }, 1, 0] }
            },
            unassignedPatients: {
              $sum: { 
                $cond: [
                  { 
                    $and: [
                      { $in: ['$status', ['Admitted', 'Pending']] },
                      { $eq: ['$assignedRoom', null] }
                    ]
                  }, 
                  1, 
                  0
                ]
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalPatients: 0,
        admittedPatients: 0,
        dischargedPatients: 0,
        pendingPatients: 0,
        criticalPatients: 0,
        stablePatients: 0,
        normalPatients: 0,
        unassignedPatients: 0
      };

      res.json({
        success: true,
        data: {
          stats: result
        }
      });

    } catch (error) {
      console.error('Get patient stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = PatientController;
