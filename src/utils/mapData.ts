import { abuZones } from '../data/abuZones';
import { AbuZone } from '../types';

export interface LandmarkCoords {
  lat: number;
  lng: number;
  name: string;
}

function getZoneCenter(zone: AbuZone): [number, number] {
  const lngs = zone.coordinates.map(c => c[0]);
  const lats = zone.coordinates.map(c => c[1]);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  return [centerLat, centerLng];
}

/**
 * Sync helper to quickly retrieve accurate coordinates from the campus zones dataset.
 */
export function getAccurateLandmarkCoordsSync(landmarkId: string): LandmarkCoords | null {
  const normalizedId = landmarkId.toLowerCase().trim();
  const zone = abuZones.find(z => z.id.toLowerCase().trim() === normalizedId);
  if (!zone) {
    // Fuzzy match fallback
    const fuzzyZone = abuZones.find(z => 
      z.id.toLowerCase().includes(normalizedId) || 
      normalizedId.includes(z.id.toLowerCase())
    );
    if (!fuzzyZone) return null;
    const [lat, lng] = getZoneCenter(fuzzyZone);
    return { lat, lng, name: fuzzyZone.name };
  }
  const [lat, lng] = getZoneCenter(zone);
  return { lat, lng, name: zone.name };
}

/**
 * Fetches the highly accurate GPS coordinates for a major ABU Zaria landmark.
 * Supports asynchronous operation to allow integration with remote services.
 * @param landmarkId The unique identifier of the landmark.
 * @returns A promise resolving to the coordinates, or null if not found.
 */
export async function fetchAccurateLandmarkCoords(landmarkId: string): Promise<LandmarkCoords | null> {
  // Simulate an API network delay of 50ms for realistic asynchronous fetching
  await new Promise(resolve => setTimeout(resolve, 50));
  return getAccurateLandmarkCoordsSync(landmarkId);
}
