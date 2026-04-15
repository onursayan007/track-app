<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-slate-900 relative overflow-hidden">
    <!-- Background Decoration -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
      <div class="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]"></div>
      <div class="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[100px]"></div>
    </div>

    <div class="w-full max-w-md p-8 space-y-8 bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700 relative z-10">
      <div class="text-center space-y-2">
        <h1 class="text-4xl font-black text-white tracking-tight">Servisim <span class="text-indigo-500">Geliyor</span></h1>
        <p class="text-slate-400 text-sm font-medium">Rota ve rota takipte yeni nesil servis deneyimi</p>
      </div>

      <div v-if="errorMessage" class="p-4 text-sm text-red-200 bg-red-900/50 border border-red-800 rounded-xl flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        {{ errorMessage }}
      </div>

      <div class="space-y-5">
        <div class="space-y-1">
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">E-posta veya Telefon</label>
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <input 
              v-model="email" 
              type="text" 
              placeholder="ornek@mail.com veya 05xx xxx xxxx" 
              class="w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Şifre</label>
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
              </svg>
            </div>
            <input 
              v-model="password" 
              type="password" 
              placeholder="••••••" 
              class="w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              @keyup.enter="handleLogin"
            />
          </div>
        </div>

        <button 
          @click="handleLogin" 
          :disabled="isLoading"
          class="w-full py-4 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
        >
          <span v-if="isLoading" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Giriş Yapılıyor...
          </span>
          <span v-else>Giriş Yap</span>
        </button>
      </div>

      <div class="pt-6 border-t border-slate-700/50">
        <p class="mb-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest">Hızlı Test Girişi</p>
        <div class="grid grid-cols-1 gap-2.5">
          <button @click="loginAsTestAccount('SUPER_ADMIN')" :disabled="isLoading" class="group flex items-center justify-between py-3 px-4 text-left bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all border border-slate-600 hover:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(79,70,229,0.15)]">
            <div>
              <span class="block text-xs font-bold text-indigo-400">Platform Admin</span>
              <span class="block text-[10px] text-slate-500 font-mono mt-0.5">admin@servisimgeliyor.com</span>
            </div>
            <span class="text-[10px] text-slate-600 font-mono bg-slate-800/80 px-2 py-1 rounded-md group-hover:text-slate-400 transition">password123</span>
          </button>
          <button @click="loginAsTestAccount('TENANT_ADMIN')" :disabled="isLoading" class="group flex items-center justify-between py-3 px-4 text-left bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all border border-slate-600 hover:border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <div>
              <span class="block text-xs font-bold text-cyan-400">Şirket Paneli</span>
              <span class="block text-[10px] text-slate-500 font-mono mt-0.5">admin@antalya-vip.com</span>
            </div>
            <span class="text-[10px] text-slate-600 font-mono bg-slate-800/80 px-2 py-1 rounded-md group-hover:text-slate-400 transition">password123</span>
          </button>
          <button @click="loginAsTestAccount('DRIVER')" :disabled="isLoading" class="group flex items-center justify-between py-3 px-4 text-left bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all border border-slate-600 hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <div>
              <span class="block text-xs font-bold text-emerald-400">Sürücü App</span>
              <span class="block text-[10px] text-slate-500 font-mono mt-0.5">driver1@antalya-vip.com</span>
            </div>
            <span class="text-[10px] text-slate-600 font-mono bg-slate-800/80 px-2 py-1 rounded-md group-hover:text-slate-400 transition">password123</span>
          </button>
          <button @click="loginAsTestAccount('PASSENGER')" :disabled="isLoading" class="group flex items-center justify-between py-3 px-4 text-left bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all border border-slate-600 hover:border-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]">
            <div>
              <span class="block text-xs font-bold text-violet-400">Yolcu App</span>
              <span class="block text-[10px] text-slate-500 font-mono mt-0.5">passenger@antalya-vip.com</span>
            </div>
            <span class="text-[10px] text-slate-600 font-mono bg-slate-800/80 px-2 py-1 rounded-md group-hover:text-slate-400 transition">password123</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// Form Verileri
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = computed(() => authStore.loading);

const loginAsTestAccount = async (role) => {
  errorMessage.value = '';
  try {
    await authStore.loginWithMock(role);
    if (authStore.error) {
      errorMessage.value = authStore.error;
    }
  } catch (error) {
    errorMessage.value = authStore.error || 'Backend bağlantısı kurulamadı. Sunucu çalışıyor mu?';
  }
};

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Lütfen e-posta/telefon ve şifrenizi giriniz.';
    return;
  }

  errorMessage.value = '';

  try {
    await authStore.login(email.value, password.value);
  } catch (error) {
    errorMessage.value = authStore.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
  }
};
</script>
