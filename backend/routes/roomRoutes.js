const express = require('express');
const { body, param, query } = require('express-validator');
const RoomController = require('../controllers/roomController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const createRoomValidation = [
  body('roomNumber')
    .notEmpty()
    .withMessage('Room number is required')
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage('Room number can only contain letters, numbers, and hyphens'),
  
  body('type')
    .isIn(['ICU', 'General', 'Private', 'Emergency', 'Surgery'])
    .withMessage('Room type must be ICU, General, Private, Emergency, or Surgery'),
  
  body('floor')
    .isInt({ min: 1, max: 20 })
    .withMessage('Floor must be between 1 and 20'),
  
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage('Capacity must be between 1 and 4'),
  
  body('dailyRate')
    .isFloat({ min: 0 })
    .withMessage('Daily rate must be a positive number'),
  
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),
  
  body('amenities.*')
    .optional()
    .isIn(['AC', 'TV', 'WiFi', 'Bathroom', 'Balcony', 'Refrigerator'])
    .withMessage('Invalid amenity'),
  
  body('equipment')
    .optional()
    .isArray()
    .withMessage('Equipment must be an array'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const updateRoomValidation = [
  body('roomNumber')
    .optional()
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage('Room number can only contain letters, numbers, and hyphens'),
  
  body('type')
    .optional()
    .isIn(['ICU', 'General', 'Private', 'Emergency', 'Surgery'])
    .withMessage('Room type must be ICU, General, Private, Emergency, or Surgery'),
  
  body('floor')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Floor must be between 1 and 20'),
  
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage('Capacity must be between 1 and 4'),
  
  body('dailyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Daily rate must be a positive number'),
  
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),
  
  body('amenities.*')
    .optional()
    .isIn(['AC', 'TV', 'WiFi', 'Bathroom', 'Balcony', 'Refrigerator'])
    .withMessage('Invalid amenity'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid room ID')
];

const assignPatientValidation = [
  body('patientId')
    .isMongoId()
    .withMessage('Invalid patient ID')
];

const setStatusValidation = [
  body('status')
    .isIn(['Available', 'Occupied', 'Maintenance', 'Cleaning'])
    .withMessage('Status must be Available, Occupied, Maintenance, or Cleaning'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['roomNumber', 'type', 'floor', 'status', 'dailyRate'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('type')
    .optional()
    .isIn(['ICU', 'General', 'Private', 'Emergency', 'Surgery'])
    .withMessage('Invalid room type filter'),
  
  query('status')
    .optional()
    .isIn(['Available', 'Occupied', 'Maintenance', 'Cleaning'])
    .withMessage('Invalid status filter'),
  
  query('floor')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Floor must be between 1 and 20'),
  
  query('available')
    .optional()
    .isBoolean()
    .withMessage('Available must be true or false')
];

// Routes

/**
 * @route   POST /api/rooms
 * @desc    Create a new room
 * @access  Private (Admin only)
 */
router.post('/', 
  authenticateToken,
  authorizeRoles('Admin'),
  createRoomValidation,
  RoomController.createRoom
);

/**
 * @route   GET /api/rooms
 * @desc    Get all rooms with pagination and filtering
 * @access  Private
 */
router.get('/', 
  authenticateToken,
  paginationValidation,
  RoomController.getAllRooms
);

/**
 * @route   GET /api/rooms/stats
 * @desc    Get room statistics
 * @access  Private
 */
router.get('/stats', 
  authenticateToken,
  RoomController.getRoomStats
);

/**
 * @route   GET /api/rooms/available
 * @desc    Get available rooms
 * @access  Private
 */
router.get('/available', 
  authenticateToken,
  query('type')
    .optional()
    .isIn(['ICU', 'General', 'Private', 'Emergency', 'Surgery'])
    .withMessage('Invalid room type'),
  query('floor')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Floor must be between 1 and 20'),
  RoomController.getAvailableRooms
);

/**
 * @route   GET /api/rooms/transfer-suggestions
 * @desc    Get room transfer suggestions
 * @access  Private (Admin, Doctor)
 */
router.get('/transfer-suggestions', 
  authenticateToken,
  authorizeRoles('Admin', 'Doctor'),
  RoomController.getTransferSuggestions
);

/**
 * @route   GET /api/rooms/:id
 * @desc    Get room by ID
 * @access  Private
 */
router.get('/:id', 
  authenticateToken,
  idValidation,
  RoomController.getRoomById
);

/**
 * @route   PUT /api/rooms/:id
 * @desc    Update room
 * @access  Private (Admin only)
 */
router.put('/:id', 
  authenticateToken,
  authorizeRoles('Admin'),
  idValidation,
  updateRoomValidation,
  RoomController.updateRoom
);

/**
 * @route   DELETE /api/rooms/:id
 * @desc    Delete room
 * @access  Private (Admin only)
 */
router.delete('/:id', 
  authenticateToken,
  authorizeRoles('Admin'),
  idValidation,
  RoomController.deleteRoom
);

/**
 * @route   POST /api/rooms/:id/assign
 * @desc    Assign patient to room
 * @access  Private (Admin, Doctor, Nurse)
 */
router.post('/:id/assign', 
  authenticateToken,
  authorizeRoles('Admin', 'Doctor', 'Nurse'),
  idValidation,
  assignPatientValidation,
  RoomController.assignPatient
);

/**
 * @route   POST /api/rooms/:id/release
 * @desc    Release room (remove patient)
 * @access  Private (Admin, Doctor, Nurse)
 */
router.post('/:id/release', 
  authenticateToken,
  authorizeRoles('Admin', 'Doctor', 'Nurse'),
  idValidation,
  RoomController.releaseRoom
);

/**
 * @route   PUT /api/rooms/:id/status
 * @desc    Set room status
 * @access  Private (Admin, Staff)
 */
router.put('/:id/status', 
  authenticateToken,
  authorizeRoles('Admin', 'Staff', 'Nurse'),
  idValidation,
  setStatusValidation,
  RoomController.setRoomStatus
);

module.exports = router;
