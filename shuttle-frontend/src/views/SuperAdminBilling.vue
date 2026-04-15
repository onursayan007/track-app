<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white">Abonelik ve Faturalandırma</h1>
        <p class="mt-2 text-slate-400">SaaS gelirlerini, müşteri faturalarını ve ödeme durumlarını takip edin.</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="runSuspensionCheck" :disabled="runningCheck" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition disabled:opacity-50">
          <svg :class="runningCheck ? 'animate-spin' : ''" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"/></svg>
          Vade Kontrolü
        </button>
        <button @click="generateMonthlyInvoices" :disabled="generatingInvoices" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition disabled:opacity-50">
          <svg :class="generatingInvoices ? 'animate-spin' : ''" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>
          Aylık Fatura Oluştur
        </button>
        <button @click="openManualInvoice" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Manuel Fatura Oluştur
        </button>
      </div>
    </div>

    <!-- Top Metric Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
        <p class="text-sm font-medium text-slate-400">Aylık Tekrarlayan Gelir (MRR)</p>
        <p class="text-3xl font-bold text-white mt-2">{{ formatCurrency(stats.mrr) }}</p>
      </div>
      <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <p class="text-sm font-medium text-slate-400">Bekleyen Tahsilat</p>
        <p class="text-3xl font-bold text-amber-400 mt-2">{{ formatCurrency(stats.pendingAmount) }}</p>
      </div>
      <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <p class="text-sm font-medium text-slate-400">Gecikmiş (Vadesi Geçen)</p>
        <p class="text-3xl font-bold text-red-400 mt-2">{{ formatCurrency(stats.overdueAmount) }}</p>
      </div>
      <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <p class="text-sm font-medium text-slate-400">Aktif Lisanslı Firma</p>
        <p class="text-3xl font-bold text-cyan-400 mt-2">{{ stats.activeLicensedTenants }}</p>
      </div>
    </div>

    <!-- Tenant MRR Breakdown Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
      <div class="p-4 sm:p-6 border-b border-slate-800">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <svg class="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605"/></svg>
          Firma Bazlı Aylık Gelir Dağılımı
        </h2>
        <p class="text-sm text-slate-500 mt-1">Her firmanın araç sayısına göre hesaplanan aylık fatura tutarı.</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left text-slate-300">
          <thead class="text-xs text-slate-400 uppercase bg-slate-900">
            <tr class="border-b border-slate-800">
              <th class="px-6 py-4">Firma Adı</th>
              <th class="px-6 py-4">Plan</th>
              <th class="px-6 py-4 text-center">Araç Sayısı</th>
              <th class="px-6 py-4 text-right">Birim Fiyat</th>
              <th class="px-6 py-4 text-right">Aylık Tutar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingInvoices" v-for="n in 4" :key="'skel-brk-'+n" class="border-b border-slate-800">
              <td v-for="c in 5" :key="c" class="px-6 py-4"><div class="h-4 bg-slate-800 rounded animate-pulse" :style="{ width: (40 + Math.random() * 40) + '%' }"></div></td>
            </tr>
            <tr v-if="!loadingInvoices && tenantBreakdown.length === 0">
              <td colspan="5" class="text-center py-12 text-slate-500">Plana atanmış aktif firma yok.</td>
            </tr>
            <tr v-for="tb in tenantBreakdown" :key="tb.tenantId" class="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
              <td class="px-6 py-4 font-medium text-cyan-400">{{ tb.tenantName }}</td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/10 text-indigo-400">{{ tb.planName }}</span>
              </td>
              <td class="px-6 py-4 text-center font-mono font-bold text-white">{{ tb.vehicleCount }}</td>
              <td class="px-6 py-4 text-right font-mono text-slate-400">{{ formatCurrency(tb.pricePerVehicle) }}</td>
              <td class="px-6 py-4 text-right font-mono font-bold text-emerald-400">{{ formatCurrency(tb.currentInvoiceAmount) }}</td>
            </tr>
          </tbody>
          <tfoot v-if="tenantBreakdown.length > 0">
            <tr class="border-t-2 border-indigo-500/30 bg-slate-900/80">
              <td colspan="2" class="px-6 py-4 text-sm font-bold text-slate-300">TOPLAM MRR</td>
              <td class="px-6 py-4 text-center font-mono font-bold text-white">{{ tenantBreakdown.reduce((s, t) => s + t.vehicleCount, 0) }}</td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-right font-mono text-lg font-black text-indigo-400">{{ formatCurrency(stats.mrr) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Filters and Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
      <div class="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="relative w-full sm:max-w-xs">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input v-model="searchQuery" type="search" placeholder="Firma adı veya fatura no ara..." class="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"/>
        </div>
        <div class="flex items-center bg-slate-800/80 border border-slate-700 rounded-lg p-1 space-x-1">
          <button @click="statusFilter = ''" :class="['px-3 py-1.5 text-sm font-medium rounded-md transition-colors', statusFilter === '' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700']">Tümü</button>
          <button @click="statusFilter = 'PAID'" :class="['px-3 py-1.5 text-sm font-medium rounded-md transition-colors', statusFilter === 'PAID' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700']">Ödendi</button>
          <button @click="statusFilter = 'PENDING'" :class="['px-3 py-1.5 text-sm font-medium rounded-md transition-colors', statusFilter === 'PENDING' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700']">Bekliyor</button>
          <button @click="statusFilter = 'OVERDUE'" :class="['px-3 py-1.5 text-sm font-medium rounded-md transition-colors', statusFilter === 'OVERDUE' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700']">Gecikmiş</button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left text-slate-300">
          <thead class="text-xs text-slate-400 uppercase bg-slate-900">
            <tr class="border-b border-slate-800">
              <th class="px-6 py-4">Fatura No</th>
              <th class="px-6 py-4">Firma Adı</th>
              <th class="px-6 py-4">Tür</th>
              <th class="px-6 py-4">Tutar</th>
              <th class="px-6 py-4">Vade</th>
              <th class="px-6 py-4">Durum</th>
              <th class="px-6 py-4 text-right">Eylemler</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingInvoices" v-for="n in 5" :key="n" class="border-b border-slate-800">
              <td v-for="c in 7" :key="c" class="px-6 py-4"><div class="h-4 bg-slate-800 rounded animate-pulse" :style="{ width: (40 + Math.random() * 40) + '%' }"></div></td>
            </tr>
            <tr v-if="!loadingInvoices && filteredInvoices.length === 0">
              <td colspan="7" class="text-center py-12 text-slate-500">Arama kriterlerine uygun fatura bulunamadı.</td>
            </tr>
            <tr v-for="inv in filteredInvoices" :key="inv.id" class="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
              <td class="px-6 py-4 font-mono font-bold text-white whitespace-nowrap">{{ inv.invoiceNo }}</td>
              <td class="px-6 py-4 font-medium text-cyan-400">{{ inv.tenant?.name ?? '—' }}</td>
              <td class="px-6 py-4">
                <span :class="typeClass(inv.type)" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">{{ typeLabel(inv.type) }}</span>
              </td>
              <td class="px-6 py-4 font-mono">{{ formatCurrency(inv.amount) }}</td>
              <td class="px-6 py-4 text-slate-400">{{ formatDate(inv.dueDate) }}</td>
              <td class="px-6 py-4">
                <span :class="statusClass(inv.status)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                  {{ statusLabel(inv.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                <button @click="downloadPdf(inv)" class="font-medium text-indigo-400 hover:underline inline-flex items-center text-xs">
                  <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  PDF
                </button>
                <button v-if="inv.status !== 'PAID'" @click="markPaid(inv)" class="font-medium text-emerald-400 hover:underline inline-flex items-center text-xs">
                  <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
                  Ödendi
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Manuel Fatura Modal -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="showManualModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="showManualModal = false"></div>
          <div class="relative z-10 w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-[0_0_60px_rgba(79,70,229,0.15)]">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <span class="flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                </span>
                Manuel Fatura Oluştur
              </h2>
              <button @click="showManualModal = false" class="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="px-6 py-6 space-y-4">
              <div v-if="manualError" class="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3">
                <p class="text-sm text-rose-400">{{ manualError }}</p>
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Firma *</label>
                <select v-model="manualForm.tenantId" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition">
                  <option value="">Firma Seçin</option>
                  <option v-for="t in tenants" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Tutar (₺) *</label>
                  <input v-model.number="manualForm.amount" type="number" min="0" step="0.01" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition font-mono" />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Tür *</label>
                  <select v-model="manualForm.type" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition">
                    <option value="HARDWARE">Donanım</option>
                    <option value="ONE_TIME_SETUP">Kurulum Ücreti</option>
                    <option value="RECURRING">Aylık Abonelik</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Açıklama *</label>
                <input v-model="manualForm.description" type="text" placeholder="ör: GPS Cihazı kurulumu (5 araç)" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Vade Tarihi *</label>
                <input v-model="manualForm.dueDate" type="date" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
              <button @click="showManualModal = false" class="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition">İptal</button>
              <button @click="saveManualInvoice" :disabled="savingManual" class="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50">
                {{ savingManual ? 'Kaydediliyor...' : 'Fatura Oluştur' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../services/api'

// ─── State ────────────────────────────────────────────
const invoices = ref([])
const tenants = ref([])
const stats = ref({ mrr: 0, pendingAmount: 0, overdueAmount: 0, paidThisMonth: 0, activeLicensedTenants: 0 })
const tenantBreakdown = ref([])
const loadingInvoices = ref(true)
const searchQuery = ref('')
const statusFilter = ref('')
const runningCheck = ref(false)
const generatingInvoices = ref(false)

// Manual invoice modal
const showManualModal = ref(false)
const savingManual = ref(false)
const manualError = ref('')
const manualForm = reactive({
  tenantId: '',
  amount: 0,
  type: 'HARDWARE',
  description: '',
  dueDate: '',
})

// ─── Fetch data ────────────────────────────────────────
async function fetchAll() {
  loadingInvoices.value = true
  try {
    const [invRes, statRes, tenRes] = await Promise.all([
      api.get('/superadmin/invoices'),
      api.get('/superadmin/billing/stats'),
      api.get('/superadmin/tenants'),
    ])
    invoices.value = invRes.data?.data ?? invRes.data ?? []
    const statData = statRes.data?.data ?? statRes.data ?? stats.value
    stats.value = statData
    tenantBreakdown.value = statData.tenantBreakdown ?? []
    tenants.value = tenRes.data?.data ?? tenRes.data ?? []
  } catch (e) {
    console.error('Billing verileri yüklenemedi:', e.message)
  } finally {
    loadingInvoices.value = false
  }
}

// ─── Filters ──────────────────────────────────────────
const filteredInvoices = computed(() => {
  return invoices.value.filter(inv => {
    const q = searchQuery.value.toLowerCase()
    const searchMatch = !q || inv.invoiceNo?.toLowerCase().includes(q) || inv.tenant?.name?.toLowerCase().includes(q)
    const statusMatch = !statusFilter.value || inv.status === statusFilter.value
    return searchMatch && statusMatch
  })
})

// ─── Helpers ──────────────────────────────────────────
function formatCurrency(val) {
  return (val ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function statusLabel(s) {
  const map = { PAID: 'Ödendi', PENDING: 'Bekliyor', OVERDUE: 'Gecikmiş' }
  return map[s] || s
}

function statusClass(s) {
  const map = {
    PAID: 'bg-green-500/10 text-green-400 border-green-500/20',
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    OVERDUE: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return map[s] || 'bg-slate-700/50 text-slate-400 border-slate-700'
}

function typeLabel(t) {
  const map = { RECURRING: 'Aylık', PRORATA: 'Kıstelyevm', ONE_TIME_SETUP: 'Kurulum', HARDWARE: 'Donanım' }
  return map[t] || t
}

function typeClass(t) {
  const map = {
    RECURRING: 'bg-indigo-500/10 text-indigo-400',
    PRORATA: 'bg-cyan-500/10 text-cyan-400',
    ONE_TIME_SETUP: 'bg-purple-500/10 text-purple-400',
    HARDWARE: 'bg-orange-500/10 text-orange-400',
  }
  return map[t] || 'bg-slate-700/50 text-slate-400'
}

// ─── Actions ──────────────────────────────────────────
async function markPaid(inv) {
  try {
    await api.patch(`/superadmin/invoices/${inv.id}/pay`)
    await fetchAll()
  } catch (e) {
    alert(e.response?.data?.message || 'Ödeme işaretlenemedi')
  }
}

async function runSuspensionCheck() {
  runningCheck.value = true
  try {
    await api.post('/superadmin/billing/run-suspension-check')
    await fetchAll()
  } catch (e) {
    console.error('Vade kontrolü hatası:', e.message)
  } finally {
    runningCheck.value = false
  }
}

async function generateMonthlyInvoices() {
  generatingInvoices.value = true
  try {
    const res = await api.post('/superadmin/billing/generate-invoices')
    const data = res.data?.data ?? res.data
    alert(`${data.generatedCount} fatura oluşturuldu, ${data.skippedCount} atlandı.`)
    await fetchAll()
  } catch (e) {
    alert(e.response?.data?.message || 'Fatura oluşturma hatası')
  } finally {
    generatingInvoices.value = false
  }
}

function openManualInvoice() {
  Object.assign(manualForm, { tenantId: '', amount: 0, type: 'HARDWARE', description: '', dueDate: '' })
  manualError.value = ''
  showManualModal.value = true
}

async function saveManualInvoice() {
  if (!manualForm.tenantId || !manualForm.amount || !manualForm.description || !manualForm.dueDate) {
    manualError.value = 'Tüm alanları doldurun'
    return
  }
  savingManual.value = true
  manualError.value = ''
  try {
    await api.post('/superadmin/invoices', manualForm)
    showManualModal.value = false
    await fetchAll()
  } catch (e) {
    manualError.value = e.response?.data?.message || 'Fatura oluşturulamadı'
  } finally {
    savingManual.value = false
  }
}

// ─── PDF Generation (client-side using jspdf) ─────────
async function downloadPdf(inv) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF('p', 'mm', 'a4')
  const w = doc.internal.pageSize.getWidth()

  // Header bar
  doc.setFillColor(30, 41, 59)
  doc.rect(0, 0, w, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('FATURA', 20, 25)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(inv.invoiceNo, w - 20, 20, { align: 'right' })
  doc.text(`Tarih: ${formatDate(inv.issueDate)}`, w - 20, 27, { align: 'right' })
  doc.text(`Vade: ${formatDate(inv.dueDate)}`, w - 20, 34, { align: 'right' })

  // Platform info
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(8)
  doc.text('Servisim Geliyor B2B SaaS Platformu', 20, 50)
  doc.text('www.servisimgeliyor.com', 20, 55)

  // Tenant info
  const tenant = inv.tenant || {}
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Fatura Edilen Firma:', 20, 70)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(tenant.legalName || tenant.name || '—', 20, 77)
  let infoY = 83
  if (tenant.taxOffice || tenant.taxId) {
    doc.text(`Vergi Dairesi: ${tenant.taxOffice || '—'}   VKN: ${tenant.taxId || '—'}`, 20, infoY)
    infoY += 6
  }
  if (tenant.billingAddress) {
    doc.text(`Adres: ${tenant.billingAddress}`, 20, infoY)
    infoY += 6
  }
  if (tenant.contactPhone) {
    doc.text(`Tel: ${tenant.contactPhone}`, 20, infoY)
    infoY += 6
  }

  // Table header
  const tableY = Math.max(infoY + 10, 105)
  doc.setFillColor(241, 245, 249)
  doc.rect(20, tableY, w - 40, 10, 'F')
  doc.setTextColor(71, 85, 105)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Aciklama', 25, tableY + 7)
  doc.text('Tur', 120, tableY + 7)
  doc.text('Tutar', w - 25, tableY + 7, { align: 'right' })

  // Row
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const rowY = tableY + 18
  doc.text(inv.description || typeLabel(inv.type), 25, rowY)
  doc.text(typeLabel(inv.type), 120, rowY)
  doc.text(formatCurrency(inv.amount), w - 25, rowY, { align: 'right' })

  doc.setDrawColor(203, 213, 225)
  doc.line(20, rowY + 5, w - 20, rowY + 5)

  // Total
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('TOPLAM:', 120, rowY + 18)
  doc.setTextColor(79, 70, 229)
  doc.text(formatCurrency(inv.amount), w - 25, rowY + 18, { align: 'right' })

  // Status
  const statusY = rowY + 35
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  if (inv.status === 'PAID') { doc.setTextColor(34, 197, 94); doc.text('ODENDI', w / 2, statusY, { align: 'center' }) }
  else if (inv.status === 'OVERDUE') { doc.setTextColor(239, 68, 68); doc.text('GECIKMIS', w / 2, statusY, { align: 'center' }) }
  else { doc.setTextColor(245, 158, 11); doc.text('ODEME BEKLIYOR', w / 2, statusY, { align: 'center' }) }

  // Footer
  doc.setTextColor(148, 163, 184)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Bu fatura Fleet Tracking SaaS sistemi tarafindan otomatik olusturulmustur.', w / 2, 280, { align: 'center' })

  doc.save(`${inv.invoiceNo}.pdf`)
}

onMounted(fetchAll)
</script>