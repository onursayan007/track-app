<template>
  <div class="min-h-full bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
    <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">İletişim Merkezi</h1>
        <p class="text-slate-400 mt-1 text-sm">Sürücü/yolcu duyuruları, SOS yönetimi ve super admin hata bildirimleri.</p>
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 font-semibold text-rose-200">
          Açık SOS: {{ openSosCount }}
        </span>
        <span class="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 font-semibold text-indigo-200">
          Duyuru: {{ announcements.length }}
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 space-y-6">
        <section class="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
          <h2 class="text-lg font-bold text-white mb-4">Yeni Duyuru</h2>
          <div v-if="announceError" class="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">{{ announceError }}</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="space-y-1.5">
              <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Başlık</span>
              <input v-model="announceForm.title" class="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Örn: 18:00 yoğun yağış" />
            </label>
            <label class="space-y-1.5">
              <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Tür</span>
              <select v-model="announceForm.type" class="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="INFO">Bilgi</option>
                <option value="WARNING">Uyarı</option>
                <option value="SUCCESS">Başarı</option>
              </select>
            </label>
            <label class="space-y-1.5">
              <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Öncelik</span>
              <select v-model="announceForm.priority" class="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="LOW">Düşük</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Yüksek</option>
                <option value="CRITICAL">Kritik</option>
              </select>
            </label>
            <label class="space-y-1.5">
              <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Hedef</span>
              <select v-model="announceForm.targetType" class="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="ALL">Tüm Kullanıcılar</option>
                <option value="DRIVERS">Sürücüler</option>
                <option value="PASSENGERS">Yolcular</option>
                <option value="TENANT_ADMINS">Firma Yöneticileri</option>
                <option value="VEHICLE_PLATE">Plakaya Özel</option>
              </select>
            </label>
          </div>

          <label class="mt-4 block space-y-1.5" v-if="announceForm.targetType === 'VEHICLE_PLATE'">
            <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Plaka</span>
            <input v-model="announceForm.targetValue" class="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="34 ABC 123" />
          </label>

          <label class="mt-4 block space-y-1.5">
            <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Mesaj</span>
            <textarea v-model="announceForm.message" rows="3" class="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Duyuru içeriği"></textarea>
          </label>

          <div class="mt-4 flex items-center justify-end">
            <button @click="createAnnouncement" :disabled="announceSaving" class="inline-flex items-center rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed transition">
              {{ announceSaving ? 'Yayınlanıyor...' : 'Duyuru Yayınla' }}
            </button>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
          <h2 class="text-lg font-bold text-white mb-4">Aktif SOS Listesi</h2>
          <div v-if="loadingSos" class="text-sm text-slate-400 py-8 text-center">SOS kayıtları yükleniyor...</div>
          <div v-else-if="sosAlerts.length === 0" class="text-sm text-slate-500 py-8 text-center">Aktif SOS kaydı yok.</div>
          <div v-else class="space-y-3">
            <article v-for="item in sosAlerts" :key="item.id" class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <div class="flex items-center flex-wrap gap-2">
                    <span class="inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-bold border" :class="item.status === 'OPEN' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'">
                      {{ item.status === 'OPEN' ? 'AÇIK' : item.status }}
                    </span>
                    <span class="text-xs text-slate-400">{{ formatDate(item.createdAt) }}</span>
                    <span v-if="item.isMock" class="inline-flex items-center rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-1 text-[10px] font-bold text-fuchsia-200">MOCK</span>
                  </div>
                  <p class="mt-2 text-sm text-white font-semibold">{{ item.plateSnapshot || item.vehicle?.plate || 'Plaka Bilinmiyor' }}</p>
                  <p class="text-xs text-slate-400 mt-0.5">{{ item.driver?.name || 'Sürücü Bilinmiyor' }} • {{ item.driver?.phone || '-' }}</p>
                  <p class="text-sm text-slate-300 mt-2">{{ item.message || 'Mesaj yok' }}</p>
                </div>
                <button @click="resolveSos(item.id)" class="inline-flex items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 transition">
                  Çözüldü İşaretle
                </button>
              </div>
            </article>
          </div>
        </section>
      </div>

      <div class="space-y-6">
        <section class="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 class="text-base font-bold text-white mb-3">Simülasyon Paneli</h2>
          <div class="space-y-2">
            <button @click="simulateAnnouncementToast" class="w-full rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2.5 text-sm font-semibold text-indigo-200 hover:bg-indigo-500/20 transition">
              Duyuru Toast Simüle Et
            </button>
            <button @click="createMockSos" :disabled="mockSosLoading" class="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm font-semibold text-rose-200 hover:bg-rose-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition">
              {{ mockSosLoading ? 'Üretiliyor...' : 'Test SOS Enjekte Et' }}
            </button>
          </div>

          <div class="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
            <div v-if="simToasts.length === 0" class="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-500">
              Henüz simüle edilmiş bildirim yok.
            </div>
            <article v-for="toast in simToasts" :key="toast.id" class="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2">
              <p class="text-xs font-semibold text-white">{{ toast.title }}</p>
              <p class="text-[11px] text-slate-400 mt-0.5">{{ toast.message }}</p>
              <p class="text-[10px] text-slate-600 mt-1">{{ formatDate(toast.createdAt) }}</p>
            </article>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 class="text-base font-bold text-white mb-3">Super Admin'e Hata Bildir</h2>
          <div v-if="errorReportMessage" class="mb-3 rounded-lg border px-3 py-2 text-xs" :class="errorReportSuccess ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/30 bg-rose-500/10 text-rose-200'">
            {{ errorReportMessage }}
          </div>
          <label class="block space-y-1.5">
            <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Konu</span>
            <input v-model="errorForm.subject" class="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Örn: Duyuru gönderimi yavaş" />
          </label>
          <label class="mt-3 block space-y-1.5">
            <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Detay</span>
            <textarea v-model="errorForm.details" rows="4" class="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Hata adımlarını yazın"></textarea>
          </label>
          <button @click="submitErrorReport" :disabled="errorReportLoading" class="mt-4 w-full rounded-xl bg-amber-600 hover:bg-amber-500 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed transition">
            {{ errorReportLoading ? 'Gönderiliyor...' : 'Hata Bildirimi Gönder' }}
          </button>
        </section>
      </div>
    </div>

    <section class="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <h2 class="text-lg font-bold text-white mb-4">Son Duyurular</h2>
      <div v-if="loadingAnnouncements" class="text-sm text-slate-400 py-8 text-center">Duyurular yükleniyor...</div>
      <div v-else-if="announcements.length === 0" class="text-sm text-slate-500 py-8 text-center">Henüz duyuru yok.</div>
      <div v-else class="space-y-3">
        <article v-for="item in announcements" :key="item.id" class="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
          <div class="flex items-center flex-wrap gap-2">
            <span class="inline-flex items-center rounded-lg border px-2 py-1 text-[10px] font-bold" :class="typeClass(item.type)">{{ item.type }}</span>
            <span class="inline-flex items-center rounded-lg border px-2 py-1 text-[10px] font-bold" :class="priorityClass(item.priority)">{{ item.priority || 'NORMAL' }}</span>
            <span class="text-[11px] text-slate-500">{{ item.targetType || 'ALL' }}</span>
            <span class="text-[11px] text-slate-600">{{ formatDate(item.createdAt) }}</span>
          </div>
          <p class="mt-2 text-sm font-semibold text-white">{{ item.title }}</p>
          <p class="mt-1 text-sm text-slate-300">{{ item.message }}</p>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'

const announcements = ref([])
const sosAlerts = ref([])
const simToasts = ref([])

const loadingAnnouncements = ref(false)
const loadingSos = ref(false)
const announceSaving = ref(false)
const announceError = ref('')
const mockSosLoading = ref(false)

const errorReportLoading = ref(false)
const errorReportMessage = ref('')
const errorReportSuccess = ref(false)

const announceForm = reactive({
  title: '',
  message: '',
  type: 'INFO',
  priority: 'NORMAL',
  targetType: 'ALL',
  targetValue: '',
})

const errorForm = reactive({
  subject: '',
  details: '',
})

const openSosCount = computed(() => sosAlerts.value.filter((item) => item.status === 'OPEN' || item.status === 'ACKNOWLEDGED').length)

function formatDate(value) {
  if (!value) return '-'
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

function typeClass(type) {
  if (type === 'WARNING') return 'border-amber-500/30 bg-amber-500/10 text-amber-200'
  if (type === 'SUCCESS') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
  return 'border-blue-500/30 bg-blue-500/10 text-blue-200'
}

function priorityClass(priority) {
  if (priority === 'CRITICAL') return 'border-rose-500/30 bg-rose-500/10 text-rose-200'
  if (priority === 'HIGH') return 'border-orange-500/30 bg-orange-500/10 text-orange-200'
  if (priority === 'LOW') return 'border-slate-600 bg-slate-700/40 text-slate-200'
  return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200'
}

function pushSimToast(payload) {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  simToasts.value.unshift({ id, ...payload, createdAt: new Date().toISOString() })
  if (simToasts.value.length > 8) {
    simToasts.value = simToasts.value.slice(0, 8)
  }
}

function resetAnnouncementForm() {
  announceForm.title = ''
  announceForm.message = ''
  announceForm.type = 'INFO'
  announceForm.priority = 'NORMAL'
  announceForm.targetType = 'ALL'
  announceForm.targetValue = ''
}

async function fetchAnnouncements() {
  loadingAnnouncements.value = true
  try {
    const res = await api.get('/tenant/comms/announcements')
    announcements.value = res.data?.data ?? []
  } finally {
    loadingAnnouncements.value = false
  }
}

async function fetchSos() {
  loadingSos.value = true
  try {
    const res = await api.get('/tenant/comms/sos-alerts')
    const all = res.data?.data ?? []
    sosAlerts.value = all.filter((item) => item.status !== 'RESOLVED')
  } finally {
    loadingSos.value = false
  }
}

async function createAnnouncement() {
  announceError.value = ''

  if (!announceForm.title.trim() || !announceForm.message.trim()) {
    announceError.value = 'Başlık ve mesaj zorunludur.'
    return
  }

  if (announceForm.targetType === 'VEHICLE_PLATE' && !announceForm.targetValue.trim()) {
    announceError.value = 'Plakaya özel duyurularda plaka zorunludur.'
    return
  }

  announceSaving.value = true
  try {
    const payload = {
      title: announceForm.title,
      message: announceForm.message,
      type: announceForm.type,
      priority: announceForm.priority,
      targetType: announceForm.targetType,
      targetValue: announceForm.targetType === 'VEHICLE_PLATE' ? announceForm.targetValue : null,
    }
    const res = await api.post('/tenant/comms/announcements', payload)
    const created = res.data?.data
    if (created) {
      announcements.value.unshift(created)
      pushSimToast({ title: created.title, message: created.message })
    }
    resetAnnouncementForm()
  } catch (error) {
    announceError.value = error?.response?.data?.message || 'Duyuru oluşturulamadı.'
  } finally {
    announceSaving.value = false
  }
}

function simulateAnnouncementToast() {
  const latest = announcements.value[0]
  if (!latest) {
    pushSimToast({ title: 'Simülasyon', message: 'Önce bir duyuru oluşturun.' })
    return
  }
  pushSimToast({ title: latest.title, message: latest.message })
}

async function createMockSos() {
  mockSosLoading.value = true
  try {
    const res = await api.post('/tenant/comms/sos-alerts/mock')
    const row = res.data?.data
    if (row) {
      sosAlerts.value.unshift(row)
      pushSimToast({
        title: 'Test SOS',
        message: `${row.plateSnapshot || row.vehicle?.plate || 'Araç'} için mock SOS üretildi.`,
      })
    }
  } catch (error) {
    pushSimToast({ title: 'Hata', message: error?.response?.data?.message || 'Mock SOS üretilemedi.' })
  } finally {
    mockSosLoading.value = false
  }
}

async function resolveSos(id) {
  try {
    await api.put(`/tenant/comms/sos-alerts/${id}/resolve`)
    sosAlerts.value = sosAlerts.value.filter((item) => item.id !== id)
  } catch (error) {
    pushSimToast({ title: 'Hata', message: error?.response?.data?.message || 'SOS çözümlenemedi.' })
  }
}

async function submitErrorReport() {
  errorReportMessage.value = ''
  errorReportSuccess.value = false

  if (!errorForm.subject.trim() || !errorForm.details.trim()) {
    errorReportMessage.value = 'Konu ve detay zorunludur.'
    return
  }

  errorReportLoading.value = true
  try {
    await api.post('/tenant/comms/error-reports', {
      subject: errorForm.subject,
      details: errorForm.details,
      source: 'DISPATCH_CENTER',
    })
    errorReportSuccess.value = true
    errorReportMessage.value = 'Hata bildirimi super admin ekibine iletildi.'
    errorForm.subject = ''
    errorForm.details = ''
  } catch (error) {
    errorReportSuccess.value = false
    errorReportMessage.value = error?.response?.data?.message || 'Hata bildirimi gönderilemedi.'
  } finally {
    errorReportLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchAnnouncements(), fetchSos()])
})
</script>
