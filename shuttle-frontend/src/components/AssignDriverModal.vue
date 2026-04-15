<script setup>
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  AssignDriverModal.vue — Assign / Unassign a driver to a vehicle           ║
// ║  PATCH /api/v1/tenant/vehicles/:id/assign-driver  { driverId }             ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'

const props = defineProps({
  vehicleId: { type: String, required: true },
  vehiclePlate: { type: String, default: '' },
  currentDriverId: { type: String, default: null },
  currentClientId: { type: String, default: null },
})
const emit = defineEmits(['close', 'assigned'])

const drivers = ref([])
const clients = ref([])
const selectedDriverId = ref(props.currentDriverId || '')
const selectedClientId = ref(props.currentClientId || '')
const searchDriver = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref('')

const hasChanges = computed(() => {
  const current = props.currentDriverId || ''
  const currentClient = props.currentClientId || ''
  return selectedDriverId.value !== current || selectedClientId.value !== currentClient
})

const filteredDrivers = computed(() => {
  const term = searchDriver.value.trim().toLowerCase()
  if (!term) return drivers.value
  return drivers.value.filter((driver) => {
    const name = (driver.name || '').toLowerCase()
    const phone = (driver.phone || '').toLowerCase()
    const email = (driver.email || '').toLowerCase()
    return name.includes(term) || phone.includes(term) || email.includes(term)
  })
})

async function fetchDrivers() {
  isLoading.value = true
  try {
    const res = await api.get('/tenant/drivers')
    drivers.value = res.data?.data ?? res.data ?? []
  } catch (e) {
    console.warn('Şoför listesi alınamadı:', e.message)
  } finally {
    isLoading.value = false
  }
}

async function fetchClients() {
  try {
    const res = await api.get('/tenant/clients')
    clients.value = res.data?.data ?? res.data ?? []
  } catch (e) {
    console.warn('Kurum listesi alınamadı:', e.message)
  }
}

function isAssignedElsewhere(driver) {
  if (!driver.assignedVehicles || driver.assignedVehicles.length === 0) return false
  return driver.assignedVehicles[0].id !== props.vehicleId
}

function driverBadgeText(driver) {
  if (!driver.assignedVehicles || driver.assignedVehicles.length === 0) return 'Boşta'
  if (driver.assignedVehicles[0].id === props.vehicleId) return 'Bu araçta'
  return driver.assignedVehicles[0].plate
}

async function submit() {
  isSaving.value = true
  error.value = ''
  try {
    const driverId = selectedDriverId.value || null
    const clientId = selectedClientId.value || null
    await api.patch(`/tenant/vehicles/${props.vehicleId}/assign-driver`, { driverId, clientId })
    emit('assigned')
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Atama başarısız'
  } finally {
    isSaving.value = false
  }
}

function unassign() {
  selectedDriverId.value = ''
}

onMounted(fetchDrivers)
onMounted(fetchClients)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="$emit('close')"></div>

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div class="relative z-10 w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">

            <!-- Header -->
            <div class="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 class="text-lg font-bold text-white flex items-center gap-2">
                  <span class="flex items-center justify-center h-7 w-7 rounded-lg bg-orange-500/20 text-orange-400">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </span>
                  Şoför Ata / Değiştir
                </h3>
                <p class="text-sm text-slate-400 mt-0.5 ml-9 font-mono">{{ vehiclePlate }}</p>
              </div>
              <button @click="$emit('close')" class="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-5 max-h-[50vh] overflow-y-auto">

              <!-- Error -->
              <div v-if="error" class="flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 mb-4">
                <svg class="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>
                <p class="text-sm text-rose-400">{{ error }}</p>
              </div>

              <!-- Loading -->
              <div v-if="isLoading" class="flex items-center justify-center py-10">
                <div class="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span class="ml-3 text-slate-400 text-sm">Şoförler yükleniyor...</span>
              </div>

              <!-- Driver List -->
              <div v-else class="space-y-2">
                <div class="mb-3 rounded-xl border border-slate-700 bg-slate-800/40 p-3">
                  <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Kurum / Şirket</label>
                  <select v-model="selectedClientId" class="w-full rounded-lg border border-slate-700 bg-slate-900 text-sm text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                    <option value="">Bireysel / Tanımsız</option>
                    <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                </div>

                <div class="mb-3 rounded-xl border border-slate-700 bg-slate-800/40 p-3">
                  <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Şoför Ara</label>
                  <input v-model="searchDriver" type="text" placeholder="Ad, telefon veya email ile ara" class="w-full rounded-lg border border-slate-700 bg-slate-900 text-sm text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                </div>

                <!-- Unassign option -->
                <label
                  class="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border"
                  :class="selectedDriverId === '' ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'"
                >
                  <input type="radio" name="driver" value="" v-model="selectedDriverId" class="hidden" />
                  <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-amber-400">Şoförü Araçtan Al</p>
                    <p class="text-[11px] text-slate-500">Araç boşta kalacaktır</p>
                  </div>
                  <div v-if="selectedDriverId === ''" class="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                </label>

                <!-- Driver options -->
                <label
                  v-for="d in filteredDrivers"
                  :key="d.id"
                  class="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border"
                  :class="selectedDriverId === d.id ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'"
                >
                  <input type="radio" name="driver" :value="d.id" v-model="selectedDriverId" class="hidden" />
                  <div class="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 text-xs font-bold">
                    {{ d.name ? d.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?' }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-white truncate">{{ d.name }}</p>
                    <p class="text-[11px] text-slate-500 truncate">{{ d.phone || d.email || '—' }}</p>
                  </div>
                  <!-- Status badge -->
                  <span
                    class="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    :class="
                      (!d.assignedVehicles || d.assignedVehicles.length === 0)
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : d.assignedVehicles[0].id === vehicleId
                          ? 'bg-indigo-500/10 text-indigo-400'
                          : 'bg-amber-500/10 text-amber-400'
                    "
                  >
                    {{ driverBadgeText(d) }}
                  </span>
                  <!-- Check mark -->
                  <div v-if="selectedDriverId === d.id" class="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                </label>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button @click="$emit('close')" class="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                İptal
              </button>
              <button
                @click="submit"
                :disabled="!hasChanges || isSaving"
                class="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                :class="hasChanges ? 'bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-500/20' : 'bg-slate-700'"
              >
                <svg v-if="isSaving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                {{ isSaving ? 'Kaydediliyor...' : 'Onayla' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
