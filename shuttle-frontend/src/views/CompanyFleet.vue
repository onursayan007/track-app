<template>
  <div class="flex flex-col gap-6 text-slate-300">
    
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Filo Yönetimi</h1>
        <p class="text-slate-400 mt-1 text-sm">Araçlarınızın telemetri verilerini ve şoför atamalarını canlı takip edin.</p>
      </div>
      <p class="text-[10px] text-slate-500 font-medium flex items-center gap-1">
        <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Filoya yeni araç/cihaz eklemek için Sistem Yöneticisi ile iletişime geçin.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-6">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <p class="text-xs lg:text-sm font-medium text-slate-400">Sisteme Kayıtlı Araç</p>
          <p class="text-2xl lg:text-3xl font-black text-white mt-1">{{ totalVehicles }}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4M4 17h16" /></svg>
        </div>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <p class="text-xs lg:text-sm font-medium text-slate-400">Aktif Sefere Çıkan Şoför</p>
          <p class="text-2xl lg:text-3xl font-black text-emerald-400 mt-1">{{ activeDrivers }}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>

      <div class="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 shadow-[0_0_15px_rgba(225,29,72,0.15)] flex items-center justify-between relative overflow-hidden">
        <div class="absolute -right-4 -top-4 w-16 h-16 bg-rose-500/20 rounded-full blur-xl animate-pulse"></div>
        <div class="relative z-10">
          <p class="text-[11px] lg:text-xs font-bold text-rose-400 uppercase tracking-wider leading-tight mb-1">Kaçak/Şüpheli Kullanım</p>
          <div class="flex items-end gap-2">
            <p class="text-2xl lg:text-3xl font-black text-white">{{ conflictCount }}</p>
            <p class="text-[10px] lg:text-xs text-slate-400 mb-1">Araç tespit edildi</p>
          </div>
        </div>
        <div class="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg relative z-10 animate-bounce shrink-0 ml-2">
          <svg class="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
      </div>
    </div>

    <div class="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div class="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <table class="w-full min-w-[850px] text-sm text-left">
          <thead class="bg-slate-800/50">
            <tr>
              <th scope="col" class="py-4 pl-6 pr-3 font-bold text-slate-400 uppercase tracking-wider text-xs">Plaka & Araç</th>
              <th scope="col" class="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Atanan Şoför</th>
              <th scope="col" class="px-4 py-4 text-center font-bold text-slate-400 uppercase tracking-wider text-xs">Kontak (GPS)</th>
              <th scope="col" class="px-4 py-4 text-center font-bold text-slate-400 uppercase tracking-wider text-xs">Uygulama</th>
              <th scope="col" class="px-4 py-4 text-right font-bold text-slate-400 uppercase tracking-wider text-xs">Gerçek KM</th>
              <th scope="col" class="py-4 pl-3 pr-6 text-right font-bold text-slate-400 uppercase tracking-wider text-xs">İşlem</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/50">
            <tr v-for="vehicle in vehicles" :key="vehicle.id" 
                :class="['hover:bg-slate-800/40 transition-colors group', vehicle.hasConflict ? 'bg-rose-500/5 border-l-4 border-l-rose-500' : 'border-l-4 border-l-transparent']">
              
              <td class="py-4 pl-6 pr-3">
                <div class="flex items-center gap-3">
                  <div :class="['w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 border transition-all overflow-hidden', vehicle.hasConflict ? 'bg-rose-500 border-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.4)]' : 'bg-slate-800 border-slate-700 group-hover:border-slate-600']">
                    <img v-if="vehicle.photoUrl" :src="photoUrl(vehicle.photoUrl)" :alt="vehicle.model" class="h-full w-full object-cover" @error="$event.target.style.display='none'" />
                    <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4M4 17h16" /></svg>
                  </div>
                  <div class="min-w-0">
                    <div class="font-mono font-bold text-white text-base truncate">{{ vehicle.plate }}</div>
                    <div class="text-xs text-slate-500 truncate">{{ vehicle.model }}</div>
                  </div>
                </div>
              </td>
              
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="font-medium text-slate-200">{{ vehicle.driverName }}</div>
                <div class="text-xs text-slate-500">{{ vehicle.phone }}</div>
              </td>
              
              <td class="px-4 py-4 text-center whitespace-nowrap">
                <span v-if="vehicle.ignition" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> AÇIK
                </span>
                <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 shadow-sm">
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span> KAPALI
                </span>
              </td>

              <td class="px-4 py-4 text-center whitespace-nowrap">
                <span v-if="vehicle.appOnline" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Aktif
                </span>
                <span v-else class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-500 border border-slate-700 shadow-sm">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  Çevrimdışı
                </span>
              </td>

              <td class="px-4 py-4 text-right">
                <div class="font-mono text-slate-300 whitespace-nowrap">{{ vehicle.odometer.toLocaleString('tr-TR') }} km</div>
                <div v-if="vehicle.hasConflict" class="text-[10px] text-rose-400 font-bold mt-1.5 leading-tight max-w-[140px] ml-auto">
                  ⚠️ UYARI: Uygulama Kapalı, Kontak Açık!
                </div>
              </td>

              <td class="py-4 pl-3 pr-6 text-right whitespace-nowrap">
                <button @click="openAssignModal(vehicle)" class="text-orange-400 hover:text-white font-medium text-sm transition-colors bg-orange-500/10 hover:bg-orange-500 px-3 py-1.5 rounded-lg border border-orange-500/20 hover:border-orange-500 mr-2">
                  Şoför Değiştir
                </button>
                <button @click="downloadQrPdf(vehicle)" class="text-indigo-300 hover:text-white font-medium text-sm transition-colors bg-indigo-500/10 hover:bg-indigo-500 px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:border-indigo-500 mr-2">
                  QR İndir
                </button>
                <button @click="openGeofenceModal(vehicle)" class="text-cyan-400 hover:text-white font-medium text-sm transition-colors bg-cyan-500/10 hover:bg-cyan-500 px-3 py-1.5 rounded-lg border border-cyan-500/20 hover:border-cyan-500">
                  Sanal Çit Ata
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Assign Driver Modal -->
    <AssignDriverModal
      v-if="assignTarget"
      :vehicleId="assignTarget.id"
      :vehiclePlate="assignTarget.plate"
      :currentDriverId="assignTarget.currentDriverId"
      :currentClientId="assignTarget.currentClientId"
      @close="assignTarget = null"
      @assigned="onDriverAssigned"
    />

    <Teleport to="body">
      <div v-if="geofenceTarget" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="geofenceTarget = null"></div>
        <div class="relative z-10 w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
          <div class="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-white">Sanal Çit Ata</h3>
              <p class="text-sm text-slate-400 font-mono">{{ geofenceTarget.plate }}</p>
            </div>
            <button @click="geofenceTarget = null" class="text-slate-400 hover:text-white">✕</button>
          </div>
          <div class="p-6 max-h-[55vh] overflow-y-auto space-y-2">
            <label v-for="g in geofences" :key="g.id" class="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <span class="text-slate-200">{{ g.name }}</span>
              <input type="checkbox" :value="g.id" v-model="selectedGeofenceIds" class="h-4 w-4" />
            </label>
            <p v-if="!geofences.length" class="text-sm text-slate-500">Önce Firma Ayarları > Sanal Çit Bölgeleri sekmesinden bölge ekleyin.</p>
          </div>
          <div class="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">
            <button @click="geofenceTarget = null" class="px-4 py-2 rounded-lg text-slate-400 hover:text-white">İptal</button>
            <button @click="saveVehicleGeofences" class="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold">Kaydet</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Success Toast -->
    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-2">
      <div v-if="successMsg" class="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-sm font-medium text-emerald-400 shadow-lg backdrop-blur-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
        {{ successMsg }}
      </div>
    </Transition>

    <button
      @click="refreshFleetData"
      class="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 transition-all duration-300 flex items-center gap-2"
      title="Filo verilerini yenile"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span class="text-sm font-semibold">Filoyu Yenile</span>
    </button>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import AssignDriverModal from '../components/AssignDriverModal.vue'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'

const successMsg = ref('')
const isLoading = ref(false)
const loadError = ref('')
const assignTarget = ref(null)
const geofenceTarget = ref(null)
const geofences = ref([])
const selectedGeofenceIds = ref([])

function openAssignModal(vehicle) {
  assignTarget.value = {
    id: vehicle.id,
    plate: vehicle.plate,
    currentDriverId: vehicle.driverId || null,
    currentClientId: vehicle.clientId || null,
  }
}

async function downloadQrPdf(vehicle) {
  try {
    const res = await api.get(`/tenant/vehicles/${vehicle.id}/qr-pdf`, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${vehicle.plate?.replace(/\s+/g, '_') || 'vehicle'}_QR.pdf`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    console.warn('QR PDF indirilemedi:', e.message)
  }
}

function onDriverAssigned() {
  assignTarget.value = null
  successMsg.value = 'Şoför ataması güncellendi!'
  setTimeout(() => { successMsg.value = '' }, 3000)
  fetchFleet()
}

async function fetchGeofences() {
  try {
    const res = await api.get('/tenant/settings/geofences')
    geofences.value = res.data?.data ?? res.data ?? []
  } catch (e) {
    console.warn('Geofence listesi alınamadı:', e.message)
  }
}

async function openGeofenceModal(vehicle) {
  geofenceTarget.value = vehicle
  selectedGeofenceIds.value = []
  try {
    const res = await api.get(`/tenant/settings/geofences/vehicle/${vehicle.id}`)
    const list = res.data?.data ?? res.data ?? []
    selectedGeofenceIds.value = list.map((item) => item.geofenceDefinitionId)
  } catch (e) {
    console.warn('Araç geofence atamaları alınamadı:', e.message)
  }
}

async function saveVehicleGeofences() {
  if (!geofenceTarget.value) return
  await api.put(`/tenant/settings/geofences/vehicle/${geofenceTarget.value.id}`, {
    geofenceDefinitionIds: selectedGeofenceIds.value,
  })
  geofenceTarget.value = null
  successMsg.value = 'Sanal çit atamaları güncellendi!'
  setTimeout(() => { successMsg.value = '' }, 3000)
}

const vehicles = ref([])

const totalVehicles = computed(() => vehicles.value.length)
const activeDrivers = computed(() => vehicles.value.filter(v => v.appOnline).length)
const conflictCount = computed(() => vehicles.value.filter(v => v.hasConflict).length)

function photoUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_BASE}${path}`
}

async function fetchFleet() {
  isLoading.value = true
  loadError.value = ''
  try {
    const res = await api.get('/tenant/vehicles')
    const list = res.data?.data ?? res.data ?? []
    vehicles.value = (Array.isArray(list) ? list : []).map(v => {
      const vm = v.vehicleModel
      const driver = v.assignedDriver
      return {
        id: v.id,
        plate: v.plate,
        model: vm ? `${vm.brand} ${vm.modelName}` : v.model || '—',
        photoUrl: vm?.photoUrl || '',
        driverName: driver?.name || '—',
        driverId: driver?.id || null,
        clientId: v.client?.id || null,
        phone: driver?.phone || '',
        ignition: v.status === 'ACTIVE',
        appOnline: v.status === 'ACTIVE',
        odometer: v.odometer || 0,
        hasConflict: v.status === 'ACTIVE' && !v.assignedDriver,
      }
    })
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Filo yüklenemedi'
    console.warn('fetchFleet hata:', e.message)
  } finally {
    isLoading.value = false
  }
}

async function refreshFleetData() {
  await Promise.all([fetchFleet(), fetchGeofences()])
  successMsg.value = 'Filo verileri güncellendi!'
  setTimeout(() => { successMsg.value = '' }, 2500)
}

onMounted(() => {
  fetchFleet()
  fetchGeofences()
})
</script>