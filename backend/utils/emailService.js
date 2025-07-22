const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send appointment confirmation email
const sendAppointmentConfirmation = async (user, appointment) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Appointment Confirmation - ${appointment.department.toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Appointment Confirmation</h2>
          <p>Dear ${user.name},</p>
          <p>Your appointment has been successfully booked!</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Appointment Details:</h3>
            <p><strong>Appointment Number:</strong> ${appointment.appointmentNumber}</p>
            <p><strong>Department:</strong> ${appointment.department.toUpperCase()}</p>
            <p><strong>Service:</strong> ${appointment.service}</p>
            <p><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
            <p><strong>Purpose:</strong> ${appointment.purpose}</p>
          </div>
          
          <p>Please arrive 15 minutes before your scheduled time.</p>
          <p>If you need to cancel or reschedule, please contact us immediately.</p>
          
          <p>Best regards,<br>Appointment Hub Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Confirmation email sent to ${user.email}`);
  } catch (error) {
    console.error(`❌ Error sending confirmation email: ${error.message}`);
  }
};

// Send appointment status update email
const sendStatusUpdate = async (user, appointment, newStatus) => {
  try {
    const transporter = createTransporter();
    
    const statusColors = {
      confirmed: '#10b981',
      completed: '#059669',
      cancelled: '#ef4444',
      rejected: '#dc2626'
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Appointment Status Update - ${appointment.appointmentNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Appointment Status Update</h2>
          <p>Dear ${user.name},</p>
          <p>Your appointment status has been updated.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Appointment Details:</h3>
            <p><strong>Appointment Number:</strong> ${appointment.appointmentNumber}</p>
            <p><strong>Department:</strong> ${appointment.department.toUpperCase()}</p>
            <p><strong>Service:</strong> ${appointment.service}</p>
            <p><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
            <p><strong>New Status:</strong> <span style="color: ${statusColors[newStatus]}; font-weight: bold;">${newStatus.toUpperCase()}</span></p>
          </div>
          
          ${appointment.adminNotes ? `<p><strong>Admin Notes:</strong> ${appointment.adminNotes}</p>` : ''}
          
          <p>Best regards,<br>Appointment Hub Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Status update email sent to ${user.email}`);
  } catch (error) {
    console.error(`❌ Error sending status update email: ${error.message}`);
  }
};

module.exports = {
  sendAppointmentConfirmation,
  sendStatusUpdate
}; 