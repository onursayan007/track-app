<template>
  <div class="h-full flex flex-col p-2 sm:p-4 md:p-6 bg-slate-950 text-slate-300">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 class="text-3xl font-black text-white tracking-tight">Müşteri Yönetimi</h1>
        <p class="text-slate-400 mt-1">Kurumsal müşterilerinizi, vergi ve fatura bilgileriyle yönetin.</p>
      </div>
      <button @click="openCreateModal" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-200">
        Yeni Müşteri Ekle
      </button>
    </div>

    <div class="mb-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Müşteri adı veya vergi no ara..."
        class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
    </div>

    <div class="flex-1 overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <table class="min-w-full divide-y divide-slate-800">
        <thead class="bg-slate-800/50">
          <tr>
            <th class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Müşteri</th>
            <th class="px-3 py-3.5 text-left text-sm font-semibold text-white">Vergi No</th>
            <th class="px-3 py-3.5 text-right text-sm font-semibold text-white">Aylık Ödenek</th>
            <th class="px-3 py-3.5 text-center text-sm font-semibold text-white">Rota</th>
            <th class="px-3 py-3.5 text-center text-sm font-semibold text-white">Yolcu</th>
            <th class="relative py-3.5 pl-3 pr-4 sm:pr-6"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
          <tr v-if="isLoading">
            <td colspan="6" class="py-12 text-center text-slate-400">Müşteriler yükleniyor...</td>
          </tr>
          <tr v-else-if="loadError">
            <td colspan="6" class="py-12 text-center text-rose-300">{{ loadError }}</td>
          </tr>
          <tr v-else-if="filteredClients.length === 0">
            <td colspan="6" class="py-12 text-center text-slate-500">Gösterilecek müşteri bulunamadı.</td>
          </tr>
          <tr v-else v-for="client in filteredClients" :key="client.id" class="hover:bg-slate-800/40 transition-colors">
            <td class="py-4 pl-4 pr-3 sm:pl-6">
              <div class="font-semibold text-white">{{ client.name }}</div>
              <div class="text-xs text-slate-400 mt-0.5">{{ client.taxOffice }}</div>
            </td>
            <td class="px-3 py-4 text-sm text-slate-300 font-mono">{{ client.taxNumber }}</td>
            <td class="px-3 py-4 text-sm text-right text-amber-300 font-mono font-semibold">{{ formatCurrency(client.monthlyAllowance) }}</td>
            <td class="px-3 py-4 text-sm text-center text-slate-300">{{ client.routeCount }}</td>
            <td class="px-3 py-4 text-sm text-center text-slate-300">{{ client.passengerCount }}</td>
            <td class="py-4 pl-3 pr-4 sm:pr-6">
              <div class="flex items-center justify-end gap-2">
                <button @click="openEditModal(client)" class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700">Düzenle</button>
                <button @click="removeClient(client)" class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25">Sil</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" @click.self="closeModal">
        <div class="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 class="text-lg font-bold text-white">{{ isEditMode ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle' }}</h3>
            <button @click="closeModal" class="text-slate-400 hover:text-white">✕</button>
          </div>

          <div class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Müşteri Adı</label>
              <input v-model="form.name" type="text" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vergi No</label>
                <input v-model="form.taxNumber" type="text" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vergi Dairesi</label>
                <input v-model="form.taxOffice" type="text" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fatura Adresi</label>
              <textarea v-model="form.invoiceAddress" rows="3" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3"></textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">İletişim E-postası</label>
              <input v-model="form.contactEmail" type="email" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Aylık Ödenek (₺)</label>
              <input v-model.number="form.monthlyAllowance" type="number" min="0" step="0.01" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3" />
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button @click="closeModal" class="px-4 py-2 rounded-lg text-slate-400 hover:text-white">İptal</button>
              <button @click="submitClient" :disabled="isSaving" class="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-60">
                {{ isSaving ? 'Kaydediliyor...' : 'Kaydet' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '../services/api'

const isLoading = ref(false)
const isSaving = ref(false)
const loadError = ref('')
const searchQuery = ref('')
const clients = ref([])

const isModalOpen = ref(false)
const isEditMode = ref(false)
const editingId = ref(null)

const form = reactive({
  name: '',
  taxNumber: '',
  taxOffice: '',
  invoiceAddress: '',
  contactEmail: '',
  monthlyAllowance: 0,
})

function formatCurrency(value) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

const filteredClients = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return clients.value
  return clients.value.filter((client) => {
    return (
      (client.name || '').toLowerCase().includes(query) ||
      (client.taxNumber || '').toLowerCase().includes(query)
    )
  })
})

function resetForm() {
  form.name = ''
  form.taxNumber = ''
  form.taxOffice = ''
  form.invoiceAddress = ''
  form.contactEmail = ''
  form.monthlyAllowance = 0
}

async function fetchClients() {
  const res = await api.get('/tenant/clients')
  const list = res.data?.data ?? res.data ?? []
  clients.value = Array.isArray(list) ? list : []
}

async function loadAll() {
  isLoading.value = true
  loadError.value = ''
  try {
    await fetchClients()
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Müşteri verileri alınamadı.'
  } finally {
    isLoading.value = false
  }
}

function openCreateModal() {
  isEditMode.value = false
  editingId.value = null
  resetForm()
  isModalOpen.value = true
}

function openEditModal(client) {
  isEditMode.value = true
  editingId.value = client.id
  form.name = client.name || ''
  form.taxNumber = client.taxNumber || ''
  form.taxOffice = client.taxOffice || ''
  form.invoiceAddress = client.invoiceAddress || ''
  form.contactEmail = client.contactEmail || ''
  form.monthlyAllowance = Number(client.monthlyAllowance || 0)
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

async function submitClient() {
  isSaving.value = true
  loadError.value = ''
  try {
    const payload = {
      name: form.name,
      taxNumber: form.taxNumber,
      taxOffice: form.taxOffice,
      invoiceAddress: form.invoiceAddress,
      contactEmail: form.contactEmail,
      monthlyAllowance: Number(form.monthlyAllowance || 0),
    }

    if (isEditMode.value && editingId.value) {
      await api.put(`/tenant/clients/${editingId.value}`, payload)
    } else {
      await api.post('/tenant/clients', payload)
    }

    await fetchClients()
    closeModal()
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Müşteri kaydı başarısız.'
  } finally {
    isSaving.value = false
  }
}

async function removeClient(client) {
  const approved = window.confirm(`${client.name} kaydını silmek istiyor musunuz?`)
  if (!approved) return

  isSaving.value = true
  loadError.value = ''
  try {
    await api.delete(`/tenant/clients/${client.id}`)
    await fetchClients()
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Müşteri silinemedi.'
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadAll()
})
</script>
