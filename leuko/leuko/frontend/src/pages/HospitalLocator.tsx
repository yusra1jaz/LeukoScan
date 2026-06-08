import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Globe, Navigation, Loader2, MapPin, X } from "lucide-react";

// Import Leaflet CSS (will be loaded dynamically)
let L: any = null;

interface Hospital {
  id: number;
  name: string;
  address: {
    full_address: string;
  };
  contact: {
    website: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
}

const HospitalLocator: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchArea, setSearchArea] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userLocationMarkerRef = useRef<any>(null);

  // Predefined coordinates for major cities to avoid CORS issues
  const cityCoordinates: { [key: string]: { lat: number, lon: number } } = {
    'islamabad': { lat: 33.6844, lon: 73.0479 },
    'karachi': { lat: 24.8607, lon: 67.0011 },
    'lahore': { lat: 31.5497, lon: 74.3436 },
    'peshawar': { lat: 34.0151, lon: 71.5789 },
    'quetta': { lat: 30.1798, lon: 66.9750 },
    'faisalabad': { lat: 31.4504, lon: 73.1347 },
    'multan': { lat: 30.1575, lon: 71.5249 },
    'rawalpindi': { lat: 33.5651, lon: 73.0169 },
    'gujranwala': { lat: 32.1877, lon: 74.1944 },
    'sialkot': { lat: 32.4945, lon: 74.5229 },
    'hyderabad': { lat: 25.3969, lon: 68.3672 },
    'sukkur': { lat: 27.7052, lon: 68.8575 },
    'murree': { lat: 33.9070, lon: 73.3900 },
    'abbottabad': { lat: 34.1688, lon: 73.2215 },
    'bahawalpur': { lat: 29.3998, lon: 71.6834 },
    'sargodha': { lat: 32.0836, lon: 72.6745 },
    'jhang': { lat: 31.3069, lon: 72.3137 },
    'sheikhupura': { lat: 31.9126, lon: 73.9784 },
    'mardan': { lat: 34.1975, lon: 72.0460 },
    'mingora': { lat: 34.7758, lon: 72.3630 },
    'kohat': { lat: 33.5847, lon: 71.4389 },
    'bannu': { lat: 32.9875, lon: 70.6070 },
    'dera ghazi khan': { lat: 30.0503, lon: 70.6369 },
    'dera ismail khan': { lat: 31.8306, lon: 70.9137 },
    'chakwal': { lat: 32.9285, lon: 72.8575 },
    'jhelum': { lat: 32.9430, lon: 73.7261 },
    'mianwali': { lat: 32.5833, lon: 71.5431 },
    'bhakkar': { lat: 31.6414, lon: 71.0597 },
    'atok': { lat: 33.7701, lon: 72.3782 },
    'haripur': { lat: 33.9675, lon: 72.9336 },
    'havelian': { lat: 34.0475, lon: 73.1756 },
    'karak': { lat: 33.0698, lon: 71.8475 },
    'lakki marwat': { lat: 32.6167, lon: 70.9083 },
    'mansehra': { lat: 34.3300, lon: 73.2000 },
    'nowshera': { lat: 34.0167, lon: 71.9833 },
    'pabbi': { lat: 33.8167, lon: 72.4167 },
    'risalpur': { lat: 33.8333, lon: 72.2500 },
    'swabi': { lat: 34.1167, lon: 72.4667 },
    'tangi': { lat: 34.1333, lon: 71.9333 },
    'taxila': { lat: 33.7667, lon: 72.8333 },
    'topi': { lat: 34.0667, lon: 72.3500 },
    'wah': { lat: 33.7500, lon: 72.5833 },
    'new york': { lat: 40.7128, lon: -74.0060 },
    'london': { lat: 51.5074, lon: -0.1278 },
    'paris': { lat: 48.8566, lon: 2.3522 },
    'tokyo': { lat: 35.6762, lon: 139.6503 },
    'beijing': { lat: 39.9042, lon: 116.4074 },
    'delhi': { lat: 28.6139, lon: 77.2090 },
    'mumbai': { lat: 19.0760, lon: 72.8777 },
    'dubai': { lat: 25.2048, lon: 55.2708 },
    'singapore': { lat: 1.3521, lon: 103.8198 }
  };

  // Load Leaflet dynamically
  useEffect(() => {
    if (showMap && !mapLoaded) {
      // Load Leaflet CSS
      const leafletCss = document.createElement('link');
      leafletCss.rel = 'stylesheet';
      leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCss);

      // Load Leaflet JS
      const leafletScript = document.createElement('script');
      leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletScript.onload = () => {
        // @ts-ignore
        L = window.L;
        setMapLoaded(true);
      };
      document.head.appendChild(leafletScript);
    }
  }, [showMap, mapLoaded]);

  // Initialize map when it's loaded and we have hospitals
  useEffect(() => {
    if (mapLoaded && showMap && hospitals.length > 0 && mapRef.current && !mapInstanceRef.current) {
      // Calculate center point from hospital coordinates
      const avgLat = hospitals.reduce((sum, h) => sum + h.location.latitude, 0) / hospitals.length;
      const avgLon = hospitals.reduce((sum, h) => sum + h.location.longitude, 0) / hospitals.length;

      // Initialize map
      const map = L.map(mapRef.current).setView([avgLat, avgLon], 12);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Add user location marker if available
      if (userLocation) {
        const userIcon = L.divIcon({
          html: '<div style="background: #3b82f6; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">You</div>',
          iconSize: [20, 20],
          className: 'user-location-marker'
        });
        
        const userMarker = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
          .addTo(map)
          .bindPopup('<div style="min-width: 150px;"><h4 style="margin: 0; color: #333;">Your Location</h4></div>');
        
        userLocationMarkerRef.current = userMarker;
      }

      // Add hospital markers
      hospitals.forEach(hospital => {
        const distance = userLocation ? 
          calculateDistance(userLocation.lat, userLocation.lon, hospital.location.latitude, hospital.location.longitude) : 
          null;
        
        const marker = L.marker([hospital.location.latitude, hospital.location.longitude])
          .addTo(map)
          .bindPopup(`
            <div style="min-width: 220px;">
              <h4 style="margin: 0 0 8px 0; color: #333;">${hospital.name}</h4>
              <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${hospital.address.full_address}</p>
              ${distance ? `<p style="margin: 0 0 8px 0; color: #10b981; font-weight: bold; font-size: 14px;">${formatDistance(distance)}</p>` : ''}
              <div style="display: flex; gap: 8px; margin-top: 8px;">
                <button 
                  onclick="window.open('${hospital.contact.website.startsWith('http') ? hospital.contact.website : 'https://' + hospital.contact.website}', '_blank')"
                  style="padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
                >
                  Website
                </button>
                <button 
                  onclick="window.open('https://www.google.com/maps/dir/?api=1&origin=${userLocation ? userLocation.lat + ',' + userLocation.lon : ''}&destination=${hospital.location.latitude},${hospital.location.longitude}', '_blank')"
                  style="padding: 4px 8px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
                >
                  Directions
                </button>
              </div>
            </div>
          `);
        
        markersRef.current.push(marker);
      });

      mapInstanceRef.current = map;
    }
  }, [mapLoaded, showMap, hospitals]);

  // Get user's current location
  const getUserLocation = async (): Promise<{lat: number, lon: number} | null> => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return null;
    }

    setLocationLoading(true);
    
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setUserLocation(location);
          setLocationLoading(false);
          resolve(location);
        },
        (error) => {
          setLocationLoading(false);
          console.error('Geolocation error:', error);
          setError('Unable to get your location. Please enable location services.');
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  // Calculate distance between two points in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Format distance for display
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)}km away`;
    } else {
      return `${Math.round(distance)}km away`;
    }
  };

  // Geocode address using predefined coordinates
  const geocodeAddress = async (address: string): Promise<{lat: number, lon: number} | null> => {
    const normalizedAddress = address.toLowerCase().trim();
    
    // Check if the address matches any predefined city
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (normalizedAddress.includes(city)) {
        return coords;
      }
    }
    
    // Default to Islamabad if no match found
    console.log('No predefined coordinates found for:', address, 'Using Islamabad as default');
    return cityCoordinates['islamabad'];
  };

  
  // Search hospitals using Overpass API
  const searchHospitalsWithOverpass = async (lat: number, lon: number): Promise<Hospital[]> => {
    try {
      const radius = 50000; // 50km radius in meters
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:${radius},${lat},${lon});
          way["amenity"="hospital"](around:${radius},${lat},${lon});
          relation["amenity"="hospital"](around:${radius},${lat},${lon});
        );
        out geom;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      
      // Check if response is XML (error) instead of JSON
      if (text.trim().startsWith('<?xml')) {
        throw new Error('Overpass API returned XML error (likely timeout or overload)');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error('Failed to parse Overpass API response');
      }
      
      if (data.elements) {
        // Process all elements first, then do reverse geocoding for those without addresses
        const hospitalsWithAddresses = await Promise.all(
          data.elements.map(async (element: any, index: number) => {
            let name = 'Unknown Hospital';
            let address = 'Unknown Address';
            
            if (element.tags && element.tags.name) {
              name = element.tags.name;
            }
            
            // Get coordinates first
            let elementLat = element.lat;
            let elementLon = element.lon;
            
            if (element.center) {
              elementLat = element.center.lat;
              elementLon = element.center.lon;
            } else if (element.bounds && element.bounds.centerlat) {
              elementLat = element.bounds.centerlat;
              elementLon = element.bounds.centerlon;
            }
            
            // Try multiple address tag combinations
            if (element.tags && element.tags['addr:full']) {
              address = element.tags['addr:full'];
            } else if (element.tags && element.tags['addr:street']) {
              const street = element.tags['addr:street'] || '';
              const housenumber = element.tags['addr:housenumber'] || '';
              const city = element.tags['addr:city'] || element.tags['addr:town'] || element.tags['addr:village'] || '';
              const postcode = element.tags['addr:postcode'] || '';
              const state = element.tags['addr:state'] || '';
              const country = element.tags['addr:country'] || '';
              
              const fullAddress = `${street} ${housenumber}`.trim();
              const cityState = `${city}, ${state}`.trim();
              const postalCode = postcode ? ` ${postcode}` : '';
              const countryPart = country ? `, ${country}` : '';
              
              address = `${fullAddress}, ${cityState}${postalCode}${countryPart}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').trim();
            } else if (element.tags && element.tags['addr:housenumber']) {
              // Fallback to just housenumber if available
              address = element.tags['addr:housenumber'];
            } else if (element.tags && element.tags['addr:city']) {
              // Fallback to just city if available
              address = element.tags['addr:city'];
            } else if (element.tags && element.tags['addr:postcode']) {
              // Fallback to just postcode if available
              address = element.tags['addr:postcode'];
            } else {
              // Last resort: show coordinates-based location
              if (elementLat && elementLon) {
                address = `Location: ${elementLat.toFixed(4)}, ${elementLon.toFixed(4)}`;
              } else {
                address = 'Location not available';
              }
            }

            return {
              id: index + 1,
              name: name,
              address: {
                full_address: address
              },
              contact: {
                website: element.tags?.website || element.tags?.url || element.tags?.contact?.website || 'Not available'
              },
              location: {
                latitude: elementLat,
                longitude: elementLon
              }
            };
          })
        );
        
        return hospitalsWithAddresses;
      }
      
      return [];
    } catch (err) {
      console.error('Overpass API error:', err);
      
      // Check if it's a timeout error
      if (err instanceof Error && err.message.includes('timeout')) {
        setError('Server timeout. The service is temporarily overloaded. Please try again in a few moments.');
        return [];
      }
      
      // Try alternative Overpass API server
      try {
        const fallbackQuery = `
          [out:json][timeout:25];
          (
            node["amenity"="hospital"](around:50000,${lat},${lon});
            way["amenity"="hospital"](around:50000,${lat},${lon});
            relation["amenity"="hospital"](around:50000,${lat},${lon});
          );
          out geom;
        `;
        
        const fallbackResponse = await fetch('https://overpass.kumi.systems/api/interpreter', {
          method: 'POST',
          body: 'data=' + encodeURIComponent(fallbackQuery),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        if (fallbackResponse.ok) {
          const fallbackText = await fallbackResponse.text();
          if (!fallbackText.trim().startsWith('<?xml')) {
            const fallbackData = JSON.parse(fallbackText);
            if (fallbackData.elements) {
              const fallbackHospitals = await Promise.all(
                fallbackData.elements.map(async (element: any, index: number) => {
                  let name = 'Unknown Hospital';
                  let address = 'Unknown Address';
                  
                  if (element.tags && element.tags.name) {
                    name = element.tags.name;
                  }
                  
                  // Get coordinates first
                  let elementLat = element.lat;
                  let elementLon = element.lon;
                  
                  if (element.center) {
                    elementLat = element.center.lat;
                    elementLon = element.center.lon;
                  } else if (element.bounds && element.bounds.centerlat) {
                    elementLat = element.bounds.centerlat;
                    elementLon = element.bounds.centerlon;
                  }
                  
                  // Try multiple address tag combinations
                  if (element.tags && element.tags['addr:full']) {
                    address = element.tags['addr:full'];
                  } else if (element.tags && element.tags['addr:street']) {
                    const street = element.tags['addr:street'] || '';
                    const housenumber = element.tags['addr:housenumber'] || '';
                    const city = element.tags['addr:city'] || element.tags['addr:town'] || element.tags['addr:village'] || '';
                    const postcode = element.tags['addr:postcode'] || '';
                    const state = element.tags['addr:state'] || '';
                    const country = element.tags['addr:country'] || '';
                    
                    const fullAddress = `${street} ${housenumber}`.trim();
                    const cityState = `${city}, ${state}`.trim();
                    const postalCode = postcode ? ` ${postcode}` : '';
                    const countryPart = country ? `, ${country}` : '';
                    
                    address = `${fullAddress}, ${cityState}${postalCode}${countryPart}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').trim();
                  } else if (element.tags && element.tags['addr:housenumber']) {
                    // Fallback to just housenumber if available
                    address = element.tags['addr:housenumber'];
                  } else if (element.tags && element.tags['addr:city']) {
                    // Fallback to just city if available
                    address = element.tags['addr:city'];
                  } else if (element.tags && element.tags['addr:postcode']) {
                    // Fallback to just postcode if available
                    address = element.tags['addr:postcode'];
                  } else {
                    // Last resort: show coordinates-based location
                    if (elementLat && elementLon) {
                      address = `Location: ${elementLat.toFixed(4)}, ${elementLon.toFixed(4)}`;
                    } else {
                      address = 'Location not available';
                    }
                  }

                  return {
                    id: index + 1,
                    name: name,
                    address: {
                      full_address: address
                    },
                    contact: {
                      website: element.tags?.website || element.tags?.url || element.tags?.contact?.website || 'Not available'
                    },
                    location: {
                      latitude: elementLat,
                      longitude: elementLon
                    }
                  };
                })
              );
              
              return fallbackHospitals;
            }
          }
        }
      } catch (fallbackErr) {
        console.error('Fallback API also failed:', fallbackErr);
        
        // Check if fallback also timed out
        if (fallbackErr instanceof Error && (fallbackErr.message.includes('timeout') || fallbackErr.message.includes('504'))) {
          setError('Both map servers are temporarily overloaded. Please try again in a few moments.');
        } else {
          setError('Unable to connect to map services. Please check your connection and try again.');
        }
      }
      
      return [];
    }
  };

  const searchHospitals = async () => {
    if (!searchArea.trim()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First geocode the search area
      const coordinates = await geocodeAddress(searchArea);
      
      if (!coordinates) {
        setError('Location not found. Please try a different search term.');
        setHospitals([]);
        setLoading(false);
        return;
      }

      // Then search for hospitals using Overpass API
      const hospitalResults = await searchHospitalsWithOverpass(coordinates.lat, coordinates.lon);
      
      if (hospitalResults.length === 0) {
        setError('No hospitals found in this area. Try searching for a different location.');
      } else {
        setHospitals(hospitalResults);
      }
      
    } catch (err) {
      setError('Failed to search for hospitals. Please try again.');
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  const getDirections = async (hospital: Hospital) => {
    // Try to get user location first
    const userLoc = userLocation || await getUserLocation();
    
    if (userLoc) {
      // Calculate distance
      const distance = calculateDistance(
        userLoc.lat, 
        userLoc.lon, 
        hospital.location.latitude, 
        hospital.location.longitude
      );
      
      // Open Google Maps with user location as origin
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lon}&destination=${hospital.location.latitude},${hospital.location.longitude}`;
      window.open(url, '_blank');
      
      // Show distance info
      console.log(`Distance to ${hospital.name}: ${formatDistance(distance)}`);
    } else {
      // Fallback to hospital as origin if user location unavailable
      const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.location.latitude},${hospital.location.longitude}`;
      window.open(url, '_blank');
    }
  };

  const visitWebsite = (website: string, hospitalName: string) => {
    if (website && website !== 'Not available') {
      window.open(website.startsWith('http') ? website : `https://${website}`, '_blank');
    } else {
      // If no website in data, search for hospital website online
      const searchQuery = encodeURIComponent(`${hospitalName} official website contact information`);
      window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leukemia Treatment Center Locator</h1>
          <p className="text-gray-600">Find specialized hospitals that treat leukemia, cancer, and blood disorders using OpenStreetMap</p>
        </div>

        {/* Search Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <CardTitle className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5" />
              Search for Leukemia Treatment Centers
            </CardTitle>
            
            <div className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Enter any city, address, or hospital name..."
                  value={searchArea}
                  onChange={(e) => setSearchArea(e.target.value)}
                  className="w-full text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && searchHospitals()}
                />
              </div>
              
              <Button 
                onClick={searchHospitals}
                disabled={loading || !searchArea.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2" /> Search Hospitals
                  </>
                )}
              </Button>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section - Full Width When Results Exist */}
        {hospitals.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <CardTitle>
                  {hospitals.length === 0 ? (
                    <span>No hospitals found. Try searching for a different location.</span>
                  ) : (
                    <span>Found {hospitals.length} Hospitals Near {searchArea}</span>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={getUserLocation}
                    disabled={locationLoading}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {locationLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                    {userLocation ? 'Location Set' : 'Get My Location'}
                  </Button>
                  <Button
                    onClick={() => setShowMap(!showMap)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {showMap ? <X className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </Button>
                </div>
              </div>

              {/* Map View */}
              {showMap && (
                <div className="mb-6">
                  {!mapLoaded ? (
                    <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                        <p className="text-gray-600">Loading map...</p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      ref={mapRef} 
                      className="h-96 rounded-lg border border-gray-300"
                      style={{ minHeight: '400px' }}
                    />
                  )}
                </div>
              )}
              
              {/* List View */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hospitals.map((hospital) => {
                  const distance = userLocation ? 
                    calculateDistance(userLocation.lat, userLocation.lon, hospital.location.latitude, hospital.location.longitude) : 
                    null;
                  
                  return (
                    <div key={hospital.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="mb-3">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {hospital.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {hospital.address.full_address}
                        </p>
                        {distance && (
                          <p className="text-sm font-semibold text-green-600 mb-2">
                            {formatDistance(distance)}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => visitWebsite(hospital.contact.website, hospital.name)}
                          className="w-full flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" />
                          Website
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => getDirections(hospital)}
                          className="w-full flex items-center gap-1"
                        >
                          <Navigation className="h-3 w-3" />
                          Get Directions
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HospitalLocator;
