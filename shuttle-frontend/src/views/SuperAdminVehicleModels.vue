<script setup>
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  SuperAdminVehicleModels.vue — Vehicle Model Catalog Management            ║
// ║  SUPER_ADMIN can add vehicle makes/models with photos                      ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
import { ref, onMounted } from 'vue'
import api from '../services/api'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'

const vehicleModels = ref([])
const isLoading = ref(false)
const loadError = ref('')

// ─── Modal State ────────────────────────────────────────────────────────────────
const isModalOpen = ref(false)
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')

const brand = ref('')
const modelName = ref('')
const photoFile = ref(null)
const photoPreview = ref('')

function openModal() {
  brand.value = ''
  modelName.value = ''
  photoFile.value = null
  photoPreview.value = ''
  saveError.value = ''
  isSaving.value = false
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}

// ─── API Calls ──────────────────────────────────────────────────────────────────
async function fetchModels() {
  isLoading.value = true
  loadError.value = ''
  try {
    const res = await api.get('/superadmin/vehicle-models')
    vehicleModels.value = res.data?.data ?? res.data ?? []
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Modeller yüklenemedi'
  } finally {
    isLoading.value = false
  }
}

async function saveModel() {
  if (!brand.value || !modelName.value || !photoFile.value) return
  isSaving.value = true
  saveError.value = ''

  const formData = new FormData()
  formData.append('brand', brand.value)
  formData.append('modelName', modelName.value)
  formData.append('photo', photoFile.value)

  try {
    await api.post('/superadmin/vehicle-models', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    saveSuccess.value = 'Araç modeli başarıyla eklendi!'
    setTimeout(() => { saveSuccess.value = '' }, 3000)
    closeModal()
    await fetchModels()
  } catch (e) {
    saveError.value = e.response?.data?.message || e.message || 'Model kaydedilemedi'
  } finally {
    isSaving.value = false
  }
}

async function deleteModel(id) {
  if (!confirm('Bu araç modelini silmek istediğinize emin misiniz?')) return
  try {
    await api.delete(`/superadmin/vehicle-models/${id}`)
    await fetchModels()
  } catch (e) {
    console.warn('Silme hatası:', e.message)
  }
}

function photoUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_BASE}${path}`
}

onMounted(() => {
  fetchModels()
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8 font-sans antialiased">

    <!-- ═══════════════════════════════ HEADER ═══════════════════════════════ -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">
          Araç Model Kataloğu
        </h1>
        <p class="mt-1.5 text-sm text-slate-500">Sisteme kayıtlı araç marka ve modellerini yönetin, fotoğrafları ile birlikte.</p>
      </div>
      <button
        @click="openModal"
        class="group inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(79,70,229,0.35)] hover:shadow-[0_0_35px_rgba(79,70,229,0.55)] hover:scale-[1.02] active:scale-[0.98]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform group-hover:rotate-90 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
        Araç Modeli Ekle
      </button>
    </header>

    <!-- ═══════════════════════════ LOADING / ERROR ═══════════════════════════ -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
    </div>

    <div v-else-if="loadError" class="text-center py-20 text-rose-400 text-sm">{{ loadError }}</div>

    <!-- ═══════════════════════════ MODEL GRID ═══════════════════════════ -->
    <div v-else-if="vehicleModels.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <div
        v-for="m in vehicleModels"
        :key="m.id"
        class="group relative overflow-hidden rounded-2xl bg-slate-900/70 backdrop-blur-sm border border-slate-800 shadow-[0_0_15px_rgba(79,70,229,0.1)] hover:shadow-[0_0_25px_rgba(79,70,229,0.2)] transition-all duration-300"
      >
        <!-- Photo -->
        <div class="aspect-[16/10] bg-slate-800 overflow-hidden">
          <img
            :src="photoUrl(m.photoUrl)"
            :alt="`${m.brand} ${m.modelName}`"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            @error="$event.target.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22%23334155%22 viewBox=%220 0 24 24%22><path d=%22M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21%22/></svg>'"
          />
        </div>

        <!-- Info -->
        <div class="p-4">
          <h3 class="text-sm font-bold text-white truncate">{{ m.brand }}</h3>
          <p class="text-xs text-slate-400 truncate mt-0.5">{{ m.modelName }}</p>
        </div>

        <!-- Delete button -->
        <button
          @click="deleteModel(m.id)"
          class="absolute top-3 right-3 p-2 rounded-lg bg-slate-900/80 backdrop-blur-sm text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700/50 hover:border-rose-500/30 opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-800/50 text-slate-600 ring-1 ring-slate-700/50">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h.862c.227 0 .45.036.662.106l.727.242a3.375 3.375 0 0 0 2.124 0l.727-.242a2.25 2.25 0 0 1 .662-.106h4.111m0 0h2.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.25 2.25 0 0 0-.659-1.591l-2.482-2.482a2.25 2.25 0 0 0-1.591-.659H9.375c-.621 0-1.125.504-1.125 1.125v7.758"/></svg>
      </div>
      <p class="text-sm text-slate-600">Henüz araç modeli eklenmemiş.</p>
      <button @click="openModal" class="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition">İlk modeli ekle &rarr;</button>
    </div>

    <!-- ═══════════════════════════ TOASTS ═══════════════════════════ -->
    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-2">
      <div v-if="saveSuccess" class="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-sm font-medium text-emerald-400 shadow-lg backdrop-blur-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
        {{ saveSuccess }}
      </div>
    </Transition>

    <!-- ═══════════════════════════ ADD MODEL MODAL ═══════════════════════════ -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="closeModal"></div>

          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-4"
          >
            <div v-if="isModalOpen" class="relative z-10 w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-[0_0_60px_rgba(79,70,229,0.15)]">
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <div>
                  <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <span class="flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                    </span>
                    Araç Modeli Ekle
                  </h2>
                  <p class="text-xs text-slate-500 mt-1 ml-9">Marka, model adı ve araç fotoğrafı</p>
                </div>
                <button @click="closeModal" class="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <!-- Body -->
              <div class="px-6 py-6 space-y-5">
                <!-- Photo Upload -->
                <div>
                  <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Araç Fotoğrafı *</label>
                  <div
                    class="relative flex flex-col items-center justify-center gap-3 px-6 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300"
                    :class="photoPreview
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-slate-700 hover:border-indigo-500/40 bg-slate-800/20 hover:bg-slate-800/50'"
                    @click="$refs.fileInput.click()"
                  >
                    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
                    <img v-if="photoPreview" :src="photoPreview" alt="Preview" class="max-h-32 rounded-lg object-contain" />
                    <template v-else>
                      <div class="flex items-center justify-center h-12 w-12 rounded-xl bg-slate-700/30 text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"/></svg>
                      </div>
                      <span class="text-sm text-slate-400">Fotoğraf yüklemek için tıklayın</span>
                      <span class="text-[10px] text-slate-600">JPEG, PNG veya WebP — Maks 10MB</span>
                    </template>
                  </div>
                </div>

                <!-- Brand + Model -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[11px] font-medium text-slate-500 mb-1.5">Marka *</label>
                    <input v-model="brand" type="text" placeholder="Mercedes-Benz" class="w-full rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-medium text-slate-500 mb-1.5">Model Adı *</label>
                    <input v-model="modelName" type="text" placeholder="Sprinter 516 CDI" class="w-full rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                  </div>
                </div>

                <!-- Error -->
                <p v-if="saveError" class="text-xs text-rose-400">{{ saveError }}</p>
              </div>

              <!-- Footer -->
              <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
                <button @click="closeModal" class="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all">İptal</button>
                <button
                  @click="saveModel"
                  :disabled="!brand || !modelName || !photoFile || isSaving"
                  class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                  :class="!brand || !modelName || !photoFile
                    ? 'bg-slate-700 cursor-not-allowed opacity-50 shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_35px_rgba(79,70,229,0.5)] hover:scale-[1.02] active:scale-[0.98]'"
                >
                  <svg v-if="!isSaving" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
                  <svg v-else class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Kaydet
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
