const express = require('express');
const { haversineKm, geocodeWithNominatim, searchHospitalsOverpass } = require('../utils/helpers');
const router = express.Router();

// Returns hospitals/clinics in a city (prioritizing oncology/hematology keywords)
router.get('/hospitals', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const radiusKm = 25; // Fixed radius for city searches

    if (!q) return res.status(400).json({ message: 'Missing query parameter: q' });

    console.log(`[Hospitals] Geocoding city: ${q}`);
    const geo = await geocodeWithNominatim(q);
    if (!geo) {
      console.log(`[Hospitals] City not found: ${q}`);
      return res.status(404).json({ message: 'City not found. Try a different city name.' });
    }
    console.log(`[Hospitals] Found city: ${geo.name} (${geo.lat}, ${geo.lon})`);

    const radiusMeters = Math.round(radiusKm * 1000);
    console.log(`[Hospitals] Searching hospitals within ${radiusKm}km (${radiusMeters}m)`);
    const rawHospitals = await searchHospitalsOverpass(geo.lat, geo.lon, radiusMeters);
    console.log(`[Hospitals] Found ${rawHospitals.length} facilities`);

    const hospitals = rawHospitals
      .map((h) => ({
        ...h,
        distanceKm: haversineKm(geo.lat, geo.lon, h.lat, h.lon)
      }))
      .sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9))
      .slice(0, 50);

    console.log(`[Hospitals] Returning ${hospitals.length} hospitals`);
    res.json({
      location: { name: geo.name, lat: geo.lat, lon: geo.lon, radiusKm },
      hospitals
    });
  } catch (e) {
    console.error('[Hospitals] Error:', e.message);
    console.error('[Hospitals] Stack:', e.stack);
    res.status(500).json({ 
      message: 'Unable to load hospitals right now. Please try again.',
      error: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
});

module.exports = router;
