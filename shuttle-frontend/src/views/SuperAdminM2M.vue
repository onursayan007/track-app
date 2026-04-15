<template>
  <div class="space-y-8">

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- HEADER + TENANT FILTER                                        -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white">M2M Hat Yönetimi</h1>
        <p class="text-sm text-slate-500 mt-1">Tüm araçlarınızın SIM kart, kota ve hat durumlarını yönetin.</p>
      </div>
      <div class="flex items-center gap-3">
        <select
          v-model="selectedTenantId"
          @change="onTenantChange"
          class="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all min-w-[220px]"
        >
          <option value="" disabled>Firma Seçiniz...</option>
          <option v-for="t in tenants" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- NO TENANT SELECTED — EMPTY STATE                              -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div v-if="!selectedTenantId" class="flex flex-col items-center justify-center py-28">
      <div class="h-20 w-20 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-6 shadow-lg">
        <svg class="h-10 w-10 text-indigo-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-slate-300 mb-2">Firma Seçimi Gerekli</h3>
      <p class="text-sm text-slate-500 max-w-md text-center leading-relaxed">
        Lütfen M2M hatlarını görüntülemek için sağ üstten bir firma seçiniz.
        Seçim yapıldığında, ilgili firmanın tüm araç ve SIM kart bilgileri burada listelenecektir.
      </p>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- STATS CARDS (only when tenant selected)                       -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div v-if="selectedTenantId" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div v-for="stat in stats" :key="stat.label"
        class="bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-lg"
      >
        <div :class="stat.iconBg" class="h-12 w-12 rounded-xl flex items-center justify-center shadow-md">
          <component :is="stat.icon" class="h-6 w-6" :class="stat.iconColor" />
        </div>
        <div>
          <div class="text-2xl font-bold text-white">{{ stat.value }}</div>
          <div class="text-xs text-slate-500 font-medium uppercase tracking-wide">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- LOADING STATE                                                 -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div v-if="selectedTenantId && isLoading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span class="ml-3 text-sm text-slate-400">M2M verileri yükleniyor...</span>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- DATA TABLE                                                    -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <div v-if="selectedTenantId && !isLoading" class="bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-2xl shadow-lg overflow-hidden">

      <!-- Search Bar -->
      <div class="p-4 border-b border-slate-800">
        <div class="relative max-w-md">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Plaka, ICCID veya numara ara..."
            class="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500 transition-all"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredVehicles.length === 0" class="py-20 text-center">
        <svg class="h-16 w-16 mx-auto text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
        </svg>
        <p class="text-slate-500 text-sm">Eşleşen M2M kayıt bulunamadı.</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm text-left text-slate-300">
          <thead class="text-xs text-slate-500 uppercase bg-slate-900/50 border-b border-slate-800">
            <tr>
              <th class="px-6 py-4 font-semibold">Araç & Cihaz</th>
              <th class="px-6 py-4 font-semibold">M2M Bilgileri</th>
              <th class="px-6 py-4 font-semibold">Hat Durumu</th>
              <th class="px-6 py-4 font-semibold">Kota Kullanımı</th>
              <th class="px-6 py-4 font-semibold text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="v in filteredVehicles"
              :key="v.id"
              class="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors duration-150"
            >
              <!-- Araç & Cihaz -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
                    {{ v.plate?.slice(0, 2) }}
                  </div>
                  <div>
                    <div class="font-semibold text-white">{{ v.plate }}</div>
                    <div class="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span :class="hardwareBadgeClass(v.hardwareType)" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium">
                        {{ formatHardware(v.hardwareType) }}
                      </span>
                      <span v-if="v.tenant" class="text-slate-600">·</span>
                      <span v-if="v.tenant" class="text-slate-500">{{ v.tenant.name }}</span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- M2M Bilgileri -->
              <td class="px-6 py-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <svg class="h-3.5 w-3.5 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                    <span class="font-mono text-xs text-slate-300">{{ v.m2mNumber || '—' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" :class="operatorBadgeClass(v.m2mOperator)">
                      {{ v.m2mOperator || 'N/A' }}
                    </span>
                  </div>
                  <div class="text-[11px] text-slate-600 font-mono">ICCID: {{ v.m2mIccid || '—' }}</div>
                </div>
              </td>

              <!-- Hat Durumu -->
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                  :class="statusBadgeClass(v.m2mStatus)"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass(v.m2mStatus)"></span>
                  {{ statusLabel(v.m2mStatus) }}
                </span>
              </td>

              <!-- Kota Kullanımı -->
              <td class="px-6 py-4 min-w-[200px]">
                <template v-if="v.m2mDataQuotaMB">
                  <div class="flex justify-between text-xs mb-1.5">
                    <span class="text-slate-400">{{ v.m2mUsedDataMB ?? 0 }} / {{ v.m2mDataQuotaMB }} MB</span>
                    <span class="font-bold" :class="quotaPercent(v) > 80 ? 'text-rose-400' : 'text-indigo-400'">
                      %{{ quotaPercent(v) }}
                    </span>
                  </div>
                  <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="quotaPercent(v) > 80 ? 'bg-rose-500' : 'bg-indigo-500'"
                      :style="{ width: Math.min(quotaPercent(v), 100) + '%' }"
                    ></div>
                  </div>
                </template>
                <span v-else class="text-xs text-slate-600">Kota tanımsız</span>
              </td>

              <!-- İşlemler -->
              <td class="px-6 py-4 text-right">
                <button
                  @click="openEditModal(v)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all duration-200"
                >
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                  Güncelle
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- EDIT MODAL                                                    -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-black/70 backdrop-blur-sm" @click="closeModal"></div>

          <!-- Modal Content -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="isModalOpen" class="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 z-10">

              <!-- Modal Header -->
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-bold text-white">M2M Hat Güncelle</h3>
                  <p class="text-sm text-slate-500 mt-0.5">
                    <span class="font-mono text-indigo-400">{{ editForm.plate }}</span> — SIM kart bilgilerini düzenle
                  </p>
                </div>
                <button @click="closeModal" class="text-slate-500 hover:text-white transition-colors">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <!-- Divider -->
              <div class="border-t border-slate-800"></div>

              <!-- Form Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Operator -->
                <div>
                  <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Operatör</label>
                  <select
                    v-model="editForm.m2mOperator"
                    class="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="">Seçiniz</option>
                    <option value="Turkcell">Turkcell</option>
                    <option value="Vodafone">Vodafone</option>
                    <option value="Türk Telekom">Türk Telekom</option>
                    <option value="Global Roaming">Global Roaming</option>
                  </select>
                </div>

                <!-- Status -->
                <div>
                  <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Hat Durumu</label>
                  <select
                    v-model="editForm.m2mStatus"
                    class="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="SUSPENDED">Askıda</option>
                    <option value="CANCELLED">İptal</option>
                  </select>
                </div>

                <!-- Phone Number -->
                <div class="sm:col-span-2">
                  <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Telefon Numarası</label>
                  <input
                    v-model="editForm.m2mNumber"
                    type="text"
                    placeholder="+90 5XX XXX XX XX"
                    class="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-600 transition-all font-mono"
                  />
                </div>

                <!-- ICCID -->
                <div class="sm:col-span-2">
                  <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">ICCID</label>
                  <input
                    v-model="editForm.m2mIccid"
                    type="text"
                    placeholder="89 90 XXXX XXXX XXXX XXXX X"
                    maxlength="22"
                    class="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-600 transition-all font-mono"
                  />
                </div>

                <!-- Total Quota MB -->
                <div>
                  <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Toplam Kota (MB)</label>
                  <input
                    v-model.number="editForm.m2mDataQuotaMB"
                    type="number"
                    min="0"
                    placeholder="500"
                    class="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-600 transition-all font-mono"
                  />
                </div>

                <!-- Used Data MB -->
                <div>
                  <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Kullanılan (MB)</label>
                  <input
                    v-model.number="editForm.m2mUsedDataMB"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-600 transition-all font-mono"
                  />
                </div>
              </div>

              <!-- Divider -->
              <div class="border-t border-slate-800"></div>

              <!-- Actions -->
              <div class="flex justify-end gap-3">
                <button
                  @click="closeModal"
                  class="px-4 py-2.5 text-sm font-semibold text-slate-400 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition-all duration-200"
                >
                  İptal
                </button>
                <button
                  @click="submitEdit"
                  :disabled="isSaving"
                  class="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg v-if="isSaving" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {{ isSaving ? 'Kaydediliyor...' : 'Kaydet' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!-- SUCCESS TOAST                                                 -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div v-if="toastMsg" class="fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-sm font-medium text-emerald-400 shadow-lg backdrop-blur-sm">
        <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SuperAdminM2M.vue — Enterprise M2M SIM Card Management                   ║
// ║  Deep Dark Mode · Glassmorphism · Indigo/Cyan Accents                     ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
import { ref, reactive, computed, onMounted, h } from 'vue'
import api from '../services/api'

// ─── State ───────────────────────────────────────────────────────────────────
const tenants          = ref([])
const vehicles         = ref([])
const selectedTenantId = ref('')
const searchQuery      = ref('')
const isLoading        = ref(false)
const isModalOpen      = ref(false)
const isSaving         = ref(false)
const toastMsg         = ref('')

const editForm = reactive({
  vehicleId: '',
  plate: '',
  m2mNumber: '',
  m2mIccid: '',
  m2mOperator: '',
  m2mStatus: 'ACTIVE',
  m2mDataQuotaMB: null,
  m2mUsedDataMB: null,
})

// ─── Computed ────────────────────────────────────────────────────────────────
const filteredVehicles = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return vehicles.value
  return vehicles.value.filter(v =>
    (v.plate || '').toLowerCase().includes(q) ||
    (v.m2mIccid || '').toLowerCase().includes(q) ||
    (v.m2mNumber || '').toLowerCase().includes(q) ||
    (v.m2mOperator || '').toLowerCase().includes(q)
  )
})

const totalLines     = computed(() => vehicles.value.length)
const activeLines    = computed(() => vehicles.value.filter(v => v.m2mStatus === 'ACTIVE').length)
const suspendedLines = computed(() => vehicles.value.filter(v => v.m2mStatus === 'SUSPENDED').length)
const overQuotaLines = computed(() => vehicles.value.filter(v => v.m2mDataQuotaMB && quotaPercent(v) > 80).length)

// ─── Inline SVG Icon Components ──────────────────────────────────────────────
const IconSignal = { render: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z' })
])}
const IconCheck = { render: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' })
])}
const IconPause = { render: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M14.25 9v6m-4.5 0V9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' })
])}
const IconExclamation = { render: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z' })
])}

const stats = computed(() => [
  { label: 'Toplam Hat',    value: totalLines.value,     icon: IconSignal,      iconBg: 'bg-indigo-500/15', iconColor: 'text-indigo-400' },
  { label: 'Aktif',         value: activeLines.value,    icon: IconCheck,       iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400' },
  { label: 'Askıda',        value: suspendedLines.value, icon: IconPause,       iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400' },
  { label: 'Kota Aşımı >80%', value: overQuotaLines.value, icon: IconExclamation, iconBg: 'bg-rose-500/15', iconColor: 'text-rose-400' },
])

// ─── Helpers ─────────────────────────────────────────────────────────────────
function quotaPercent(v) {
  if (!v.m2mDataQuotaMB || v.m2mDataQuotaMB === 0) return 0
  return Math.round(((v.m2mUsedDataMB ?? 0) / v.m2mDataQuotaMB) * 100)
}

function formatHardware(type) {
  const map = { ARVENTO: 'Arvento', TELTONIKA: 'Teltonika', UDP_DEVICE: 'UDP', APP_ONLY: 'Mobil Uygulama' }
  return map[type] || type || '—'
}

function hardwareBadgeClass(type) {
  const map = {
    ARVENTO: 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/25',
    TELTONIKA: 'bg-teal-500/15 text-teal-400 ring-1 ring-teal-500/25',
    UDP_DEVICE: 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/25',
    APP_ONLY: 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/25',
  }
  return map[type] || 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/25'
}

function operatorBadgeClass(op) {
  if (!op) return 'bg-slate-700/50 text-slate-500'
  const o = op.toLowerCase()
  if (o.includes('turkcell'))  return 'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/25'
  if (o.includes('vodafone'))  return 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25'
  if (o.includes('telekom'))   return 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/25'
  if (o.includes('global'))    return 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/25'
  return 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/25'
}

function statusBadgeClass(status) {
  const map = {
    ACTIVE:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    SUSPENDED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }
  return map[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}

function statusDotClass(status) {
  const map = { ACTIVE: 'bg-emerald-400', SUSPENDED: 'bg-amber-400', CANCELLED: 'bg-rose-400' }
  return map[status] || 'bg-slate-400'
}

function statusLabel(status) {
  const map = { ACTIVE: 'Aktif', SUSPENDED: 'Askıda', CANCELLED: 'İptal' }
  return map[status] || status || '—'
}

function showToast(msg) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, 3000)
}

// ─── API Calls ───────────────────────────────────────────────────────────────
async function fetchTenants() {
  try {
    const res = await api.get('/superadmin/tenants')
    const list = res.data?.data ?? res.data ?? []
    tenants.value = Array.isArray(list) ? list : []
  } catch (e) {
    console.warn('M2M: Tenant listesi alınamadı', e.message)
  }
}

function onTenantChange() {
  vehicles.value = []
  searchQuery.value = ''
  if (selectedTenantId.value) {
    fetchVehicles()
  }
}

async function fetchVehicles() {
  if (!selectedTenantId.value) return
  isLoading.value = true
  try {
    const url = `/superadmin/vehicles?tenantId=${selectedTenantId.value}`
    const res = await api.get(url)
    const list = res.data?.data ?? res.data ?? []
    vehicles.value = Array.isArray(list) ? list : []
  } catch (e) {
    console.warn('M2M: Araçlar alınamadı', e.message)
    vehicles.value = []
  } finally {
    isLoading.value = false
  }
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function openEditModal(vehicle) {
  editForm.vehicleId      = vehicle.id
  editForm.plate          = vehicle.plate
  editForm.m2mNumber      = vehicle.m2mNumber || ''
  editForm.m2mIccid       = vehicle.m2mIccid || ''
  editForm.m2mOperator    = vehicle.m2mOperator || ''
  editForm.m2mStatus      = vehicle.m2mStatus || 'ACTIVE'
  editForm.m2mDataQuotaMB = vehicle.m2mDataQuotaMB ?? null
  editForm.m2mUsedDataMB  = vehicle.m2mUsedDataMB ?? null
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

async function submitEdit() {
  isSaving.value = true
  try {
    await api.patch(`/superadmin/vehicles/${editForm.vehicleId}/m2m`, {
      m2mNumber:      editForm.m2mNumber || null,
      m2mIccid:       editForm.m2mIccid || null,
      m2mOperator:    editForm.m2mOperator || null,
      m2mStatus:      editForm.m2mStatus,
      m2mDataQuotaMB: editForm.m2mDataQuotaMB ?? null,
      m2mUsedDataMB:  editForm.m2mUsedDataMB ?? null,
    })
    closeModal()
    showToast(`${editForm.plate} — M2M bilgileri güncellendi!`)
    await fetchVehicles()
  } catch (e) {
    console.error('M2M güncelleme hatası:', e)
    alert('Güncelleme başarısız: ' + (e.response?.data?.message || e.message))
  } finally {
    isSaving.value = false
  }
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchTenants()
  // Do NOT fetch vehicles on mount — user must pick a tenant first
})
</script>

<style scoped>
/* Smooth scrollbar for dark theme */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #334155; border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: #475569; }
</style>
