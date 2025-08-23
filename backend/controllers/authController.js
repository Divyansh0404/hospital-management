const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

class AuthController {
  
  /**
   * Register a new user
   */
  static async register(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { 
        username, 
        email, 
        password, 
        role, 
        firstName, 
        lastName, 
        employeeId, 
        department, 
        phone,
        shift 
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }, { employeeId }]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email, username, or employee ID already exists'
        });
      }

      // Set default permissions based on role
      const defaultPermissions = AuthController.getDefaultPermissions(role);

      // Create new user
      const user = new User({
        username,
        email,
        passwordHash: password, // Will be hashed by pre-save middleware
        role,
        firstName,
        lastName,
        employeeId,
        department,
        phone,
        shift,
        permissions: defaultPermissions
      });

      await user.save();

      // Generate JWT token
      const token = AuthController.generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.toJSON(),
          token
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Login user
   */
  static async login(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { username, password } = req.body;

      // Find user by username or email
      const user = await User.findOne({
        $or: [{ username }, { email: username }],
        isActive: true
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      await user.updateLastLogin();

      // Generate JWT token
      const token = AuthController.generateToken(user._id);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          token
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req, res) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const allowedUpdates = ['firstName', 'lastName', 'phone', 'email'];
      const updates = {};

      // Only allow certain fields to be updated
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toJSON()
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Change password
   */
  static async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Find user with password
      const user = await User.findById(req.user._id);

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.passwordHash = newPassword; // Will be hashed by pre-save middleware
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Logout user (client-side token removal)
   */
  static async logout(req, res) {
    try {
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Generate JWT token
   * @private
   */
  static generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  }

  /**
   * Get default permissions for a role
   * @private
   */
  static getDefaultPermissions(role) {
    const permissionSets = {
      'Admin': [
        { module: 'patients', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'rooms', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'users', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'reports', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'settings', actions: ['create', 'read', 'update', 'delete'] }
      ],
      'Doctor': [
        { module: 'patients', actions: ['create', 'read', 'update'] },
        { module: 'rooms', actions: ['read', 'update'] },
        { module: 'reports', actions: ['read'] }
      ],
      'Nurse': [
        { module: 'patients', actions: ['read', 'update'] },
        { module: 'rooms', actions: ['read', 'update'] }
      ],
      'Staff': [
        { module: 'patients', actions: ['read'] },
        { module: 'rooms', actions: ['read'] }
      ]
    };

    return permissionSets[role] || permissionSets['Staff'];
  }
}

module.exports = AuthController;
