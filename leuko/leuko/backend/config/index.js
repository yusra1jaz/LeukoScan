require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const multer = require('multer');
const OpenAI = require('openai');

const app = express();

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_strong_secret_in_prod';
const JWT_EXPIRES = '7d';
const PORT = 4000;
const DB_PATH = path.join(__dirname, '..', 'users.db');

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// CORS configuration
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080,http://localhost:3001,http://127.0.0.1:3001')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!require('fs').existsSync(uploadDir)) require('fs').mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `user_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// System prompts
const LEUKEMIA_SYSTEM_PROMPT = `You are a knowledgeable and compassionate medical assistant specializing in leukemia (blood cancer). Your role is to provide accurate, helpful, and empathetic information about leukemia, including:

- Types of leukemia (ALL, AML, CLL, CML, and others)
- Symptoms and early warning signs
- Diagnosis methods and tests
- Treatment options (chemotherapy, targeted therapy, immunotherapy, stem cell transplant, etc.)
- Medications and their purposes
- Side effects and management
- Prognosis and survival rates
- Lifestyle and support during treatment
- Questions to ask doctors

IMPORTANT GUIDELINES:
- Always emphasize that you provide educational information only, not medical advice
- Encourage users to consult with qualified healthcare professionals for diagnosis and treatment decisions
- Be empathetic and supportive, especially when discussing serious topics
- Use clear, understandable language while maintaining medical accuracy
- If asked about something outside leukemia, politely redirect to leukemia-related topics
- Never provide specific dosages or treatment recommendations for individuals
- If you don't know something, admit it rather than guessing

Be helpful, accurate, and compassionate in all your responses.`;

module.exports = {
  app,
  express,
  JWT_SECRET,
  JWT_EXPIRES,
  PORT,
  DB_PATH,
  openai,
  allowedOrigins,
  upload,
  LEUKEMIA_SYSTEM_PROMPT
};
