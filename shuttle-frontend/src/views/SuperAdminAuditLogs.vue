<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white">Denetim Kayıtları</h1>
        <p class="mt-2 text-slate-400">Tüm sistem etkinliklerinin kronolojik kaydı.</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="fetchLogs" :disabled="loading" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition disabled:opacity-50">
          <svg class="h-3.5 w-3.5" :class="{ 'animate-spin': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"/></svg>
          Yenile
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-slate-900 rounded-2xl border border-slate-800 p-4">
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">İşlem</label>
          <select v-model="filters.action" @change="fetchLogs" class="w-full rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            <option value="">Tümü</option>
            <option value="CREATE">Oluşturma</option>
            <option value="UPDATE">Güncelleme</option>
            <option value="DELETE">Silme</option>
            <option value="LOGIN">Giriş</option>
          </select>
        </div>
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Varlık</label>
          <select v-model="filters.entity" @change="fetchLogs" class="w-full rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            <option value="">Tümü</option>
            <option value="User">Kullanıcı</option>
            <option value="Vehicle">Araç</option>
            <option value="Route">Rota</option>
            <option value="Tenant">Firma</option>
            <option value="Announcement">Duyuru</option>
          </select>
        </div>
        <div>
          <label class="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Kayıt Sayısı</label>
          <select v-model="filters.limit" @change="fetchLogs" class="w-full rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="clearFilters" class="w-full px-4 py-2 rounded-lg text-xs font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition">Filtreleri Temizle</button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <svg class="animate-spin h-8 w-8 text-indigo-500 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <p class="mt-3 text-sm text-slate-500">Yükleniyor…</p>
      </div>

      <div v-else-if="logs.length === 0" class="p-16 text-center">
        <svg class="mx-auto h-14 w-14 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"/></svg>
        <h3 class="mt-3 text-sm font-medium text-slate-500">Kayıt bulunamadı</h3>
      </div>

      <table v-else class="w-full">
        <thead>
          <tr class="border-b border-slate-800">
            <th class="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3">Tarih</th>
            <th class="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3">Kullanıcı</th>
            <th class="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3">Firma</th>
            <th class="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3">İşlem</th>
            <th class="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-5 py-3">Detay</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/50">
          <tr v-for="log in logs" :key="log.id" class="hover:bg-slate-800/40 transition-colors">
            <td class="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">{{ formatDate(log.createdAt) }}</td>
            <td class="px-5 py-3">
              <div class="text-xs font-medium text-white">{{ log.user?.name || '—' }}</div>
              <div class="text-[10px] text-slate-600">{{ log.user?.email || '' }}</div>
            </td>
            <td class="px-5 py-3 text-xs text-slate-400">{{ log.tenant?.name || '—' }}</td>
            <td class="px-5 py-3">
              <span :class="actionBadge(log.action)" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border">
                {{ actionLabel(log.action) }}
              </span>
              <span class="block mt-0.5 text-[10px] text-slate-600">{{ entityLabel(log.entity) }} <span v-if="log.entityId" class="text-slate-700">#{{ log.entityId.slice(0,8) }}</span></span>
            </td>
            <td class="px-5 py-3">
              <button v-if="log.details" @click="expanded === log.id ? expanded = null : expanded = log.id" class="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition">
                <svg class="h-3 w-3 transition-transform" :class="{ 'rotate-90': expanded === log.id }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
                {{ expanded === log.id ? 'Gizle' : 'Göster' }}
              </button>
              <span v-else class="text-[10px] text-slate-700">—</span>
            </td>
          </tr>
          <!-- Expanded Detail Row -->
          <tr v-for="log in logs.filter(l => l.details && expanded === l.id)" :key="'d-'+log.id">
            <td colspan="5" class="px-5 py-3 bg-slate-800/30">
              <pre class="text-[10px] text-slate-400 leading-relaxed overflow-x-auto max-h-48 scrollbar-thin">{{ JSON.stringify(log.details, null, 2) }}</pre>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="logs.length > 0" class="flex items-center justify-between px-5 py-3 border-t border-slate-800">
        <div class="text-[10px] text-slate-600">{{ logs.length }} kayıt gösteriliyor (offset: {{ filters.offset }})</div>
        <div class="flex items-center gap-2">
          <button @click="prevPage" :disabled="filters.offset === 0" class="px-3 py-1.5 rounded-lg text-[10px] font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition disabled:opacity-30">
            ← Önceki
          </button>
          <button @click="nextPage" :disabled="logs.length < filters.limit" class="px-3 py-1.5 rounded-lg text-[10px] font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition disabled:opacity-30">
            Sonraki →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../services/api'

const logs = ref([])
const loading = ref(true)
const expanded = ref(null)

const filters = reactive({
  action: '',
  entity: '',
  limit: 50,
  offset: 0,
})

async function fetchLogs() {
  loading.value = true
  try {
    const params = {}
    if (filters.action) params.action = filters.action
    if (filters.entity) params.entity = filters.entity
    params.limit = filters.limit
    params.offset = filters.offset
    const res = await api.get('/superadmin/audit-logs', { params })
    logs.value = res.data?.data ?? res.data ?? []
  } catch (e) {
    console.error(e.message)
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  Object.assign(filters, { action: '', entity: '', limit: 50, offset: 0 })
  fetchLogs()
}

function prevPage() {
  filters.offset = Math.max(0, filters.offset - filters.limit)
  fetchLogs()
}
function nextPage() {
  filters.offset += filters.limit
  fetchLogs()
}

function actionBadge(a) {
  const map = {
    CREATE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    UPDATE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    DELETE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    LOGIN: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  }
  return map[a] || 'bg-slate-700/50 text-slate-400 border-slate-700'
}

function actionLabel(a) {
  const map = { CREATE: 'Oluşturma', UPDATE: 'Güncelleme', DELETE: 'Silme', LOGIN: 'Giriş' }
  return map[a] || a
}

function entityLabel(e) {
  const map = { User: 'Kullanıcı', Vehicle: 'Araç', Route: 'Rota', Tenant: 'Firma', Announcement: 'Duyuru', Driver: 'Sürücü' }
  return map[e] || e
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

onMounted(fetchLogs)
</script>
