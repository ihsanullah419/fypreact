const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: [true, 'Please specify department'],
    enum: ['NADRA', 'Passport Office', 'Assistant Commissioner Office']
  },
  service: {
    type: String,
    required: [true, 'Please specify service'],
    trim: true
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Please specify appointment date']
  },
  appointmentTime: {
    type: String,
    required: [true, 'Please specify appointment time']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  purpose: {
    type: String,
    required: [true, 'Please specify purpose'],
    trim: true,
    maxlength: [500, 'Purpose cannot be more than 500 characters']
  },
  documents: [{
    name: String,
    url: String
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot be more than 1000 characters']
  },
  appointmentNumber: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate appointment number before saving
AppointmentSchema.pre('save', async function(next) {
  if (!this.appointmentNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const count = await this.constructor.countDocuments();
    this.appointmentNumber = `APT-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
AppointmentSchema.index({ user: 1, department: 1, status: 1 });
AppointmentSchema.index({ appointmentDate: 1, department: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema); 