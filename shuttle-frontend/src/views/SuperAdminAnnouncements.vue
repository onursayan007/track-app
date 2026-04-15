<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white">Sistem Duyuruları</h1>
        <p class="mt-2 text-slate-400">Tüm kullanıcı rollerine yönelik global duyuruları yönetin.</p>
      </div>
      <button @click="openCreate" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
        Yeni Duyuru
      </button>
    </div>

    <!-- Announcements List -->
    <div v-if="loading" class="space-y-4">
      <div v-for="n in 3" :key="n" class="bg-slate-900 rounded-2xl border border-slate-800 p-6 animate-pulse">
        <div class="h-5 bg-slate-800 rounded w-1/3 mb-3"></div>
        <div class="h-4 bg-slate-800 rounded w-2/3 mb-2"></div>
        <div class="h-3 bg-slate-800 rounded w-1/4"></div>
      </div>
    </div>

    <div v-else-if="announcements.length === 0" class="text-center py-16">
      <svg class="mx-auto h-16 w-16 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46"/></svg>
      <h3 class="mt-4 text-lg font-semibold text-slate-400">Henüz duyuru yok</h3>
      <p class="text-sm text-slate-600 mt-1">İlk duyurunuzu oluşturun.</p>
    </div>

    <div v-else class="space-y-4">
      <div v-for="ann in announcements" :key="ann.id" class="bg-slate-900 rounded-2xl border border-slate-800 p-6 hover:border-slate-700 transition-all">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-2">
              <span :class="typeBadge(ann.type)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border">
                {{ typeLabel(ann.type) }}
              </span>
              <span :class="ann.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-700/50 text-slate-500 border-slate-700'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                {{ ann.isActive ? 'Aktif' : 'Pasif' }}
              </span>
              <span class="text-xs text-slate-600">{{ formatDate(ann.createdAt) }}</span>
            </div>
            <h3 class="text-lg font-bold text-white mb-1">{{ ann.title }}</h3>
            <p class="text-sm text-slate-400 leading-relaxed">{{ ann.message }}</p>
            <div class="flex flex-wrap gap-1.5 mt-3">
              <span v-for="role in ann.targetRoles" :key="role" class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                {{ roleLabel(role) }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button @click="toggle(ann)" class="p-2 rounded-lg text-xs font-medium transition" :class="ann.isActive ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20'" :title="ann.isActive ? 'Pasife Al' : 'Aktifleştir'">
              <svg v-if="ann.isActive" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5"/></svg>
              <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"/></svg>
            </button>
            <button @click="remove(ann)" class="p-2 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition" title="Sil">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tenant Error Reports -->
    <section class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div class="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 class="text-lg font-bold text-white">Firmalardan Gelen Hata Bildirimleri</h2>
          <p class="text-xs text-slate-500 mt-1">Company Dispatch ekranından gelen super admin hata bildirimleri.</p>
        </div>
        <button @click="fetchErrorReports" class="px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition">
          Yenile
        </button>
      </div>

      <div v-if="reportsLoading" class="py-8 text-center text-sm text-slate-400">Bildirimler yükleniyor...</div>
      <div v-else-if="errorReports.length === 0" class="py-8 text-center text-sm text-slate-500">Henüz gelen hata bildirimi yok.</div>
      <div v-else class="space-y-3">
        <article v-for="report in errorReports" :key="report.id" class="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border"
                  :class="report.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' : report.status === 'IN_REVIEW' ? 'bg-amber-500/10 text-amber-300 border-amber-500/25' : 'bg-rose-500/10 text-rose-300 border-rose-500/25'">
                  {{ report.status }}
                </span>
                <span class="text-xs text-slate-500">{{ report.tenant?.name || 'Tenant Bilinmiyor' }}</span>
                <span class="text-xs text-slate-600">{{ formatDate(report.createdAt) }}</span>
              </div>
              <h3 class="mt-2 text-sm font-bold text-white">{{ report.subject }}</h3>
              <p class="mt-1 text-xs text-slate-400 leading-relaxed">{{ report.details }}</p>
              <p class="mt-2 text-[11px] text-slate-500">
                Gönderen: {{ report.reporter?.name || '-' }} • Kaynak: {{ report.source || '-' }}
              </p>
            </div>
            <button
              v-if="report.status !== 'RESOLVED'"
              @click="resolveReport(report.id)"
              class="shrink-0 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition"
            >
              Çözüldü İşaretle
            </button>
          </div>
        </article>
      </div>
    </section>

    <!-- Create Modal -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="showModal = false"></div>
          <div class="relative z-10 w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-[0_0_60px_rgba(79,70,229,0.15)]">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <span class="flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46"/></svg>
                </span>
                Yeni Duyuru Oluştur
              </h2>
              <button @click="showModal = false" class="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="px-6 py-6 space-y-4">
              <div v-if="formError" class="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3">
                <p class="text-sm text-rose-400">{{ formError }}</p>
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Başlık *</label>
                <input v-model="form.title" type="text" placeholder="ör: Sistem Bakımı" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Mesaj *</label>
                <textarea v-model="form.message" rows="3" placeholder="Duyuru içeriğini yazın..." class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition resize-none"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Tür</label>
                  <select v-model="form.type" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition">
                    <option value="INFO">Bilgi</option>
                    <option value="WARNING">Uyarı</option>
                    <option value="SUCCESS">Başarı</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Hedef Roller</label>
                  <div class="space-y-2 mt-1">
                    <label v-for="opt in roleOptions" :key="opt.value" class="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" :value="opt.value" v-model="form.targetRoles" class="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50" />
                      <span class="text-xs text-slate-400 group-hover:text-slate-200 transition">{{ opt.label }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
              <button @click="showModal = false" class="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition">İptal</button>
              <button @click="save" :disabled="saving" class="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50">
                {{ saving ? 'Kaydediliyor...' : 'Yayınla' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../services/api'

const announcements = ref([])
const errorReports = ref([])
const loading = ref(true)
const reportsLoading = ref(false)
const showModal = ref(false)
const saving = ref(false)
const formError = ref('')

const form = reactive({
  title: '',
  message: '',
  type: 'INFO',
  targetRoles: ['ALL'],
})

const roleOptions = [
  { value: 'ALL', label: 'Tüm Roller' },
  { value: 'TENANT_ADMIN', label: 'Firma Yöneticileri' },
  { value: 'DRIVER', label: 'Sürücüler' },
  { value: 'PASSENGER', label: 'Yolcular' },
]

async function fetchAnnouncements() {
  loading.value = true
  try {
    const res = await api.get('/superadmin/announcements')
    announcements.value = res.data?.data ?? res.data ?? []
  } catch (e) {
    console.error(e.message)
  } finally {
    loading.value = false
  }
}

async function fetchErrorReports() {
  reportsLoading.value = true
  try {
    const res = await api.get('/superadmin/comms/error-reports')
    errorReports.value = res.data?.data ?? []
  } catch (e) {
    console.error(e.message)
  } finally {
    reportsLoading.value = false
  }
}

async function resolveReport(id) {
  try {
    await api.put(`/superadmin/comms/error-reports/${id}/resolve`)
    await fetchErrorReports()
  } catch (e) {
    alert(e.response?.data?.message || 'Bildirimi çözümlenirken hata oluştu')
  }
}

function openCreate() {
  Object.assign(form, { title: '', message: '', type: 'INFO', targetRoles: ['ALL'] })
  formError.value = ''
  showModal.value = true
}

async function save() {
  if (!form.title || !form.message) {
    formError.value = 'Başlık ve mesaj zorunludur'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    await api.post('/superadmin/announcements', form)
    showModal.value = false
    await fetchAnnouncements()
  } catch (e) {
    formError.value = e.response?.data?.message || 'Oluşturulamadı'
  } finally {
    saving.value = false
  }
}

async function toggle(ann) {
  try {
    await api.patch(`/superadmin/announcements/${ann.id}/toggle`)
    await fetchAnnouncements()
  } catch (e) {
    console.error(e.message)
  }
}

async function remove(ann) {
  if (!confirm(`"${ann.title}" duyurusunu silmek istediğinize emin misiniz?`)) return
  try {
    await api.delete(`/superadmin/announcements/${ann.id}`)
    await fetchAnnouncements()
  } catch (e) {
    alert(e.response?.data?.message || 'Silinemedi')
  }
}

function typeBadge(t) {
  const map = {
    INFO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    WARNING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    SUCCESS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  }
  return map[t] || 'bg-slate-700/50 text-slate-400 border-slate-700'
}

function typeLabel(t) {
  const map = { INFO: 'Bilgi', WARNING: 'Uyarı', SUCCESS: 'Başarı' }
  return map[t] || t
}

function roleLabel(r) {
  const map = { ALL: 'Tüm Roller', TENANT_ADMIN: 'Şirketler', DRIVER: 'Sürücüler', PASSENGER: 'Yolcular', SUPER_ADMIN: 'Süper Admin' }
  return map[r] || r
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  await Promise.all([fetchAnnouncements(), fetchErrorReports()])
})
</script>
