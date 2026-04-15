<script setup>
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  TenantAccountsModal.vue — Manage users (accounts) for a specific tenant   ║
// ║  GET  /api/v1/superadmin/tenants/:id/users                                ║
// ║  POST /api/v1/superadmin/tenants/:id/users                                ║
// ║  PATCH /api/v1/superadmin/users/:userId/password                          ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
import { ref, reactive, watch } from 'vue'
import api from '../services/api'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  tenant:     { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue'])

const users       = ref([])
const loading     = ref(false)
const error       = ref('')
const successMsg  = ref('')

// ─── Add User Form ─────────────────────────────────────
const showAddForm     = ref(false)
const addSaving       = ref(false)
const addError        = ref('')
const addForm = reactive({ name: '', email: '', password: '', role: 'TENANT_ADMIN' })

// ─── Password Reset ────────────────────────────────────
const resetUserId     = ref(null)
const resetPassword   = ref('')
const resetSaving     = ref(false)

function close() {
  emit('update:modelValue', false)
}

watch(() => props.modelValue, async (v) => {
  if (v && props.tenant) {
    successMsg.value = ''
    error.value = ''
    showAddForm.value = false
    resetUserId.value = null
    await fetchUsers()
  }
})

async function fetchUsers() {
  if (!props.tenant) return
  loading.value = true
  error.value = ''
  try {
    const res = await api.get(`/superadmin/tenants/${props.tenant.id}/users`)
    users.value = res.data?.data ?? res.data ?? []
  } catch (e) {
    error.value = 'Kullanıcılar yüklenemedi: ' + (e.response?.data?.message || e.message)
  } finally {
    loading.value = false
  }
}

// ─── Add New User ──────────────────────────────────────
function openAddForm() {
  Object.assign(addForm, { name: '', email: '', password: '', role: 'TENANT_ADMIN' })
  addError.value = ''
  showAddForm.value = true
}

async function saveNewUser() {
  if (!addForm.name || !addForm.email || !addForm.password) {
    addError.value = 'Ad, email ve şifre zorunludur'
    return
  }
  addSaving.value = true
  addError.value = ''
  try {
    await api.post(`/superadmin/tenants/${props.tenant.id}/users`, addForm)
    showAddForm.value = false
    successMsg.value = 'Hesap başarıyla oluşturuldu!'
    setTimeout(() => { successMsg.value = '' }, 3000)
    await fetchUsers()
  } catch (e) {
    addError.value = e.response?.data?.message || 'Hesap oluşturulamadı'
  } finally {
    addSaving.value = false
  }
}

// ─── Password Reset ────────────────────────────────────
function openPasswordReset(userId) {
  resetUserId.value = userId
  resetPassword.value = ''
}

async function savePasswordReset() {
  if (!resetPassword.value || resetPassword.value.length < 6) {
    alert('Şifre en az 6 karakter olmalıdır')
    return
  }
  resetSaving.value = true
  try {
    await api.patch(`/superadmin/users/${resetUserId.value}/password`, { password: resetPassword.value })
    resetUserId.value = null
    resetPassword.value = ''
    successMsg.value = 'Şifre güncellendi!'
    setTimeout(() => { successMsg.value = '' }, 3000)
  } catch (e) {
    alert(e.response?.data?.message || 'Şifre güncellenemedi')
  } finally {
    resetSaving.value = false
  }
}

function roleLabel(r) {
  const map = { SUPER_ADMIN: 'Süper Admin', TENANT_ADMIN: 'Firma Yöneticisi', DRIVER: 'Sürücü', PASSENGER: 'Yolcu' }
  return map[r] || r
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="close"></div>

        <!-- Panel -->
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div
            v-if="modelValue"
            class="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-[0_0_60px_rgba(79,70,229,0.15)]"
          >
            <!-- Header -->
            <div class="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md rounded-t-2xl">
              <div>
                <h2 class="text-lg font-bold text-white flex items-center gap-2">
                  <span class="flex items-center justify-center h-7 w-7 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/></svg>
                  </span>
                  Hesaplar — {{ tenant?.name }}
                </h2>
                <p class="text-xs text-slate-500 mt-1 ml-9">Firma kullanıcılarını yönetin</p>
              </div>
              <button @click="close" class="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-6 space-y-5">

              <!-- Error / Success -->
              <div v-if="error" class="flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>
                <p class="text-sm text-rose-400">{{ error }}</p>
              </div>
              <div v-if="successMsg" class="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                <p class="text-sm text-emerald-400">{{ successMsg }}</p>
              </div>

              <!-- Add Account Button -->
              <div class="flex justify-end">
                <button v-if="!showAddForm" @click="openAddForm" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                  Yeni Hesap Ekle
                </button>
              </div>

              <!-- Add User Inline Form -->
              <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
                <div v-if="showAddForm" class="p-4 rounded-xl border border-indigo-500/20 bg-slate-800/30 space-y-4">
                  <h4 class="text-sm font-semibold text-indigo-400 flex items-center gap-2">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z"/></svg>
                    Yeni Hesap
                  </h4>
                  <div v-if="addError" class="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2">
                    <p class="text-xs text-rose-400">{{ addError }}</p>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Ad Soyad *</label>
                      <input v-model="addForm.name" type="text" placeholder="ör: Ahmet Yılmaz" class="w-full rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Email *</label>
                      <input v-model="addForm.email" type="email" placeholder="user@firma.com" class="w-full rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Şifre *</label>
                      <input v-model="addForm.password" type="password" placeholder="••••••••" class="w-full rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Rol</label>
                      <select v-model="addForm.role" class="w-full rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition">
                        <option value="TENANT_ADMIN">Firma Yöneticisi</option>
                        <option value="DRIVER">Sürücü</option>
                        <option value="PASSENGER">Yolcu</option>
                      </select>
                    </div>
                  </div>
                  <div class="flex justify-end gap-2">
                    <button @click="showAddForm = false" class="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition">İptal</button>
                    <button @click="saveNewUser" :disabled="addSaving" class="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 transition disabled:opacity-50">
                      {{ addSaving ? 'Kaydediliyor...' : 'Oluştur' }}
                    </button>
                  </div>
                </div>
              </Transition>

              <!-- Users Table -->
              <div class="overflow-x-auto rounded-xl border border-slate-800">
                <table class="w-full text-sm text-left text-slate-300">
                  <thead class="text-xs text-slate-400 uppercase bg-slate-900/80">
                    <tr class="border-b border-slate-800">
                      <th class="px-4 py-3">Ad Soyad</th>
                      <th class="px-4 py-3">Email</th>
                      <th class="px-4 py-3">Rol</th>
                      <th class="px-4 py-3">Kayıt</th>
                      <th class="px-4 py-3 text-right">Eylem</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Loading Skeleton -->
                    <tr v-if="loading" v-for="n in 3" :key="'skel-'+n" class="border-b border-slate-800">
                      <td v-for="c in 5" :key="c" class="px-4 py-3"><div class="h-4 bg-slate-800 rounded animate-pulse" :style="{ width: (30 + Math.random() * 50) + '%' }"></div></td>
                    </tr>
                    <!-- Empty -->
                    <tr v-if="!loading && users.length === 0">
                      <td colspan="5" class="text-center py-10 text-slate-500">
                        <svg class="mx-auto h-10 w-10 text-slate-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/></svg>
                        Bu firmaya ait hesap bulunamadı
                      </td>
                    </tr>
                    <!-- User Rows -->
                    <tr v-for="u in users" :key="u.id" class="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td class="px-4 py-3 font-medium text-white whitespace-nowrap">{{ u.name }}</td>
                      <td class="px-4 py-3 text-slate-400">{{ u.email || '—' }}</td>
                      <td class="px-4 py-3">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="u.role === 'TENANT_ADMIN' ? 'bg-indigo-500/10 text-indigo-400' : u.role === 'DRIVER' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-700/50 text-slate-400'">
                          {{ roleLabel(u.role) }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-xs text-slate-500">{{ formatDate(u.createdAt) }}</td>
                      <td class="px-4 py-3 text-right">
                        <!-- Password Reset -->
                        <div v-if="resetUserId === u.id" class="inline-flex items-center gap-2">
                          <input v-model="resetPassword" type="password" placeholder="Yeni şifre" class="w-32 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                          <button @click="savePasswordReset" :disabled="resetSaving" class="px-2 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition disabled:opacity-50">
                            {{ resetSaving ? '...' : 'Kaydet' }}
                          </button>
                          <button @click="resetUserId = null" class="px-2 py-1.5 rounded-lg text-xs font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition">×</button>
                        </div>
                        <button v-else @click="openPasswordReset(u.id)" class="text-xs font-medium text-amber-400 hover:underline inline-flex items-center gap-1">
                          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/></svg>
                          Şifre Güncelle
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Footer -->
            <div class="sticky bottom-0 flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md rounded-b-2xl">
              <button @click="close" class="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all">Kapat</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overflow-y-auto::-webkit-scrollbar { width: 6px; }
.overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
.overflow-y-auto::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.3); border-radius: 3px; }
</style>
