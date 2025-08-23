const express = require('express');
const { body, param, query } = require('express-validator');
const PatientController = require('../controllers/patientController');
const { authenticateToken, authorizeRoles, checkPermission } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const createPatientValidation = [
  body('name')
    .notEmpty()
    .withMessage('Patient name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  
  body('age')
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be between 0 and 150'),
  
  body('condition')
    .isIn(['Critical', 'Stable', 'Normal'])
    .withMessage('Condition must be Critical, Stable, or Normal'),
  
  body('contactNumber')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid contact number'),
  
  body('emergencyContact.name')
    .notEmpty()
    .withMessage('Emergency contact name is required'),
  
  body('emergencyContact.phone')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid emergency contact phone'),
  
  body('emergencyContact.relationship')
    .notEmpty()
    .withMessage('Emergency contact relationship is required'),
  
  body('medicalHistory')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Medical history cannot exceed 1000 characters'),
  
  body('allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),
  
  body('currentMedication')
    .optional()
    .isArray()
    .withMessage('Current medication must be an array'),
  
  body('status')
    .optional()
    .isIn(['Admitted', 'Discharged', 'Pending'])
    .withMessage('Status must be Admitted, Discharged, or Pending')
];

const updatePatientValidation = [
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be between 0 and 150'),
  
  body('condition')
    .optional()
    .isIn(['Critical', 'Stable', 'Normal'])
    .withMessage('Condition must be Critical, Stable, or Normal'),
  
  body('contactNumber')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid contact number'),
  
  body('medicalHistory')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Medical history cannot exceed 1000 characters'),
  
  body('status')
    .optional()
    .isIn(['Admitted', 'Discharged', 'Pending'])
    .withMessage('Status must be Admitted, Discharged, or Pending')
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid patient ID')
];

const assignRoomValidation = [
  body('roomId')
    .isMongoId()
    .withMessage('Invalid room ID')
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
    .isIn(['name', 'age', 'condition', 'priority', 'status', 'admissionDate'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('status')
    .optional()
    .isIn(['Admitted', 'Discharged', 'Pending'])
    .withMessage('Invalid status filter'),
  
  query('condition')
    .optional()
    .isIn(['Critical', 'Stable', 'Normal'])
    .withMessage('Invalid condition filter'),
  
  query('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5')
];

// Routes

/**
 * @route   POST /api/patients
 * @desc    Create a new patient
 * @access  Private (Admin, Doctor, Nurse)
 */
router.post('/', 
  authenticateToken,
  authorizeRoles('Admin', 'Doctor', 'Nurse'),
  createPatientValidation,
  PatientController.createPatient
);

/**
 * @route   GET /api/patients
 * @desc    Get all patients with pagination and filtering
 * @access  Private
 */
router.get('/', 
  authenticateToken,
  paginationValidation,
  PatientController.getAllPatients
);

/**
 * @route   GET /api/patients/stats
 * @desc    Get patient statistics
 * @access  Private
 */
router.get('/stats', 
  authenticateToken,
  PatientController.getPatientStats
);

/**
 * @route   GET /api/patients/priority
 * @desc    Get patients sorted by priority
 * @access  Private
 */
router.get('/priority', 
  authenticateToken,
  PatientController.getPatientsByPriority
);

/**
 * @route   POST /api/patients/auto-allocate
 * @desc    Auto-allocate rooms to waiting patients
 * @access  Private (Admin, Doctor, Nurse)
 */
router.post('/auto-allocate', 
  authenticateToken,
  authorizeRoles('Admin', 'Doctor', 'Nurse'),
  PatientController.autoAllocateRooms
);

/**
 * @route   GET /api/patients/:id
 * @desc    Get patient by ID
 * @access  Private
 */
router.get('/:id', 
  authenticateToken,
  idValidation,
  PatientController.getPatientById
);

/**
 * @route   PUT /api/patients/:id
 * @desc    Update patient
 * @access  Private (Admin, Doctor, Nurse)
 */
router.put('/:id', 
  authenticateToken,
  authorizeRoles('Admin', 'Doctor', 'Nurse'),
  idValidation,
  updatePatientValidation,
  PatientController.updatePatient
);

/**
 * @route   POST /api/patients/:id/discharge
 * @desc    Discharge patient
 * @access  Private (Admin, Doctor)
 */
router.post('/:id/discharge', 
  authenticateToken,
  authorizeRoles('Admin', 'Doctor'),
  idValidation,
  body('dischargeNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Discharge notes cannot exceed 500 characters'),
  PatientController.dischargePatient
);

/**
 * @route   POST /api/patients/:id/assign-room
 * @desc    Assign patient to room
 * @access  Private (Admin, Doctor, Nurse)
 */
router.post('/:id/assign-room', 
  authenticateToken,
  authorizeRoles('Admin', 'Doctor', 'Nurse'),
  idValidation,
  assignRoomValidation,
  PatientController.assignRoom
);

module.exports = router;
