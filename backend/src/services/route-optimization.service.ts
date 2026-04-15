const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

export class RouteOptimizationService {
  /**
   * Optimizes the order of waypoints using Google Maps Directions API
   * @param origin Starting point (lat,lng string or address)
   * @param destination Ending point (lat,lng string or address)
   * @param waypoints Array of intermediate stops
   */
  static async optimizeRouteOrder(origin: string, destination: string, waypoints: string[]) {
    // Mock response if no API key is present (for development without billing)
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('GOOGLE_MAPS_API_KEY missing. Returning original order (Mock Mode).');
      return {
        waypoints,
        totalDistance: 0,
        totalDuration: 0,
        optimizedOrder: waypoints.map((_, i) => i)
      };
    }

    try {
      // Prepare waypoints string: "optimize:true|lat,lng|lat,lng..."
      // This tells Google to reorder the stops for efficiency
      const waypointsStr = `optimize:true|${waypoints.join('|')}`;

      const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
      url.searchParams.append('origin', origin);
      url.searchParams.append('destination', destination);
      url.searchParams.append('waypoints', waypointsStr);
      url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Google Maps API Error: ${data.status} - ${data.error_message || ''}`);
      }

      const route = data.routes[0];
      const waypointOrder = route.waypoint_order; // e.g., [2, 0, 1]

      // Reorder the input waypoints based on the optimized order
      const optimizedWaypoints = waypointOrder.map((index: number) => waypoints[index]);

      // Calculate total distance and duration from the legs of the route
      let totalDistance = 0;
      let totalDuration = 0;

      if (route.legs) {
        for (const leg of route.legs) {
          totalDistance += leg.distance.value; // meters
          totalDuration += leg.duration.value; // seconds
        }
      }

      return {
        waypoints: optimizedWaypoints,
        totalDistance,
        totalDuration,
        optimizedOrder: waypointOrder
      };

    } catch (error) {
      console.error('Route optimization service error:', error);
      throw error;
    }
  }
}