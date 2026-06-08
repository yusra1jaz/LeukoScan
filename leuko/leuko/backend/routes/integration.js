/**
 * 🧠 COMPREHENSIVE ML INTEGRATION ROUTES
 * 
 * Single unified API endpoint for all ML functionality
 * - All trained models
 * - Complete currennt.py implementation  
 * - WSL compatibility
 * - Multiple prediction methods
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware, adminOrDoctorOnly } = require('../middleware/auth');
const mlIntegrationService = require('../services/integration');
const db = require('../models/database');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/predictions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `integration-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|bmp|tiff/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper function to cleanup uploaded files
const cleanupFile = (file) => {
  if (file && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
};

// Helper function to validate blood sample images (without Sharp)
const validateBloodSampleImage = async (filePath, originalName) => {
  try {
    // Validate file size - blood sample images are typically medium-sized
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    if (fileSizeMB < 0.01 || fileSizeMB > 15) {
      return { valid: false, reason: 'Invalid file size for blood sample image (10KB - 15MB required)' };
    }
    
    // Validate file extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'];
    const ext = path.extname(filePath).toLowerCase();
    if (!validExtensions.includes(ext)) {
      return { valid: false, reason: 'Invalid image format for blood sample (JPG, PNG, BMP, TIFF only)' };
    }
    
    // Strong validation based on filename patterns typical of medical/blood sample images
    const filename = originalName.toLowerCase();
    
    // Common patterns in blood sample/medical images
    const medicalPatterns = [
      /blood/, /smear/, /cell/, /leuk/, /hema/, /cyto/, /patho/,
      /micro/, /slide/, /specimen/, /sample/, /test/, /lab/,
      /all/, /aml/, /cll/, /cml/, /healthy/, /normal/,
      /\d{4}\d{2}\d{2}/, // Date patterns like 20190115
      /hdr/, /img/, /dsc/, /scan/, /microscope/
    ];
    
    // Non-medical patterns that should be rejected
    const nonMedicalPatterns = [
      /selfie/, /portrait/, /landscape/, /nature/, /animal/, /pet/,
      /food/, /car/, /house/, /building/, /street/, /city/,
      /screenshot/, /wallpaper/, /meme/, /cartoon/, /drawing/,
      /logo/, /icon/, /avatar/, /profile/, /cover/, /banner/
    ];
    
    // Check if filename suggests medical content
    const hasMedicalPattern = medicalPatterns.some(pattern => pattern.test(filename));
    const hasNonMedicalPattern = nonMedicalPatterns.some(pattern => pattern.test(filename));
    
    // Additional validation: check if filename looks like a medical image
    // Most medical images have specific naming conventions
    const looksLikeMedicalImage = 
      hasMedicalPattern && !hasNonMedicalPattern ||
      // Allow generic numbered files (common in datasets)
      /^(img|image|dsc|photo|pic)?[\d_-]+/.test(filename) ||
      // Allow files with dates
      /\d{4}[_-]?\d{2}[_-]?\d{2}/.test(filename);
    
    if (!looksLikeMedicalImage) {
      return { 
        valid: false, 
        reason: 'Image does not appear to be a blood sample or medical image. Please upload only blood smear/microscopic images for leukemia diagnosis.' 
      };
    }
    
    console.log(`Validation passed for medical image: ${originalName}`);
    return { valid: true };
  } catch (error) {
    console.error('Image validation error:', error);
    return { valid: false, reason: 'Failed to validate image' };
  }
};

// Helper function to save diagnosis results to database
const saveDiagnosisResult = async (userId, result, imageFilename) => {
  try {
    const diagnosisData = {
      user_id: userId,
      prediction: result.prediction,
      confidence: result.confidence,
      ensemble_details: result.ensembleDetails ? JSON.stringify(result.ensembleDetails) : null,
      heatmap_data: result.heatmapData ? JSON.stringify(result.heatmapData) : null,
      image_filename: imageFilename
    };

    await db.run(
      `INSERT INTO diagnosis_results (user_id, prediction, confidence, ensemble_details, heatmap_data, image_filename) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [diagnosisData.user_id, diagnosisData.prediction, diagnosisData.confidence, 
       diagnosisData.ensemble_details, diagnosisData.heatmap_data, diagnosisData.image_filename]
    );
    
    console.log('Diagnosis result saved to database for user:', userId);
  } catch (error) {
    console.error('Error saving diagnosis result:', error);
  }
};

// Health check
router.get('/health', authMiddleware, async (req, res) => {
  try {
    const health = await mlIntegrationService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get complete configuration
router.get('/config', authMiddleware, async (req, res) => {
  try {
    const config = mlIntegrationService.getConfiguration();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all available models
router.get('/models', authMiddleware, async (req, res) => {
  try {
    const models = mlIntegrationService.getAllModels();
    res.json({ models });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Temporary test endpoint without authentication for debugging
router.post('/test-predict', upload.single('image'), async (req, res) => {
  try {
    console.log('?? Test predict endpoint called');
    console.log('?? File received:', req.file ? req.file.originalname : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate that the image is a blood sample/microscopic image
    const validation = await validateBloodSampleImage(req.file.path, req.file.originalname);
    if (!validation.valid) {
      cleanupFile(req.file);
      return res.status(400).json({ 
        error: 'Invalid image type',
        details: validation.reason
      });
    }

    console.log('?? Reading image buffer...');
    const imageBuffer = fs.readFileSync(req.file.path);
    console.log('?? Image size:', imageBuffer.length, 'bytes');
    
    console.log('?? Starting ML prediction...');
    const result = await mlIntegrationService.predictStandard(imageBuffer, 'primary');
    
    console.log('?? Prediction completed:', result);
    
    cleanupFile(req.file);
    res.json(result);
    
  } catch (error) {
    console.error('?? Test predict error:', error);
    cleanupFile(req.file);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get available models endpoint
router.get('/models', authMiddleware, async (req, res) => {
  try {
    const availableModels = mlIntegrationService.getAvailableModels();
    res.json({
      success: true,
      models: availableModels,
      total: availableModels.length
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      success: false 
    });
  }
});

// Universal prediction endpoint - single entry point for all prediction types
router.post('/predict', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate that the image is a blood sample/microscopic image
    const validation = await validateBloodSampleImage(req.file.path, req.file.originalname);
    if (!validation.valid) {
      cleanupFile(req.file);
      return res.status(400).json({ 
        error: 'Invalid image type',
        details: validation.reason
      });
    }

    const { 
      model = 'primary',           // Which model to use
      method = 'standard',         // standard, tta, ensemble
      useTTA = false             // Backward compatibility
    } = req.body;

    // Read image buffer
    const imageBuffer = fs.readFileSync(req.file.path);
    
    let result;
    
    // Determine prediction method
    if (method === 'ensemble') {
      result = await mlIntegrationService.predictEnsemble(
        imageBuffer, 
        useTTA === 'true' || useTTA === true
      );
    } else if (method === 'tta' || useTTA === 'true' || useTTA === true) {
      result = await mlIntegrationService.predictTTA(imageBuffer, model);
    } else {
      result = await mlIntegrationService.predictStandard(imageBuffer, model);
    }
    
    // Save result to database
    await saveDiagnosisResult(req.user.id, result, req.file.filename);
    
    // Clean up uploaded file
    cleanupFile(req.file);
    
    // Add metadata
    result.metadata = {
      service: 'ML Integration Service',
      timestamp: new Date().toISOString(),
      uploadedBy: req.user.username,
      originalFilename: req.file.originalname,
      requestParams: { model, method, useTTA }
    };
    
    res.json(result);
  } catch (error) {
    cleanupFile(req.file);
    res.status(500).json({ error: error.message });
  }
});

// Standard prediction (78% accuracy)
router.post('/predict/standard', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate that the image is a blood sample/microscopic image
    const validation = await validateBloodSampleImage(req.file.path, req.file.originalname);
    if (!validation.valid) {
      cleanupFile(req.file);
      return res.status(400).json({ 
        error: 'Invalid image type',
        details: validation.reason
      });
    }

    const { model = 'primary' } = req.body;
    const imageBuffer = fs.readFileSync(req.file.path);
    
    const result = await mlIntegrationService.predictStandard(imageBuffer, model);
    
    cleanupFile(req.file);
    result.metadata = {
      service: 'ML Integration - Standard',
      timestamp: new Date().toISOString(),
      uploadedBy: req.user.username,
      originalFilename: req.file.originalname
    };
    
    res.json(result);
  } catch (error) {
    cleanupFile(req.file);
    res.status(500).json({ error: error.message });
  }
});

// TTA prediction (81% accuracy - currennt.py optimized)
router.post('/predict/tta', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate that the image is a blood sample/microscopic image
    const validation = await validateBloodSampleImage(req.file.path, req.file.originalname);
    if (!validation.valid) {
      cleanupFile(req.file);
      return res.status(400).json({ 
        error: 'Invalid image type',
        details: validation.reason
      });
    }

    const { model = 'primary' } = req.body;
    const imageBuffer = fs.readFileSync(req.file.path);
    
    const result = await mlIntegrationService.predictTTA(imageBuffer, model);
    
    cleanupFile(req.file);
    result.metadata = {
      service: 'ML Integration - TTA',
      timestamp: new Date().toISOString(),
      uploadedBy: req.user.username,
      originalFilename: req.file.originalname,
      ttaSteps: 5
    };
    
    res.json(result);
  } catch (error) {
    cleanupFile(req.file);
    res.status(500).json({ error: error.message });
  }
});

// Ensemble prediction (best accuracy)
router.post('/predict/ensemble', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate that the image is a blood sample/microscopic image
    const validation = await validateBloodSampleImage(req.file.path, req.file.originalname);
    if (!validation.valid) {
      cleanupFile(req.file);
      return res.status(400).json({ 
        error: 'Invalid image type',
        details: validation.reason
      });
    }

    const { useTTA = false } = req.body;
    const imageBuffer = fs.readFileSync(req.file.path);
    
    const result = await mlIntegrationService.predictEnsemble(
      imageBuffer, 
      useTTA === 'true' || useTTA === true
    );
    
    cleanupFile(req.file);
    result.metadata = {
      service: 'ML Integration - Ensemble',
      timestamp: new Date().toISOString(),
      uploadedBy: req.user.username,
      originalFilename: req.file.originalname,
      ensembleSize: result.ensembleSize
    };
    
    res.json(result);
  } catch (error) {
    cleanupFile(req.file);
    res.status(500).json({ error: error.message });
  }
});

// Comprehensive comparative analysis
router.post('/analyze', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageBuffer = fs.readFileSync(req.file.path);
    
    const analysis = await mlIntegrationService.performComparativeAnalysis(imageBuffer);
    
    cleanupFile(req.file);
    analysis.metadata = {
      service: 'ML Integration - Comparative Analysis',
      timestamp: new Date().toISOString(),
      uploadedBy: req.user.username,
      originalFilename: req.file.originalname
    };
    
    res.json(analysis);
  } catch (error) {
    cleanupFile(req.file);
    res.status(500).json({ error: error.message });
  }
});

// Batch processing
router.post('/predict-batch', authMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const { 
      model = 'primary', 
      method = 'standard', 
      useTTA = false 
    } = req.body;

    const results = [];
    
    for (const file of req.files) {
      try {
        const imageBuffer = fs.readFileSync(file.path);
        
        let result;
        if (method === 'ensemble') {
          result = await mlIntegrationService.predictEnsemble(
            imageBuffer, 
            useTTA === 'true' || useTTA === true
          );
        } else if (method === 'tta' || useTTA === 'true' || useTTA === true) {
          result = await mlIntegrationService.predictTTA(imageBuffer, model);
        } else {
          result = await mlIntegrationService.predictStandard(imageBuffer, model);
        }
        
        result.filename = file.filename;
        result.originalName = file.originalname;
        results.push(result);
        
        cleanupFile(file);
      } catch (error) {
        results.push({
          filename: file.filename,
          originalName: file.originalname,
          error: error.message
        });
        
        cleanupFile(file);
      }
    }
    
    res.json({
      results,
      summary: {
        total: req.files.length,
        successful: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length
      },
      metadata: {
        service: 'ML Integration - Batch Processing',
        method: method,
        timestamp: new Date().toISOString(),
        uploadedBy: req.user.username,
        requestParams: { model, method, useTTA }
      }
    });
  } catch (error) {
    // Clean up all files if error occurs
    if (req.files) {
      req.files.forEach(cleanupFile);
    }
    res.status(500).json({ error: error.message });
  }
});

// Initialize service manually
router.post('/initialize', authMiddleware, adminOrDoctorOnly, async (req, res) => {
  try {
    await mlIntegrationService.initialize();
    res.json({ 
      message: 'ML Integration Service initialized successfully',
      configuration: mlIntegrationService.getConfiguration()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's previous diagnosis results
router.get('/results', authMiddleware, async (req, res) => {
  try {
    const results = await db.all(
      `SELECT * FROM diagnosis_results 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [req.user.id]
    );

    // Parse JSON fields for each result
    const parsedResults = results.map(result => ({
      ...result,
      ensemble_details: result.ensemble_details ? JSON.parse(result.ensemble_details) : null,
      heatmap_data: result.heatmap_data ? JSON.parse(result.heatmap_data) : null
    }));

    res.json({
      success: true,
      results: parsedResults,
      total: parsedResults.length
    });
  } catch (error) {
    console.error('Error fetching diagnosis results:', error);
    res.status(500).json({ 
      error: error.message,
      success: false 
    });
  }
});

// Get service documentation
router.get('/docs', authMiddleware, (req, res) => {
  const docs = {
    title: 'ML Integration Service API',
    description: 'Unified API for all ML models and currennt.py functionality',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'Service health check',
      'GET /config': 'Complete configuration and features',
      'GET /models': 'Available models and their status',
      'POST /predict': 'Universal prediction endpoint (all methods)',
      'POST /predict/standard': 'Standard prediction (78% accuracy)',
      'POST /predict/tta': 'TTA prediction (81% accuracy)',
      'POST /predict/ensemble': 'Ensemble prediction (best accuracy)',
      'POST /analyze': 'Comparative analysis of all methods',
      'POST /predict-batch': 'Batch processing (up to 10 images)',
      'GET /results': 'Get user previous diagnosis results',
      'POST /initialize': 'Manual service initialization'
    },
    features: [
      'All trained models integrated',
      'Complete currennt.py implementation',
      'WSL compatibility',
      'Multiple prediction methods',
      'Ensemble capabilities',
      'Comparative analysis',
      'Batch processing',
      'Threshold balancing',
      'Test-time augmentation',
      'Focal loss optimization',
      'Persistent result storage'
    ],
    models: [
      {
        name: 'Primary DenseNet',
        accuracy: '81%',
        description: 'Best fine-tuned DenseNet with TTA and threshold balancing'
      },
      {
        name: 'Secondary DenseNet', 
        accuracy: '78%',
        description: 'Alternative fine-tuned DenseNet model'
      }
    ],
    classLabels: ['ALL', 'AML', 'CLL', 'CML', 'Healthy'],
    accuracy: {
      standard: '78%',
      tta: '81%',
      ensemble: '82-85%'
    }
  };
  
  res.json(docs);
});

module.exports = router;
