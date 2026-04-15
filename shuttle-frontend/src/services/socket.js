// ════════════════════════════════════════════════════════════════════
// Socket.io Client Service — real-time telemetry for Vue.js frontend
//
// Usage:
//   import { socketService } from '@/services/socket'
//
//   socketService.connect()           — after login
//   socketService.disconnect()        — on logout
//   socketService.subscribeRoute(id)  — live-track a route
//   socketService.onVehicleTelemetry(cb) — react to GPS updates
// ════════════════════════════════════════════════════════════════════

import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

/**
 * @typedef {Object} VehicleTelemetryEvent
 * @property {string}   vehicleId
 * @property {string}   tenantId
 * @property {string}   [deviceId]
 * @property {number}   lat
 * @property {number}   lng
 * @property {number}   speed
 * @property {number}   heading
 * @property {number}   [altitude]
 * @property {boolean}  [ignition]
 * @property {string}   timestamp
 * @property {string[]} [routeIds]
 */

/**
 * @typedef {Object} RouteStatusEvent
 * @property {string} routeId
 * @property {string} tenantId
 * @property {string} status
 * @property {string} [vehicleId]
 * @property {string} [driverId]
 */

/**
 * @typedef {Object} AlarmEvent
 * @property {string} tenantId
 * @property {string} vehicleId
 * @property {string} type
 * @property {string} message
 * @property {number} lat
 * @property {number} lng
 * @property {string} timestamp
 */

// ─── Singleton Service ───────────────────────────────────────────

class SocketService {
  /** @type {import('socket.io-client').Socket | null} */
  _socket = null
  _connected = false

  /** True when the socket is connected and authenticated */
  get connected() {
    return this._connected
  }

  // ─── Lifecycle ───────────────────────────────────────────────

  /**
   * Connect to the WebSocket server using the JWT stored in localStorage.
   * Safe to call multiple times — re-uses the existing connection.
   */
  connect() {
    if (this._socket?.connected) return

    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('[Socket] No JWT token found — skipping connection')
      return
    }

    this._socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
    })

    this._socket.on('connect', () => {
      this._connected = true
      console.log('[Socket] Connected:', this._socket?.id)
    })

    this._socket.on('disconnect', (reason) => {
      this._connected = false
      console.log('[Socket] Disconnected:', reason)
    })

    this._socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message)
      // If auth failed, don't spam reconnects
      if (err.message.includes('AUTH_TOKEN')) {
        this.disconnect()
      }
    })
  }

  /**
   * Disconnect and tear down the socket.
   * Call on logout.
   */
  disconnect() {
    if (this._socket) {
      this._socket.removeAllListeners()
      this._socket.disconnect()
      this._socket = null
      this._connected = false
    }
  }

  /**
   * Reconnect with a fresh token (e.g. after token refresh).
   */
  reconnect() {
    this.disconnect()
    this.connect()
  }

  // ─── Room Subscriptions ──────────────────────────────────────

  /**
   * Subscribe to live updates for a specific route.
   * The server validates tenant ownership before allowing the join.
   * @param {string} routeId
   * @returns {Promise<boolean>} true if the server accepted the subscription
   */
  subscribeRoute(routeId) {
    return new Promise((resolve) => {
      if (!this._socket?.connected) return resolve(false)
      this._socket.emit('subscribe:route', routeId, (ok) => resolve(ok))
    })
  }

  /** @param {string} routeId */
  unsubscribeRoute(routeId) {
    this._socket?.emit('unsubscribe:route', routeId)
  }

  /**
   * Subscribe to live updates for a specific vehicle.
   * @param {string} vehicleId
   * @returns {Promise<boolean>} true if the server accepted the subscription
   */
  subscribeVehicle(vehicleId) {
    return new Promise((resolve) => {
      if (!this._socket?.connected) return resolve(false)
      this._socket.emit('subscribe:vehicle', vehicleId, (ok) => resolve(ok))
    })
  }

  /** @param {string} vehicleId */
  unsubscribeVehicle(vehicleId) {
    this._socket?.emit('unsubscribe:vehicle', vehicleId)
  }

  // ─── Event Listeners ────────────────────────────────────────

  /**
   * Register a callback for vehicle telemetry updates.
   * Events arrive for all vehicles in the user's tenant room,
   * plus any specifically-subscribed vehicle/route rooms.
   * @param {(event: VehicleTelemetryEvent) => void} callback
   * @returns {() => void} unsubscribe function
   */
  onVehicleTelemetry(callback) {
    this._socket?.on('vehicle:telemetry', callback)
    return () => {
      this._socket?.off('vehicle:telemetry', callback)
    }
  }

  /**
   * Register a callback for route status changes.
   * @param {(event: RouteStatusEvent) => void} callback
   * @returns {() => void} unsubscribe function
   */
  onRouteStatus(callback) {
    this._socket?.on('route:status', callback)
    return () => {
      this._socket?.off('route:status', callback)
    }
  }

  /**
   * Register a callback for alarm / geofence events.
   * @param {(event: AlarmEvent) => void} callback
   * @returns {() => void} unsubscribe function
   */
  onAlarm(callback) {
    this._socket?.on('alarm', callback)
    return () => {
      this._socket?.off('alarm', callback)
    }
  }

  // ─── Convenience ─────────────────────────────────────────────

  /** Underlying socket instance (for advanced usage) */
  get raw() {
    return this._socket
  }
}

/** Singleton — import this everywhere */
export const socketService = new SocketService()
