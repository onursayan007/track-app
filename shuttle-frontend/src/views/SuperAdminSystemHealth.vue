<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white">IoT Sistem Sağlığı</h1>
        <p class="mt-2 text-slate-400">Platform telemetri, kaynak kullanımı ve bağlantı durumları.</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold" :class="data.status === 'OPERATIONAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'">
          <span class="w-2 h-2 rounded-full animate-pulse" :class="data.status === 'OPERATIONAL' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500'"></span>
          {{ data.status || 'LOADING' }}
        </span>
        <button @click="fetchHealth" :disabled="loading" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition disabled:opacity-50">
          <svg :class="loading ? 'animate-spin' : ''" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"/></svg>
          Yenile
        </button>
      </div>
    </div>

    <!-- Metric Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- CPU -->
      <div class="relative bg-slate-900 rounded-2xl border border-slate-800 p-6 overflow-hidden group hover:border-cyan-500/30 transition-all">
        <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="relative">
          <div class="flex items-center justify-between mb-4">
            <div class="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <svg class="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z"/></svg>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">CPU</span>
          </div>
          <div class="text-3xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)] font-mono">{{ data.cpuUsage || '—' }}</div>
          <p class="text-xs text-slate-500 mt-1">İşlemci Kullanımı</p>
        </div>
      </div>

      <!-- RAM -->
      <div class="relative bg-slate-900 rounded-2xl border border-slate-800 p-6 overflow-hidden group hover:border-indigo-500/30 transition-all">
        <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="relative">
          <div class="flex items-center justify-between mb-4">
            <div class="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <svg class="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z"/></svg>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">RAM</span>
          </div>
          <div class="text-3xl font-black text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.4)] font-mono">{{ data.ramUsage || '—' }}</div>
          <p class="text-xs text-slate-500 mt-1">Bellek Kullanımı</p>
        </div>
      </div>

      <!-- UDP Connections -->
      <div class="relative bg-slate-900 rounded-2xl border border-slate-800 p-6 overflow-hidden group hover:border-emerald-500/30 transition-all">
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="relative">
          <div class="flex items-center justify-between mb-4">
            <div class="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <svg class="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z"/></svg>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">UDP</span>
          </div>
          <div class="text-3xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)] font-mono">{{ data.activeUdpConnections ?? '—' }}</div>
          <p class="text-xs text-slate-500 mt-1">Aktif UDP Bağlantısı</p>
        </div>
      </div>

      <!-- GPS Packets/sec -->
      <div class="relative bg-slate-900 rounded-2xl border border-slate-800 p-6 overflow-hidden group hover:border-amber-500/30 transition-all">
        <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="relative">
          <div class="flex items-center justify-between mb-4">
            <div class="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <svg class="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">GPS/s</span>
          </div>
          <div class="text-3xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)] font-mono">{{ data.packetsProcessedPerSec ?? '—' }}</div>
          <p class="text-xs text-slate-500 mt-1">GPS paket/saniye</p>
        </div>
      </div>
    </div>

    <!-- Secondary Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- TCP Connections -->
      <div class="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-slate-400">TCP Bağlantıları</h3>
          <span class="text-2xl font-black text-cyan-400 font-mono drop-shadow-[0_0_6px_rgba(34,211,238,0.3)]">{{ data.activeTcpConnections ?? '—' }}</span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-2">
          <div class="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(34,211,238,0.4)]" :style="{ width: Math.min((data.activeTcpConnections || 0) / 2, 100) + '%' }"></div>
        </div>
      </div>

      <!-- WebSocket Clients -->
      <div class="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-slate-400">WebSocket İstemcileri</h3>
          <span class="text-2xl font-black text-indigo-400 font-mono drop-shadow-[0_0_6px_rgba(129,140,248,0.3)]">{{ data.websocketClients ?? '—' }}</span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-2">
          <div class="bg-gradient-to-r from-indigo-500 to-indigo-400 h-2 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(129,140,248,0.4)]" :style="{ width: Math.min((data.websocketClients || 0) / 1, 100) + '%' }"></div>
        </div>
      </div>

      <!-- DB Pool -->
      <div class="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-slate-400">DB Bağlantı Havuzu</h3>
          <span class="text-sm font-mono text-emerald-400"><span class="font-black text-2xl drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]">{{ data.dbConnectionPool?.active ?? '—' }}</span> <span class="text-slate-500">/ {{ data.dbConnectionPool?.max ?? '—' }}</span></span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-2">
          <div class="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(52,211,153,0.4)]" :style="{ width: ((data.dbConnectionPool?.active || 0) / (data.dbConnectionPool?.max || 20) * 100) + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Bottom Info Strip -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex items-center gap-4">
        <div class="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
          <svg class="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/></svg>
        </div>
        <div>
          <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold">Bugün İşlenen GPS Noktası</p>
          <p class="text-2xl font-black text-white font-mono">{{ (data.gpsPointsToday ?? 0).toLocaleString('tr-TR') }}</p>
        </div>
      </div>

      <div class="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex items-center gap-4">
        <div class="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
          <svg class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
        </div>
        <div>
          <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold">Sunucu Çalışma Süresi (uptime)</p>
          <p class="text-2xl font-black text-white font-mono">{{ formatUptime(data.uptime) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import api from '../services/api'

const loading = ref(false)
const data = reactive({
  status: '', cpuUsage: '', ramUsage: '', heapUsed: '',
  activeUdpConnections: 0, activeTcpConnections: 0,
  packetsProcessedPerSec: 0, gpsPointsToday: 0,
  websocketClients: 0, dbConnectionPool: { active: 0, idle: 0, max: 20 },
  uptime: 0, lastTelemetryAt: '',
})

let interval = null

async function fetchHealth() {
  loading.value = true
  try {
    const res = await api.get('/superadmin/system-health')
    const d = res.data?.data ?? res.data
    Object.assign(data, d)
  } catch (e) {
    console.error('Health check failed:', e.message)
  } finally {
    loading.value = false
  }
}

function formatUptime(seconds) {
  if (!seconds) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts = []
  if (d > 0) parts.push(`${d}g`)
  parts.push(`${h}s`)
  parts.push(`${m}dk`)
  return parts.join(' ')
}

onMounted(() => {
  fetchHealth()
  interval = setInterval(fetchHealth, 10000) // Auto-refresh every 10s
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>
