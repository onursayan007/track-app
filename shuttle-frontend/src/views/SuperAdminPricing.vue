<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white">Abonelik Planları</h1>
        <p class="mt-2 text-slate-400">Araç başı ücretlendirme planlarını yönetin.</p>
      </div>
      <button @click="openCreate" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
        Yeni Plan Ekle
      </button>
    </div>

    <!-- Plan Cards Grid -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="n in 3" :key="n" class="bg-slate-900 rounded-2xl border border-slate-800 p-6 animate-pulse">
        <div class="h-6 bg-slate-800 rounded w-1/2 mb-4"></div>
        <div class="h-10 bg-slate-800 rounded w-2/3 mb-6"></div>
        <div class="space-y-2">
          <div class="h-4 bg-slate-800 rounded w-full"></div>
          <div class="h-4 bg-slate-800 rounded w-3/4"></div>
        </div>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="plan in plans" :key="plan.id" class="relative bg-slate-900 rounded-2xl border border-slate-800 p-6 hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all group">
        <!-- Status Badge -->
        <div class="absolute top-4 right-4">
          <span :class="plan.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-700/50 text-slate-500 border-slate-700'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
            {{ plan.isActive ? 'Aktif' : 'Pasif' }}
          </span>
        </div>

        <!-- Plan Name -->
        <h3 class="text-lg font-bold text-white mb-1">{{ plan.name }}</h3>
        <p class="text-xs text-slate-500 mb-4">{{ plan._count?.tenants ?? 0 }} firma kullanıyor</p>

        <!-- Price -->
        <div class="mb-6">
          <span class="text-3xl font-black text-indigo-400">₺{{ plan.pricePerVehicle.toLocaleString('tr-TR') }}</span>
          <span class="text-sm text-slate-500 ml-1">/ araç / ay</span>
        </div>

        <!-- Limits -->
        <div class="space-y-2 mb-6 text-sm text-slate-400">
          <div class="flex items-center gap-2">
            <svg class="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
            Min. {{ plan.minVehicles }} araç
          </div>
          <div class="flex items-center gap-2">
            <svg class="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
            Maks. {{ plan.maxVehicles >= 9999 ? 'Sınırsız' : plan.maxVehicles }} araç
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button @click="openEdit(plan)" class="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition">Düzenle</button>
          <button @click="togglePlan(plan)" :class="plan.isActive ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20'" class="flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition">
            {{ plan.isActive ? 'Pasife Al' : 'Aktifleştir' }}
          </button>
          <button @click="deletePlan(plan)" class="px-3 py-2 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition" title="Planı Sil">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && plans.length === 0" class="text-center py-16">
      <svg class="mx-auto h-16 w-16 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"/></svg>
      <h3 class="mt-4 text-lg font-semibold text-slate-400">Henüz plan oluşturulmamış</h3>
      <p class="text-sm text-slate-600 mt-1">İlk abonelik planınızı ekleyin.</p>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="showModal = false"></div>
          <div class="relative z-10 w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-[0_0_60px_rgba(79,70,229,0.15)]">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 class="text-lg font-bold text-white">{{ isEditing ? 'Plan Düzenle' : 'Yeni Plan Oluştur' }}</h2>
              <button @click="showModal = false" class="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="px-6 py-6 space-y-4">
              <div v-if="formError" class="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3">
                <p class="text-sm text-rose-400">{{ formError }}</p>
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Plan Adı *</label>
                <input v-model="form.name" type="text" placeholder="ör: Enterprise" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Araç Başı Ücret (₺/ay) *</label>
                <input v-model.number="form.pricePerVehicle" type="number" min="0" step="0.01" placeholder="250" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition font-mono" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Min. Araç</label>
                  <input v-model.number="form.minVehicles" type="number" min="1" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Maks. Araç</label>
                  <input v-model.number="form.maxVehicles" type="number" min="1" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                </div>
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
              <button @click="showModal = false" class="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition">İptal</button>
              <button @click="savePlan" :disabled="saving" class="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50">
                {{ saving ? 'Kaydediliyor...' : (isEditing ? 'Güncelle' : 'Oluştur') }}
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

const plans = ref([])
const loading = ref(true)
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')

const form = reactive({
  name: '',
  pricePerVehicle: 0,
  minVehicles: 1,
  maxVehicles: 9999,
})

async function fetchPlans() {
  loading.value = true
  try {
    const res = await api.get('/superadmin/plans')
    plans.value = res.data?.data ?? res.data ?? []
  } catch (e) {
    console.error('Plans yüklenemedi:', e.message)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, { name: '', pricePerVehicle: 0, minVehicles: 1, maxVehicles: 9999 })
  formError.value = ''
  showModal.value = true
}

function openEdit(plan) {
  isEditing.value = true
  editingId.value = plan.id
  Object.assign(form, {
    name: plan.name,
    pricePerVehicle: plan.pricePerVehicle,
    minVehicles: plan.minVehicles,
    maxVehicles: plan.maxVehicles,
  })
  formError.value = ''
  showModal.value = true
}

async function savePlan() {
  if (!form.name || form.pricePerVehicle == null) {
    formError.value = 'Plan adı ve fiyat zorunludur'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    if (isEditing.value) {
      await api.put(`/superadmin/plans/${editingId.value}`, form)
    } else {
      await api.post('/superadmin/plans', form)
    }
    showModal.value = false
    await fetchPlans()
  } catch (e) {
    formError.value = e.response?.data?.message || 'Bir hata oluştu'
  } finally {
    saving.value = false
  }
}

async function togglePlan(plan) {
  try {
    await api.patch(`/superadmin/plans/${plan.id}/toggle`)
    await fetchPlans()
  } catch (e) {
    console.error('Plan toggle hatası:', e.message)
  }
}

async function deletePlan(plan) {
  if (!confirm(`"${plan.name}" planını silmek istediğinize emin misiniz?`)) return
  try {
    await api.delete(`/superadmin/plans/${plan.id}`)
    await fetchPlans()
  } catch (e) {
    alert(e.response?.data?.message || 'Plan silinemedi')
  }
}

onMounted(fetchPlans)
</script>
