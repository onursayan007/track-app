<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 p-3">
    <div class="mx-auto max-w-md space-y-3">
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h1 class="text-lg font-black text-white">Servisim Geliyor</h1>
        <p class="mt-1 text-xs text-slate-400">Canlı araç takibi ve sürücü onaylı katılım ekranı</p>
        <p v-if="vehicleState?.vehicle?.plate" class="mt-2 text-sm font-bold text-indigo-300">Araç: {{ vehicleState.vehicle.plate }}</p>
      </div>

      <div class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <l-map
          v-if="mapReady"
          :center="mapCenter"
          :zoom="15"
          :use-global-leaflet="false"
          style="height: 46vh"
        >
          <l-tile-layer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            layer-type="base"
            name="Dark"
          />

          <l-polyline v-if="trackingStopsLatLng.length > 1" :lat-lngs="trackingStopsLatLng" color="#6366f1" :weight="4" />

          <l-marker v-if="vehicleLocation" :lat-lng="[vehicleLocation.lat, vehicleLocation.lng]">
            <l-icon :icon-size="[24, 24]" :icon-anchor="[12, 12]" class-name="bg-transparent border-none">
              <div class="relative flex items-center justify-center w-full h-full">
                <div class="absolute w-7 h-7 rounded-full bg-cyan-400/40 animate-ping"></div>
                <div class="relative h-4 w-4 rounded-full border-2 border-white bg-cyan-400"></div>
              </div>
            </l-icon>
          </l-marker>
        </l-map>
      </div>

      <Transition name="fade">
        <div v-if="loading" class="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Yükleniyor...</div>
      </Transition>

      <Transition name="fade">
        <div v-if="!loading && !vehicleState?.activeTrip" class="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-amber-300">
          Şu an aktif sefer bulunmuyor.
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="!loading && vehicleState?.activeTrip" class="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
          <p class="text-xs uppercase tracking-wider text-slate-500 font-bold">Aktif Sefer</p>
          <p class="text-base font-black text-white">{{ vehicleState.activeTrip.name }}</p>
          <button
            v-if="mode === 'landing'"
            @click="showJoinForm = true"
            class="w-full rounded-xl bg-indigo-600 py-3 text-sm font-black text-white"
          >
            Servise Katıl
          </button>

          <div v-if="showJoinForm && mode === 'landing'" class="space-y-2">
            <input v-model="form.name" type="text" placeholder="Ad" class="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" />
            <input v-model="form.surname" type="text" placeholder="Soyad" class="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" />
            <input v-model="form.phone" type="tel" placeholder="Telefon Numarası" class="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" />

            <button
              @click="submitJoinRequest"
              :disabled="submitting || isBlocked"
              class="w-full rounded-xl bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              {{ submitting ? 'Gönderiliyor...' : 'Onay İsteği Gönder' }}
            </button>

            <p v-if="isBlocked" class="text-xs text-rose-300">Yeni istek için {{ countdownLabel }} bekleyin.</p>
          </div>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="mode === 'waiting'" class="rounded-2xl border border-indigo-800 bg-indigo-950/40 p-4 text-center">
          <div class="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-indigo-300 border-t-transparent"></div>
          <p class="text-sm font-bold text-indigo-200">Şoför Onayı Bekleniyor...</p>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="mode === 'tracking'" class="rounded-2xl border border-emerald-800 bg-emerald-950/40 p-4 space-y-2">
          <p class="text-sm font-black text-emerald-300">Talebiniz Onaylandı</p>
          <p class="text-xs text-slate-300">Rota: {{ approvedRouteName || vehicleState?.activeTrip?.name }}</p>
          <p class="text-xs text-slate-300">Tahmini varış (basit ETA): {{ etaMinutes }} dk</p>
          <div class="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p class="text-[11px] text-slate-500 uppercase font-bold mb-2">Duraklar</p>
            <div class="space-y-1 max-h-32 overflow-y-auto">
              <p v-for="stop in trackingStops" :key="stop.id" class="text-xs text-slate-300">• {{ stop.name }}</p>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="mode === 'rejected'" class="rounded-2xl border border-rose-800 bg-rose-950/40 p-4 text-sm text-rose-300">
          Talebiniz reddedildi. 10 dakika boyunca yeni başvuru engellendi.
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { io } from 'socket.io-client'
import { LIcon, LMap, LMarker, LPolyline, LTileLayer } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import { useRoute } from 'vue-router'

const route = useRoute()

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const SOCKET_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

const loading = ref(false)
const submitting = ref(false)
const showJoinForm = ref(false)
const mapReady = ref(true)
const mode = ref('landing') // landing | waiting | tracking | rejected

const vehicleState = ref(null)
const vehicleLocation = ref(null)
const trackingStops = ref([])
const approvedRouteName = ref('')
const requestId = ref('')

const form = ref({
  name: '',
  surname: '',
  phone: '',
})

const blockUntil = ref(0)
let blockTimer = null
let socket = null

const mapCenter = computed(() => {
  if (vehicleLocation.value) return [vehicleLocation.value.lat, vehicleLocation.value.lng]
  const live = vehicleState.value?.liveLocation
  if (live) return [live.lat, live.lng]
  const firstStop = vehicleState.value?.activeTrip?.route?.stops?.[0]
  if (firstStop) return [firstStop.latitude, firstStop.longitude]
  return [37.0662, 37.3833]
})

const trackingStopsLatLng = computed(() =>
  trackingStops.value.map((stop) => [stop.latitude, stop.longitude]),
)

const isBlocked = computed(() => Date.now() < blockUntil.value)

const countdownLabel = computed(() => {
  const diff = Math.max(0, blockUntil.value - Date.now())
  const mins = Math.ceil(diff / 60000)
  return `${mins} dk`
})

const etaMinutes = computed(() => {
  if (!vehicleLocation.value || trackingStops.value.length === 0) return '-'
  const target = trackingStops.value[0]
  const distanceKm = haversineKm(vehicleLocation.value.lat, vehicleLocation.value.lng, target.latitude, target.longitude)
  const avgSpeedKmh = 35
  return Math.max(1, Math.ceil((distanceKm / avgSpeedKmh) * 60))
})

function haversineKm(lat1, lng1, lat2, lng2) {
  const rad = (v) => (v * Math.PI) / 180
  const R = 6371
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function normalizePhone(raw) {
  return String(raw || '').replace(/\D+/g, '').slice(-10)
}

function blockStorageKey() {
  const phone = normalizePhone(form.value.phone)
  return `portal:block:${route.params.publicAccessId}:${phone}`
}

async function fetchVehicleState() {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/public/vehicle/${route.params.publicAccessId}`)
    const data = await response.json()
    if (!response.ok || !data?.success) throw new Error(data?.message || 'Portal verisi alınamadı')

    vehicleState.value = data.data
    if (data.data?.liveLocation) {
      vehicleLocation.value = {
        lat: data.data.liveLocation.lat,
        lng: data.data.liveLocation.lng,
      }
    }
  } finally {
    loading.value = false
  }
}

function connectPublicSocket() {
  socket = io(`${SOCKET_BASE}/public`, {
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    socket.emit('subscribe:public_vehicle', route.params.publicAccessId)
    if (requestId.value) {
      socket.emit('subscribe:request_status', requestId.value)
    }
  })

  socket.on('vehicle:telemetry', (event) => {
    if (!vehicleState.value?.vehicle?.id || event.vehicleId !== vehicleState.value.vehicle.id) return
    vehicleLocation.value = { lat: Number(event.lat), lng: Number(event.lng) }
  })

  socket.on('passenger:request_approved', (event) => {
    if (!requestId.value || event.requestId !== requestId.value) return
    mode.value = 'tracking'
    approvedRouteName.value = event.routeName || ''
    trackingStops.value = Array.isArray(event.stops) ? event.stops : []
  })

  socket.on('passenger:request_rejected', (event) => {
    if (!requestId.value || event.requestId !== requestId.value) return
    mode.value = 'rejected'
    const retryAfter = Number(event.retryAfterSeconds || 600)
    blockUntil.value = Date.now() + retryAfter * 1000
    localStorage.setItem(blockStorageKey(), String(blockUntil.value))
  })

  socket.on('trip:closed', () => {
    mode.value = 'landing'
    vehicleState.value = {
      ...(vehicleState.value || {}),
      activeTrip: null,
    }
  })
}

async function submitJoinRequest() {
  if (isBlocked.value) return

  const payload = {
    publicAccessId: String(route.params.publicAccessId || ''),
    name: form.value.name.trim(),
    surname: form.value.surname.trim(),
    phone: form.value.phone.trim(),
  }

  if (!payload.name || !payload.surname || normalizePhone(payload.phone).length < 10) {
    return
  }

  submitting.value = true
  try {
    const response = await fetch(`${API_BASE}/public/join-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json()

    if (response.status === 429 && data?.retryAt) {
      blockUntil.value = new Date(data.retryAt).getTime()
      localStorage.setItem(blockStorageKey(), String(blockUntil.value))
      mode.value = 'rejected'
      return
    }

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || 'Talep gönderilemedi')
    }

    requestId.value = data.data.requestId
    mode.value = 'waiting'
    showJoinForm.value = false
    socket?.emit('subscribe:request_status', requestId.value)

    const routeStops = vehicleState.value?.activeTrip?.route?.stops || []
    trackingStops.value = routeStops
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await fetchVehicleState()
  connectPublicSocket()

  const stored = Number(localStorage.getItem(blockStorageKey()) || 0)
  if (stored > Date.now()) {
    blockUntil.value = stored
    mode.value = 'rejected'
  }

  blockTimer = window.setInterval(() => {
    if (blockUntil.value > 0 && Date.now() >= blockUntil.value) {
      blockUntil.value = 0
      if (mode.value === 'rejected') mode.value = 'landing'
      localStorage.removeItem(blockStorageKey())
    }
  }, 1000)
})

onBeforeUnmount(() => {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  if (blockTimer) {
    clearInterval(blockTimer)
    blockTimer = null
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:deep(.leaflet-control-zoom),
:deep(.leaflet-control-attribution) {
  display: none !important;
}
</style>
