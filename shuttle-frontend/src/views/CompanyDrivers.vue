<template>
  <div class="flex flex-col gap-6 text-slate-300">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Şoför Yönetimi</h1>
        <p class="text-slate-400 mt-1 text-sm">Firma şoförlerini yönetin ve araç atamalarını takip edin.</p>
      </div>
      <button
        @click="showAddDriver = true"
        class="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
        Yeni Şoför Ekle
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Toplam Şoför</p>
          <p class="text-2xl font-black text-white mt-1">{{ drivers.length }}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Araç Atanmış</p>
          <p class="text-2xl font-black text-emerald-400 mt-1">{{ assignedCount }}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-slate-400">Boşta</p>
          <p class="text-2xl font-black text-amber-400 mt-1">{{ drivers.length - assignedCount }}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 shrink-0">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="relative max-w-sm">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      <input v-model="search" type="text" placeholder="Şoför ara..." class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
    </div>

    <!-- Data Table -->
    <div class="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="ml-3 text-slate-400 text-sm">Yükleniyor...</span>
      </div>

      <div v-else-if="filteredDrivers.length === 0" class="text-center py-20">
        <svg class="w-16 h-16 text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        <p class="text-slate-500 text-sm">Henüz şoför bulunamadı</p>
      </div>

      <div v-else class="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <table class="w-full min-w-[700px] text-sm text-left">
          <thead class="bg-slate-800/50">
            <tr>
              <th class="py-4 pl-6 pr-3 font-bold text-slate-400 uppercase tracking-wider text-xs">Ad Soyad</th>
              <th class="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Telefon / Email</th>
              <th class="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Atanan Araç</th>
              <th class="px-4 py-4 text-center font-bold text-slate-400 uppercase tracking-wider text-xs">Durum</th>
              <th class="py-4 pl-3 pr-6 text-right font-bold text-slate-400 uppercase tracking-wider text-xs">İşlemler</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/50">
            <tr v-for="d in filteredDrivers" :key="d.id" class="hover:bg-slate-800/40 transition-colors group">

              <!-- Ad Soyad -->
              <td class="py-4 pl-6 pr-3">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0 text-xs font-bold">
                    {{ initials(d.name) }}
                  </div>
                  <span class="font-semibold text-white">{{ d.name }}</span>
                </div>
              </td>

              <!-- Telefon / Email -->
              <td class="px-4 py-4">
                <p class="text-slate-300">{{ d.phone || '—' }}</p>
                <p class="text-xs text-slate-500">{{ d.email || '' }}</p>
              </td>

              <!-- Atanan Araç -->
              <td class="px-4 py-4">
                <span v-if="d.assignedVehicles && d.assignedVehicles.length > 0" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4M4 17h16" /></svg>
                  {{ d.assignedVehicles[0].plate }}
                </span>
                <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-500 border border-slate-700">
                  Boşta
                </span>
              </td>

              <!-- Durum -->
              <td class="px-4 py-4 text-center">
                <span v-if="d.isActive" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Aktif
                </span>
                <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-400">
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  Pasif
                </span>
              </td>

              <!-- İşlemler -->
              <td class="py-4 pl-3 pr-6 text-right">
                <button @click="openEditDriver(d)" class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700/50 transition-colors" title="Düzenle">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Driver Modal -->
    <AddDriverModal v-model="showAddDriver" @created="onDriverCreated" />

    <Teleport to="body">
      <div v-if="editOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="closeEdit"></div>
        <div class="relative z-10 w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
          <div class="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <h3 class="text-lg font-bold text-white">Şoför Bilgilerini Güncelle</h3>
            <button @click="closeEdit" class="text-slate-400 hover:text-white">✕</button>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label class="space-y-1.5">
                <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Ad (Kilitli)</span>
                <input :value="editForm.name" readonly class="w-full rounded-xl bg-slate-800/60 border border-slate-700 text-sm text-slate-400 px-3 py-2.5" />
              </label>
              <label class="space-y-1.5">
                <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Soyad (Kilitli)</span>
                <input :value="editForm.surname" readonly class="w-full rounded-xl bg-slate-800/60 border border-slate-700 text-sm text-slate-400 px-3 py-2.5" />
              </label>
              <label class="space-y-1.5 sm:col-span-2">
                <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Email (Kilitli)</span>
                <input :value="editForm.email" readonly class="w-full rounded-xl bg-slate-800/60 border border-slate-700 text-sm text-slate-400 px-3 py-2.5" />
              </label>
              <label class="space-y-1.5">
                <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Telefon</span>
                <input v-model="editForm.phone" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
              </label>
              <label class="space-y-1.5">
                <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Ehliyet Sınıfı</span>
                <input v-model="editForm.licenseClass" placeholder="Örn: D" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
              </label>
              <label class="space-y-1.5 sm:col-span-2">
                <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Adres</span>
                <textarea v-model="editForm.address" rows="3" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"></textarea>
              </label>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">
            <button @click="closeEdit" class="px-4 py-2 rounded-lg text-slate-400 hover:text-white">İptal</button>
            <button @click="saveEditDriver" :disabled="editSaving" class="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              {{ editSaving ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Success Toast -->
    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-2">
      <div v-if="successMsg" class="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-sm font-medium text-emerald-400 shadow-lg backdrop-blur-sm">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
        {{ successMsg }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import AddDriverModal from '../components/AddDriverModal.vue'

const showAddDriver = ref(false)
const successMsg = ref('')
const isLoading = ref(false)
const search = ref('')
const drivers = ref([])
const editOpen = ref(false)
const editSaving = ref(false)
const editForm = ref({ id: '', name: '', surname: '', email: '', phone: '', licenseClass: '', address: '' })

const assignedCount = computed(() => drivers.value.filter(d => d.assignedVehicles?.length > 0).length)

const filteredDrivers = computed(() => {
  if (!search.value) return drivers.value
  const q = search.value.toLowerCase()
  return drivers.value.filter(d =>
    (d.name || '').toLowerCase().includes(q) ||
    (d.phone || '').toLowerCase().includes(q) ||
    (d.email || '').toLowerCase().includes(q)
  )
})

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function splitName(fullName) {
  const text = (fullName || '').trim()
  if (!text) return { name: '', surname: '' }
  const parts = text.split(/\s+/)
  if (parts.length === 1) return { name: parts[0], surname: '' }
  return { name: parts.slice(0, -1).join(' '), surname: parts.slice(-1).join(' ') }
}

function openEditDriver(driver) {
  const split = splitName(driver.name)
  editForm.value = {
    id: driver.id,
    name: split.name || driver.name || '',
    surname: split.surname,
    email: driver.email || '',
    phone: driver.phone || '',
    licenseClass: driver.licenseClass || '',
    address: driver.address || '',
  }
  editOpen.value = true
}

function closeEdit() {
  editOpen.value = false
}

async function saveEditDriver() {
  if (!editForm.value.id) return
  editSaving.value = true
  try {
    await api.patch(`/tenant/drivers/${editForm.value.id}`, {
      phone: editForm.value.phone,
      licenseClass: editForm.value.licenseClass || null,
      address: editForm.value.address || null,
    })
    closeEdit()
    successMsg.value = 'Şoför bilgileri güncellendi!'
    setTimeout(() => { successMsg.value = '' }, 3000)
    await fetchDrivers()
  } catch (e) {
    console.warn('Şoför güncelleme hatası:', e.message)
  } finally {
    editSaving.value = false
  }
}

function onDriverCreated(driver) {
  successMsg.value = `${driver?.name || 'Şoför'} başarıyla eklendi!`
  setTimeout(() => { successMsg.value = '' }, 3000)
  fetchDrivers()
}

async function fetchDrivers() {
  isLoading.value = true
  try {
    const res = await api.get('/tenant/drivers')
    drivers.value = res.data?.data ?? res.data ?? []
  } catch (e) {
    console.warn('fetchDrivers hata:', e.message)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchDrivers)
</script>
