const express = require('express');
const { protect, admin, departmentAdmin } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendStatusUpdate } = require('../utils/emailService');

const router = express.Router();

// @desc    Get all appointments (admin)
// @route   GET /api/admin/appointments
// @access  Private/Admin
const getAllAppointments = async (req, res) => {
  try {
    const { status, department, date, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (department && department !== 'all') {
      query.department = department;
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // If admin is department-specific, filter by department
    if (req.user.department) {
      query.department = req.user.department;
    }

    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(query)
      .populate('user', 'name email phone cnic')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single appointment (admin)
// @route   GET /api/admin/appointments/:id
// @access  Private/Admin
const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('user', 'name email phone cnic');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if admin has access to this appointment's department
    if (req.user.department && appointment.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this appointment'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update appointment status (admin)
// @route   PUT /api/admin/appointments/:id/status
// @access  Private/Admin
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const appointment = await Appointment.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if admin has access to this appointment's department
    if (req.user.department && appointment.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    const oldStatus = appointment.status;
    appointment.status = status;
    
    if (adminNotes) {
      appointment.adminNotes = adminNotes;
    }

    await appointment.save();

    // Send status update email if status changed
    if (oldStatus !== status) {
      await sendStatusUpdate(appointment.user, appointment, status);
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const { department } = req.query;
    const query = {};

    // If admin is department-specific, filter by department
    if (req.user.department) {
      query.department = req.user.department;
    } else if (department && department !== 'all') {
      query.department = department;
    }

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayQuery = { ...query, appointmentDate: { $gte: today, $lt: tomorrow } };

    // Get statistics
    const totalAppointments = await Appointment.countDocuments(query);
    const pendingAppointments = await Appointment.countDocuments({ ...query, status: 'pending' });
    const confirmedAppointments = await Appointment.countDocuments({ ...query, status: 'confirmed' });
    const completedAppointments = await Appointment.countDocuments({ ...query, status: 'completed' });
    const cancelledAppointments = await Appointment.countDocuments({ ...query, status: 'cancelled' });
    const todayAppointments = await Appointment.countDocuments(todayQuery);

    // Get recent appointments
    const recentAppointments = await Appointment.find(query)
      .populate('user', 'name email phone')
      .sort('-createdAt')
      .limit(5);

    // Get appointments by status
    const appointmentsByStatus = await Appointment.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get appointments by department (if not department-specific admin)
    let appointmentsByDepartment = [];
    if (!req.user.department) {
      appointmentsByDepartment = await Appointment.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } }
      ]);
    }

    res.status(200).json({
      success: true,
      data: {
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        todayAppointments,
        recentAppointments,
        appointmentsByStatus,
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

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { role, department, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (department && department !== 'all') {
      query.department = department;
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create admin user
// @route   POST /api/admin/users
// @access  Private/Admin
const createAdminUser = async (req, res) => {
  try {
    const { name, email, password, phone, cnic, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { cnic }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or CNIC already exists'
      });
    }

    // Create admin user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      cnic,
      role: 'admin',
      department
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cnic: user.cnic,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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

router.get('/appointments', protect, admin, getAllAppointments);
router.get('/appointments/:id', protect, admin, getAppointment);
router.put('/appointments/:id/status', protect, admin, updateAppointmentStatus);
router.get('/dashboard', protect, admin, getDashboardStats);
router.get('/users', protect, admin, getAllUsers);
router.post('/users', protect, admin, createAdminUser);
router.put('/users/:id/status', protect, admin, updateUserStatus);

module.exports = router; 