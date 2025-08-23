const { validationResult } = require('express-validator');
const Room = require('../models/Room');
const Patient = require('../models/Patient');
const PriorityAllocator = require('../utils/priorityAllocator');

class RoomController {

  /**
   * Create a new room
   */
  static async createRoom(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const roomData = req.body;
      const room = new Room(roomData);
      await room.save();

      // Emit socket event for real-time updates
      req.app.get('io').emit('roomCreated', { room });

      res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: {
          room
        }
      });

    } catch (error) {
      console.error('Create room error:', error);
      
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

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Room number already exists'
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
   * Get all rooms with filtering and sorting
   */
  static async getAllRooms(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        status,
        floor,
        available,
        sortBy = 'roomNumber',
        sortOrder = 'asc'
      } = req.query;

      // Build filter object
      const filter = {};
      
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (floor) filter.floor = parseInt(floor);
      if (available !== undefined) {
        filter.occupied = available === 'true' ? false : true;
        if (available === 'true') {
          filter.status = 'Available';
        }
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        populate: {
          path: 'patientId',
          select: 'name age condition priority status'
        }
      };

      const result = await Room.paginate(filter, options);

      res.json({
        success: true,
        data: {
          rooms: result.docs,
          pagination: {
            currentPage: result.page,
            totalPages: result.totalPages,
            totalRooms: result.totalDocs,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage
          }
        }
      });

    } catch (error) {
      console.error('Get rooms error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get room by ID
   */
  static async getRoomById(req, res) {
    try {
      const { id } = req.params;

      const room = await Room.findById(id)
        .populate('patientId')
        .exec();

      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      res.json({
        success: true,
        data: {
          room
        }
      });

    } catch (error) {
      console.error('Get room error:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid room ID'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update room
   */
  static async updateRoom(req, res) {
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

      // Prevent direct patient assignment through update
      delete updates.patientId;
      delete updates.occupied;

      const room = await Room.findByIdAndUpdate(
        id,
        updates,
        { 
          new: true, 
          runValidators: true 
        }
      ).populate('patientId');

      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      // Emit socket event for real-time updates
      req.app.get('io').emit('roomUpdated', { room });

      res.json({
        success: true,
        message: 'Room updated successfully',
        data: {
          room
        }
      });

    } catch (error) {
      console.error('Update room error:', error);
      
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
          message: 'Invalid room ID'
        });
      }

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Room number already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Delete room
   */
  static async deleteRoom(req, res) {
    try {
      const { id } = req.params;

      const room = await Room.findById(id);

      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      if (room.occupied) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete occupied room. Please discharge patient first.'
        });
      }

      await Room.findByIdAndDelete(id);

      // Emit socket event for real-time updates
      req.app.get('io').emit('roomDeleted', { roomId: id });

      res.json({
        success: true,
        message: 'Room deleted successfully'
      });

    } catch (error) {
      console.error('Delete room error:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid room ID'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Assign patient to room
   */
  static async assignPatient(req, res) {
    try {
      const { id } = req.params;
      const { patientId } = req.body;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
      }

      // Check if room exists
      const room = await Room.findById(id);
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

      // Check if patient exists
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // If patient already has a room, release it first
      if (patient.assignedRoom) {
        await PriorityAllocator.releasePatientFromRoom(patientId);
      }

      // Assign patient to room
      const allocation = await PriorityAllocator.assignPatientToRoom(patientId, id);

      // Emit socket event for real-time updates
      req.app.get('io').emit('patientAssigned', {
        patient: allocation.patient,
        room: allocation.room
      });

      res.json({
        success: true,
        message: 'Patient assigned to room successfully',
        data: allocation
      });

    } catch (error) {
      console.error('Assign patient error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Release room (remove patient)
   */
  static async releaseRoom(req, res) {
    try {
      const { id } = req.params;

      const room = await Room.findById(id).populate('patientId');

      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      if (!room.occupied || !room.patientId) {
        return res.status(400).json({
          success: false,
          message: 'Room is not occupied'
        });
      }

      // Release patient from room
      const result = await PriorityAllocator.releasePatientFromRoom(room.patientId._id);

      // Emit socket event for real-time updates
      req.app.get('io').emit('roomReleased', {
        patient: result.patient,
        room: result.room
      });

      res.json({
        success: true,
        message: 'Room released successfully',
        data: result
      });

    } catch (error) {
      console.error('Release room error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get available rooms by type
   */
  static async getAvailableRooms(req, res) {
    try {
      const { type, floor } = req.query;

      const filter = {
        status: 'Available',
        occupied: false
      };

      if (type) filter.type = type;
      if (floor) filter.floor = parseInt(floor);

      const rooms = await Room.find(filter)
        .sort({ floor: 1, roomNumber: 1 })
        .exec();

      res.json({
        success: true,
        data: {
          rooms,
          totalCount: rooms.length
        }
      });

    } catch (error) {
      console.error('Get available rooms error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Set room status (maintenance, cleaning, etc.)
   */
  static async setRoomStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const validStatuses = ['Available', 'Occupied', 'Maintenance', 'Cleaning'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const room = await Room.findById(id);

      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      // Don't allow changing status to Available if room is occupied
      if (status === 'Available' && room.occupied) {
        return res.status(400).json({
          success: false,
          message: 'Cannot set occupied room to available'
        });
      }

      // Don't allow changing status from Available if room has patient
      if (room.status === 'Occupied' && status !== 'Occupied' && room.patientId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change status of room with assigned patient'
        });
      }

      const updates = { status };
      if (notes) updates.notes = notes;
      if (status === 'Cleaning') updates.lastCleaned = new Date();

      const updatedRoom = await Room.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).populate('patientId');

      // Emit socket event for real-time updates
      req.app.get('io').emit('roomStatusChanged', { room: updatedRoom });

      res.json({
        success: true,
        message: 'Room status updated successfully',
        data: {
          room: updatedRoom
        }
      });

    } catch (error) {
      console.error('Set room status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get room statistics
   */
  static async getRoomStats(req, res) {
    try {
      const stats = await Room.getRoomStats();
      
      const totalRooms = await Room.countDocuments();
      const occupiedRooms = await Room.countDocuments({ occupied: true });
      const availableRooms = await Room.countDocuments({ 
        status: 'Available', 
        occupied: false 
      });
      const maintenanceRooms = await Room.countDocuments({ status: 'Maintenance' });
      const cleaningRooms = await Room.countDocuments({ status: 'Cleaning' });

      // Occupancy rate
      const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : 0;

      res.json({
        success: true,
        data: {
          totalRooms,
          occupiedRooms,
          availableRooms,
          maintenanceRooms,
          cleaningRooms,
          occupancyRate: parseFloat(occupancyRate),
          roomsByType: stats
        }
      });

    } catch (error) {
      console.error('Get room stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get room transfer suggestions
   */
  static async getTransferSuggestions(req, res) {
    try {
      const suggestions = await PriorityAllocator.suggestRoomTransfers();

      res.json({
        success: true,
        data: {
          suggestions,
          totalSuggestions: suggestions.length
        }
      });

    } catch (error) {
      console.error('Get transfer suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = RoomController;
