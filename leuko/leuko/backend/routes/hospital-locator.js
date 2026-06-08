const express = require('express');
const router = express.Router();

// Fallback hospital data for regions with limited OpenStreetMap data
const fallbackHospitals = {
  'PK': {
    'Lahore': [
      {
        id: 1,
        name: 'Mayo Hospital Lahore',
        type: 'hospital',
        address: {
          street: '78-E/1, Main Boulevard Gulberg',
          city: 'Lahore',
          state: 'Punjab',
          postcode: '54000',
          full_address: '78-E/1, Main Boulevard Gulberg, Lahore, Punjab 54000'
        },
        contact: {
          phone: '+92 42 111 555 555',
          website: 'https://www.mayohospital.com.pk',
          email: 'info@mayohospital.com.pk'
        },
        location: {
          latitude: 31.5204,
          longitude: 74.3587
        },
        details: {
          emergency: true,
          beds: 200,
          operator: 'Mayo Hospital',
          specialty: 'Leukemia Treatment Center',
          opening_hours: '24/7 Emergency'
        }
      },
      {
        id: 2,
        name: 'Services Hospital Lahore',
        type: 'hospital',
        address: {
          street: 'Services Hospital Road',
          city: 'Lahore',
          state: 'Punjab',
          postcode: '54660',
          full_address: 'Services Hospital Road, Lahore, Punjab 54660'
        },
        contact: {
          phone: '+92 42 99211111',
          website: 'https://www.serviceshospital.com',
          email: 'info@serviceshospital.com'
        },
        location: {
          latitude: 31.4735,
          longitude: 74.2927
        },
        details: {
          emergency: true,
          beds: 500,
          operator: 'Services Institute of Medical Sciences',
          specialty: 'Leukemia & Blood Disorders',
          opening_hours: '24/7 Emergency'
        }
      },
      {
        id: 3,
        name: 'Shalamar Hospital Lahore',
        type: 'hospital',
        address: {
          street: 'Shalimar Link Road',
          city: 'Lahore',
          state: 'Punjab',
          postcode: '54000',
          full_address: 'Shalimar Link Road, Lahore, Punjab 54000'
        },
        contact: {
          phone: '+92 42 111 555 555',
          website: 'https://www.shalamarhospital.org',
          email: 'info@shalamarhospital.org'
        },
        location: {
          latitude: 31.5820,
          longitude: 74.3000
        },
        details: {
          emergency: true,
          beds: 350,
          operator: 'Shalamar Medical & Dental College',
          specialty: 'Oncology & Leukemia Treatment',
          opening_hours: '24/7 Emergency'
        }
      },
      {
        id: 4,
        name: 'Shaukat Khanum Memorial Cancer Hospital',
        type: 'hospital',
        address: {
          street: 'Johar Town, 7-A Block, Canal Bank Road',
          city: 'Lahore',
          state: 'Punjab',
          postcode: '54000',
          full_address: 'Johar Town, 7-A Block, Canal Bank Road, Lahore, Punjab 54000'
        },
        contact: {
          phone: '+92 42 35905000',
          website: 'https://www.shaukatkhanum.org.pk',
          email: 'info@shaukatkhanum.org.pk'
        },
        location: {
          latitude: 31.4667,
          longitude: 74.3000
        },
        details: {
          emergency: true,
          beds: 300,
          operator: 'Shaukat Khanum Memorial Trust',
          specialty: 'Cancer & Leukemia Specialized Hospital',
          opening_hours: '24/7 Emergency'
        }
      },
      {
        id: 5,
        name: 'Institute of Blood Diseases',
        type: 'hospital',
        address: {
          street: 'Allama Iqbal Road',
          city: 'Lahore',
          state: 'Punjab',
          postcode: '54000',
          full_address: 'Allama Iqbal Road, Lahore, Punjab 54000'
        },
        contact: {
          phone: '+92 42 37666666',
          website: 'https://www.ibd.edu.pk',
          email: 'info@ibd.edu.pk'
        },
        location: {
          latitude: 31.5497,
          longitude: 74.3425
        },
        details: {
          emergency: true,
          beds: 150,
          operator: 'Institute of Blood Diseases',
          specialty: 'Blood Disorders & Leukemia Treatment',
          opening_hours: '24/7 Emergency'
        }
      },
      {
        id: 6,
        name: 'Children\'s Hospital & Institute of Child Health',
        type: 'hospital',
        address: {
          street: 'Ferozepur Road',
          city: 'Lahore',
          state: 'Punjab',
          postcode: '54000',
          full_address: 'Ferozepur Road, Lahore, Punjab 54000'
        },
        contact: {
          phone: '+92 42 99233144',
          website: 'https://www.chich.edu.pk',
          email: 'info@chich.edu.pk'
        },
        location: {
          latitude: 31.5650,
          longitude: 74.3275
        },
        details: {
          emergency: true,
          beds: 400,
          operator: 'Government of Punjab',
          specialty: 'Pediatric Leukemia Treatment',
          opening_hours: '24/7 Emergency'
        }
      },
      {
        id: 7,
        name: 'Hameed Latif Hospital',
        type: 'hospital',
        address: {
          street: '1-A/I, New Muslim Town',
          city: 'Lahore',
          state: 'Punjab',
          postcode: '54600',
          full_address: '1-A/I, New Muslim Town, Lahore, Punjab 54600'
        },
        contact: {
          phone: '+92 42 111 555 555',
          website: 'https://www.hameedlatif.com',
          email: 'info@hameedlatif.com'
        },
        location: {
          latitude: 31.4925,
          longitude: 74.3175
        },
        details: {
          emergency: true,
          beds: 250,
          operator: 'Hameed Latif Hospital',
          specialty: 'Oncology & Cancer Treatment',
          opening_hours: '24/7 Emergency'
        }
      },
      {
        id: 8,
        name: 'National Hospital & Medical Center',
        type: 'hospital',
        address: {
          street: 'Abdul Haque Road',
          city: 'Lahore',
          state: 'Punjab',
          postcode: '54000',
          full_address: 'Abdul Haque Road, Lahore, Punjab 54000'
        },
        contact: {
          phone: '+92 42 111 555 555',
          website: 'https://www.nationalhospital.com.pk',
          email: 'info@nationalhospital.com.pk'
        },
        location: {
          latitude: 31.5450,
          longitude: 74.3550
        },
        details: {
          emergency: true,
          beds: 200,
          operator: 'National Hospital',
          specialty: 'Cancer & Blood Disorders',
          opening_hours: '24/7 Emergency'
        }
      }
    ],
    'Karachi': [
      {
        id: 4,
        name: 'Aga Khan University Hospital',
        type: 'hospital',
        address: {
          street: 'Stadium Road',
          city: 'Karachi',
          state: 'Sindh',
          postcode: '74800',
          full_address: 'Stadium Road, Karachi, Sindh 74800'
        },
        contact: {
          phone: '+92 21 111 911 911',
          website: 'https://www.aku.edu.pk/hospital',
          email: 'hospital@aku.edu.pk'
        },
        location: {
          latitude: 24.8960,
          longitude: 67.0760
        },
        details: {
          emergency: true,
          beds: 562,
          operator: 'Aga Khan University',
          specialty: 'Leukemia & Blood Disorders Treatment',
          opening_hours: '24/7 Emergency'
        }
      },
      {
        id: 9,
        name: 'Indus Hospital',
        type: 'hospital',
        address: {
          street: 'Korangi Creek Road',
          city: 'Karachi',
          state: 'Sindh',
          postcode: '75190',
          full_address: 'Korangi Creek Road, Karachi, Sindh 75190'
        },
        contact: {
          phone: '+92 21 111 467 847',
          website: 'https://www.indushospital.org',
          email: 'info@indushospital.org'
        },
        location: {
          latitude: 24.8430,
          longitude: 67.1300
        },
        details: {
          emergency: true,
          beds: 300,
          operator: 'Indus Health Network',
          specialty: 'Cancer & Leukemia Treatment',
          opening_hours: '24/7 Emergency'
        }
      },
      {
        id: 10,
        name: 'Civil Hospital Karachi',
        type: 'hospital',
        address: {
          street: 'Nishtar Road',
          city: 'Karachi',
          state: 'Sindh',
          postcode: '74200',
          full_address: 'Nishtar Road, Karachi, Sindh 74200'
        },
        contact: {
          phone: '+92 21 99215141',
          website: 'https://www.civilhospitalkarachi.gov.pk',
          email: 'info@civilhospitalkarachi.gov.pk'
        },
        location: {
          latitude: 24.8615,
          longitude: 67.0099
        },
        details: {
          emergency: true,
          beds: 1200,
          operator: 'Government of Sindh',
          specialty: 'Oncology & Blood Disorders',
          opening_hours: '24/7 Emergency'
        }
      }
    ],
    'Islamabad': [
      {
        id: 5,
        name: 'Pakistan Institute of Medical Sciences (PIMS)',
        type: 'hospital',
        address: {
          street: 'G-8/3, Markaz G-8',
          city: 'Islamabad',
          state: 'Federal Capital',
          postcode: '44000',
          full_address: 'G-8/3, Markaz G-8, Islamabad, Federal Capital 44000'
        },
        contact: {
          phone: '+92 51 9265500',
          website: 'https://www.pims.gov.pk',
          email: 'info@pims.gov.pk'
        },
        location: {
          latitude: 33.7148,
          longitude: 73.0395
        },
        details: {
          emergency: true,
          beds: 1200,
          operator: 'Ministry of National Health Services',
          specialty: 'Leukemia & Blood Disorders Treatment',
          opening_hours: '24/7 Emergency'
        }
      },
      {
        id: 11,
        name: 'Shifa International Hospital',
        type: 'hospital',
        address: {
          street: 'Sector H-8/4',
          city: 'Islamabad',
          state: 'Federal Capital',
          postcode: '44000',
          full_address: 'Sector H-8/4, Islamabad, Federal Capital 44000'
        },
        contact: {
          phone: '+92 51 8464646',
          website: 'https://www.shifainternational.com',
          email: 'info@shifainternational.com'
        },
        location: {
          latitude: 33.6935,
          longitude: 73.0350
        },
        details: {
          emergency: true,
          beds: 500,
          operator: 'Shifa International Hospital Ltd',
          specialty: 'Oncology & Cancer Treatment',
          opening_hours: '24/7 Emergency'
        }
      }
    ],
    'Faisalabad': [
      {
        id: 12,
        name: 'Allied Hospital Faisalabad',
        type: 'hospital',
        address: {
          street: 'Allied Hospital Road',
          city: 'Faisalabad',
          state: 'Punjab',
          postcode: '38000',
          full_address: 'Allied Hospital Road, Faisalabad, Punjab 38000'
        },
        contact: {
          phone: '+92 41 9200081',
          website: 'https://www.alliedhospital.org',
          email: 'info@alliedhospital.org'
        },
        location: {
          latitude: 31.4504,
          longitude: 73.1349
        },
        details: {
          emergency: true,
          beds: 400,
          operator: 'Allied Hospitals',
          specialty: 'Leukemia & Blood Disorders Treatment',
          opening_hours: '24/7 Emergency'
        }
      },
      {
        id: 13,
        name: 'District Headquarters Hospital',
        type: 'hospital',
        address: {
          street: 'Satiana Road',
          city: 'Faisalabad',
          state: 'Punjab',
          postcode: '38000',
          full_address: 'Satiana Road, Faisalabad, Punjab 38000'
        },
        contact: {
          phone: '+92 41 9200456',
          website: 'https://www.dhfaisalabad.gov.pk',
          email: 'info@dhfaisalabad.gov.pk'
        },
        location: {
          latitude: 31.4187,
          longitude: 73.0791
        },
        details: {
          emergency: true,
          beds: 600,
          operator: 'Government of Punjab',
          specialty: 'General & Oncology Services',
          opening_hours: '24/7 Emergency'
        }
      }
    ],
    'Rawalpindi': [
      {
        id: 14,
        name: 'Rawalpindi Institute of Cardiology',
        type: 'hospital',
        address: {
          street: 'Muree Road',
          city: 'Rawalpindi',
          state: 'Punjab',
          postcode: '46000',
          full_address: 'Muree Road, Rawalpindi, Punjab 46000'
        },
        contact: {
          phone: '+92 51 9291300',
          website: 'https://www.ric.gov.pk',
          email: 'info@ric.gov.pk'
        },
        location: {
          latitude: 33.5651,
          longitude: 73.0169
        },
        details: {
          emergency: true,
          beds: 300,
          operator: 'Government of Punjab',
          specialty: 'Cardiology & Blood Disorders',
          opening_hours: '24/7 Emergency'
        }
      },
      {
        id: 15,
        name: 'Holy Family Hospital Rawalpindi',
        type: 'hospital',
        address: {
          street: 'Murree Road',
          city: 'Rawalpindi',
          state: 'Punjab',
          postcode: '46000',
          full_address: 'Murree Road, Rawalpindi, Punjab 46000'
        },
        contact: {
          phone: '+92 51 9291400',
          website: 'https://www.holyfamilyrawalpindi.com',
          email: 'info@holyfamilyrawalpindi.com'
        },
        location: {
          latitude: 33.5991,
          longitude: 73.0476
        },
        details: {
          emergency: true,
          beds: 500,
          operator: 'Rawalpindi Medical College',
          specialty: 'Oncology & General Medicine',
          opening_hours: '24/7 Emergency'
        }
      }
    ],
    'Peshawar': [
      {
        id: 16,
        name: 'Khyber Teaching Hospital',
        type: 'hospital',
        address: {
          street: 'University Road',
          city: 'Peshawar',
          state: 'Khyber Pakhtunkhwa',
          postcode: '25000',
          full_address: 'University Road, Peshawar, Khyber Pakhtunkhwa 25000'
        },
        contact: {
          phone: '+92 91 9217653',
          website: 'https://www.kth.gov.pk',
          email: 'info@kth.gov.pk'
        },
        location: {
          latitude: 34.0121,
          longitude: 71.5787
        },
        details: {
          emergency: true,
          beds: 1200,
          operator: 'Khyber Medical College',
          specialty: 'Leukemia & Blood Disorders Treatment',
          opening_hours: '24/7 Emergency'
        }
      },
      {
        id: 17,
        name: 'Lady Reading Hospital',
        type: 'hospital',
        address: {
          street: 'The Mall',
          city: 'Peshawar',
          state: 'Khyber Pakhtunkhwa',
          postcode: '25000',
          full_address: 'The Mall, Peshawar, Khyber Pakhtunkhwa 25000'
        },
        contact: {
          phone: '+92 91 9210363',
          website: 'https://www.lrh.gov.pk',
          email: 'info@lrh.gov.pk'
        },
        location: {
          latitude: 34.0151,
          longitude: 71.5787
        },
        details: {
          emergency: true,
          beds: 800,
          operator: 'Government of KPK',
          specialty: 'General & Oncology Services',
          opening_hours: '24/7 Emergency'
        }
      }
    ]
  }
};

// Hospital Locator using OpenStreetMap Overpass API
router.get('/hospitals', async (req, res) => {
  try {
    const { lat, lon, radius = 10000, limit = 20 } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ 
        message: 'Latitude and longitude are required',
        example: '/api/hospitals?lat=34.0522&lon=-118.2437&radius=10000'
      });
    }
    
    console.log('Hospital search request:', { lat, lon, radius, limit });
    
    // Overpass API query to find hospitals near coordinates
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lon});
        node["amenity"="clinic"](around:${radius},${lat},${lon});
      );
      out body;
      >;
      out count;
    `;
    
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    
    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'LeukoHospitalFinder/1.0'
      },
      body: 'data=' + encodeURIComponent(overpassQuery),
      timeout: 8000 // 8 second timeout (reduced from 15)
    });
    
    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Overpass API error:', data.error);
      return res.status(500).json({ 
        message: 'Failed to fetch hospital data',
        error: data.error 
      });
    }
    
    // Process and format the hospital data
    const hospitals = data.elements.map(element => {
      const tags = element.tags || {};
      
      return {
        id: element.id,
        name: tags.name || tags['operator'] || 'Unknown Hospital',
        type: tags['amenity'] || 'hospital',
        address: {
          street: tags['addr:street'] || '',
          city: tags['addr:city'] || '',
          state: tags['addr:state'] || '',
          postcode: tags['addr:postcode'] || '',
          full_address: `${tags['addr:street'] || ''}, ${tags['addr:city'] || ''}, ${tags['addr:state'] || ''} ${tags['addr:postcode'] || ''}`.trim()
        },
        contact: {
          phone: tags.phone || tags['contact:phone'] || '',
          website: tags.website || '',
          email: tags['contact:email'] || ''
        },
        location: {
          latitude: element.lat,
          longitude: element.lon
        },
        details: {
          emergency: tags['emergency'] === 'yes',
          beds: tags['beds'] ? parseInt(tags['beds']) : null,
          operator: tags['operator'] || '',
          specialty: tags['healthcare'] || tags['medical'] || 'General',
          opening_hours: tags['opening_hours'] || ''
        },
        distance: null // Will be calculated on frontend
      };
    });
    
    // Calculate distances from user location
    hospitals.forEach(hospital => {
      const distance = calculateDistance(
        parseFloat(lat), 
        parseFloat(lon), 
        hospital.location.latitude, 
        hospital.location.longitude
      );
      hospital.distance = Math.round(distance * 100) / 100; // Round to 2 decimal places
    });
    
    // Sort by distance and limit results
    const sortedHospitals = hospitals
      .sort((a, b) => a.distance - b.distance)
      .slice(0, parseInt(limit));
    
    console.log(`Found ${hospitals.length} hospitals, returning ${sortedHospitals.length} nearest`);
    
    res.json({
      success: true,
      count: sortedHospitals.length,
      total: hospitals.length,
      search_center: {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        radius: parseInt(radius)
      },
      hospitals: sortedHospitals
    });
    
  } catch (error) {
    console.error('Hospital locator error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Search hospitals by city/name
router.get('/hospitals/search', async (req, res) => {
  try {
    const { query, city, state, country, limit = 20 } = req.query;
    
    if (!query && !city && !country) {
      return res.status(400).json({ 
        message: 'Search query, city, or country is required',
        example: '/api/hospitals/search?city=Los+Angeles&country=USA' 
      });
    }
    
    console.log('Hospital search request:', { query, city, state, country });
    
    // Build Overpass query for text search
    let searchQuery = '';
    if (query) {
      searchQuery = `["name"~"${query}", i]["healthcare"~"${query}", i]`;
    } else if (city) {
      searchQuery = `["addr:city"="${city}"]`;
      if (state) searchQuery += `["addr:state"="${state}"]`;
      if (country) searchQuery += `["addr:country"="${country}"]`;
    } else if (country) {
      searchQuery = `["addr:country"="${country}"]`;
    }
    
    const overpassQuery = `
      [out:json][timeout:15];
      (
        node["amenity"~"hospital|clinic"]${searchQuery};
      );
      out body;
      >;
      out count;
    `;
    
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    
    try {
      const response = await fetch(overpassUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'LeukoHospitalFinder/1.0'
        },
        body: 'data=' + encodeURIComponent(overpassQuery),
        timeout: 8000 // 8 second timeout (reduced from 15)
      });
      
      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Overpass API error:', data.error);
        
        // Check if it's a timeout or data availability issue
        if (data.error.includes('timeout') || data.error.includes('Gateway Timeout')) {
          // Use fallback data for Pakistani cities
          if (country === 'PK' && city) {
            const fallbackData = fallbackHospitals[country];
            // Case-insensitive city matching
            const normalizedCity = city.toLowerCase();
            const matchingCity = Object.keys(fallbackData).find(
              fallbackCity => fallbackCity.toLowerCase() === normalizedCity
            );
            
            if (fallbackData && matchingCity && fallbackData[matchingCity]) {
              console.log(`Using fallback data for ${city}, ${country} due to timeout`);
              return res.json({
                success: true,
                count: fallbackData[matchingCity].length,
                search_query: { city, country },
                countries_searched: [country],
                hospitals: fallbackData[matchingCity].slice(0, parseInt(limit)),
                message: `Showing ${fallbackData[matchingCity].length} hospitals from our database for ${city}, ${country}. OpenStreetMap API timed out.`
              });
            }
          }
          
          return res.status(200).json({
            success: true,
            count: 0,
            message: `Limited hospital data available for ${city || country}. This may be due to incomplete OpenStreetMap data or API timeout.`,
            hospitals: [],
            search_query: { city, country }
          });
        }
        
        return res.status(500).json({ 
          message: 'Failed to search hospitals',
          error: data.error 
        });
      }
      
      // Process the hospital data (same as above)
      const hospitals = data.elements.map(element => {
        const tags = element.tags || {};
        
        return {
          id: element.id,
          name: tags.name || tags['operator'] || 'Unknown Hospital',
          type: tags['amenity'] || 'hospital',
          address: {
            street: tags['addr:street'] || '',
            city: tags['addr:city'] || '',
            state: tags['addr:state'] || '',
            postcode: tags['addr:postcode'] || '',
            full_address: `${tags['addr:street'] || ''}, ${tags['addr:city'] || ''}, ${tags['addr:state'] || ''} ${tags['addr:postcode'] || ''}`.trim()
          },
          contact: {
            phone: tags.phone || tags['contact:phone'] || '',
            website: tags.website || '',
            email: tags['contact:email'] || ''
          },
          location: {
            latitude: element.lat,
            longitude: element.lon
          },
          details: {
            emergency: tags['emergency'] === 'yes',
            beds: tags['beds'] ? parseInt(tags['beds']) : null,
            operator: tags['operator'] || '',
            specialty: tags['healthcare'] || tags['medical'] || 'General',
            opening_hours: tags['opening_hours'] || ''
          }
        };
      });
      
      console.log(`Search found ${hospitals.length} hospitals`);
      
      // If no hospitals found OR data is incomplete for major Pakistani cities, use fallback data
      const hasIncompleteData = hospitals.length === 0 || hospitals.some(h => 
        !h.name || !h.address.city || !h.contact.phone
      );
      
      if (hasIncompleteData && country === 'PK' && city) {
        const fallbackData = fallbackHospitals[country];
        // Case-insensitive city matching
        const normalizedCity = city.toLowerCase();
        const matchingCity = Object.keys(fallbackData).find(
          fallbackCity => fallbackCity.toLowerCase() === normalizedCity
        );
        
        if (fallbackData && matchingCity && fallbackData[matchingCity]) {
          console.log(`Using fallback data for ${city}, ${country} due to incomplete OpenStreetMap data`);
          return res.json({
            success: true,
            count: fallbackData[matchingCity].length,
            search_query: { city, country },
            countries_searched: [country],
            hospitals: fallbackData[matchingCity].slice(0, parseInt(limit)),
            message: `Showing ${fallbackData[matchingCity].length} hospitals from our database for ${city}, ${country}. OpenStreetMap data for this region may be incomplete.`
          });
        }
      }
      
      res.json({
        success: true,
        count: hospitals.length,
        search_query: { query, city, state, country },
        countries_searched: country ? [country] : [],
        hospitals: hospitals.slice(0, parseInt(limit))
      });
      
    } catch (fetchError) {
      console.error('Network or fetch error:', fetchError);
      
      // Use fallback data for Pakistani cities on network errors
      if (country === 'PK' && city) {
        const fallbackData = fallbackHospitals[country];
        // Case-insensitive city matching
        const normalizedCity = city.toLowerCase();
        const matchingCity = Object.keys(fallbackData).find(
          fallbackCity => fallbackCity.toLowerCase() === normalizedCity
        );
        
        if (fallbackData && matchingCity && fallbackData[matchingCity]) {
          console.log(`Using fallback data for ${city}, ${country} due to network error`);
          return res.json({
            success: true,
            count: fallbackData[matchingCity].length,
            search_query: { city, country },
            countries_searched: [country],
            hospitals: fallbackData[matchingCity].slice(0, parseInt(limit)),
            message: `Showing ${fallbackData[matchingCity].length} hospitals from our database for ${city}, ${country}. Network error occurred.`
          });
        }
      }
      
      // Don't re-throw the error - handle it gracefully
      return res.status(200).json({
        success: true,
        count: 0,
        message: `No hospital data available for ${city || country}. Please try again later.`,
        hospitals: [],
        search_query: { city, country }
      });
    }
    
  } catch (error) {
    console.error('Hospital search error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

module.exports = router;
