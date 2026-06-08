require('dotenv').config();

const { app, allowedOrigins, PORT, express } = require('./config');
const database = require('./models/database');
const cors = require('cors');
const path = require('path');

// -------------------- Middleware --------------------
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(require('cookie-parser')());

// CORS configuration
app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin / server-to-server (no Origin header)
    if (!origin) return cb(null, true);
    if (allowedOrigins.has(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

// Quick health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -------------------- Route Mounting --------------------

// Authentication routes
app.use('/api', require('./routes/auth'));

// User management routes
app.use('/api/users', require('./routes/users'));

// Admin routes
app.use('/api/admin', require('./routes/admin'));

// Patients routes (for doctors and admins)
app.use('/api/patients', require('./routes/patients'));

// Doctor profile routes
app.use('/api/doctors', require('./routes/doctors'));

// Symptom management routes
app.use('/api/symptoms', require('./routes/symptoms'));

// Medical reports routes
app.use('/api/reports', require('./routes/reports'));

// Chatbot routes
app.use('/chatbot', require('./routes/chatbot'));

// Chat routes
app.use('/api/chats', require('./routes/chat'));

// Hospital locator routes
app.use('/api', require('./routes/hospital-locator'));

// Unified ML Integration routes (single file for all models)
app.use('/api/integration', require('./routes/integration'));

// Medications routes
app.use('/api/medications', require('./routes/medications'));

// Consultation routes
app.use('/api/consultations', require('./routes/consultations'));

// -------------------- Server Start --------------------
if (require.main === module) {
  app.listen(PORT, () => console.log('✅ Server running on port', PORT));
}

module.exports = { app, database };
