

const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs');

// WSL Path Detection and Management
class WSLPathManager {
  constructor() {
    this.isWSL = this.detectWSL();
    this.basePaths = this.initializePaths();
  }

  detectWSL() {
    try {
      const release = fs.readFileSync('/proc/version', 'utf8');
      const isWSL = release.toLowerCase().includes('microsoft') || release.toLowerCase().includes('wsl');
      console.log('🔍 WSL Detection - /proc/version content:', release.trim());
      console.log('🔍 WSL Detection - Is WSL:', isWSL);
      return isWSL;
    } catch (error) {
      console.log('🔍 WSL Detection - Failed to read /proc/version:', error.message);
      return false;
    }
  }

  initializePaths() {
    if (this.isWSL) {
      const wslPaths = {
        models: '/mnt/e/fyp/leuko/leuko/train test',
        dataset: '/mnt/e/fyp/leuko/leuko/leukodataset',
        uploads: '/mnt/e/fyp/leuko/leuko/backend/uploads',
        tfjsModels: '/mnt/e/fyp/leuko/leuko/backend/models/tfjs'
      };
      console.log('🔍 WSL Paths initialized:', wslPaths);
      
      // Test if the path exists with proper escaping
      console.log('🔍 Testing path existence...');
      try {
        const exists = fs.existsSync(wslPaths.models);
        console.log('🔍 Raw path exists check:', exists);
        
        // Try with proper path resolution
        const resolvedPath = path.resolve(wslPaths.models);
        console.log('🔍 Resolved path:', resolvedPath);
        console.log('🔍 Resolved path exists:', fs.existsSync(resolvedPath));
      } catch (error) {
        console.log('🔍 Path test error:', error.message);
      }
      
      return wslPaths;
    } else {
      const windowsPaths = {
        models: 'e:/fyp/leuko/leuko/train test',
        dataset: 'e:/fyp/leuko/leuko/leukodataset',
        uploads: 'e:/fyp/leuko/leuko/backend/uploads',
        tfjsModels: 'e:/fyp/leuko/leuko/backend/models/tfjs'
      };
      console.log('🔍 Windows Paths initialized:', windowsPaths);
      return windowsPaths;
    }
  }

  getModelPath(filename) {
    return path.join(this.basePaths.models, filename);
  }

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
  }

  listAvailableModels() {
    const modelsDir = this.basePaths.models;
    console.log('🔍 Checking models directory:', modelsDir);
    console.log('🔍 Directory exists:', fs.existsSync(modelsDir));
    
    if (!fs.existsSync(modelsDir)) {
      console.log('❌ Models directory does not exist:', modelsDir);
      return [];
    }
    
    const files = fs.readdirSync(modelsDir);
    console.log('🔍 All files in directory:', files);
    
    const modelFiles = files.filter(file => file.endsWith('.h5') || file.endsWith('.json'));
    console.log('🔍 Model files found:', modelFiles);
    
    return modelFiles;
  }
}

// Main Integration Service
class MLIntegrationService {
  constructor() {
    this.pathManager = new WSLPathManager();
    this.models = {};
    this.isInitialized = false;
    
    // Configuration from currennt.py
    this.CLASS_LABELS = ['ALL', 'AML', 'CLL', 'CML', 'Healthy']; // Order matches training directories
    this.THRESHOLD_MULTIPLIERS = { 0: 3.5, 1: 1.5, 2: 1.0, 3: 0.7, 4: 1.0 }; // From currennt.py line 312-314
    this.CUSTOM_WEIGHTS = { 0: 20.0, 1: 5.0, 2: 1.0, 3: 1.0, 4: 0.5 };
    
    // Model configurations - Only use the 2 configured models
    this.MODEL_CONFIGS = {
      primary: {
        name: 'Primary DenseNet',
        path: this.pathManager.getModelPath('best_finetuned_densenet.h5'),
        accuracy: '81%',
        description: 'Best fine-tuned DenseNet with TTA and threshold balancing'
      },
      secondary: {
        name: 'Secondary DenseNet',
        path: this.pathManager.getModelPath('fine_tuned_densenet_leukemia (1).h5'),
        accuracy: '78%',
        description: 'Alternative fine-tuned DenseNet model'
      }
    };
  }

  async initialize() {
    try {
      console.log(' Initializing Comprehensive ML Integration Service...');
      console.log('Environment:', this.pathManager.isWSL ? 'WSL' : 'Windows');
      console.log('Available models:', this.pathManager.listAvailableModels());
      
      // Load all available models dynamically
      const modelKeys = Object.keys(this.MODEL_CONFIGS);
      for (const modelKey of modelKeys) {
        await this.loadModel(modelKey, this.MODEL_CONFIGS[modelKey]);
      }
      
      if (Object.keys(this.models).length === 0) {
        console.error(' No models could be loaded! This might cause all predictions to default to AML.');
        throw new Error('No models could be loaded');
      }

      this.isInitialized = true;
      console.log(' ML Integration Service initialized successfully');
      console.log(' Loaded models:', Object.keys(this.models));
      console.log(' Class labels:', this.CLASS_LABELS);
      console.log(' Threshold multipliers:', this.THRESHOLD_MULTIPLIERS);
      this.printModelSummary();
      
    } catch (error) {
      console.error(' Error initializing ML Integration Service:', error);
      throw error;
    }
  }

  async loadModel(modelKey, config) {
    try {
      console.log(`📥 Registering ${config.name} for Python prediction: ${config.path}`);
      
      // Register model for Python-based prediction
      this.models[modelKey] = {
        type: 'python',
        path: config.path,
        name: config.name,
        accuracy: config.accuracy
      };
      
      console.log(`✅ ${config.name} registered for Python prediction`);
    } catch (error) {
      console.error(`❌ Failed to register ${config.name}:`, error.message);
    }
  }

  getAvailableModels() {
    return Object.keys(this.MODEL_CONFIGS).map(key => ({
      key,
      name: this.MODEL_CONFIGS[key].name,
      accuracy: this.MODEL_CONFIGS[key].accuracy,
      description: this.MODEL_CONFIGS[key].description
    }));
  }

  printModelSummary() {
    console.log('\n📋 Model Summary:');
    console.log('=' * 60);
    Object.entries(this.MODEL_CONFIGS).forEach(([key, config]) => {
      const status = this.models[key] ? '✅ Loaded' : '❌ Not Available';
      console.log(`${status} ${config.name}`);
      console.log(`   Accuracy: ${config.accuracy} | ${config.description}`);
      console.log('');
    });
  }

  // Focal Loss from currennt.py
  focalLoss(gamma = 2.0, alpha = 4.0) {
    return (yTrue, yPred) => {
      const epsilon = tf.epsilon();
      const clippedPred = tf.clipByValue(yPred, epsilon, 1.0 - epsilon);
      const crossEntropy = tf.neg(tf.mul(yTrue, tf.log(clippedPred)));
      const loss = tf.mul(
        tf.scalar(alpha),
        tf.mul(tf.pow(tf.sub(1.0, clippedPred), tf.scalar(gamma)), crossEntropy)
      );
      return tf.mean(tf.sum(loss, -1));
    };
  }

  // Image preprocessing from currennt.py
  preprocessImage(imageBuffer) {
    return tf.tidy(() => {
      return tf.node.decodeImage(imageBuffer, 3)
        .resizeBilinear([224, 224])
        .toFloat()
        .div(255.0)
        .expandDims(0);
    });
  }

  // Data augmentation from currennt.py
  applyDataAugmentation(imageTensor) {
    return tf.tidy(() => {
      let augmented = imageTensor;
      
      if (Math.random() < 0.5) {
        const rotationAngle = tf.randomUniform([], 0, Math.PI / 2);
        augmented = tf.image.rotate(augmented, rotationAngle);
      }
      
      if (Math.random() < 0.5) {
        const zoomFactor = tf.randomUniform([], 0.8, 1.2);
        const newSize = tf.mul(tf.shape(augmented).slice([1, 3]), zoomFactor);
        augmented = tf.image.resizeBilinear(augmented, newSize);
        augmented = tf.image.resizeBilinear(augmented, [224, 224]);
      }
      
      if (Math.random() < 0.5) {
        augmented = tf.image.translate(augmented, [
          tf.randomUniform([], -20, 20),
          tf.randomUniform([], -20, 20)
        ]);
      }
      
      if (Math.random() < 0.5) {
        const brightnessDelta = tf.randomUniform([], -0.1, 0.1);
        augmented = tf.image.adjustBrightness(augmented, brightnessDelta);
      }
      
      return augmented;
    });
  }

  // TTA from currennt.py
  async performTTA(model, imageBuffer, steps = 5) {
    const allPredictions = [];
    
    for (let i = 0; i < steps; i++) {
      const preprocessedImage = this.preprocessImage(imageBuffer);
      const augmentedImage = i === 0 ? preprocessedImage : this.applyDataAugmentation(preprocessedImage);
      const prediction = await model.predict(augmentedImage);
      allPredictions.push(prediction.arraySync()[0]);
    }
    
    const avgPredictions = allPredictions[0].map((_, index) => {
      return allPredictions.reduce((sum, pred) => sum + pred[index], 0) / steps;
    });
    
    return tf.tensor2d([avgPredictions]);
  }

  // Apply threshold balancing from currennt.py
  applyThresholdBalancing(predictions) {
    const probabilities = predictions.arraySync()[0];
    console.log('🔍 Original probabilities:', probabilities.map((p, i) => `${this.CLASS_LABELS[i]}: ${(p*100).toFixed(2)}%`));
    console.log('⚖️  Threshold multipliers:', this.THRESHOLD_MULTIPLIERS);
    
    // Apply multipliers to ALL classes
    probabilities[0] *= this.THRESHOLD_MULTIPLIERS[0]; // ALL boost
    probabilities[1] *= this.THRESHOLD_MULTIPLIERS[1]; // AML boost
    probabilities[2] *= this.THRESHOLD_MULTIPLIERS[2]; // CLL neutral
    probabilities[3] *= this.THRESHOLD_MULTIPLIERS[3]; // CML suppress
    probabilities[4] *= this.THRESHOLD_MULTIPLIERS[4]; // Healthy slight boost
    
    console.log('⚖️  After threshold balancing:', probabilities.map((p, i) => `${this.CLASS_LABELS[i]}: ${(p*100).toFixed(2)}%`));
    console.log('🎯 Max probability class:', this.CLASS_LABELS[probabilities.indexOf(Math.max(...probabilities))]);
    
    return probabilities;
  }

  // Calculate final prediction
  calculateFinalPrediction(balancedProbs, modelName, method = 'standard') {
    const finalClassIdx = balancedProbs.indexOf(Math.max(...balancedProbs));
    const confidence = (Math.max(...balancedProbs) / balancedProbs.reduce((a, b) => a + b, 0)) * 100;
    
    return {
      prediction: this.CLASS_LABELS[finalClassIdx],
      confidence: confidence.toFixed(2),
      probabilities: this.CLASS_LABELS.map((label, index) => ({
        class: label,
        probability: (balancedProbs[index] * 100).toFixed(2)
      })),
      model: {
        name: modelName,
        accuracy: this.MODEL_CONFIGS[modelName]?.accuracy || 'Unknown'
      },
      method: method
    };
  }

  // Main prediction methods
  async predictStandard(imageBuffer, modelKey = 'ensemble') {
    console.log(`🔮 Starting ensemble prediction using all models...`);
    if (!this.isInitialized) await this.initialize();
    if (!this.models || Object.keys(this.models).length === 0) {
      console.error('❌ No models available for ensemble prediction');
      throw new Error('No models available for ensemble prediction');
    }

    console.log(`✅ Using ensemble of ${Object.keys(this.models).length} models`);
    
    try {
      // Collect predictions from all available models
      const modelPredictions = [];
      const modelKeys = Object.keys(this.models);
      
      for (const modelKey of modelKeys) {
        console.log(`🔮 Getting prediction from ${modelKey} model...`);
        
        // Create unique temp file for each model
        const tempImagePath = `/tmp/prediction_${modelKey}_${Date.now()}.jpg`;
        fs.writeFileSync(tempImagePath, imageBuffer);
        
        // Call Python prediction script with heatmap generation
        const { spawn } = require('child_process');
        const datasetPath = this.pathManager.basePaths.dataset;
        const pythonArgs = [
          '/mnt/e/fyp/leuko/leuko/backend/predict_with_heatmap.py',
          this.models[modelKey].path,
          tempImagePath
        ];
        
        // Add dataset path if available for SHAP
        if (datasetPath && fs.existsSync(datasetPath)) {
          pythonArgs.push(datasetPath);
        }
        
        const python = spawn('python3', pythonArgs);
        
        let result = '';
        let error = '';
        
        python.stdout.on('data', (data) => {
          result += data.toString();
        });
        
        python.stderr.on('data', (data) => {
          const errorData = data.toString();
          error += errorData;
          console.log(`🐍 Python stderr [${modelKey}]:`, errorData);
        });
        
        const predictionResult = await new Promise((resolve, reject) => {
          python.on('close', (code) => {
            if (code !== 0) {
              reject(new Error(`Python script failed: ${error}`));
              return;
            }
            
            try {
              const parsed = JSON.parse(result);
              if (parsed.error) {
                reject(new Error(parsed.error));
                return;
              }
              
              modelPredictions.push({
                model: this.models[modelKey].name,
                prediction: parsed.prediction,
                confidence: parsed.confidence,
                probabilities: parsed.probabilities,
                heatmapData: parsed.heatmapData || null,
                hasHeatmap: parsed.hasGradCAM || false
              });
              
              console.log(`✅ ${modelKey} prediction completed:`, parsed.prediction);
              console.log(`🔥 Heatmap data for ${modelKey}:`, parsed.heatmapData ? 'Present' : 'None');
              if (parsed.heatmapData) {
                console.log(`🎯 Grad-CAM URL length:`, parsed.heatmapData.gradCamUrl?.length || 0);
              }
            } catch (e) {
              reject(new Error(`Failed to parse Python result: ${e.message}`));
            }
            
            resolve();
          });
        });
        
        // Clean up temp file
        fs.unlinkSync(tempImagePath);
      }
      
      // Ensemble voting - weighted average of all predictions
      const classVotes = {};
      const classConfidences = {};
      
      // Initialize vote tracking
      for (const className of this.CLASS_LABELS) {
        classVotes[className] = 0;
        classConfidences[className] = 0;
      }
      
      // Tally votes and confidences
      for (const prediction of modelPredictions) {
        const predictedClass = prediction.prediction;
        classVotes[predictedClass] += 1;
        classConfidences[predictedClass] += prediction.confidence;
      }
      
      // Find class with highest votes
      let finalPrediction = this.CLASS_LABELS[0];
      let maxVotes = 0;
      
      for (const className of this.CLASS_LABELS) {
        if (classVotes[className] > maxVotes) {
          maxVotes = classVotes[className];
          finalPrediction = className;
        }
      }
      
      // If tie, use highest average confidence
      const tiedClasses = this.CLASS_LABELS.filter(cls => classVotes[cls] === maxVotes);
      if (tiedClasses.length > 1) {
        let maxConfidence = 0;
        for (const cls of tiedClasses) {
          if (classConfidences[cls] > maxConfidence) {
            maxConfidence = classConfidences[cls];
            finalPrediction = cls;
          }
        }
      }
      
      // Calculate average confidence for final prediction
      const avgConfidence = classConfidences[finalPrediction] / classVotes[finalPrediction];
      
      // Find the best model for heatmap (highest confidence)
      const bestModelPrediction = modelPredictions.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      console.log(`🗳️ Ensemble results:`);
      console.log(`  Votes:`, classVotes);
      console.log(`  Final prediction: ${finalPrediction}`);
      console.log(`  Average confidence: ${avgConfidence.toFixed(2)}%`);
      console.log(`  Best model for heatmap: ${bestModelPrediction.model}`);
      
      return {
        prediction: finalPrediction,
        confidence: avgConfidence,
        probabilities: this.CLASS_LABELS.map(label => ({
          class: label,
          probability: classVotes[label] > 0 ? (classConfidences[label] / classVotes[label]) * 100 : 0
        })),
        model: {
          name: 'Ensemble Model',
          accuracy: 'Combined',
          description: `Ensemble of ${modelKeys.length} models with ${maxVotes} votes`
        },
        method: 'ensemble',
        ensembleDetails: {
          models: modelPredictions,
          votes: classVotes,
          tieBreaker: tiedClasses.length > 1 ? 'confidence' : 'majority'
        },
        heatmapData: bestModelPrediction.heatmapData,
        hasHeatmap: bestModelPrediction.hasHeatmap
      };
      
    } catch (error) {
      console.error('❌ Ensemble prediction failed:', error);
      throw error;
    }
  }

  async predictTTA(imageBuffer, modelKey = 'primary') {
    if (!this.isInitialized) await this.initialize();
    if (!this.models[modelKey]) throw new Error(`Model ${modelKey} not available`);

    const predictions = await this.performTTA(this.models[modelKey], imageBuffer, 5);
    const balancedProbs = this.applyThresholdBalancing(predictions);
    
    return this.calculateFinalPrediction(balancedProbs, modelKey, 'TTA');
  }

  async predictEnsemble(imageBuffer, useTTA = false) {
    if (!this.isInitialized) await this.initialize();

    const availableModels = Object.keys(this.models);
    if (availableModels.length === 0) throw new Error('No models available for ensemble');

    const predictions = [];
    
    for (const modelKey of availableModels) {
      try {
        const result = useTTA ? 
          await this.predictTTA(imageBuffer, modelKey) : 
          await this.predictStandard(imageBuffer, modelKey);
        predictions.push(result);
      } catch (error) {
        console.warn(`Failed to get prediction from ${modelKey}:`, error.message);
      }
    }

    if (predictions.length === 0) throw new Error('All models failed to predict');

    // Ensemble averaging
    const avgProbabilities = this.CLASS_LABELS.map((label, index) => {
      const sum = predictions.reduce((acc, pred) => 
        acc + parseFloat(pred.probabilities[index].probability), 0
      );
      return {
        class: label,
        probability: (sum / predictions.length).toFixed(2)
      };
    });

    const finalPrediction = avgProbabilities.reduce((max, current) => 
      parseFloat(current.probability) > parseFloat(max.probability) ? current : max
    );

    return {
      prediction: finalPrediction.class,
      confidence: finalPrediction.probability,
      probabilities: avgProbabilities,
      method: 'ensemble',
      modelsUsed: predictions.map(p => p.model.name),
      ensembleSize: predictions.length
    };
  }

  // Comparative analysis (currennt.py style)
  async performComparativeAnalysis(imageBuffer) {
    if (!this.isInitialized) await this.initialize();

    const results = {};
    const availableModels = Object.keys(this.models);

    // Standard predictions
    for (const modelKey of availableModels) {
      try {
        results[`${modelKey}_standard`] = await this.predictStandard(imageBuffer, modelKey);
      } catch (error) {
        results[`${modelKey}_standard`] = { error: error.message };
      }
    }

    // TTA predictions
    for (const modelKey of availableModels) {
      try {
        results[`${modelKey}_tta`] = await this.predictTTA(imageBuffer, modelKey);
      } catch (error) {
        results[`${modelKey}_tta`] = { error: error.message };
      }
    }

    // Ensemble prediction
    try {
      results.ensemble_standard = await this.predictEnsemble(imageBuffer, false);
      results.ensemble_tta = await this.predictEnsemble(imageBuffer, true);
    } catch (error) {
      results.ensemble = { error: error.message };
    }

    return {
      comparison: results,
      summary: {
        totalModels: availableModels.length,
        successfulPredictions: Object.values(results).filter(r => !r.error).length,
        bestAccuracy: '81%',
        recommendedMethod: 'TTA + Ensemble'
      }
    };
  }

  
  // Service information
  getAllModels() {
    return Object.entries(this.MODEL_CONFIGS).map(([key, config]) => ({
      key,
      ...config,
      loaded: !!this.models[key],
      available: this.models[key] ? true : false
    }));
  }

  getConfiguration() {
    return {
      service: 'ML Integration Service',
      environment: this.pathManager.isWSL ? 'WSL' : 'Windows',
      models: this.getAllModels(),
      classLabels: this.CLASS_LABELS,
      features: {
        focalLoss: true,
        thresholdBalancing: true,
        tta: true,
        dataAugmentation: true,
        ensemble: true,
        comparativeAnalysis: true
      },
      currenntIntegration: {
        thresholdMultipliers: this.THRESHOLD_MULTIPLIERS,
        customWeights: this.CUSTOM_WEIGHTS,
        ttaSteps: 5,
        accuracy: {
          standard: '78%',
          optimized: '81%',
          improvement: '+3%'
        }
      }
    };
  }

  async healthCheck() {
    return {
      initialized: this.isInitialized,
      service: 'ML Integration Service',
      environment: this.pathManager.isWSL ? 'WSL' : 'Windows',
      loadedModels: Object.keys(this.models),
      availableModels: this.getAllModels(),
      configuration: this.getConfiguration()
    };
  }
}

// Export singleton instance
module.exports = new MLIntegrationService();
