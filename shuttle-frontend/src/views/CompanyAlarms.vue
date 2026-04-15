<template>
  <div class="min-h-full bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">İhlal ve Alarmlar</h1>
        <p class="text-slate-400 mt-1 text-sm">Araç telemetri kaynaklı alarm ve ihlalleri gerçek zamanlı takip edin.</p>
      </div>

      <div class="flex items-center gap-3">
        <div class="flex items-center bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-xl p-1">
          <button
            v-for="filter in filters"
            :key="filter.value"
            @click="onPriorityFilterClick(filter.value)"
            :class="[
              'px-3 py-1.5 text-xs sm:text-sm rounded-lg font-semibold transition-colors',
              activeFilter === filter.value
                ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30'
                : 'text-slate-300 hover:bg-slate-800'
            ]"
          >
            {{ filter.label }}
          </button>
        </div>

        <div class="min-w-[220px]">
          <select
            v-model="selectedAlertType"
            class="w-full rounded-xl bg-slate-900/70 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            title="Gösterilecek ihlal tiplerini seç"
          >
            <option value="ALL">Tümü</option>
            <option
              v-for="option in alertTypeOptions"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
        </div>

      </div>
    </div>

    <div class="rounded-2xl bg-slate-900/70 backdrop-blur-sm border border-slate-800 shadow-[0_0_30px_rgba(15,23,42,0.6)] overflow-hidden">
      <div v-if="errorMessage" class="mx-5 mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
        {{ errorMessage }}
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left text-slate-300">
          <thead class="text-xs uppercase tracking-wide text-slate-400 bg-slate-900/80">
            <tr class="border-b border-slate-800">
              <th class="px-5 py-4">Tarih ve Saat</th>
              <th class="px-5 py-4">Plaka</th>
              <th class="px-5 py-4">İhlal Tipi</th>
              <th class="px-5 py-4">Öncelik</th>
              <th class="px-5 py-4 text-right">Aksiyon</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="isLoading">
              <td colspan="5" class="px-5 py-12 text-center text-slate-400">Alarm verileri yükleniyor...</td>
            </tr>

            <tr v-else-if="filteredAlerts.length === 0">
              <td colspan="5" class="px-5 py-12 text-center text-slate-500">Gösterilecek alarm bulunamadı.</td>
            </tr>

            <tr
              v-else
              v-for="alert in filteredAlerts"
              :key="alert.id"
              class="border-b border-slate-800/70 hover:bg-slate-800/40 transition-colors"
            >
              <td class="px-5 py-4 whitespace-nowrap font-mono text-slate-400">{{ formatDate(alert.timestamp) }}</td>
              <td class="px-5 py-4 font-bold text-white whitespace-nowrap">{{ alert.vehicle?.plate || '-' }}</td>
              <td class="px-5 py-4">
                <div class="flex items-center gap-2">
                  <p class="text-slate-100">{{ alert.alertType }}</p>
                  <span
                    v-if="alert.isMock"
                    class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/35"
                  >
                    MOCK
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-1">{{ alert.detailsText || '-' }}</p>
              </td>
              <td class="px-5 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border" :class="severityClass(alert.severity)">
                  {{ severityLabel(alert.severity) }}
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <div class="inline-flex items-center gap-2">
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium"
                    :class="alert.isResolved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-orange-500/10 text-orange-300 border border-orange-500/30'"
                  >
                    {{ alert.isResolved ? 'Çözüldü' : 'Açık Alarm' }}
                  </span>
                  <button
                    @click="openDeleteConfirm(alert.id)"
                    class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition"
                  >
                    İhlali Sil
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <button
      @click="createMockAlert"
      :disabled="isMocking"
      class="fixed right-6 bottom-6 sm:right-8 sm:bottom-8 inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm shadow-[0_10px_30px_rgba(79,70,229,0.45)] transition"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      {{ isMocking ? 'Oluşturuluyor...' : 'Tüm Araçlar için Mock Üret' }}
    </button>

    <div
      v-if="isDeleteConfirmOpen"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
      @click.self="closeDeleteConfirm"
    >
      <div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-[0_0_60px_rgba(244,63,94,0.15)]">
        <div class="px-5 py-4 border-b border-slate-800">
          <h3 class="text-base font-bold text-white">İhlal Kaydını Sil</h3>
          <p class="mt-1 text-xs text-slate-400">Bu işlem geri alınamaz. Seçili ihlal kaydı kalıcı olarak silinecek.</p>
        </div>
        <div class="px-5 py-4 flex justify-end gap-2">
          <button
            @click="closeDeleteConfirm"
            class="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm"
          >
            Vazgeç
          </button>
          <button
            @click="confirmDeleteAlert"
            class="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold"
          >
            Evet, Sil
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import api from '../services/api'

const alerts = ref([])

const isLoading = ref(false)
const isMocking = ref(false)
const activeFilter = ref('ALL')
const errorMessage = ref('')
const isDeleteConfirmOpen = ref(false)
const deletingAlertId = ref('')
const selectedAlertType = ref('ALL')

const filters = [
  { label: 'Tümü', value: 'ALL' },
  { label: 'Yüksek', value: 'HIGH' },
  { label: 'Orta', value: 'MEDIUM' },
  { label: 'Düşük', value: 'LOW' },
]


const alertTypeOptions = computed(() => {
  const known = [
    'Hız Sınırı Aşımı',
    'Rölanti İhlali',
    'Mesai Dışı Kullanım',
    'Sanal Çit İhlali',
    'Cihaz Sinyali Kesildi',
    'Cihaz Söküldü',
  ]
  const dynamic = alerts.value.map((alert) => alert.alertType).filter(Boolean)
  return Array.from(new Set([...known, ...dynamic]))
})

const filteredAlerts = computed(() => {
  let base = alerts.value

  if (selectedAlertType.value !== 'ALL') {
    base = base.filter((alert) => alert.alertType === selectedAlertType.value)
  }

  if (activeFilter.value === 'ALL') return base
  return base.filter((alert) => alert.severity === activeFilter.value)
})

function getFixedSeverityByAlertType(alertType) {
  if (alertType?.includes('Mesai Dışı')) return 'HIGH'
  if (alertType?.includes('Cihaz Sinyali Kesildi')) return 'HIGH'
  if (alertType?.includes('Cihaz Söküldü') || alertType?.includes('Sabotaj') || alertType?.includes('Güç Kesintisi')) return 'HIGH'
  if (alertType?.includes('Hız Sınırı Aşımı')) return 'MEDIUM'
  if (alertType?.includes('Sanal Çit')) return 'MEDIUM'
  if (alertType?.includes('Rölanti')) return 'LOW'
  return null
}

function onPriorityFilterClick(nextFilter) {
  if (selectedAlertType.value !== 'ALL') {
    const fixedSeverity = getFixedSeverityByAlertType(selectedAlertType.value)
    activeFilter.value = fixedSeverity || 'ALL'
    return
  }
  activeFilter.value = nextFilter
}

watch(selectedAlertType, (newType) => {
  if (newType === 'ALL') {
    activeFilter.value = 'ALL'
    return
  }

  const fixedSeverity = getFixedSeverityByAlertType(newType)
  activeFilter.value = fixedSeverity || 'ALL'
})

function severityClass(severity) {
  if (severity === 'HIGH') return 'bg-red-500/10 text-red-400 border-red-500/30'
  if (severity === 'MEDIUM') return 'bg-amber-500/10 text-amber-300 border-amber-500/30'
  return 'bg-blue-500/10 text-blue-300 border-blue-500/30'
}

function severityLabel(severity) {
  if (severity === 'HIGH') return 'YÜKSEK'
  if (severity === 'MEDIUM') return 'ORTA'
  return 'DÜŞÜK'
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

async function fetchAlerts() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await api.get('/tenant/alerts')
    alerts.value = res.data?.data ?? []
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'Alarmlar alınamadı. Oturum/tenant yetkisini kontrol edin.'
    console.error('Alarmlar alınamadı:', error?.response?.data?.message || error.message)
  } finally {
    isLoading.value = false
  }
}

async function createMockAlert() {
  isMocking.value = true
  errorMessage.value = ''
  try {
    await api.post('/tenant/alerts/mock/all')
    await fetchAlerts()
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'Mock ihlal üretilemedi.'
    console.error('Mock alert oluşturulamadı:', error?.response?.data?.message || error.message)
  } finally {
    isMocking.value = false
  }
}

async function deleteAlert(alertId) {
  try {
    await api.delete(`/tenant/alerts/${alertId}`)
    alerts.value = alerts.value.filter((alert) => alert.id !== alertId)
  } catch (error) {
    console.error('İhlal silinemedi:', error?.response?.data?.message || error.message)
  }
}

function openDeleteConfirm(alertId) {
  deletingAlertId.value = alertId
  isDeleteConfirmOpen.value = true
}

function closeDeleteConfirm() {
  deletingAlertId.value = ''
  isDeleteConfirmOpen.value = false
}

async function confirmDeleteAlert() {
  if (!deletingAlertId.value) return
  const alertId = deletingAlertId.value
  closeDeleteConfirm()
  await deleteAlert(alertId)
}

onMounted(async () => {
  await fetchAlerts()
})
</script>