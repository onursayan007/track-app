import { defineStore } from 'pinia';
import { ref, computed, onUnmounted } from 'vue';
import { socketService } from '@/services/socket';

export const useShuttleStore = defineStore('shuttle', () => {
  // ─── State ─────────────────────────────────────────────────
  const currentLocation = ref({ lat: 37.0662, lng: 37.3783 }); // Gaziantep defaults
  const busLocation = ref({ lat: 37.06, lng: 37.38 });
  const driverInfo = ref({
    name: 'Ahmet Yılmaz',
    photo: 'https://i.pravatar.cc/150?u=ahmet',
    plate: '27 ABC 99',
  });
  const eta = ref(5); // in minutes
  const status = ref('En Route'); // 'Waiting for Service' or 'En Route'

  /** Map of vehicleId → latest telemetry event (for multi-vehicle dashboards) */
  const vehicles = ref({});

  /** Latest alarm events (newest first, capped at 50) */
  const alarms = ref([]);

  /** Currently tracked route / vehicle IDs */
  const subscribedRouteId = ref(null);
  const subscribedVehicleId = ref(null);

  // ─── Socket.io Integration ─────────────────────────────────
  let unsubTelemetry = null;
  let unsubAlarm = null;
  let unsubRouteStatus = null;

  /**
   * Start listening for real-time events.
   * Call once after login when the socket is connected.
   */
  function startListening() {
    // Vehicle telemetry → update busLocation + vehicles map
    unsubTelemetry = socketService.onVehicleTelemetry((event) => {
      // Update per-vehicle map
      vehicles.value = {
        ...vehicles.value,
        [event.vehicleId]: event,
      };

      // If we're tracking a specific vehicle, update busLocation shortcut
      if (
        !subscribedVehicleId.value ||
        subscribedVehicleId.value === event.vehicleId
      ) {
        busLocation.value = { lat: event.lat, lng: event.lng };
      }
    });

    // Alarm events → prepend to alarms list
    unsubAlarm = socketService.onAlarm((event) => {
      alarms.value = [event, ...alarms.value].slice(0, 50);
    });

    // Route status events → update store status
    unsubRouteStatus = socketService.onRouteStatus((event) => {
      if (
        !subscribedRouteId.value ||
        subscribedRouteId.value === event.routeId
      ) {
        status.value = event.status;
      }
    });
  }

  /**
   * Stop listening and clean up subscriptions.
   * Call on logout or component teardown.
   */
  function stopListening() {
    unsubTelemetry?.();
    unsubAlarm?.();
    unsubRouteStatus?.();
    unsubTelemetry = null;
    unsubAlarm = null;
    unsubRouteStatus = null;
  }

  /**
   * Track a specific route — joins the server room for targeted updates.
   * @param {string} routeId
   */
  async function trackRoute(routeId) {
    // Unsub from previous route if any
    if (subscribedRouteId.value) {
      socketService.unsubscribeRoute(subscribedRouteId.value);
    }
    subscribedRouteId.value = routeId;
    await socketService.subscribeRoute(routeId);
  }

  /**
   * Track a specific vehicle — joins the server room for targeted updates.
   * @param {string} vehicleId
   */
  async function trackVehicle(vehicleId) {
    if (subscribedVehicleId.value) {
      socketService.unsubscribeVehicle(subscribedVehicleId.value);
    }
    subscribedVehicleId.value = vehicleId;
    await socketService.subscribeVehicle(vehicleId);
  }

  /** Stop tracking the current route */
  function untrackRoute() {
    if (subscribedRouteId.value) {
      socketService.unsubscribeRoute(subscribedRouteId.value);
      subscribedRouteId.value = null;
    }
  }

  /** Stop tracking the current vehicle */
  function untrackVehicle() {
    if (subscribedVehicleId.value) {
      socketService.unsubscribeVehicle(subscribedVehicleId.value);
      subscribedVehicleId.value = null;
    }
  }

  return {
    // state
    currentLocation,
    busLocation,
    driverInfo,
    eta,
    status,
    vehicles,
    alarms,
    subscribedRouteId,
    subscribedVehicleId,

    // actions
    startListening,
    stopListening,
    trackRoute,
    trackVehicle,
    untrackRoute,
    untrackVehicle,
  };
});
