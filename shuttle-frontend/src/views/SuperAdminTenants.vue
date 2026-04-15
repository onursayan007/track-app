<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 class="text-3xl font-bold text-white">Firma ve Müşteri Yönetimi</h1>
      <button
        @click="showAddTenant = true"
        class="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-sm font-semibold shadow-lg shadow-indigo-500/20"
      >
         <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Yeni Firma Ekle
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
      <span class="ml-3 text-sm text-slate-400">Firmalar yükleniyor...</span>
    </div>

    <!-- Tenants Table -->
    <div v-if="!isLoading" class="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left text-slate-300">
          <thead class="text-xs text-slate-400 uppercase bg-slate-900">
            <tr class="border-b border-slate-800">
              <th scope="col" class="px-6 py-4">Firma Adı</th>
              <th scope="col" class="px-6 py-4">Plan/Paket</th>
              <th scope="col" class="px-6 py-4">Araç Sayısı</th>
              <th scope="col" class="px-6 py-4">Kullanıcı Sayısı</th>
              <th scope="col" class="px-6 py-4">Durum</th>
              <th scope="col" class="px-6 py-4 text-right">Eylemler</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tenant in tenants" :key="tenant.id" class="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
              <th scope="row" class="px-6 py-4 font-bold text-white whitespace-nowrap">
                {{ tenant.name }}
              </th>
              <td class="px-6 py-4">
                 <span v-if="tenant.plan" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                   {{ tenant.plan.name }} — ₺{{ tenant.plan.pricePerVehicle }}/araç
                 </span>
                 <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-500 border border-slate-700">Plan Atanmamış</span>
              </td>
              <td class="px-6 py-4 font-mono">{{ tenant._count?.vehicles ?? '—' }}</td>
              <td class="px-6 py-4 font-mono">{{ tenant._count?.users ?? '—' }}</td>
              <td class="px-6 py-4">
                 <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="tenant.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-700/50 text-slate-400 border border-slate-700'">
                  {{ tenant.isActive ? 'Aktif' : 'Pasif' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                <button @click="openEdit(tenant)" class="font-medium text-indigo-400 hover:underline">Düzenle</button>
                <button @click="openAccounts(tenant)" class="font-medium text-cyan-400 hover:underline">Hesaplar</button>
                <button @click="toggleStatus(tenant)" class="font-medium hover:underline" :class="tenant.isActive ? 'text-amber-400' : 'text-emerald-400'">
                  {{ tenant.isActive ? 'Askıya Al' : 'Aktifleştir' }}
                </button>
                <button @click="impersonate(tenant)" class="font-medium text-cyan-400 hover:underline">Giriş Yap</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Tenant Modal -->
    <AddTenantModal v-model="showAddTenant" @created="onTenantCreated" />

    <!-- Edit Tenant Modal -->
    <EditTenantModal v-model="showEditTenant" :tenant="editingTenant" @updated="onTenantUpdated" />

    <!-- Accounts Modal -->
    <TenantAccountsModal v-model="showAccountsModal" :tenant="accountsTenant" />

    <!-- Success Toast -->
    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-2">
      <div v-if="successMsg" class="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-sm font-medium text-emerald-400 shadow-lg backdrop-blur-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
        {{ successMsg }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'
import AddTenantModal from '../components/AddTenantModal.vue'
import EditTenantModal from '../components/EditTenantModal.vue'
import TenantAccountsModal from '../components/TenantAccountsModal.vue'

const router   = useRouter()
const auth     = useAuthStore()

const tenants        = ref([])
const isLoading      = ref(false)
const showAddTenant  = ref(false)
const showEditTenant = ref(false)
const editingTenant     = ref(null)
const showAccountsModal = ref(false)
const accountsTenant    = ref(null)
const successMsg        = ref('')

async function fetchTenants() {
  isLoading.value = true
  try {
    const res  = await api.get('/superadmin/tenants')
    const list = res.data?.data ?? res.data ?? []
    tenants.value = Array.isArray(list) ? list : []
  } catch (e) {
    console.warn('fetchTenants hata:', e.message)
  } finally {
    isLoading.value = false
  }
}

function onTenantCreated(tenant) {
  successMsg.value = `${tenant?.name || 'Firma'} başarıyla oluşturuldu!`
  setTimeout(() => { successMsg.value = '' }, 3000)
  fetchTenants()
}

// ─── Hesaplar ────────────────────────────────────────────────────
function openAccounts(tenant) {
  accountsTenant.value    = tenant
  showAccountsModal.value = true
}

// ─── Düzenle ─────────────────────────────────────────────────────
function openEdit(tenant) {
  editingTenant.value  = tenant
  showEditTenant.value = true
}

function onTenantUpdated(tenant) {
  successMsg.value = `${tenant?.name || 'Firma'} güncellendi!`
  setTimeout(() => { successMsg.value = '' }, 3000)
  fetchTenants()
}

// ─── Askıya Al / Aktifleştir ─────────────────────────────────────
async function toggleStatus(tenant) {
  const action = tenant.isActive ? 'askıya almak' : 'aktifleştirmek'
  if (!confirm(`"${tenant.name}" firmasını ${action} istediğinize emin misiniz?`)) return
  try {
    await api.patch(`/superadmin/tenants/${tenant.id}/toggle-status`)
    successMsg.value = tenant.isActive
      ? `${tenant.name} askıya alındı`
      : `${tenant.name} aktifleştirildi`
    setTimeout(() => { successMsg.value = '' }, 3000)
    fetchTenants()
  } catch (e) {
    alert(e.response?.data?.message || 'İşlem başarısız')
  }
}

// ─── Giriş Yap (Impersonate) ────────────────────────────────────
async function impersonate(tenant) {
  if (!confirm(`"${tenant.name}" firma paneline giriş yapmak istiyor musunuz?`)) return
  try {
    const res = await api.post(`/superadmin/tenants/${tenant.id}/impersonate`)
    const { token, user } = res.data?.data ?? res.data

    // Save original SA credentials so we can return later
    localStorage.setItem('sa_token', localStorage.getItem('token') || '')
    localStorage.setItem('sa_role', localStorage.getItem('userRole') || '')
    localStorage.setItem('sa_user', localStorage.getItem('user') || '')

    // Overwrite auth store with impersonated user
    auth.token = token
    auth.user  = user
    auth.role  = user.role

    localStorage.setItem('token', token)
    localStorage.setItem('userRole', user.role)
    localStorage.setItem('user', JSON.stringify(user))

    router.push('/company/fleet')
  } catch (e) {
    alert(e.response?.data?.message || 'Giriş yapılamadı. Firma yöneticisi bulunamadı olabilir.')
  }
}

onMounted(fetchTenants)


</script>