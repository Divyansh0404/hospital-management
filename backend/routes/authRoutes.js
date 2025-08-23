const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required'),
  
  body('department')
    .isIn(['Emergency', 'ICU', 'General', 'Surgery', 'Pediatrics', 'Cardiology', 'Neurology', 'Administration'])
    .withMessage('Invalid department'),
  
  body('phone')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number'),
  
  body('role')
    .optional()
    .isIn(['Admin', 'Staff', 'Doctor', 'Nurse'])
    .withMessage('Invalid role'),
  
  body('shift')
    .isIn(['Morning', 'Evening', 'Night'])
    .withMessage('Invalid shift')
];

const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username or email is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('firstName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  
  body('lastName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// Routes

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Private (Admin only)
 */
router.post('/register', 
  authenticateToken,
  authorizeRoles('Admin'),
  registerValidation, 
  AuthController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', 
  loginValidation, 
  AuthController.login
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', 
  authenticateToken, 
  AuthController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', 
  authenticateToken,
  updateProfileValidation,
  AuthController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', 
  authenticateToken,
  changePasswordValidation,
  AuthController.changePassword
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', 
  authenticateToken, 
  AuthController.logout
);

module.exports = router;
