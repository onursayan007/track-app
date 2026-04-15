<template>
  <div class="relative w-full h-[calc(100vh-4rem)] bg-slate-950 text-white font-sans flex flex-col items-center justify-center p-6 animate-fade-in pb-24">
    
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-black text-orange-500 tracking-tight">Sürücü Profili</h1>
    </div>

    <div class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      <div class="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

      <div class="space-y-6 relative z-10">
        
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <span class="text-slate-400 text-sm font-medium">İsim Soyisim:</span>
          <span class="text-white font-bold text-lg">Ahmet Yılmaz</span>
        </div>

        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <span class="text-slate-400 text-sm font-medium">Atanmış Araç:</span>
          <span class="bg-slate-800 text-indigo-300 px-3 py-1.5 rounded-lg border border-slate-700 font-mono font-bold text-sm">
            {{ activeVehicle || 'Seçilmedi' }}
          </span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-slate-400 text-sm font-medium">Telefon:</span>
          <span class="text-white font-bold text-base">+90 555 123 45 67</span>
        </div>

      </div>
    </div>

    <button @click="logout" class="w-full max-w-sm mt-8 bg-rose-600 hover:bg-rose-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center justify-center gap-2">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
      Çıkış Yap
    </button>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const activeVehicle = ref(localStorage.getItem('active_vehicle'));

// Layout'tan araç değişirse profilin de haberi olsun
const updateVehicle = () => {
  activeVehicle.value = localStorage.getItem('active_vehicle');
};

onMounted(() => {
  window.addEventListener('vehicle-changed', updateVehicle);
});

onUnmounted(() => {
  window.removeEventListener('vehicle-changed', updateVehicle);
});

const logout = () => {
  localStorage.removeItem('active_vehicle');
  authStore.logout();
};
</script>

<style>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>