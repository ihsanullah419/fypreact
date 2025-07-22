const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');

    // Get user's appointment statistics
    const totalAppointments = await Appointment.countDocuments({ user: req.user.id });
    const pendingAppointments = await Appointment.countDocuments({ 
      user: req.user.id, 
      status: 'pending' 
    });
    const confirmedAppointments = await Appointment.countDocuments({ 
      user: req.user.id, 
      status: 'confirmed' 
    });
    const completedAppointments = await Appointment.countDocuments({ 
      user: req.user.id, 
      status: 'completed' 
    });
    const cancelledAppointments = await Appointment.countDocuments({ 
      user: req.user.id, 
      status: 'cancelled' 
    });

    // Get recent appointments
    const recentAppointments = await Appointment.find({ user: req.user.id })
      .sort('-createdAt')
      .limit(5);

    // Get appointments by department
    const appointmentsByDepartment = await Appointment.aggregate([
      { $match: { user: req.user.id } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        recentAppointments,
        appointmentsByDepartment
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/stats', protect, getUserStats);

module.exports = router; 