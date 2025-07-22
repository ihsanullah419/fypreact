# Appointment Hub Backend API

A comprehensive Node.js/Express.js backend API for the Appointment Hub system, supporting NADRA, Passport Office, and Assistant Commissioner Office appointment bookings.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Customer registration, login, and profile management
- **Admin Management**: Department-specific admin accounts with dashboard access
- **Appointment Booking**: Complete appointment booking system with validation
- **Email Notifications**: Automated email confirmations and status updates
- **Dashboard Analytics**: Comprehensive statistics and reporting
- **MongoDB Integration**: Robust data persistence with MongoDB

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `config.env` and update with your values:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/appointment-hub
   JWT_SECRET=your-super-secret-jwt-key
   EMAIL_HOST=smtp.gmail.com
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. **Start MongoDB**
   
   **Option A: Local MongoDB**
   - Run the provided script: `.\start-mongodb.ps1` (PowerShell) or `start-mongodb.bat` (Command Prompt)
   - Or manually start MongoDB service: `Start-Service MongoDB`
   
   **Option B: MongoDB Atlas (Cloud)**
   - Go to https://www.mongodb.com/atlas
   - Create free account and cluster
   - Get connection string and update `config.env`

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Customer login
- `POST /api/auth/admin-login` - Admin login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password

### Appointments
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments/my-appointments` - Get user appointments
- `GET /api/appointments/:id` - Get single appointment
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `PUT /api/appointments/:id` - Update appointment
- `GET /api/appointments/available-slots` - Get available time slots

### Admin Routes
- `GET /api/admin/appointments` - Get all appointments
- `GET /api/admin/appointments/:id` - Get single appointment
- `PUT /api/admin/appointments/:id/status` - Update appointment status
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create admin user
- `PUT /api/admin/users/:id/status` - Update user status

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get user statistics

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 👥 User Roles

### Customer
- Register and login
- Book appointments
- View and cancel their appointments
- Update profile information

### Admin
- Access department-specific dashboard
- View and manage appointments
- Update appointment status
- Manage user accounts
- View analytics and statistics

## 📅 Appointment System

### Departments
- **NADRA**: CNIC services, corrections, renewals
- **Passport Office**: New passports, renewals, corrections
- **Assistant Commissioner Office**: Property registration, documentation

### Appointment Status
- `pending` - Awaiting admin approval
- `confirmed` - Approved by admin
- `completed` - Service completed
- `cancelled` - Cancelled by user or admin
- `rejected` - Rejected by admin

### Time Slots
- Available slots: 9:00 AM to 4:00 PM
- 1-hour intervals
- Real-time availability checking

## 📧 Email Notifications

The system sends automated emails for:
- Appointment confirmations
- Status updates
- Cancellation notifications

Configure your email settings in `config.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  cnic: String (unique),
  role: String (customer/admin),
  department: String (for admins),
  isActive: Boolean,
  createdAt: Date
}
```

### Appointment Model
```javascript
{
  user: ObjectId (ref: User),
  department: String,
  service: String,
  appointmentDate: Date,
  appointmentTime: String,
  status: String,
  purpose: String,
  documents: Array,
  notes: String,
  adminNotes: String,
  appointmentNumber: String (auto-generated),
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Demo Data

Run the seed script to populate the database with demo data:

```bash
npm run seed
```

### Demo Accounts

**Customer:**
- Email: `john@example.com`
- Password: `password123`

**Admin Accounts:**
- NADRA: `nadra@admin.com` / `admin123`
- Passport: `passport@admin.com` / `admin123`
- AC Office: `ac@admin.com` / `admin123`

## 🔧 Development

### Project Structure
```
backend/
├── config/
│   └── database.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── models/
│   ├── User.js
│   └── Appointment.js
├── routes/
│   ├── auth.js
│   ├── appointments.js
│   ├── admin.js
│   └── users.js
├── utils/
│   ├── emailService.js
│   └── seedData.js
├── server.js
├── package.json
└── config.env
```

### Environment Variables
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRE`: JWT token expiration time
- `EMAIL_HOST`: SMTP server host
- `EMAIL_PORT`: SMTP server port
- `EMAIL_USER`: Email username
- `EMAIL_PASS`: Email password
- `FRONTEND_URL`: Frontend URL for CORS

## 🚀 Deployment

1. **Set environment variables** for production
2. **Install dependencies**: `npm install --production`
3. **Start the server**: `npm start`
4. **Use PM2** for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "appointment-hub-api"
   ```

## 📝 API Documentation

### Request/Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions, please contact the development team. 