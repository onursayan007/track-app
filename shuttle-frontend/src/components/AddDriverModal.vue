<script setup>
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  AddDriverModal.vue — Register new driver under the authenticated tenant   ║
// ║  Posts to  POST /api/v1/tenant/drivers  (tenantId from JWT, not body)      ║
// ║  Email OR Phone required — drivers in the field may not have email.        ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
import { ref, reactive, watch, computed } from 'vue'
import api from '../services/api'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'created'])

const isSaving = ref(false)
const error    = ref('')

const form = reactive({
  name:     '',
  email:    '',
  phone:    '',
  password: '',
})

function resetForm() {
  Object.assign(form, { name: '', email: '', phone: '', password: '' })
  error.value = ''
}

function close() {
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (v) => { if (v) resetForm() })

// At least one of email or phone must be filled
const hasIdentifier = computed(() => !!(form.email.trim() || form.phone.trim()))
const canSave = computed(() => form.name.trim() && form.password.trim() && hasIdentifier.value)

async function save() {
  if (!form.name.trim() || !form.password.trim()) {
    error.value = 'Ad ve şifre zorunludur'
    return
  }
  if (!hasIdentifier.value) {
    error.value = 'Email veya telefon numarasından en az birini giriniz'
    return
  }

  isSaving.value = true
  error.value    = ''

  try {
    const payload = {
      name:     form.name.trim(),
      password: form.password,
      ...(form.email.trim()  ? { email: form.email.trim() }  : {}),
      ...(form.phone.trim()  ? { phone: form.phone.trim() }  : {}),
    }
    // POST to /tenant/drivers — backend extracts tenantId from JWT
    const res = await api.post('/tenant/drivers', payload)
    emit('created', res.data?.data ?? res.data)
    close()
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Şoför kaydedilemedi'
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
            class="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-[0_0_60px_rgba(79,70,229,0.15)]"
          >
            <!-- Header -->
            <div class="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md rounded-t-2xl">
              <div>
                <h2 class="text-lg font-bold text-white flex items-center gap-2">
                  <span class="flex items-center justify-center h-7 w-7 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"/></svg>
                  </span>
                  Yeni Şoför Kaydı
                </h2>
                <p class="text-xs text-slate-500 mt-1 ml-9">Firmaya bağlı yeni sürücü oluşturun</p>
              </div>
              <button @click="close" class="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-6 space-y-5">

              <!-- Error -->
              <div v-if="error" class="flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>
                <p class="text-sm text-rose-400">{{ error }}</p>
              </div>

              <!-- Identifier hint banner -->
              <div class="flex items-start gap-3 rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/></svg>
                <p class="text-xs text-amber-300/80 leading-relaxed">
                  <span class="font-semibold text-amber-300">Email veya Telefon numarasından en az birini giriniz.</span>
                  Şoför, girilen bilgi ile giriş yapabilecektir.
                </p>
              </div>

              <!-- Ad Soyad -->
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Ad Soyad *</label>
                <input v-model="form.name" type="text" placeholder="ör: Mehmet Yılmaz" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
              </div>

              <!-- Email & Telefon -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email <span class="text-slate-600">(opsiyonel)</span></label>
                  <input v-model="form.email" type="email" placeholder="sofor@firma.com" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Telefon <span class="text-slate-600">(opsiyonel)</span></label>
                  <input v-model="form.phone" type="tel" placeholder="05xx xxx xxxx" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
                </div>
              </div>

              <!-- Şifre -->
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Şifre *</label>
                <input v-model="form.password" type="password" placeholder="En az 6 karakter" class="w-full rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition" />
              </div>

              <!-- Info -->
              <div class="flex items-start gap-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 px-4 py-3.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-cyan-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/></svg>
                <p class="text-xs text-cyan-300/80 leading-relaxed">
                  Şoför, <span class="font-semibold text-cyan-300">Servisim Geliyor Sürücü</span> uygulamasına email veya telefon numarası ile giriş yapabilecektir.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div class="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md rounded-b-2xl">
              <button @click="close" class="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all">İptal</button>
              <button
                @click="save"
                :disabled="!canSave || isSaving"
                class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                :class="!canSave ? 'bg-slate-700 cursor-not-allowed opacity-50 shadow-none' : 'bg-cyan-600 hover:bg-cyan-500 hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-[0.98]'"
              >
                <svg v-if="!isSaving" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
                <svg v-else class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Şoför Kaydet
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
