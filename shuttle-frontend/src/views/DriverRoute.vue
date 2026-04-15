<template>
  <div class="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 p-4 pb-24">
    <div class="max-w-lg mx-auto space-y-4">
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div class="flex items-center justify-between gap-2">
          <h1 class="text-xl font-black text-white">Aktif Sefer</h1>
          <router-link to="/driver/create-route" class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200">
            Yeni Rota
          </router-link>
        </div>
        <p v-if="loading" class="text-sm text-slate-400 mt-2">Sefer yükleniyor...</p>
        <div v-else-if="!activeTrip" class="mt-3 text-sm text-slate-500">Aktif sefer yok. Dashboard'dan sefer başlatın.</div>
        <div v-else class="mt-3 space-y-2">
          <p class="text-sm text-slate-300 font-semibold">{{ activeTrip.name }}</p>
          <p class="text-xs text-slate-400">Araç: {{ activeTrip.vehicle?.plate || '-' }}</p>
          <p class="text-xs" :class="activeTrip.isDirectionForward ? 'text-indigo-300' : 'text-amber-300'">
            Yön: {{ activeTrip.isDirectionForward ? 'Gidiş' : 'Dönüş' }}
          </p>
          <button @click="completeTrip" class="mt-2 w-full rounded-xl bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-black text-white">SEFERİ BİTİR</button>
        </div>
      </div>

      <div v-if="activeTrip" class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 class="text-sm uppercase tracking-wider text-slate-400 font-semibold">Adım Adım Navigasyon</h2>
        <div v-if="orderedStops.length === 0" class="text-sm text-slate-500 mt-3">Bu sefer için durak yok (Serbest Sürüş).</div>
        <div v-else>
          <div class="mt-3 rounded-xl border border-slate-700 bg-slate-950 p-4">
            <p class="text-[11px] text-slate-500 uppercase font-bold">Hedef Durak</p>
            <p class="text-base font-black text-white mt-1">{{ currentStop?.name }}</p>
            <p class="text-xs text-slate-400 mt-1">{{ currentStopIndex + 1 }} / {{ orderedStops.length }}</p>
          </div>

          <div class="mt-3 grid grid-cols-1 gap-2">
            <button @click="openNativeNavigation" class="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-bold text-white">
              Navigasyonu Aç
            </button>
            <button @click="completeCurrentStop" :disabled="currentStopIndex >= orderedStops.length - 1" class="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 text-sm font-bold text-white">
              Durak Tamamlandı - Devam Et
            </button>
          </div>
        </div>
      </div>

      <div v-if="activeTrip" class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 class="text-sm uppercase tracking-wider text-slate-400 font-semibold">Onaylı Yolcular</h2>
        <div v-if="approvedPassengers.length === 0" class="text-sm text-slate-500 mt-3">Onaylı yolcu bulunmuyor.</div>
        <div v-else class="mt-3 space-y-3">
          <div v-for="p in approvedPassengers" :key="p.id" class="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p class="font-bold text-white text-sm">{{ p.passengerName }}</p>
            <p class="text-xs text-slate-400 mt-0.5">{{ p.phone }}</p>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <button @click="updateRideStatus(p.id, 'BOARDED')" class="rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 text-sm font-bold text-white">Bindi</button>
              <button @click="updateRideStatus(p.id, 'NO_SHOW')" class="rounded-lg bg-rose-600 hover:bg-rose-500 py-2.5 text-sm font-bold text-white">Gelmedi</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="incomingRequest" class="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="w-full max-w-md rounded-2xl border border-rose-700 bg-slate-900 p-4">
            <p class="text-xs uppercase tracking-wider text-rose-300 font-black">Yeni Yolcu Talebi</p>
            <p class="mt-2 text-lg font-black text-white">{{ incomingRequest.passengerName }}</p>
            <p class="text-sm text-slate-300">{{ incomingRequest.phone }}</p>
            <p class="text-xs text-slate-500 mt-1">Anında karar verin.</p>
            <div class="mt-4 grid grid-cols-2 gap-2">
              <button @click="decideRequest('APPROVED')" :disabled="decisionLoading" class="rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-black text-white">Onayla</button>
              <button @click="decideRequest('REJECTED')" :disabled="decisionLoading" class="rounded-xl bg-rose-600 hover:bg-rose-500 py-3 text-sm font-black text-white">Reddet</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { io } from 'socket.io-client'
import api from '@/services/api'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const activeTrip = ref(null)
const approvedPassengers = ref([])
const currentStopIndex = ref(0)
const incomingRequest = ref(null)
const decisionLoading = ref(false)

const pendingQueue = ref([])
let driverSocket = null

const orderedStops = computed(() => {
  const stops = activeTrip.value?.route?.stops || []
  if (!activeTrip.value) return []
  return activeTrip.value.isDirectionForward ? [...stops] : [...stops].reverse()
})

const currentStop = computed(() => orderedStops.value[currentStopIndex.value] || null)

async function fetchCurrentTrip() {
  loading.value = true
  try {
    const res = await api.get('/driver/active-trips/current')
    activeTrip.value = res.data?.data || null
    currentStopIndex.value = 0
  } finally {
    loading.value = false
  }
}

async function fetchApprovedPassengers() {
  const res = await api.get('/driver/passenger-requests/approved')
  approvedPassengers.value = res.data?.data ?? []
}

async function fetchPendingPassengers() {
  const res = await api.get('/driver/passenger-requests/pending')
  pendingQueue.value = res.data?.data ?? []
  if (!incomingRequest.value && pendingQueue.value.length > 0) {
    incomingRequest.value = pendingQueue.value[0]
  }
}

function openNativeNavigation() {
  if (!currentStop.value) return
  const { latitude, longitude } = currentStop.value
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
  window.open(url, '_blank')
}

function completeCurrentStop() {
  if (currentStopIndex.value < orderedStops.value.length - 1) {
    currentStopIndex.value += 1
  }
}

async function updateRideStatus(requestId, rideStatus) {
  await api.patch(`/driver/passenger-requests/${requestId}/ride-status`, { rideStatus })
  approvedPassengers.value = approvedPassengers.value.map((item) =>
    item.id === requestId ? { ...item, rideStatus } : item,
  )
}

async function completeTrip() {
  if (!activeTrip.value?.id) return
  await api.patch(`/driver/active-trips/${activeTrip.value.id}/complete`)
  activeTrip.value = null
  incomingRequest.value = null
  pendingQueue.value = []
  approvedPassengers.value = []
  localStorage.removeItem('driver_active_trip_id')
  router.push('/driver/dashboard')
}

async function decideRequest(decision) {
  if (!incomingRequest.value?.id) return
  decisionLoading.value = true
  try {
    await api.patch(`/driver/passenger-requests/${incomingRequest.value.id}/decision`, { decision })
    pendingQueue.value = pendingQueue.value.filter((item) => item.id !== incomingRequest.value.id)
    incomingRequest.value = pendingQueue.value[0] || null
    if (decision === 'APPROVED') {
      await fetchApprovedPassengers()
    }
  } finally {
    decisionLoading.value = false
  }
}

function connectDriverSocket() {
  const token = localStorage.getItem('token')
  if (!token) return

  driverSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
    auth: { token },
    transports: ['websocket', 'polling'],
  })

  driverSocket.on('passenger:request_received', (event) => {
    if (!event?.requestId) return
    const exists = pendingQueue.value.some((item) => item.id === event.requestId)
    if (exists) return

    const request = {
      id: event.requestId,
      passengerName: event.passengerName,
      phone: event.phone,
      tripId: event.tripId,
    }
    pendingQueue.value.push(request)
    if (!incomingRequest.value) incomingRequest.value = request
  })
}

onMounted(async () => {
  await fetchCurrentTrip()
  await fetchApprovedPassengers()
  await fetchPendingPassengers()
  connectDriverSocket()
})

onBeforeUnmount(() => {
  if (driverSocket) {
    driverSocket.removeAllListeners()
    driverSocket.disconnect()
    driverSocket = null
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
</style>