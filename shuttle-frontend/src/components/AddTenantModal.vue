<script setup>
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  AddTenantModal.vue — Create new company/tenant                            ║
// ║  Posts to  POST /api/v1/superadmin/tenants                                ║
// ║  Includes billing/tax info for future e-fatura integration                ║
// ║  Optionally creates a TENANT_ADMIN user for the new company               ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
import { ref, reactive, watch, onMounted } from 'vue'
import api from '../services/api'

const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit  = defineEmits(['update:modelValue', 'created'])

const isSaving = ref(false)
const error    = ref('')
const plans    = ref([])   // Dynamic plans from API

const form = reactive({
  // Temel Bilgiler
  name:             '',
  planId:           '',    // FK to SubscriptionPlan
  // Fatura Bilgileri
  legalName:        '',
  taxId:            '',
  taxOffice:        '',
  billingAddress:   '',
  contactPhone:     '',
  // Yönetici Hesabı
  adminName:        '',
  adminEmail:       '',
  adminPassword:    '',
  createAdmin:      true,
})

async function fetchPlans() {
  try {
    const res = await api.get('/superadmin/plans')
    plans.value = (res.data?.data ?? res.data ?? []).filter(p => p.isActive)
  } catch (e) {
    console.warn('Planlar yüklenemedi:', e.message)
  }
}

function resetForm() {
  Object.assign(form, {
    name: '', planId: '',
    legalName: '', taxId: '', taxOffice: '', billingAddress: '', contactPhone: '',
    adminName: '', adminEmail: '', adminPassword: '',
    createAdmin: true,
  })
  error.value = ''
}

onMounted(fetchPlans)

function close() {
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (v) => { if (v) resetForm() })

async function save() {
  if (!form.name) { error.value = 'Firma adı zorunludur'; return }
  if (form.createAdmin && (!form.adminEmail || !form.adminPassword || !form.adminName)) {
    error.value = 'Yönetici bilgileri eksik'
    return
  }

  isSaving.value = true
  error.value    = ''

  try {
    // 1. Create tenant
    const tenantRes = await api.post('/superadmin/tenants', {
      name:             form.name,
      planId:           form.planId || null,
      legalName:        form.legalName || null,
      taxId:            form.taxId || null,
      taxOffice:        form.taxOffice || null,
      billingAddress:   form.billingAddress || null,
      contactPhone:     form.contactPhone || null,
    })
    const tenant = tenantRes.data?.data ?? tenantRes.data

    // 2. Optionally create admin user
    if (form.createAdmin && tenant?.id) {
      await api.post('/superadmin/users', {
        email:    form.adminEmail,
        password: form.adminPassword,
        name:     form.adminName,
        role:     'TENANT_ADMIN',
        tenantId: tenant.id,
      })
    }

    emit('created', tenant)
    close()
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Firma oluşturulamadı'
  } finally {
    isSaving.value = false
  }
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
                  <span class="flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                  </span>
                  Yeni Firma Ekle
                </h2>
                <p class="text-xs text-slate-500 mt-1 ml-9">Firma, fatura bilgileri ve isteğe bağlı yönetici hesabı</p>
              </div>
              <button @click="close" class="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-6 space-y-6">

              <!-- Error -->
              <div v-if="error" class="flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>
                <p class="text-sm text-rose-400">{{ error }}</p>
              </div>

              <!-- ═══ SECTION 1: Temel Bilgiler ═══ -->
              <section>
                <h3 class="text-sm font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 4.5H21"/></svg>
                  Temel Bilgiler
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Firma Adı *</label>
                    <input v-model="form.name" type="text" placeholder="ör: Antalya VIP Transfer" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Abonelik Planı</label>
                    <select v-model="form.planId" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition">
                      <option value="">Plan Seçin (Opsiyonel)</option>
                      <option v-for="p in plans" :key="p.id" :value="p.id">{{ p.name }} — ₺{{ p.pricePerVehicle }}/araç/ay</option>
                    </select>
                  </div>
                </div>
              </section>

              <!-- Divider -->
              <div class="border-t border-slate-800/60"></div>

              <!-- ═══ SECTION 2: Fatura Bilgileri ═══ -->
              <section>
                <h3 class="text-sm font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>
                  Fatura Bilgileri
                  <span class="ml-auto text-[10px] font-normal text-slate-600">e-Fatura entegrasyonu için</span>
                </h3>
                <div class="space-y-4">
                  <!-- Resmi Ünvan — full width -->
                  <div>
                    <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Resmi Firma Ünvanı</label>
                    <input v-model="form.legalName" type="text" placeholder="ör: Antalya VIP Turizm Taş. Tic. Ltd. Şti." class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition" />
                  </div>
                  <!-- Vergi Dairesi + Vergi No — side by side -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Vergi Dairesi</label>
                      <input v-model="form.taxOffice" type="text" placeholder="ör: Muratpaşa" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Vergi No (VKN/TCKN)</label>
                      <input v-model="form.taxId" type="text" placeholder="ör: 1234567890" maxlength="11" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                    </div>
                  </div>
                  <!-- Telefon + Adres — side by side -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">İletişim Telefonu</label>
                      <input v-model="form.contactPhone" type="tel" placeholder="ör: 0242 123 45 67" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Fatura Adresi</label>
                      <textarea v-model="form.billingAddress" rows="2" placeholder="Mahalle, cadde, no, ilçe/il" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition resize-none"></textarea>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Divider + Admin Toggle -->
              <div class="flex items-center gap-3">
                <div class="flex-1 border-t border-slate-800/60"></div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="form.createAdmin" class="h-4 w-4 rounded bg-slate-800 border-slate-600 text-indigo-500 focus:ring-indigo-500/50" />
                  <span class="text-xs font-medium text-slate-400">Yönetici hesabı oluştur</span>
                </label>
                <div class="flex-1 border-t border-slate-800/60"></div>
              </div>

              <!-- ═══ SECTION 3: Yönetici Hesabı ═══ -->
              <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
                <section v-if="form.createAdmin">
                  <h3 class="text-sm font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>
                    Yönetici Hesabı
                  </h3>
                  <div class="p-4 rounded-xl border border-slate-800 bg-slate-800/20 space-y-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Yönetici Adı *</label>
                        <input v-model="form.adminName" type="text" placeholder="Ad Soyad" class="w-full rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                      </div>
                      <div>
                        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Yönetici Email *</label>
                        <input v-model="form.adminEmail" type="email" placeholder="admin@servisimgeliyor.com" class="w-full rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Yönetici Şifre *</label>
                      <input v-model="form.adminPassword" type="password" placeholder="••••••••" class="w-full rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                    </div>
                  </div>
                </section>
              </Transition>
            </div>

            <!-- Footer -->
            <div class="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md rounded-b-2xl">
              <button @click="close" class="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all">İptal</button>
              <button
                @click="save"
                :disabled="!form.name || isSaving"
                class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                :class="!form.name ? 'bg-slate-700 cursor-not-allowed opacity-50 shadow-none' : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_35px_rgba(79,70,229,0.5)] hover:scale-[1.02] active:scale-[0.98]'"
              >
                <svg v-if="!isSaving" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
                <svg v-else class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Firma Oluştur
              </button>
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
