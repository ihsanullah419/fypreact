const User = require('../models/User');
const Appointment = require('../models/Appointment');
const connectDB = require('../config/database');
require('dotenv').config({ path: './config.env' });

const seedData = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Appointment.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create demo admin users
    const adminUsers = [
      {
        name: 'NADRA Admin',
        email: 'nadra@admin.com',
        password: 'admin123',
        phone: '03001234567',
        role: 'admin',
        department: 'NADRA'
      },
      {
        name: 'Passport Admin',
        email: 'passport@admin.com',
        password: 'admin123',
        phone: '03001234568',
        role: 'admin',
        department: 'Passport Office'
      },
      {
        name: 'AC Office Admin',
        email: 'ac@admin.com',
        password: 'admin123',
        phone: '03001234569',
        role: 'admin',
        department: 'Assistant Commissioner Office'
      }
    ];

    // Create admin users one by one to trigger password hashing
    const createdAdmins = [];
    for (const adminData of adminUsers) {
      const admin = new User(adminData);
      await admin.save();
      createdAdmins.push(admin);
    }
    console.log('👥 Created admin users');

    // Create demo customer users
    const customerUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '03001234570',
        role: 'customer'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        phone: '03001234571',
        role: 'customer'
      },
      {
        name: 'Ahmed Khan',
        email: 'ahmed@example.com',
        password: 'password123',
        phone: '03001234572',
        role: 'customer'
      }
    ];

    // Create customer users one by one to trigger password hashing
    const createdCustomers = [];
    for (const customerData of customerUsers) {
      const customer = new User(customerData);
      await customer.save();
      createdCustomers.push(customer);
    }
    console.log('👥 Created customer users');

    // Create demo appointments
    const demoAppointments = [
      {
        user: createdCustomers[0]._id,
        department: 'NADRA',
        service: 'CNIC Renewal',
        appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        appointmentTime: '10:00',
        purpose: 'CNIC renewal due to expiry',
        status: 'confirmed'
      },
      {
        user: createdCustomers[1]._id,
        department: 'Passport Office',
        service: 'New Passport',
        appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        appointmentTime: '14:00',
        purpose: 'Applying for new passport for international travel',
        status: 'pending'
      },
      {
        user: createdCustomers[2]._id,
        department: 'Assistant Commissioner Office',
        service: 'Property Registration',
        appointmentDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        appointmentTime: '11:00',
        purpose: 'Property registration and documentation',
        status: 'confirmed'
      },
      {
        user: createdCustomers[0]._id,
        department: 'NADRA',
        service: 'CNIC Correction',
        appointmentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        appointmentTime: '09:00',
        purpose: 'Correction in CNIC details',
        status: 'completed'
      },
      {
        user: createdCustomers[1]._id,
        department: 'Passport Office',
        service: 'Passport Renewal',
        appointmentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        appointmentTime: '15:00',
        purpose: 'Passport renewal for business travel',
        status: 'cancelled'
      }
    ];

    // Create appointments one by one to trigger pre-save middleware
    for (const appointmentData of demoAppointments) {
      const appointment = new Appointment(appointmentData);
      await appointment.save();
    }
    console.log('📅 Created demo appointments');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('👤 Customer Login:');
    console.log('   Email: john@example.com');
    console.log('   Password: password123');
    console.log('\n👨‍💼 Admin Logins:');
    console.log('   NADRA: nadra@admin.com / admin123');
    console.log('   Passport: passport@admin.com / admin123');
    console.log('   AC Office: ac@admin.com / admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = seedData; 