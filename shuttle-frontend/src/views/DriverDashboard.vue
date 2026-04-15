<template>
  <div class="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 p-4 pb-24">
    <div class="max-w-lg mx-auto">
      <div class="mb-5">
        <h1 class="text-2xl font-black text-white">Sürücü Başlangıç</h1>
        <p class="text-sm text-slate-400 mt-1">Araç seçip gidiş/dönüş veya serbest sürüş başlatın.</p>
      </div>

      <div v-if="loading" class="py-12 text-center text-slate-400">Araçlar yükleniyor...</div>
      <div v-else-if="vehicles.length === 0" class="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-500">Atanmış araç bulunamadı.</div>

      <div v-else class="space-y-3">
        <button
          v-for="vehicle in vehicles"
          :key="vehicle.id"
          @click="openTripModal(vehicle)"
          class="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-left active:scale-[0.99] transition"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-black text-lg text-white">{{ vehicle.plate }}</p>
              <p class="text-xs text-slate-400 mt-1">{{ vehicle.brand || '' }} {{ vehicle.model || '' }}</p>
            </div>
            <span class="text-indigo-400 text-xs font-semibold">Sefer Başlat</span>
          </div>
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="tripModalOpen" class="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
        <div class="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-black text-white">Sefer Başlat • {{ selectedVehicle?.plate }}</h2>
            <button @click="tripModalOpen = false" class="text-slate-400 hover:text-white">✕</button>
          </div>

          <div class="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <p class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Option A · Rota Seç</p>
            <select v-model="tripForm.routeId" class="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              <option value="">Rota Seçiniz</option>
              <option v-for="r in selectedVehicleRoutes" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>

            <div class="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5">
              <span class="text-sm font-semibold text-slate-300">Yön</span>
              <button type="button" @click="tripForm.isDirectionForward = !tripForm.isDirectionForward" class="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-2 py-1">
                <span :class="tripForm.isDirectionForward ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'" class="text-xs font-bold rounded-full px-2.5 py-1">Gidiş</span>
                <span :class="!tripForm.isDirectionForward ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'" class="text-xs font-bold rounded-full px-2.5 py-1">Dönüş</span>
              </button>
            </div>
            <button @click="startTripWithRoute" :disabled="starting || !tripForm.routeId" class="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-3 font-bold text-white text-sm">
              {{ starting ? 'Başlatılıyor...' : 'Rota ile Başlat' }}
            </button>
          </div>

          <div class="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Option B · Free Drive</p>
            <button @click="startFreeDrive" :disabled="starting" class="w-full rounded-xl bg-orange-600 hover:bg-orange-500 py-3 font-black text-white text-sm">
              Rotasız / Serbest Sürüş
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="incomingRequest" class="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="w-full max-w-md rounded-2xl border border-rose-700 bg-slate-900 p-4">
            <p class="text-xs uppercase tracking-wider text-rose-300 font-black">Yeni Yolcu Talebi</p>
            <p class="mt-2 text-lg font-black text-white">{{ incomingRequest.passengerName }}</p>
            <p class="text-sm text-slate-300">{{ incomingRequest.phone }}</p>
            <p class="text-xs text-slate-500 mt-1">Sefer ekranında onaylayın veya reddedin.</p>
            <button @click="goToRouteForApproval" class="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-black text-white">Onay Ekranına Git</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { io } from 'socket.io-client'

const router = useRouter()

const loading = ref(false)
const starting = ref(false)
const tripModalOpen = ref(false)
const vehicles = ref([])
const selectedVehicle = ref(null)
const incomingRequest = ref(null)
let driverSocket = null

const tripForm = ref({
  routeId: '',
  isDirectionForward: true,
})

const selectedVehicleRoutes = computed(() => selectedVehicle.value?.routes || [])

async function fetchAssignedVehicles() {
  loading.value = true
  try {
    const res = await api.get('/driver/assigned-vehicles')
    vehicles.value = res.data?.data ?? []
    localStorage.setItem('has_multiple_vehicles', String((vehicles.value || []).length > 1))
    window.dispatchEvent(new Event('vehicle-changed'))
  } finally {
    loading.value = false
  }
}

function openTripModal(vehicle) {
  selectedVehicle.value = vehicle
  tripForm.value = { routeId: '', isDirectionForward: true }
  tripModalOpen.value = true
}

async function startTrip(payload) {
  if (!selectedVehicle.value?.id) return
  starting.value = true
  try {
    const res = await api.post('/driver/active-trips/start', {
      vehicleId: selectedVehicle.value.id,
      ...payload,
    })
    const trip = res.data?.data
    localStorage.setItem('active_vehicle', selectedVehicle.value.plate)
    localStorage.setItem('driver_active_trip_id', trip?.id || '')
    window.dispatchEvent(new Event('vehicle-changed'))
    tripModalOpen.value = false
    router.push('/driver/route')
  } finally {
    starting.value = false
  }
}

async function startTripWithRoute() {
  const route = selectedVehicleRoutes.value.find((item) => item.id === tripForm.value.routeId)
  await startTrip({
    routeId: tripForm.value.routeId,
    name: route?.name || 'Rota Seferi',
    isDirectionForward: tripForm.value.isDirectionForward,
  })
}

async function startFreeDrive() {
  await startTrip({
    routeId: null,
    name: 'Rotasız / Serbest Sürüş',
    isDirectionForward: true,
  })
}

function goToRouteForApproval() {
  incomingRequest.value = null
  router.push('/driver/route')
}

function connectDriverSocket() {
  const token = localStorage.getItem('token')
  if (!token) return

  driverSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
    auth: { token },
    transports: ['websocket', 'polling'],
  })

  driverSocket.on('passenger:request_received', (event) => {
    incomingRequest.value = {
      requestId: event?.requestId,
      passengerName: event?.passengerName,
      phone: event?.phone,
    }
  })
}

onMounted(async () => {
  await fetchAssignedVehicles()
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