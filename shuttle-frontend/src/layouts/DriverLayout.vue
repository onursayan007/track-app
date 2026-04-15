<template>
  <div class="bg-slate-950 text-slate-200 min-h-screen font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
    
    <header class="h-16 bg-slate-900/90 backdrop-blur-md flex items-center justify-between px-5 border-b border-slate-800 sticky top-0 z-50">
      <div class="font-bold text-lg text-white tracking-wide">Servisim Geliyor</div>
      
      <div class="flex items-center gap-3">
        <!-- Notification Bell -->
        <div class="relative" @click.stop>
          <button @click="bellOpen = !bellOpen" class="relative text-slate-400 hover:text-indigo-400 transition-colors">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
            <span v-if="driverNotifications.length" class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(6,182,212,0.6)]">{{ driverNotifications.length > 9 ? '9+' : driverNotifications.length }}</span>
          </button>
          <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-1">
            <div v-if="bellOpen" class="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 z-50">
              <div class="p-3 border-b border-slate-800"><h3 class="text-xs font-bold text-white">Duyurular</h3></div>
              <div v-if="driverNotifications.length === 0" class="p-5 text-center text-[11px] text-slate-600">Yeni duyuru yok</div>
              <div v-for="n in driverNotifications" :key="n.id" class="px-3 py-2.5 border-b border-slate-800/50">
                <p class="text-[11px] font-semibold text-white">{{ n.title }}</p>
                <p class="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{{ n.message }}</p>
              </div>
            </div>
          </Transition>
        </div>

        <div v-if="activeVehicle" class="flex items-center gap-2 animate-fade-in">
        <div class="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-inner">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
          <span class="text-xs font-bold text-indigo-300">{{ activeVehicle }}</span>
        </div>
        
        <button v-if="hasMultipleVehicles" @click="changeVehicle" class="text-[10px] uppercase font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg transition-all active:scale-95 border border-slate-700">
          Değiştir
        </button>
      </div>
      </div>
    </header>

    <main class="flex-1 overflow-hidden relative pb-24">
      <router-view />
    </main>

    <nav class="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 h-20 flex justify-around items-center z-[1000] pb-2 rounded-t-[2rem] shadow-[0_-15px_40px_rgba(0,0,0,0.6)]">
      
      <router-link to="/driver/dashboard" active-class="text-indigo-400" class="flex flex-col items-center justify-center text-slate-500 hover:text-indigo-300 transition-colors group w-16">
        <svg class="h-6 w-6 mb-1 group-active:scale-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13v-6m0 6l5.447 2.724A1 1 0 0015 20.382V9.618a1 1 0 00-1.447-.894L9 11m-3 4l6-3m0 0l6 3m-6-3v-6m0 0l6-3m-6 3L3 8" /></svg>
        <span class="text-[10px] font-medium tracking-wide">Harita</span>
      </router-link>

      <router-link to="/driver/route" :class="{'opacity-30 pointer-events-none grayscale': !activeVehicle}" active-class="text-indigo-400" class="flex flex-col items-center justify-center text-slate-500 hover:text-indigo-300 transition-colors group w-16 duration-500">
        <svg class="h-6 w-6 mb-1 group-active:scale-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        <span class="text-[10px] font-medium tracking-wide">Rota</span>
      </router-link>

      <router-link to="/driver/create-route" :class="{'opacity-30 pointer-events-none grayscale': !activeVehicle}" active-class="text-indigo-400" class="flex flex-col items-center justify-center text-slate-500 hover:text-indigo-300 transition-colors group w-16 duration-500">
        <svg class="h-6 w-6 mb-1 group-active:scale-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        <span class="text-[10px] font-medium tracking-wide">Oluştur</span>
      </router-link>

      <router-link to="/driver/requests" :class="{'opacity-30 pointer-events-none grayscale': !activeVehicle}" active-class="text-indigo-400" class="relative flex flex-col items-center justify-center text-slate-500 hover:text-indigo-300 transition-colors group w-16 duration-500">
        <span v-if="activeVehicle" class="absolute top-0 right-3 flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
        </span>
        <svg class="h-6 w-6 mb-1 group-active:scale-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        <span class="text-[10px] font-medium tracking-wide">Yolcular</span>
      </router-link>

      <router-link to="/driver/profile" active-class="text-indigo-400" class="flex flex-col items-center justify-center text-slate-500 hover:text-indigo-300 transition-colors group w-16">
        <svg class="h-6 w-6 mb-1 group-active:scale-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        <span class="text-[10px] font-medium tracking-wide">Profil</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';

const router = useRouter();
const activeVehicle = ref(localStorage.getItem('active_vehicle') || null);
const hasMultipleVehicles = ref(localStorage.getItem('has_multiple_vehicles') === 'true');

// Notification bell
const bellOpen = ref(false);
const driverNotifications = ref([]);

async function fetchDriverNotifications() {
  try {
    const res = await api.get('/announcements');
    driverNotifications.value = res.data?.data ?? res.data ?? [];
  } catch { /* silent */ }
}

function closeBellOutside() { if (bellOpen.value) bellOpen.value = false; }

const updateVehicle = () => {
  activeVehicle.value = localStorage.getItem('active_vehicle');
  hasMultipleVehicles.value = localStorage.getItem('has_multiple_vehicles') === 'true';
};

onMounted(() => {
  window.addEventListener('vehicle-changed', updateVehicle);
  document.addEventListener('click', closeBellOutside);
  fetchDriverNotifications();
});

onUnmounted(() => {
  window.removeEventListener('vehicle-changed', updateVehicle);
  document.removeEventListener('click', closeBellOutside);
});

const changeVehicle = () => {
  localStorage.removeItem('active_vehicle');
  activeVehicle.value = null;
  window.dispatchEvent(new Event('vehicle-changed'));
  router.push('/driver/dashboard'); 
};
</script>

<style scoped>
.router-link-exact-active {
  @apply text-indigo-400;
}
.router-link-exact-active svg {
  @apply drop-shadow-[0_0_8px_rgba(129,140,248,0.6)];
}
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>