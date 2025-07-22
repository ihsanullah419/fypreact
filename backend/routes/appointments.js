const express = require('express');
const { protect } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendAppointmentConfirmation } = require('../utils/emailService');

const router = express.Router();

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res) => {
  try {
    const {
      department,
      service,
      appointmentDate,
      appointmentTime,
      purpose,
      notes
    } = req.body;

    // Check if appointment date is in the future
    const appointmentDateTime = new Date(appointmentDate);
    const now = new Date();
    
    if (appointmentDateTime <= now) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date must be in the future'
      });
    }

    // Check if user already has an appointment on the same date and time
    const existingAppointment = await Appointment.findOne({
      user: req.user.id,
      appointmentDate: appointmentDateTime,
      appointmentTime,
      status: { $nin: ['cancelled', 'rejected'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'You already have an appointment at this date and time'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      user: req.user.id,
      department,
      service,
      appointmentDate: appointmentDateTime,
      appointmentTime,
      purpose,
      notes
    });

    // Populate user details
    await appointment.populate('user', 'name email phone');

    // Send confirmation email
    await sendAppointmentConfirmation(appointment.user, appointment);

    res.status(201).json({
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

// @desc    Get user appointments
// @route   GET /api/appointments/my-appointments
// @access  Private
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user.id })
      .populate('user', 'name email phone')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
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

    // Make sure user owns appointment or is admin
    if (appointment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
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

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Make sure user owns appointment
    if (appointment.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed appointment'
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

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

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Make sure user owns appointment
    if (appointment.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    // Check if appointment can be updated
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update cancelled or completed appointment'
      });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: updatedAppointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all appointments (admin only)
// @route   GET /api/appointments
// @access  Private (Admin)
const getAllAppointments = async (req, res) => {
  try {
    const { department, status, date } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Filter by department (admin can only see their department)
    if (req.user.role === 'admin') {
      filter.department = req.user.department;
    }
    
    // Additional filters
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.appointmentDate = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const appointments = await Appointment.find(filter)
      .populate('user', 'name email phone')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get appointment statistics (admin only)
// @route   GET /api/appointments/stats
// @access  Private (Admin)
const getAppointmentStats = async (req, res) => {
  try {
    const { department } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Filter by department (admin can only see their department)
    if (req.user.role === 'admin') {
      filter.department = req.user.department;
    }
    
    if (department) filter.department = department;

    const stats = await Appointment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };

    res.status(200).json({
      success: true,
      stats: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update appointment status (admin only)
// @route   PUT /api/appointments/:id/status
// @access  Private (Admin)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if admin can manage this appointment (same department)
    if (req.user.role === 'admin' && appointment.department !== req.user.department) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to manage this appointment'
      });
    }

    appointment.status = status;
    await appointment.save();

    // Populate user details for response
    await appointment.populate('user', 'name email phone');

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

// @desc    Add admin notes to appointment (admin only)
// @route   PUT /api/appointments/:id/notes
// @access  Private (Admin)
const addAdminNotes = async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if admin can manage this appointment (same department)
    if (req.user.role === 'admin' && appointment.department !== req.user.department) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to manage this appointment'
      });
    }

    appointment.adminNotes = adminNotes;
    await appointment.save();

    // Populate user details for response
    await appointment.populate('user', 'name email phone');

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

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization: user can delete their own appointment, admin can delete any appointment in their department
    if (appointment.user.toString() !== req.user.id && 
        (req.user.role !== 'admin' || appointment.department !== req.user.department)) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this appointment'
      });
    }

    // Allow deletion of all appointment statuses including completed
    // No status restrictions for deletion

    await Appointment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get available time slots
// @route   GET /api/appointments/available-slots
// @access  Public
const getAvailableSlots = async (req, res) => {
  try {
    const { date, department } = req.query;

    if (!date || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date and department'
      });
    }

    // Get appointments for the specified date and department
    const appointments = await Appointment.find({
      appointmentDate: new Date(date),
      department,
      status: { $nin: ['cancelled', 'rejected'] }
    });

    // Define available time slots (9 AM to 5 PM, 1-hour slots)
    const timeSlots = [
      '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
    ];

    // Get booked time slots
    const bookedSlots = appointments.map(apt => apt.appointmentTime);

    // Filter available slots
    const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));

    res.status(200).json({
      success: true,
      data: {
        date,
        department,
        availableSlots,
        bookedSlots
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

router.post('/', protect, createAppointment);
router.get('/my-appointments', protect, getMyAppointments);
router.get('/available-slots', getAvailableSlots);

// Admin routes (must come before /:id routes)
router.get('/stats', protect, getAppointmentStats);
router.get('/', protect, getAllAppointments);

// Individual appointment routes (must come after specific routes)
router.get('/:id', protect, getAppointment);
router.put('/:id/cancel', protect, cancelAppointment);
router.put('/:id/status', protect, updateAppointmentStatus);
router.put('/:id/notes', protect, addAdminNotes);
router.put('/:id', protect, updateAppointment);
router.delete('/:id', protect, deleteAppointment);

module.exports = router; 