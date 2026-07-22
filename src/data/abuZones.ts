import { AbuZone } from '../types';
import { LANDMARKS_SEED } from './seedLandmarks';

export const ABU_LAT = 11.15286; // Precise Google Street Map aligned center coordinates (Kashim Ibrahim Library)
export const ABU_LNG = 7.64770;

export const abuGeoJson = {
  "type": "FeatureCollection" as const,
  "features": LANDMARKS_SEED.map(landmark => ({
    "type": "Feature" as const,
    "properties": {
      "zone_id": landmark.id,
      "name": landmark.name,
      "category": landmark.category,
      "faculty": landmark.faculty
    },
    "geometry": {
      "type": "Point" as const,
      "coordinates": [landmark.lng, landmark.lat] as [number, number]
    }
  }))
};

const CATEGORY_COLORS: Record<string, string> = {
  administration: '#3b82f6', // blue
  library: '#6366f1',        // indigo
  faculty: '#10b981',        // emerald
  department: '#14b8a6',     // teal
  hostel: '#ec4899',         // pink
  amenity: '#f59e0b',        // amber
  gate: '#ef4444',           // red
  health: '#06b6d4',         // cyan
  worship: '#8b5cf6',        // violet
  ict: '#f43f5e',            // rose
  'student-services': '#e11d48', // rose/red
  infrastructure: '#64748b'  // slate
};

// Map GeoJSON points into visual click boxes (tiny polygons around the center coordinates)
export const abuZones: AbuZone[] = abuGeoJson.features.map((feature) => {
  const [lng, lat] = feature.geometry.coordinates;
  const p = feature.properties;
  
  // Custom description based on the entity's category and campus location
  const campusName = lng > 7.70 ? 'Kongo campus' : 'Samaru main campus';
  let description = `${p.name} on ABU ${campusName}`;
  if (p.category === 'department' && p.faculty) {
    description = `Department within the Faculty of ${p.faculty} on ABU ${campusName}`;
  } else if (p.category === 'department') {
    description = `Academic Department on ABU ${campusName}`;
  } else if (p.category === 'faculty') {
    description = `Academic Faculty Center & Offices on ABU ${campusName}`;
  } else if (p.category === 'hostel') {
    description = `Student Residence Hostel on ABU ${campusName}`;
  } else if (p.category === 'gate') {
    description = `Entrance Security Gate on ABU ${campusName}`;
  } else if (p.category === 'library') {
    description = `Library Reading & Research Center on ABU ${campusName}`;
  } else if (p.category === 'administration') {
    description = `Central Administration Headquarters on ABU ${campusName}`;
  } else if (p.category === 'health') {
    description = `University Medical & Health Services Centre on ABU ${campusName}`;
  } else if (p.category === 'worship') {
    description = `Place of Worship & Spiritual Activities on ABU ${campusName}`;
  } else if (p.category === 'ict') {
    description = `Information & Communication Technology Center on ABU ${campusName}`;
  } else if (p.category === 'student-services') {
    description = `Student Support & Guidance Services on ABU ${campusName}`;
  } else if (p.category === 'infrastructure') {
    description = `Campus Utility & Infrastructure Facility on ABU ${campusName}`;
  }

  const color = CATEGORY_COLORS[p.category] || '#64748b';
  
  // Set a small offset for building polygon box so it draws nicely
  const delta = 0.00015;
  const coordinates: [number, number][] = [
    [lng - delta, lat + delta],
    [lng + delta, lat + delta],
    [lng + delta, lat - delta],
    [lng - delta, lat - delta]
  ];

  return {
    id: p.zone_id,
    name: p.name,
    description,
    color,
    coordinates,
    category: p.category
  };
});

// Helper to find which zone contains a given coordinate (or is closest to it)
export function findZoneForCoordinates(lat: number, lng: number): AbuZone | null {
  let minDistance = Infinity;
  let closestZone: AbuZone | null = null;
  
  for (const zone of abuZones) {
    // Calculate center of the zone box
    const lngs = zone.coordinates.map(c => c[0]);
    const lats = zone.coordinates.map(c => c[1]);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    
    const dist = Math.sqrt(Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2));
    if (dist < minDistance) {
      minDistance = dist;
      closestZone = zone;
    }
  }
  
  // Return the closest zone if it is within reasonable limits (e.g. 2 kilometers / ~0.02 coordinate degrees)
  if (minDistance < 0.02) {
    return closestZone;
  }
  
  return null;
}
