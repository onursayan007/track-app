<template>
  <div class="flex flex-col gap-6 text-slate-300 h-full min-h-full">
    
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Canlı Operasyon</h1>
        <p class="text-slate-400 mt-1 text-sm">Filonuzun anlık konumunu ve operasyonel durumunu takip edin.</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Canlı
        </span>
        <span class="text-xs text-slate-500">Son güncelleme: {{ lastUpdate }}</span>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Toplam Araç</p>
          <p class="text-2xl font-black text-white mt-1">{{ stats.totalVehicles }}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4M4 17h16" /></svg>
        </div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Online Şoför</p>
          <p class="text-2xl font-black text-emerald-400 mt-1">{{ stats.onlineDrivers }}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Aktif Rota</p>
          <p class="text-2xl font-black text-amber-400 mt-1">{{ stats.activeRoutes }}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 shrink-0">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
        </div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Toplam Kullanıcı</p>
          <p class="text-2xl font-black text-cyan-400 mt-1">{{ stats.userCount }}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shrink-0">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
      </div>
    </div>

    <!-- Map Card -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-4 sm:p-6 transition-all duration-300 flex-1 min-h-[520px] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base sm:text-lg font-bold text-white tracking-tight">Canlı Harita</h2>
        <span class="text-xs text-slate-400">Tema ile senkron</span>
      </div>
      <div class="rounded-xl overflow-hidden border border-slate-800 flex-1 min-h-[420px]">
        <div id="company-live-map" class="w-full h-full min-h-[420px]"></div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl px-6 py-4 shadow-2xl">
        <svg class="animate-spin h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        <span class="text-sm text-white font-medium">Veriler yükleniyor...</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { io } from 'socket.io-client'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import api from '../services/api'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const isLoading = ref(false)
const lastUpdate = ref('—')

const MAP_ELEMENT_ID = 'company-live-map'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

let map = null
let mapTileLayer = null
let shellObserver = null
let pollInterval = null
let socket = null
let mockTelemetryInterval = null
const markers = new Map()
const OFFLINE_MS = 15 * 60 * 1000
const MOCK_BASE_LAT = 37.0662
const MOCK_BASE_LNG = 37.3833
const MOCK_ROUTE_STEP_MS = 3000
const OSRM_ROUTE_URL = 'https://router.project-osrm.org/route/v1/driving'
const mockVehicles = ref([])
let isMockStepRunning = false

const LIGHT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

function resolveTheme() {
  const shell = document.querySelector('.company-shell')
  if (shell?.classList.contains('company-theme-light')) return 'light'
  if (shell?.classList.contains('company-theme-dark')) return 'dark'
  return localStorage.getItem('companyTheme') === 'light' ? 'light' : 'dark'
}

function buildTileLayer(themeMode) {
  if (themeMode === 'light') {
    return L.tileLayer(LIGHT_TILE_URL, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 20,
    })
  }

  return L.tileLayer(DARK_TILE_URL, {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20,
  })
}

function syncMapTheme() {
  if (!map) return
  const currentTheme = resolveTheme()

  if (mapTileLayer) {
    map.removeLayer(mapTileLayer)
  }

  mapTileLayer = buildTileLayer(currentTheme)
  mapTileLayer.addTo(map)
}

const stats = reactive({
  totalVehicles: 0,
  onlineDrivers: 0,
  activeRoutes: 0,
  userCount: 0,
})

function normalizeHeading(heading) {
  const parsed = Number(heading)
  if (!Number.isFinite(parsed)) return 0
  return ((parsed % 360) + 360) % 360
}

function shouldShowMarkerLabels() {
  return !!map && map.getZoom() >= 14
}

function vehicleState(payload, lastSeenMs) {
  const now = Date.now()
  const speed = Number(payload.speed) || 0
  const hasIgnition = typeof payload.ignition === 'boolean'
  const ignition = hasIgnition ? payload.ignition : payload.status !== 'stopped'

  if (lastSeenMs && now - lastSeenMs > OFFLINE_MS) {
    return 'offline'
  }

  if (speed > 0) return 'moving'
  if (ignition) return 'idling'
  return 'stopped'
}

function vehicleStateLabel(state) {
  if (state === 'moving') return 'Hareket Halinde'
  if (state === 'idling') return 'Rölanti'
  if (state === 'offline') return 'Çevrimdışı'
  return 'Durdu'
}

function vehicleIconHtml(payload, state, showLabel) {
  const heading = normalizeHeading(payload.heading)
  const plate = payload.plate || payload.vehicleId || 'Araç'
  const speed = Math.max(0, Math.round(Number(payload.speed) || 0))
  const speedChip = state === 'moving' ? `<div class="vehicle-speed-chip">${speed} km/s</div>` : ''

  return `
    <div class="vehicle-marker vehicle-${state} ${showLabel ? '' : 'label-hidden'}">
      <div class="vehicle-marker-body" style="transform: rotate(${heading}deg)">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l8 20-8-4-8 4 8-20z" />
        </svg>
      </div>
      ${speedChip}
      <div class="vehicle-marker-label">${plate}</div>
    </div>
  `
}

function popupContent(payload, state, lastSeenMs) {
  const speed = Number(payload.speed) || 0
  const plate = payload.plate || payload.vehicleId || '—'
  const driverName = payload.driverName || 'Atanmadı'
  const secondsAgo = Math.max(2, Math.floor((Date.now() - (lastSeenMs || Date.now())) / 1000))

  return `
    <div style="min-width:220px;background:#0f172a;color:#e2e8f0;border:1px solid #1e293b;border-radius:12px;padding:10px 12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong style="font-size:14px;color:#fff;">${plate}</strong>
        <span style="font-size:11px;color:#94a3b8;">${vehicleStateLabel(state)}</span>
      </div>
      <div style="font-size:12px;line-height:1.6;">
        <div><span style="color:#94a3b8;">Şoför:</span> ${driverName}</div>
        <div><span style="color:#94a3b8;">Hız:</span> ${speed} km/s</div>
        <div><span style="color:#94a3b8;">Durum:</span> ${vehicleStateLabel(state)}</div>
        <div><span style="color:#94a3b8;">Last Updated:</span> ${secondsAgo} seconds ago</div>
      </div>
    </div>
  `
}

function refreshMarkerVisual(entry) {
  if (!map || !entry?.marker || !entry?.payload) return

  const state = vehicleState(entry.payload, entry.lastSeenMs)
  const icon = L.divIcon({
    className: 'vehicle-div-icon',
    html: vehicleIconHtml(entry.payload, state, shouldShowMarkerLabels()),
    iconSize: [46, 52],
    iconAnchor: [23, 20],
    popupAnchor: [0, -12],
  })

  entry.marker.setIcon(icon)
  entry.marker.setPopupContent(popupContent(entry.payload, state, entry.lastSeenMs))
}

function handleZoomEnd() {
  markers.forEach((entry) => refreshMarkerVisual(entry))
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180
}

function toDegrees(radians) {
  return (radians * 180) / Math.PI
}

function calculateBearing(fromLat, fromLng, toLat, toLng) {
  const φ1 = toRadians(fromLat)
  const φ2 = toRadians(toLat)
  const λ1 = toRadians(fromLng)
  const λ2 = toRadians(toLng)
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1)
  return normalizeHeading(toDegrees(Math.atan2(y, x)))
}

function haversineDistanceMeters(fromLat, fromLng, toLat, toLng) {
  const earthRadius = 6371000
  const dLat = toRadians(toLat - fromLat)
  const dLng = toRadians(toLng - fromLng)
  const lat1 = toRadians(fromLat)
  const lat2 = toRadians(toLat)

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadius * c
}

function createNearbyTarget(lat, lng) {
  const heading = randomRange(0, 360)
  const distanceMeters = randomRange(700, 2200)
  const latDelta = (distanceMeters * Math.sin(toRadians(heading))) / 111320
  const lngScale = Math.max(0.2, Math.cos(toRadians(lat)))
  const lngDelta = (distanceMeters * Math.cos(toRadians(heading))) / (111320 * lngScale)

  return {
    lat: Number((lat + latDelta).toFixed(6)),
    lng: Number((lng + lngDelta).toFixed(6)),
  }
}

async function fetchRoadRoute(fromLat, fromLng, toLat, toLng) {
  const from = `${fromLng},${fromLat}`
  const to = `${toLng},${toLat}`
  const url = `${OSRM_ROUTE_URL}/${from};${to}?overview=full&geometries=geojson&steps=false`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`OSRM route request failed (${response.status})`)
  }

  const data = await response.json()
  const coordinates = data?.routes?.[0]?.geometry?.coordinates
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null
  }

  return coordinates.map(([pointLng, pointLat]) => ({
    lat: Number(pointLat.toFixed(6)),
    lng: Number(pointLng.toFixed(6)),
  }))
}

async function ensureVehicleRoadRoute(vehicle) {
  const hasRoute = Array.isArray(vehicle.routePoints) && vehicle.routePoints.length > 1
  const hasRemaining = hasRoute && Number.isFinite(vehicle.routeIndex) && vehicle.routeIndex < vehicle.routePoints.length - 1
  if (hasRemaining || vehicle.routePending) {
    return vehicle
  }

  const pendingVehicle = { ...vehicle, routePending: true }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const target = createNearbyTarget(vehicle.lat, vehicle.lng)
      const points = await fetchRoadRoute(vehicle.lat, vehicle.lng, target.lat, target.lng)
      if (points && points.length > 1) {
        return {
          ...pendingVehicle,
          routePending: false,
          routePoints: points,
          routeIndex: 0,
          lat: points[0].lat,
          lng: points[0].lng,
        }
      }
    } catch {
      // noop
    }
  }

  return {
    ...pendingVehicle,
    routePending: false,
    routePoints: null,
    routeIndex: 0,
  }
}

async function bootstrapMockVehiclesFromFleet() {
  try {
    const res = await api.get('/tenant/vehicles')
    const list = res.data?.data ?? res.data ?? []
    const vehicles = Array.isArray(list) ? list : []

    const selected = vehicles.slice(0, 10).map((vehicle, index) => {
      const driver = vehicle.assignedDriver
      return {
        vehicleId: vehicle.id,
        plate: vehicle.plate || `34 MOCK ${index + 1}`,
        driverName: driver?.name || 'Atanmadı',
        lat: MOCK_BASE_LAT + randomRange(-0.02, 0.02),
        lng: MOCK_BASE_LNG + randomRange(-0.02, 0.02),
        heading: Math.round(randomRange(0, 360)),
        speed: Math.round(randomRange(0, 70)),
        ignition: true,
        status: 'moving',
        routePoints: null,
        routeIndex: 0,
        routePending: false,
      }
    })

    if (selected.length === 0) {
      selected.push({
        vehicleId: 'mock-fallback-1',
        plate: '34 MOCK 01',
        driverName: 'Mock Şoför',
        lat: MOCK_BASE_LAT,
        lng: MOCK_BASE_LNG,
        heading: 90,
        speed: 30,
        ignition: true,
        status: 'moving',
        routePoints: null,
        routeIndex: 0,
        routePending: false,
      })
    }

    mockVehicles.value = selected

    selected.forEach((vehicle) => {
      upsertVehicleMarker({ ...vehicle })
    })
  } catch (e) {
    console.warn('Mock araç listesi hazırlanamadı:', e.message)
  }
}

async function stepMockVehicles() {
  if (!mockVehicles.value.length || isMockStepRunning) return
  isMockStepRunning = true

  try {
    const next = await Promise.all(
      mockVehicles.value.map(async (vehicle) => {
        const routedVehicle = await ensureVehicleRoadRoute(vehicle)
        const points = routedVehicle.routePoints
        const currentIndex = Number.isFinite(routedVehicle.routeIndex) ? routedVehicle.routeIndex : 0

        if (Array.isArray(points) && points.length > 1 && currentIndex < points.length - 1) {
          const fromPoint = points[currentIndex]
          const toPoint = points[currentIndex + 1]
          const heading = Math.round(calculateBearing(fromPoint.lat, fromPoint.lng, toPoint.lat, toPoint.lng))
          const segmentMeters = haversineDistanceMeters(fromPoint.lat, fromPoint.lng, toPoint.lat, toPoint.lng)
          const speed = clamp(Math.round(segmentMeters * 1.2), 12, 92)

          return {
            ...routedVehicle,
            lat: toPoint.lat,
            lng: toPoint.lng,
            heading,
            speed,
            ignition: true,
            status: 'moving',
            routeIndex: currentIndex + 1,
          }
        }

        return {
          ...routedVehicle,
          speed: 0,
          ignition: false,
          status: 'idling',
          heading: Math.round(normalizeHeading(routedVehicle.heading || 0)),
        }
      })
    )

    mockVehicles.value = next
    next.forEach((vehicle) => upsertVehicleMarker({ ...vehicle }))
  } finally {
    isMockStepRunning = false
  }
}

async function startMockTelemetry() {
  await bootstrapMockVehiclesFromFleet()
  if (mockTelemetryInterval) clearInterval(mockTelemetryInterval)
  await stepMockVehicles()
  mockTelemetryInterval = setInterval(() => {
    stepMockVehicles()
  }, MOCK_ROUTE_STEP_MS)
}

function getTenantIdFromSession() {
  const userRaw = localStorage.getItem('user')
  if (userRaw) {
    try {
      const user = JSON.parse(userRaw)
      if (user?.tenantId) return user.tenantId
    } catch {
      // noop
    }
  }

  const token = localStorage.getItem('token')
  if (!token) return null

  try {
    const payloadBase64 = token.split('.')[1]
    const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(atob(normalized))
    return decoded?.tenantId || null
  } catch {
    return null
  }
}

function upsertVehicleMarker(payload) {
  if (!map) return

  const lat = Number(payload.lat)
  const lng = Number(payload.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !payload.vehicleId) return

  const markerPosition = [lat, lng]
  const now = Date.now()
  const existingEntry = markers.get(payload.vehicleId)

  if (!existingEntry) {
    const initialState = vehicleState(payload, now)
    const marker = L.marker(markerPosition, {
      icon: L.divIcon({
        className: 'vehicle-div-icon',
        html: vehicleIconHtml(payload, initialState, shouldShowMarkerLabels()),
        iconSize: [46, 52],
        iconAnchor: [23, 20],
        popupAnchor: [0, -12],
      }),
    }).addTo(map)

    marker.bindPopup(popupContent(payload, initialState, now), {
      className: 'vehicle-popup-shell',
    })

    const entry = { marker, payload: { ...payload }, lastSeenMs: now }
    markers.set(payload.vehicleId, entry)
    refreshMarkerVisual(entry)

    if (markers.size === 1) {
      map.setView(markerPosition, 14)
    }
  } else {
    existingEntry.payload = { ...existingEntry.payload, ...payload }
    existingEntry.lastSeenMs = now
    existingEntry.marker.setLatLng(markerPosition)
    refreshMarkerVisual(existingEntry)
  }

  lastUpdate.value = new Date().toLocaleTimeString('tr-TR')
}

function initMap() {
  if (map) return

  map = L.map(MAP_ELEMENT_ID, {
    zoomControl: true,
    preferCanvas: true,
  }).setView([37.0662, 37.3833], 13)

  syncMapTheme()
  map.on('zoomend', handleZoomEnd)

  const shell = document.querySelector('.company-shell')
  if (shell) {
    shellObserver = new MutationObserver(() => {
      syncMapTheme()
    })

    shellObserver.observe(shell, {
      attributes: true,
      attributeFilter: ['class'],
    })
  }
}

function initSocketConnection() {
  const token = localStorage.getItem('token')
  if (!token) return

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    const tenantId = getTenantIdFromSession()
    if (tenantId) {
      socket.emit('joinRoom', tenantId)
    }
  })

  socket.on('vehicle:location_update', upsertVehicleMarker)
  socket.on('vehicle:telemetry', upsertVehicleMarker)
}

async function fetchDashboard() {
  isLoading.value = true
  try {
    const res = await api.get('/tenant/dashboard')
    const d = res.data?.data ?? res.data ?? {}
    stats.totalVehicles = d.vehicles?.total ?? 0
    stats.onlineDrivers = d.vehicles?.active ?? 0
    stats.activeRoutes = d.routes?.active ?? 0
    stats.userCount = d.userCount ?? 0
    lastUpdate.value = new Date().toLocaleTimeString('tr-TR')
  } catch (e) {
    console.warn('Dashboard verisi alınamadı:', e.message)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  initMap()
  initSocketConnection()
  fetchDashboard()
  startMockTelemetry()
  pollInterval = setInterval(fetchDashboard, 30_000)
})

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval)
  if (mockTelemetryInterval) {
    clearInterval(mockTelemetryInterval)
    mockTelemetryInterval = null
  }

  if (shellObserver) {
    shellObserver.disconnect()
    shellObserver = null
  }

  if (socket) {
    socket.off('vehicle:location_update', upsertVehicleMarker)
    socket.off('vehicle:telemetry', upsertVehicleMarker)
    socket.disconnect()
    socket = null
  }

  markers.clear()

  if (map) {
    map.off('zoomend', handleZoomEnd)
    mapTileLayer = null
    map.remove()
    map = null
  }
})
</script>

<style>
.vehicle-div-icon {
  background: transparent;
  border: 0;
}

.vehicle-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.vehicle-marker-body {
  width: 26px;
  height: 26px;
  border-radius: 9999px;
  border: 2px solid rgba(15, 23, 42, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(2, 6, 23, 0.4);
  transition: transform 0.3s ease-in-out, background-color 0.3s ease-in-out;
}

.vehicle-marker-body svg {
  width: 13px;
  height: 13px;
}

.vehicle-marker-label {
  padding: 2px 6px;
  border-radius: 9999px;
  font-size: 10px;
  line-height: 1;
  font-weight: 700;
  color: #ffffff;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(71, 85, 105, 0.9);
  white-space: nowrap;
}

.vehicle-speed-chip {
  padding: 2px 6px;
  border-radius: 9999px;
  font-size: 10px;
  line-height: 1;
  font-weight: 700;
  color: #e2e8f0;
  background: rgba(2, 6, 23, 0.88);
  border: 1px solid rgba(100, 116, 139, 0.6);
  white-space: nowrap;
}

.vehicle-marker.label-hidden .vehicle-marker-label {
  display: none;
}

.vehicle-marker.label-hidden .vehicle-speed-chip {
  display: none;
}

.vehicle-marker.vehicle-moving .vehicle-marker-body {
  background: #10b981;
  color: #ecfdf5;
}

.vehicle-marker.vehicle-idling .vehicle-marker-body {
  background: #f59e0b;
  color: #fffbeb;
}

.vehicle-marker.vehicle-stopped .vehicle-marker-body {
  background: #f43f5e;
  color: #fff1f2;
}

.vehicle-marker.vehicle-offline .vehicle-marker-body {
  background: #475569;
  color: #f8fafc;
}

.vehicle-popup-shell .leaflet-popup-content-wrapper,
.vehicle-popup-shell .leaflet-popup-tip {
  background: transparent;
  box-shadow: none;
}

.vehicle-popup-shell .leaflet-popup-content {
  margin: 0;
}
</style>
