const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

// Load medications from local JSON file (Hybrid Approach)
const loadMedications = () => {
  try {
    const medicationsPath = path.join(__dirname, '../data/medications.json');
    const jsonData = fs.readFileSync(medicationsPath, 'utf8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error loading medications data:', error);
    return [];
  }
};

const getLeukemiaMedications = (req, res) => {
  try {
    // Load medications from our curated JSON file
    const medications = loadMedications();
    
    // Filter for leukemia medications (all our data is leukemia-related)
    const leukemiaMedications = medications.filter(med => 
      med.type && med.type.length > 0 && 
      med.fdaApproved === true
    );

    res.json({
      success: true,
      data: leukemiaMedications,
      total: leukemiaMedications.length,
      source: 'Hybrid Approach - Curated FDA-approved data',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error serving medications:', error);
    
    // Return fallback data if JSON loading fails
    const fallbackMedications = [
      {
        id: 'fallback-1',
        name: 'Imatinib (Gleevec)',
        genericName: 'Imatinib mesylate',
        brandNames: ['Gleevec', 'Glivec'],
        type: ['CML'],
        dosage: '400mg orally once daily for chronic phase CML',
        sideEffects: ['Fluid retention', 'Muscle cramps', 'Fatigue', 'Nausea'],
        alternatives: ['Dasatinib', 'Nilotinib', 'Bosutinib', 'Ponatinib', 'Asciminib'],
        description: 'First-generation tyrosine kinase inhibitor for CML treatment',
        contraindications: ['Pregnancy (Category D)', 'Known hypersensitivity'],
        monitoring: ['Complete blood count weekly', 'Liver function tests monthly'],
        administration: 'Take with food and large glass of water',
        storage: 'Store at room temperature 20-25°C (68-77°F)',
        drugClass: 'Tyrosine Kinase Inhibitor (TKI)',
        fdaApproved: true,
        pregnancyCategory: 'D'
      }
    ];

    res.json({
      success: true,
      data: fallbackMedications,
      total: fallbackMedications.length,
      note: 'Using fallback data due to file loading error'
    });
  }
};

router.get('/leukemia', getLeukemiaMedications);

module.exports = router;
