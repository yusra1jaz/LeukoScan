const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES } = require('../config');

// Authentication utilities
function setTokenCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  return token;
}

function generateResetToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

// Location utilities
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function geocodeWithNominatim(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '1');

  const r = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'LeukoScan/1.0 (hospital-locator)',
      'Accept': 'application/json'
    }
  });
  if (!r.ok) throw new Error(`Geocoding failed (${r.status})`);
  const data = await r.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return {
    name: data[0].display_name,
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon)
  };
}

async function searchHospitalsOverpass(lat, lon, radiusMeters) {
  const overpassUrl = 'https://overpass-api.de/api/interpreter';

  const q = `[out:json][timeout:25];
(
  node(around:${radiusMeters},${lat},${lon})["amenity"="hospital"];
  way(around:${radiusMeters},${lat},${lon})["amenity"="hospital"];
  relation(around:${radiusMeters},${lat},${lon})["amenity"="hospital"];
  node(around:${radiusMeters},${lat},${lon})["healthcare"~"hospital|clinic|centre"];
  way(around:${radiusMeters},${lat},${lon})["healthcare"~"hospital|clinic|centre"];
  relation(around:${radiusMeters},${lat},${lon})["healthcare"~"hospital|clinic|centre"];
  node(around:${radiusMeters},${lat},${lon})["amenity"="clinic"];
  way(around:${radiusMeters},${lat},${lon})["amenity"="clinic"];
  relation(around:${radiusMeters},${lat},${lon})["amenity"="clinic"];
);
out center tags;`;

  let elements = [];
  try {
    const r = await fetch(overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'LeukoScan/1.0 (hospital-locator)',
        'Accept': 'application/json'
      },
      body: `data=${encodeURIComponent(q)}`
    });
    
    if (!r.ok) {
      const errorText = await r.text();
      console.error(`[Overpass] HTTP ${r.status}: ${errorText.slice(0, 200)}`);
      throw new Error(`Overpass API failed with status ${r.status}`);
    }
    
    const data = await r.json();
    
    if (data.error) {
      console.error(`[Overpass] API error:`, data.error);
      throw new Error(`Overpass API error: ${data.error}`);
    }
    
    elements = Array.isArray(data?.elements) ? data.elements : [];
  } catch (fetchError) {
    console.error('[Overpass] Fetch error:', fetchError.message);
    return [];
  }

  const keywordRegex = /\b(oncology|hematology|haematology|cancer|blood|leukemia|leukaemia|chemo|chemotherapy|transplant|onco|hemato)\b/i;

  const hospitals = elements
    .map((el) => {
      const t = el.tags || {};
      const name = t.name || t['operator'] || 'Hospital/Clinic';
      const elLat = typeof el.lat === 'number' ? el.lat : el.center?.lat;
      const elLon = typeof el.lon === 'number' ? el.lon : el.center?.lon;
      if (typeof elLat !== 'number' || typeof elLon !== 'number') return null;

      const isHospital = t['amenity'] === 'hospital' || t['healthcare'] === 'hospital';
      const isClinic = t['amenity'] === 'clinic' || t['healthcare'] === 'clinic';
      
      if (t['healthcare'] === 'doctor' && !isHospital && !isClinic) {
        return null;
      }

      const addressParts = [
        t['addr:housenumber'],
        t['addr:street'],
        t['addr:city'],
        t['addr:state'],
        t['addr:postcode'],
        t['addr:country']
      ].filter(Boolean);
      const address = addressParts.length ? addressParts.join(', ') : (t['addr:full'] || t['contact:address'] || '');

      const specialtiesRaw = [
        t.healthcare,
        t['healthcare:speciality'],
        t['healthcare:specialty'],
        t.speciality,
        t.specialty
      ].filter(Boolean);
      const specialties = specialtiesRaw.length ? Array.from(new Set(specialtiesRaw.join(',').split(',').map(s => s.trim()).filter(Boolean))) : [];

      const textBlob = `${name} ${address} ${specialties.join(' ')} ${JSON.stringify(t)}`;
      const isRelevant = keywordRegex.test(textBlob);

      return {
        id: `${el.type}_${el.id}`,
        name,
        address: address || t['addr:full'] || t['contact:address'] || 'Address not available',
        phone: t['contact:phone'] || t.phone,
        website: t['contact:website'] || t.website,
        openHours: t.opening_hours,
        emergency: t.emergency === 'yes' || isHospital,
        specialties,
        lat: elLat,
        lon: elLon,
        _relevant: isRelevant,
        _isHospital: isHospital,
        _isClinic: isClinic
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a._relevant !== b._relevant) return b._relevant ? 1 : -1;
      if (a._isHospital !== b._isHospital) return a._isHospital ? -1 : 1;
      if (a._isClinic !== b._isClinic) return a._isClinic ? -1 : 1;
      return 0;
    });

  return hospitals;
}

// Chat utilities
function getChatHistory(db, chatId, callback) {
  db.all(
    'SELECT sender, text FROM messages WHERE chat_id = ? ORDER BY timestamp ASC LIMIT 20',
    [chatId],
    (err, rows) => {
      if (err) return callback(err, null);
      const messages = rows.map(row => ({
        role: row.sender === 'user' ? 'user' : 'assistant',
        content: row.text
      }));
      callback(null, messages);
    }
  );
}

// Fallback response generator
function generateFallbackResponse(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('type') || lowerPrompt.includes('kind') || lowerPrompt.includes('what type')) {
    return `Leukemia is classified into several main types:

**Acute Lymphoblastic Leukemia (ALL)**: Most common in children, progresses quickly, affects lymphoid cells.

**Acute Myeloid Leukemia (AML)**: Can occur in adults and children, affects myeloid cells, progresses rapidly.

**Chronic Lymphocytic Leukemia (CLL)**: Most common in adults, progresses slowly, affects lymphocytes.

**Chronic Myeloid Leukemia (CML)**: Usually affects adults, progresses slowly initially, involves a genetic abnormality called the Philadelphia chromosome.

Each type has different characteristics, treatment approaches, and prognoses. Would you like to know more about a specific type?`;
  }
  
  if (lowerPrompt.includes('what is') || lowerPrompt.includes('define') || lowerPrompt.includes('leukemia')) {
    return `Leukemia is a type of cancer that affects the blood and bone marrow. It occurs when the body produces too many abnormal white blood cells, which crowd out healthy blood cells.

**Key points:**
- Leukemia starts in the bone marrow where blood cells are made
- It causes an overproduction of abnormal white blood cells
- These abnormal cells don't function properly and can interfere with normal blood cell production
- There are several types, classified as either acute (fast-growing) or chronic (slow-growing)
- Treatment depends on the type, age, and overall health

Would you like to know more about symptoms, diagnosis, or treatment options?`;
  }
  
  if (lowerPrompt.includes('symptom') || lowerPrompt.includes('sign')) {
    return `Common symptoms of leukemia can include:

**Physical symptoms:**
- Fatigue and weakness
- Frequent infections
- Fever or chills
- Easy bruising or bleeding
- Petechiae (small red spots under the skin)
- Swollen lymph nodes
- Enlarged liver or spleen
- Bone or joint pain
- Unintended weight loss
- Night sweats

**Important note:** These symptoms can also be caused by other conditions. If you're experiencing persistent symptoms, please consult with a healthcare professional for proper evaluation and diagnosis.`;
  }
  
  if (lowerPrompt.includes('treat') || lowerPrompt.includes('therapy') || lowerPrompt.includes('medication')) {
    return `Treatment for leukemia depends on the type, stage, and individual factors. Common treatment options include:

**Chemotherapy**: Uses drugs to kill cancer cells, often the primary treatment.

**Targeted Therapy**: Drugs that target specific molecules involved in cancer cell growth.

**Immunotherapy**: Helps the immune system fight cancer cells.

**Radiation Therapy**: Uses high-energy radiation to kill cancer cells.

**Stem Cell Transplant**: Replaces diseased bone marrow with healthy stem cells.

**Clinical Trials**: Experimental treatments that may offer new options.

Treatment plans are personalized based on the specific type of leukemia, patient age, overall health, and other factors. It's important to discuss all options with your healthcare team.`;
  }
  
  if (lowerPrompt.includes('medication') || lowerPrompt.includes('drug') || lowerPrompt.includes('medicine')) {
    return `Common medications used in leukemia treatment include:

**Chemotherapy drugs**: Such as cytarabine, daunorubicin, vincristine, and others depending on the leukemia type.

**Targeted therapy drugs**: Like imatinib (for CML), rituximab (for certain types), and newer targeted agents.

**Immunotherapy**: Including CAR-T cell therapy and monoclonal antibodies.

**Supportive medications**: To manage side effects, prevent infections, and support blood cell production.

**Important**: Medication choices depend on the specific type of leukemia, treatment phase, and individual patient factors. Always follow your doctor's prescribed treatment plan and discuss any concerns with your healthcare team.`;
  }
  
  return `I'm here to help you understand leukemia. I can provide information about:
- Types of leukemia (ALL, AML, CLL, CML)
- Symptoms and diagnosis
- Treatment options
- Medications
- Living with leukemia
- Questions to ask your doctor

Could you be more specific about what you'd like to know? For example, you could ask "What are the types of leukemia?" or "What are common symptoms?"`;
}

module.exports = {
  setTokenCookie,
  generateResetToken,
  haversineKm,
  geocodeWithNominatim,
  searchHospitalsOverpass,
  getChatHistory,
  generateFallbackResponse
};
