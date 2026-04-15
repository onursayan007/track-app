<template>
  <div class="flex flex-col gap-6 text-slate-300">

    <div class="border-b border-slate-800">
      <nav class="flex gap-2">
        <button @click="activeTab = 'routes'" :class="tabClass(activeTab === 'routes')">Rotalar ve Seferler</button>
        <button @click="activeTab = 'shifts'" :class="tabClass(activeTab === 'shifts')">Vardiya Planlama</button>
      </nav>
    </div>

    <template v-if="activeTab === 'routes'">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Tur ve Planlama</h1>
        <p class="text-slate-400 mt-1 text-sm">Rotalarınızı yönetin, turlarınızı planlayın ve sefer takvimini düzenleyin.</p>
      </div>
      <button
        @click="showNewTour = true"
        class="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Yeni Tur Oluştur
      </button>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-6">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Toplam Rota</p>
          <p class="text-2xl font-black text-white mt-1">{{ stats.total }}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7l6-3 5.447 2.724A1 1 0 0121 7.618v10.764a1 1 0 01-1.447.894L15 17l-6 3z" /></svg>
        </div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Aktif Seferler</p>
          <p class="text-2xl font-black text-emerald-400 mt-1">{{ stats.active }}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        </div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Tamamlanan</p>
          <p class="text-2xl font-black text-amber-400 mt-1">{{ stats.completed }}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 shrink-0">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div class="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <table class="w-full min-w-[700px] text-sm text-left">
          <thead class="bg-slate-800/50">
            <tr>
              <th class="py-4 pl-6 pr-3 font-bold text-slate-400 uppercase tracking-wider text-xs">Rota Adı</th>
              <th class="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Tip</th>
              <th class="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Şoför</th>
              <th class="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Araç</th>
              <th class="px-4 py-4 text-center font-bold text-slate-400 uppercase tracking-wider text-xs">Durum</th>
              <th class="py-4 pl-3 pr-6 text-right font-bold text-slate-400 uppercase tracking-wider text-xs">İşlem</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/50">
            <tr v-for="route in routes" :key="route.id" class="hover:bg-slate-800/40 transition-colors group border-l-4 border-l-transparent">
              <td class="py-4 pl-6 pr-3">
                <div class="font-semibold text-white">{{ route.name }}</div>
                <div class="text-xs text-slate-500">{{ route.stops }} durak</div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <span :class="typeClass(route.type)" class="px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm">{{ typeLabel(route.type) }}</span>
              </td>
              <td class="px-4 py-4 text-slate-300">{{ route.driver || '—' }}</td>
              <td class="px-4 py-4 text-slate-300 font-mono">{{ route.plate || '—' }}</td>
              <td class="px-4 py-4 text-center">
                <span :class="statusClass(route.status)" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm">
                  <span :class="dotClass(route.status)" class="w-1.5 h-1.5 rounded-full"></span>
                  {{ statusLabel(route.status) }}
                </span>
              </td>
              <td class="py-4 pl-3 pr-6 text-right whitespace-nowrap">
                <button class="text-orange-400 hover:text-white font-medium text-sm transition-colors bg-orange-500/10 hover:bg-orange-500 px-3 py-1.5 rounded-lg border border-orange-500/20 hover:border-orange-500">
                  Düzenle
                </button>
              </td>
            </tr>
            <tr v-if="!routes.length && !isLoading">
              <td colspan="6" class="py-16 text-center text-slate-500">
                <svg class="w-12 h-12 mx-auto mb-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7l6-3 5.447 2.724A1 1 0 0121 7.618v10.764a1 1 0 01-1.447.894L15 17l-6 3z" /></svg>
                Henüz bir rota tanımlanmamış.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl px-6 py-4 shadow-2xl">
        <svg class="animate-spin h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        <span class="text-sm text-white font-medium">Rotalar yükleniyor...</span>
      </div>
    </div>
    </template>

    <template v-else>
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-slate-400 mb-2">Sürücü Seç</label>
            <select
              v-model="selectedShiftDriverId"
              @change="fetchShifts"
              class="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Sürücü seçiniz</option>
              <option v-for="driver in drivers" :key="driver.id" :value="driver.id">{{ driver.name }}</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-white">Vardiya Planlama</h2>
          <button @click="createShift" class="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-xl" :disabled="!selectedShiftDriverId">Vardiya Ekle</button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[720px] text-sm">
            <thead class="text-slate-500">
              <tr>
                <th class="text-left py-2">Sürücü</th>
                <th class="text-left py-2">Gün</th>
                <th class="text-left py-2">Başlangıç</th>
                <th class="text-left py-2">Bitiş</th>
                <th class="text-right py-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in shifts" :key="s.id" class="border-t border-slate-800">
                <td class="py-3 text-white">{{ s.user?.name || '—' }}</td>
                <td class="py-3">
                  <select v-model.number="s.dayOfWeek" class="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white" @change="updateShift(s)">
                    <option v-for="day in weekDays" :key="day.value" :value="day.value">{{ day.label }}</option>
                  </select>
                </td>
                <td class="py-3"><input type="time" v-model="s.startTime" class="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white" @change="updateShift(s)" /></td>
                <td class="py-3"><input type="time" v-model="s.endTime" class="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white" @change="updateShift(s)" /></td>
                <td class="py-3 text-right"><button @click="deleteShift(s.id)" class="text-rose-400 hover:text-rose-300">Sil</button></td>
              </tr>
              <tr v-if="!shifts.length">
                <td colspan="5" class="py-6 text-center text-slate-500">Henüz vardiya planı oluşturulmadı.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../services/api'

const activeTab = ref('routes')
const showNewTour = ref(false)
const isLoading = ref(false)
const routes = ref([])
const stats = reactive({ total: 0, active: 0, completed: 0 })
const shifts = ref([])
const drivers = ref([])
const selectedShiftDriverId = ref('')

const weekDays = [
  { value: 0, label: 'Pazar' },
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
]

function tabClass(active) {
  return [
    'px-4 py-2.5 rounded-t-xl text-sm font-semibold border border-b-0 transition-colors',
    active
      ? 'bg-slate-900 border-slate-700 text-white'
      : 'bg-slate-950 border-transparent text-slate-400 hover:text-slate-200',
  ]
}

function typeLabel(t) {
  return { SHUTTLE: 'Servis', TRANSFER: 'Transfer', SCHOOL: 'Okul', CORPORATE: 'Kurumsal' }[t] || t
}
function typeClass(t) {
  return { SHUTTLE: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', TRANSFER: 'bg-violet-500/10 text-violet-400 border-violet-500/20', SCHOOL: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', CORPORATE: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' }[t] || 'bg-slate-800 text-slate-400 border-slate-700'
}
function statusLabel(s) {
  return { DRAFT: 'Taslak', ACTIVE: 'Aktif', COMPLETED: 'Tamamlandı', CANCELLED: 'İptal' }[s] || s
}
function statusClass(s) {
  return { DRAFT: 'bg-slate-800 text-slate-400 border-slate-700', ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', COMPLETED: 'bg-amber-500/10 text-amber-400 border-amber-500/20', CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }[s] || 'bg-slate-800 text-slate-400 border-slate-700'
}
function dotClass(s) {
  return { DRAFT: 'bg-slate-500', ACTIVE: 'bg-emerald-500 animate-pulse', COMPLETED: 'bg-amber-500', CANCELLED: 'bg-rose-500' }[s] || 'bg-slate-500'
}

async function fetchRoutes() {
  isLoading.value = true
  try {
    // Fetch stats
    const statsRes = await api.get('/tenant/routes/stats')
    const sd = statsRes.data?.data ?? statsRes.data ?? {}
    stats.total = sd.total ?? 0
    stats.active = sd.active ?? 0
    stats.completed = sd.completed ?? 0

    // Fetch route list
    const res = await api.get('/tenant/routes')
    const list = res.data?.data ?? res.data ?? []
    routes.value = (Array.isArray(list) ? list : []).map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      status: r.status,
      driver: r.driver?.name || null,
      plate: r.vehicle?.plate || null,
      stops: r.stops?.length ?? 0,
    }))
  } catch (e) {
    console.warn('Rota verisi alınamadı:', e.message)
  } finally {
    isLoading.value = false
  }
}

async function fetchDrivers() {
  try {
    const res = await api.get('/tenant/drivers')
    drivers.value = res.data?.data ?? res.data ?? []
  } catch (e) {
    console.warn('Sürücüler alınamadı:', e.message)
  }
}

async function fetchShifts() {
  try {
    const params = selectedShiftDriverId.value ? { userId: selectedShiftDriverId.value } : undefined
    const res = await api.get('/tenant/shifts', { params })
    shifts.value = res.data?.data ?? res.data ?? []
  } catch (e) {
    console.warn('Vardiyalar alınamadı:', e.message)
  }
}

async function createShift() {
  if (!selectedShiftDriverId.value) return
  await api.post('/tenant/shifts', {
    userId: selectedShiftDriverId.value,
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '18:00',
  })
  await fetchShifts()
}

async function updateShift(shift) {
  await api.put(`/tenant/shifts/${shift.id}`, {
    dayOfWeek: Number(shift.dayOfWeek),
    startTime: shift.startTime,
    endTime: shift.endTime,
  })
}

async function deleteShift(id) {
  await api.delete(`/tenant/shifts/${id}`)
  await fetchShifts()
}

onMounted(() => {
  fetchRoutes()
  fetchDrivers()
  fetchShifts()
})
</script>
