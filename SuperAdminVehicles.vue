<script setup>
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SuperAdminVehicles.vue — Global Vehicle & Hardware Pool                   ║
// ║  BUG FIX: All Composition API hooks explicitly imported from 'vue'         ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'

// ─── Tenant List ────────────────────────────────────────────────────────────────
const tenants = ref([
  'Aras Kargo',
  'Sürat Lojistik',
  'MNG Kargo',
  'Horoz Lojistik',
  'Ekol Lojistik',
  'Borusan Lojistik',
  'Netlog Lojistik',
  'Ceva Lojistik',
])

// ─── Mock Vehicle Fleet Data ────────────────────────────────────────────────────
const vehicles = ref([
  { id: 1,  plate: '34 TRK 0142', model: 'Mercedes Actros 1842',  vin: 'WDB96340310287654', tenant: 'Aras Kargo',       sources: ['Arvento API'],                online: true,  imei: '' },
  { id: 2,  plate: '06 ANK 7721', model: 'Volvo FH16 550',        vin: 'YV2RT40A5KB284910', tenant: 'Sürat Lojistik',    sources: ['UDP/Teltonika'],              online: true,  imei: '350317073521489' },
  { id: 3,  plate: '35 IZM 3385', model: 'Scania R500',           vin: 'XLER4X20005682314', tenant: 'MNG Kargo',         sources: ['Arvento API', 'Mobil App'],   online: true,  imei: '' },
  { id: 4,  plate: '16 BRS 9058', model: 'Ford F-MAX 500',        vin: 'NM0GE9E20N1234567', tenant: 'Horoz Lojistik',    sources: ['UDP/Teltonika'],              online: false, imei: '862107048592163' },
  { id: 5,  plate: '41 KOC 5560', model: 'MAN TGX 18.500',       vin: 'WMAN07ZZ5CW048271', tenant: 'Ekol Lojistik',     sources: ['Mobil App'],                  online: true,  imei: '' },
  { id: 6,  plate: '34 IST 8834', model: 'DAF XF 480 FT',        vin: 'XLRTE47MS0E987215', tenant: 'Borusan Lojistik',  sources: ['Arvento API'],                online: false, imei: '' },
  { id: 7,  plate: '01 ADA 2276', model: 'Renault T520 High',    vin: 'VF625GVA000012847', tenant: 'Netlog Lojistik',   sources: ['UDP/Teltonika', 'Mobil App'], online: true,  imei: '359586015829802' },
  { id: 8,  plate: '27 GZT 4491', model: 'Iveco S-Way 490',      vin: 'WJMM1VPH10C741958', tenant: 'Ceva Lojistik',    sources: ['Arvento API'],                online: true,  imei: '' },
  { id: 9,  plate: '42 KNY 1173', model: 'Mercedes Arocs 3345',  vin: 'WDB96532110384762', tenant: 'Aras Kargo',        sources: ['Mobil App'],                  online: false, imei: '' },
  { id: 10, plate: '07 ANT 6650', model: 'Volvo FM 460',         vin: 'YV2XHM0A7LB005832', tenant: 'Sürat Lojistik',   sources: ['UDP/Teltonika'],              online: true,  imei: '864606041572903' },
  { id: 11, plate: '34 LOG 7788', model: 'Scania S730',          vin: 'XLER4X20005129877', tenant: 'MNG Kargo',         sources: ['Arvento API', 'UDP/Teltonika'], online: true, imei: '351756051847234' },
  { id: 12, plate: '06 FLT 3001', model: 'Mercedes Actros 2653', vin: 'WDB96340310998321', tenant: 'Ekol Lojistik',     sources: ['Arvento API'],                online: true,  imei: '' },
])

// ─── Dashboard Stats (Computed) ─────────────────────────────────────────────────
const totalVehicles = computed(() => 1248)
const activeDevices = computed(() => 982)
const offlineCount  = computed(() => 266)

// ─── Search & Filters ───────────────────────────────────────────────────────────
const filterTenant = ref('')
const searchQuery  = ref('')

const filteredVehicles = computed(() => {
  let list = vehicles.value
  if (filterTenant.value) {
    list = list.filter(v => v.tenant === filterTenant.value)
  }
  const q = searchQuery.value.toLowerCase().trim()
  if (q) {
    list = list.filter(v =>
      v.plate.toLowerCase().includes(q) ||
      v.vin.toLowerCase().includes(q) ||
      v.imei.toLowerCase().includes(q)
    )
  }
  return list
})

// ─── Badge Style Mapping ────────────────────────────────────────────────────────
function sourceBadgeClass(src) {
  if (src.includes('Arvento')) return 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/25'
  if (src.includes('UDP'))     return 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/25'
  if (src.includes('Mobil'))   return 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25'
  return 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/25'
}

// ─── Modal & Provisioning Form ──────────────────────────────────────────────────
const isModalOpen  = ref(false)
const ocrScanning  = ref(false)
const ocrDone      = ref(false)
const isSaving     = ref(false)

const createEmptyForm = () => ({
  tenantId: '',
  plate: '',
  model: '',
  vin: '',
  dataSource: '',
  arventoNodeId: '',
  imei: '',
})

const modalForm = reactive(createEmptyForm())

function openModal() {
  Object.assign(modalForm, createEmptyForm())
  ocrScanning.value = false
  ocrDone.value     = false
  isSaving.value    = false
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

// Reset hardware-specific fields when the data source changes
watch(() => modalForm.dataSource, (newSrc) => {
  if (newSrc !== 'arvento') modalForm.arventoNodeId = ''
  if (newSrc !== 'udp')     modalForm.imei = ''
})

// ─── Simulated AI OCR ───────────────────────────────────────────────────────────
function simulateOCR() {
  if (ocrScanning.value) return
  ocrScanning.value = true
  ocrDone.value     = false

  setTimeout(() => {
    modalForm.plate = '34 FL 2048'
    modalForm.model = 'Mercedes Actros 1845 LS'
    modalForm.vin   = 'WDB96340310456789'
    ocrScanning.value = false
    ocrDone.value     = true
  }, 1500)
}

// ─── Save Vehicle ───────────────────────────────────────────────────────────────
function saveVehicle() {
  if (!modalForm.plate || !modalForm.tenantId || !modalForm.dataSource) return

  isSaving.value = true

  const sourceMap = {
    arvento: ['Arvento API'],
    udp:     ['UDP/Teltonika'],
    app:     ['Mobil App'],
  }

  const newVehicle = {
    id: Date.now(),
    plate: modalForm.plate,
    model: modalForm.model,
    vin: modalForm.vin,
    tenant: modalForm.tenantId,
    sources: sourceMap[modalForm.dataSource] || ['Mobil App'],
    online: true,
    imei: modalForm.imei,
  }

  vehicles.value.unshift(newVehicle)

  nextTick(() => {
    isSaving.value = false
    closeModal()
  })
}

// ─── Lifecycle ──────────────────────────────────────────────────────────────────
onMounted(() => {
  console.log(`[SuperAdmin] Vehicle pool loaded — ${vehicles.value.length} local entries`)
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8 font-sans antialiased">

    <!-- ═══════════════════════════════ HEADER ═══════════════════════════════ -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">
          Global Araç &amp; Donanım Havuzu
        </h1>
        <p class="mt-1.5 text-sm text-slate-500">Tüm tenant araçlarını ve cihaz envanterini tek noktadan yönetin.</p>
      </div>
      <button
        @click="openModal"
        class="group inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(79,70,229,0.35)] hover:shadow-[0_0_35px_rgba(79,70,229,0.55)] hover:scale-[1.02] active:scale-[0.98]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform group-hover:rotate-90 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
        Yeni Araç &amp; Cihaz Kaydı
      </button>
    </header>

    <!-- ═══════════════════════════ STAT CARDS ═══════════════════════════ -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">

      <!-- Card: Total Vehicles -->
      <div class="group relative overflow-hidden rounded-2xl bg-slate-900/70 backdrop-blur-sm border border-slate-800 p-6 shadow-[0_0_15px_rgba(79,70,229,0.15)] hover:shadow-[0_0_25px_rgba(79,70,229,0.25)] transition-shadow duration-300">
        <div class="flex items-center gap-4">
          <div class="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h.862c.227 0 .45.036.662.106l.727.242a3.375 3.375 0 0 0 2.124 0l.727-.242a2.25 2.25 0 0 1 .662-.106h4.111m0 0h2.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.25 2.25 0 0 0-.659-1.591l-2.482-2.482a2.25 2.25 0 0 0-1.591-.659H9.375c-.621 0-1.125.504-1.125 1.125v7.758"/></svg>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-slate-500">Sistemdeki Toplam Araç</p>
            <p class="text-3xl font-bold text-white tabular-nums">{{ totalVehicles.toLocaleString('tr-TR') }}</p>
          </div>
        </div>
        <div class="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-indigo-500/5 blur-2xl group-hover:bg-indigo-500/10 transition-colors duration-500"></div>
      </div>

      <!-- Card: Active Devices -->
      <div class="group relative overflow-hidden rounded-2xl bg-slate-900/70 backdrop-blur-sm border border-slate-800 p-6 shadow-[0_0_15px_rgba(79,70,229,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] transition-shadow duration-300">
        <div class="flex items-center gap-4">
          <div class="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/></svg>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-slate-500">Aktif Veri Atan Cihaz <span class="text-slate-600">(UDP/API)</span></p>
            <p class="text-3xl font-bold text-white tabular-nums">{{ activeDevices.toLocaleString('tr-TR') }}</p>
          </div>
        </div>
        <div class="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-colors duration-500"></div>
      </div>

      <!-- Card: Offline / Expired -->
      <div class="group relative overflow-hidden rounded-2xl bg-slate-900/70 backdrop-blur-sm border border-slate-800 p-6 shadow-[0_0_15px_rgba(79,70,229,0.15)] hover:shadow-[0_0_25px_rgba(244,63,94,0.2)] transition-shadow duration-300">
        <div class="flex items-center gap-4">
          <div class="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-slate-500">Lisansı Biten / Çevrimdışı</p>
            <p class="text-3xl font-bold text-white tabular-nums">{{ offlineCount.toLocaleString('tr-TR') }}</p>
          </div>
        </div>
        <div class="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-rose-500/5 blur-2xl group-hover:bg-rose-500/10 transition-colors duration-500"></div>
      </div>
    </div>

    <!-- ═══════════════════════════ FILTERS ═══════════════════════════ -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <!-- Tenant Filter -->
      <div class="relative">
        <select
          v-model="filterTenant"
          class="appearance-none w-full sm:w-60 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
        >
          <option value="">Tüm Firmalar</option>
          <option v-for="t in tenants" :key="t" :value="t">{{ t }}</option>
        </select>
        <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>
      </div>

      <!-- Search -->
      <div class="relative flex-1 max-w-md">
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Plaka, VIN veya IMEI ara..."
          class="w-full rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 pl-10 pr-4 py-2.5 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
        />
      </div>

      <!-- Result count -->
      <span class="text-xs text-slate-600 tabular-nums whitespace-nowrap">
        {{ filteredVehicles.length }} / {{ vehicles.length }} kayıt
      </span>
    </div>

    <!-- ═══════════════════════════ DATA TABLE ═══════════════════════════ -->
    <div class="rounded-2xl bg-slate-900/70 backdrop-blur-sm border border-slate-800 shadow-[0_0_15px_rgba(79,70,229,0.15)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="border-b border-slate-800/80 bg-slate-900/90">
              <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Plaka &amp; Araç</th>
              <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Bağlı Olduğu Firma</th>
              <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Veri Kaynağı</th>
              <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Bağlantı Durumu</th>
              <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">İşlemler</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-800/50">
            <tr
              v-for="v in filteredVehicles"
              :key="v.id"
              class="group hover:bg-slate-800/30 transition-colors duration-150"
            >
              <!-- Plaka & Araç -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3.5">
                  <div class="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/10 group-hover:ring-indigo-500/30 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h.862c.227 0 .45.036.662.106l.727.242a3.375 3.375 0 0 0 2.124 0l.727-.242a2.25 2.25 0 0 1 .662-.106h4.111m0 0h2.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.25 2.25 0 0 0-.659-1.591l-2.482-2.482a2.25 2.25 0 0 0-1.591-.659H9.375c-.621 0-1.125.504-1.125 1.125v7.758"/></svg>
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-white truncate">{{ v.plate }}</p>
                    <p class="text-xs text-slate-500 truncate">{{ v.model }}</p>
                    <p class="text-[10px] text-slate-600 font-mono truncate">{{ v.vin }}</p>
                  </div>
                </div>
              </td>

              <!-- Firma -->
              <td class="px-6 py-4">
                <span class="text-slate-300 text-sm">{{ v.tenant }}</span>
              </td>

              <!-- Veri Kaynağı -->
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="src in v.sources"
                    :key="src"
                    :class="sourceBadgeClass(src)"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
                  >{{ src }}</span>
                </div>
              </td>

              <!-- Bağlantı Durumu -->
              <td class="px-6 py-4">
                <span class="inline-flex items-center gap-2 text-sm">
                  <span class="relative flex h-2.5 w-2.5">
                    <span
                      v-if="v.online"
                      class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                    ></span>
                    <span
                      :class="v.online ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-slate-600'"
                      class="relative inline-flex rounded-full h-2.5 w-2.5"
                    ></span>
                  </span>
                  <span :class="v.online ? 'text-emerald-400 font-medium' : 'text-slate-500'">
                    {{ v.online ? 'Online' : 'Offline' }}
                  </span>
                </span>
              </td>

              <!-- İşlemler -->
              <td class="px-6 py-4 text-right">
                <button class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 ring-1 ring-indigo-500/10 hover:ring-indigo-500/30 transition-all duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"/></svg>
                  Düzenle
                </button>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="filteredVehicles.length === 0">
              <td colspan="5" class="px-6 py-20 text-center">
                <div class="flex flex-col items-center gap-3">
                  <div class="flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-800/50 text-slate-600 ring-1 ring-slate-700/50">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>
                  </div>
                  <p class="text-sm text-slate-600">Arama kriterlerinize uygun araç bulunamadı.</p>
                  <button @click="filterTenant = ''; searchQuery = ''" class="text-xs text-indigo-400 hover:text-indigo-300 transition">Filtreleri temizle</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Footer -->
      <div class="flex items-center justify-between px-6 py-3 border-t border-slate-800/60 bg-slate-900/50">
        <span class="text-xs text-slate-600">Toplam <span class="text-slate-400 font-semibold">{{ filteredVehicles.length }}</span> araç gösteriliyor</span>
        <div class="flex gap-1">
          <span class="inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-400">1</span>
          <span class="inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs text-slate-600 hover:bg-slate-800 cursor-pointer transition">2</span>
          <span class="inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs text-slate-600 hover:bg-slate-800 cursor-pointer transition">3</span>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════ PROVISIONING MODAL ═══════════════════════ -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="closeModal"></div>

          <!-- Panel -->
          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-4"
          >
            <div
              v-if="isModalOpen"
              class="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-[0_0_60px_rgba(79,70,229,0.15)]"
            >
              <!-- ── Header ── -->
              <div class="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md rounded-t-2xl">
                <div>
                  <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <span class="flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                    </span>
                    Yeni Araç &amp; Cihaz Kaydı
                  </h2>
                  <p class="text-xs text-slate-500 mt-1 ml-9">Gelişmiş provizyon sihirbazı</p>
                </div>
                <button @click="closeModal" class="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <!-- ── Body ── -->
              <div class="px-6 py-6 space-y-7">

                <!-- STEP 1 ─ Tenant Selection -->
                <section>
                  <label class="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                    <span class="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-500/20 text-indigo-400 text-[11px] font-bold ring-1 ring-indigo-500/30">1</span>
                    Firma Seçimi
                  </label>
                  <select
                    v-model="modalForm.tenantId"
                    class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                  >
                    <option value="" disabled>Firma seçiniz...</option>
                    <option v-for="t in tenants" :key="t" :value="t">{{ t }}</option>
                  </select>
                </section>

                <!-- STEP 2 ─ AI OCR Upload -->
                <section>
                  <label class="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                    <span class="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-500/20 text-indigo-400 text-[11px] font-bold ring-1 ring-indigo-500/30">2</span>
                    Ruhsat Belgesi (AI OCR)
                  </label>

                  <!-- Drop Zone -->
                  <div
                    @click="simulateOCR"
                    class="group relative flex flex-col items-center justify-center gap-3 px-6 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300"
                    :class="ocrScanning
                      ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_20px_rgba(79,70,229,0.15)]'
                      : ocrDone
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-slate-700 hover:border-indigo-500/40 bg-slate-800/20 hover:bg-slate-800/50'"
                  >
                    <!-- State: Scanning -->
                    <template v-if="ocrScanning">
                      <div class="flex items-center gap-3">
                        <svg class="animate-spin h-6 w-6 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        <span class="text-sm font-semibold text-indigo-400 animate-pulse">Yapay Zeka Ruhsatı Analiz Ediyor...</span>
                      </div>
                      <div class="w-full max-w-xs bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 rounded-full animate-[progress_1.5s_ease-in-out_forwards]"></div>
                      </div>
                    </template>

                    <!-- State: Done -->
                    <template v-else-if="ocrDone">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-9 w-9 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                      <span class="text-sm font-semibold text-emerald-400">Ruhsat başarıyla okundu!</span>
                      <span class="text-[11px] text-slate-500">Tekrar taramak için tıklayın</span>
                    </template>

                    <!-- State: Default -->
                    <template v-else>
                      <div class="flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-700/30 text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all duration-300 ring-1 ring-slate-700 group-hover:ring-indigo-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"/></svg>
                      </div>
                      <span class="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition">Ruhsat belgesini yüklemek için tıklayın veya sürükleyin</span>
                      <span class="text-[11px] text-slate-600">PNG, JPG veya PDF — Maks 10MB</span>
                    </template>
                  </div>

                  <!-- OCR Fields -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    <div>
                      <label class="block text-[11px] font-medium text-slate-500 mb-1.5">Plaka</label>
                      <input
                        v-model="modalForm.plate"
                        type="text"
                        placeholder="34 ABC 123"
                        class="w-full rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                        :class="{ 'border-emerald-500/40 bg-emerald-500/5': ocrDone && modalForm.plate }"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] font-medium text-slate-500 mb-1.5">Marka / Model</label>
                      <input
                        v-model="modalForm.model"
                        type="text"
                        placeholder="Mercedes Actros"
                        class="w-full rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                        :class="{ 'border-emerald-500/40 bg-emerald-500/5': ocrDone && modalForm.model }"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] font-medium text-slate-500 mb-1.5">Şasi No (VIN)</label>
                      <input
                        v-model="modalForm.vin"
                        type="text"
                        placeholder="WDB96340310012345"
                        class="w-full rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white px-3 py-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                        :class="{ 'border-emerald-500/40 bg-emerald-500/5': ocrDone && modalForm.vin }"
                      />
                    </div>
                  </div>
                </section>

                <!-- STEP 3 ─ Data Source & Hardware -->
                <section>
                  <label class="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    <span class="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-500/20 text-indigo-400 text-[11px] font-bold ring-1 ring-indigo-500/30">3</span>
                    Veri Kaynağı &amp; Donanım Provizyon
                  </label>

                  <!-- Radio Cards -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">

                    <!-- Arvento API -->
                    <label
                      class="relative flex flex-col items-center gap-2.5 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200"
                      :class="modalForm.dataSource === 'arvento'
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(79,70,229,0.2)]'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'"
                    >
                      <input type="radio" v-model="modalForm.dataSource" value="arvento" class="sr-only" />
                      <div class="flex items-center justify-center h-11 w-11 rounded-xl transition-all" :class="modalForm.dataSource === 'arvento' ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40' : 'bg-slate-700/40 text-slate-500'">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.732-3.558"/></svg>
                      </div>
                      <span class="text-xs font-bold tracking-wide" :class="modalForm.dataSource === 'arvento' ? 'text-indigo-300' : 'text-slate-400'">Arvento API</span>
                      <p class="text-[10px] text-slate-600">Bulut entegrasyonu</p>
                      <div v-if="modalForm.dataSource === 'arvento'" class="absolute top-2.5 right-2.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd"/></svg>
                      </div>
                    </label>

                    <!-- Fiziksel UDP -->
                    <label
                      class="relative flex flex-col items-center gap-2.5 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200"
                      :class="modalForm.dataSource === 'udp'
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(79,70,229,0.2)]'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'"
                    >
                      <input type="radio" v-model="modalForm.dataSource" value="udp" class="sr-only" />
                      <div class="flex items-center justify-center h-11 w-11 rounded-xl transition-all" :class="modalForm.dataSource === 'udp' ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40' : 'bg-slate-700/40 text-slate-500'">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z"/></svg>
                      </div>
                      <span class="text-xs font-bold tracking-wide" :class="modalForm.dataSource === 'udp' ? 'text-indigo-300' : 'text-slate-400'">Fiziksel UDP</span>
                      <p class="text-[10px] text-slate-600">Teltonika / Ruptela</p>
                      <div v-if="modalForm.dataSource === 'udp'" class="absolute top-2.5 right-2.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd"/></svg>
                      </div>
                    </label>

                    <!-- Sadece App -->
                    <label
                      class="relative flex flex-col items-center gap-2.5 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200"
                      :class="modalForm.dataSource === 'app'
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(79,70,229,0.2)]'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'"
                    >
                      <input type="radio" v-model="modalForm.dataSource" value="app" class="sr-only" />
                      <div class="flex items-center justify-center h-11 w-11 rounded-xl transition-all" :class="modalForm.dataSource === 'app' ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40' : 'bg-slate-700/40 text-slate-500'">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/></svg>
                      </div>
                      <span class="text-xs font-bold tracking-wide" :class="modalForm.dataSource === 'app' ? 'text-indigo-300' : 'text-slate-400'">Sadece App</span>
                      <p class="text-[10px] text-slate-600">Donanımsız</p>
                      <div v-if="modalForm.dataSource === 'app'" class="absolute top-2.5 right-2.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd"/></svg>
                      </div>
                    </label>
                  </div>

                  <!-- Conditional Fields -->
                  <Transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="opacity-0 -translate-y-2"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 -translate-y-2"
                  >
                    <div v-if="modalForm.dataSource === 'arvento'" class="mt-4">
                      <label class="block text-[11px] font-medium text-slate-500 mb-1.5">Arvento Araç Node ID</label>
                      <input
                        v-model="modalForm.arventoNodeId"
                        type="text"
                        placeholder="ör: ARV-4582190"
                        class="w-full rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                      />
                    </div>
                  </Transition>

                  <Transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="opacity-0 -translate-y-2"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 -translate-y-2"
                  >
                    <div v-if="modalForm.dataSource === 'udp'" class="mt-4">
                      <label class="block text-[11px] font-medium text-slate-500 mb-1.5">Cihaz IMEI Numarası</label>
                      <input
                        v-model="modalForm.imei"
                        type="text"
                        placeholder="ör: 359586015829802"
                        class="w-full rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white px-3 py-2.5 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                      />
                    </div>
                  </Transition>

                  <Transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="opacity-0 -translate-y-2"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 -translate-y-2"
                  >
                    <div v-if="modalForm.dataSource === 'app'" class="mt-4 flex items-start gap-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 px-4 py-3.5">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-indigo-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/></svg>
                      <p class="text-xs text-indigo-300/80 leading-relaxed">
                        Bu araç yalnızca mobil uygulama üzerinden konum verisi gönderecektir. Fiziksel donanım gerekmemektedir. Sürücünün <span class="font-semibold text-indigo-300">Servisim Geliyor Sürücü</span> uygulamasını yüklemesi yeterlidir.
                      </p>
                    </div>
                  </Transition>
                </section>
              </div>

              <!-- ── Footer ── -->
              <div class="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md rounded-b-2xl">
                <button
                  @click="closeModal"
                  class="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
                >
                  İptal
                </button>
                <button
                  @click="saveVehicle"
                  :disabled="!modalForm.plate || !modalForm.tenantId || !modalForm.dataSource || isSaving"
                  class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                  :class="!modalForm.plate || !modalForm.tenantId || !modalForm.dataSource
                    ? 'bg-slate-700 cursor-not-allowed opacity-50 shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_35px_rgba(79,70,229,0.5)] hover:scale-[1.02] active:scale-[0.98]'"
                >
                  <svg v-if="!isSaving" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
                  <svg v-else class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Kaydet ve Aktifleştir
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes progress {
  0%   { width: 0%; }
  100% { width: 100%; }
}

/* Custom scrollbar for the modal */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}
</style>