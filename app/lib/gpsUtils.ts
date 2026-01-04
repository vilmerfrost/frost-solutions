// app/lib/gpsUtils.ts

/**
 * GPS utilities for location tracking and work site detection
 */

/**
 * GPS location interface
 */
export interface GPSLocation {
 latitude: number;
 longitude: number;
 accuracy?: number;
}

/**
 * Work site interface
 */
export interface WorkSite {
 id: string;
 name: string;
 latitude: number;
 longitude: number;
 radius_meters: number;
 auto_checkin_enabled: boolean;
 auto_checkin_distance: number;
}

/**
 * Calculates the distance between two GPS coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
 const R = 6371e3; // Earth's radius in meters
 const φ1 = (lat1 * Math.PI) / 180;
 const φ2 = (lat2 * Math.PI) / 180;
 const Δφ = ((lat2 - lat1) * Math.PI) / 180;
 const Δλ = ((lon2 - lon1) * Math.PI) / 180;

 const a =
  Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
  Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

 return R * c; // Distance in meters
}

/**
 * Gets the current GPS position using browser Geolocation API
 * @returns Promise that resolves to GPSLocation or rejects with error
 */
export function getCurrentPosition(): Promise<GPSLocation> {
 return new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
   reject(new Error('Geolocation is not supported by your browser'));
   return;
  }

  navigator.geolocation.getCurrentPosition(
   (position) => {
    resolve({
     latitude: position.coords.latitude,
     longitude: position.coords.longitude,
     accuracy: position.coords.accuracy || undefined,
    });
   },
   (error) => {
    reject(error);
   },
   {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
   }
  );
 });
}

/**
 * Finds the nearest work site to a given location
 * @param location Current GPS location
 * @param workSites Array of work sites to check
 * @returns Nearest work site with distance, or null if no sites
 */
export function findNearestWorkSite(
 location: GPSLocation,
 workSites: WorkSite[]
): { site: WorkSite; distance: number } | null {
 if (!workSites || workSites.length === 0) {
  return null;
 }

 let nearest: { site: WorkSite; distance: number } | null = null;

 for (const site of workSites) {
  const distance = calculateDistance(
   location.latitude,
   location.longitude,
   site.latitude,
   site.longitude
  );

  if (!nearest || distance < nearest.distance) {
   nearest = { site, distance };
  }
 }

 return nearest;
}

/**
 * Checks if a location is within auto-checkin distance of a work site
 * @param location Current GPS location
 * @param site Work site to check
 * @returns True if within auto-checkin distance
 */
export function isWithinAutoCheckinDistance(location: GPSLocation, site: WorkSite): boolean {
 if (!site.auto_checkin_enabled) {
  return false;
 }

 const distance = calculateDistance(
  location.latitude,
  location.longitude,
  site.latitude,
  site.longitude
 );

 return distance <= site.auto_checkin_distance;
}

/**
 * Starts continuous GPS tracking with periodic updates
 * @param callback Function called with each new location update
 * @param intervalMs Interval between updates in milliseconds (default: 2 minutes)
 * @returns Interval ID that can be used with stopGPSTracking
 */
export function startGPSTracking(
 callback: (location: GPSLocation) => void,
 intervalMs: number = 2 * 60 * 1000
): number {
 // Get initial position
 getCurrentPosition()
  .then((location) => {
   callback(location);
  })
  .catch((error) => {
   console.error('Error getting initial GPS position:', error);
  });

 // Set up periodic tracking
 const intervalId = window.setInterval(() => {
  getCurrentPosition()
   .then((location) => {
    callback(location);
   })
   .catch((error) => {
    console.error('Error getting GPS position during tracking:', error);
   });
 }, intervalMs);

 return intervalId;
}

/**
 * Stops GPS tracking by clearing the interval
 * @param intervalId Interval ID returned from startGPSTracking
 */
export function stopGPSTracking(intervalId: number): void {
 if (intervalId) {
  clearInterval(intervalId);
 }
}

