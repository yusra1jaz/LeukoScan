# Backend API Structure

This document describes the organized backend structure for the LeukoScan application.

## 📁 Folder Structure

```
backend/
├── server.js                 # Main server entry point
├── server_backup.js          # Original monolithic server (backup)
├── package.json             # Dependencies and scripts
├── users.db                 # SQLite database
├── uploads/                 # File upload directory
├── config/                  # Configuration files
│   ├── database.js          # Database setup and initialization
│   └── constants.js         # Application constants
├── middleware/              # Express middleware
│   └── auth.js              # Authentication middleware
├── routes/                  # API route handlers
│   ├── auth.js              # Authentication routes (login, signup, etc.)
│   ├── admin.js             # Admin management routes
│   ├── users.js             # User profile and preferences
│   ├── patients.js          # Patient management and assessment
│   ├── symptoms.js          # Symptom tracking
│   ├── chat.js              # Chat functionality
│   ├── hospitals.js         # Hospital locator API
│   └── medications.js       # Medication information API
└── utils/                   # Utility functions (for future use)
```

## 🔧 API Endpoints

### Authentication (`/api`)
- `POST /signup` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset confirmation
- `GET /me` - Get current user info

### Admin Management (`/api/admin`)
- `GET /admins` - List all admin users
- `POST /add` - Add new admin
- `DELETE /delete/:id` - Delete admin

### User Management (`/api/users`)
- `GET /info` - Get user profile
- `PUT /info` - Update user profile
- `DELETE /delete` - Delete user account
- `GET /preferences` - Get user preferences
- `PUT /preferences` - Update user preferences
- `PUT /change-password` - Change password

### Patient Management (`/api/patients`)
- `GET /patients` - List all patients (admin/doctor only)
- `GET /patients/:id` - Get patient details (admin/doctor only)
- `GET /patients/:id/disease` - Get patient disease info (admin/doctor only)
- `GET /patients/:id/notes` - Get patient doctor notes (admin/doctor only)
- `POST /patients/:id/notes` - Add doctor note (admin/doctor only)

### Symptom Tracking (`/api/symptoms`)
- `GET /symptoms` - Get user symptom entries
- `POST /symptoms` - Add new symptom entry

### Chat (`/chats`)
- `GET /chats` - Get all chats with messages
- `POST /chats` - Create new chat
- `POST /chats/:id/messages` - Add message to chat
- `DELETE /chats/:id` - Delete chat

### Hospital Locator (`/api/hospitals`)
- `GET /hospitals` - Search nearby hospitals

### Medication Information (`/api/medications`)
- `GET /medications/search` - Search medication information
- `GET /medications` - List all available medications
- `GET /medications/:name` - Get specific medication details

## 🗄️ Database Tables

- `users` - User accounts and profiles
- `user_preferences` - User settings
- `doctors` - Doctor information
- `patient_disease_info` - Patient medical data
- `doctor_notes` - Medical assessment notes
- `patient_archive` - Archived patient data (preserved after deletion)
- `symptom_entries` - Patient symptom tracking
- `chats` - Chat sessions
- `messages` - Chat messages
- `password_reset_tokens` - Password reset tokens

## 🔐 Security Features

- JWT-based authentication
- Role-based access control (admin, doctor, user)
- Password hashing with bcrypt
- CORS configuration for frontend integration
- Data persistence for deleted patients
- Secure file upload handling

## 🚀 Getting Started

1. Install dependencies: `npm install`
2. Start server: `npm start`
3. Server runs on: `http://localhost:4000`

## 📝 Notes

- All functionality from the original monolithic server.js has been preserved
- Database initialization happens automatically on server start
- The original server.js is backed up as server_backup.js
- File uploads are stored in the `uploads/` directory
- SQLite database is stored as `users.db`

## 🔧 Migration

The migration from monolithic server.js to organized structure maintains:
- ✅ All API endpoints
- ✅ Database schema
- ✅ Authentication logic
- ✅ File upload functionality
- ✅ CORS configuration
- ✅ Error handling
- ✅ All existing functionality
