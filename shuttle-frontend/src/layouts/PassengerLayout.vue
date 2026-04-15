<template>
  <div class="bg-slate-950 min-h-screen font-sans text-slate-200 selection:bg-indigo-500 selection:text-white">
    
    <!-- Passenger Header with Notification Bell -->
    <header class="h-14 bg-slate-900/90 backdrop-blur-md flex items-center justify-between px-5 border-b border-slate-800 sticky top-0 z-50">
      <div class="font-bold text-base text-white tracking-wide">Servisim Geliyor</div>
      <div class="relative" @click.stop>
        <button @click="bellOpen = !bellOpen" class="relative text-slate-400 hover:text-indigo-400 transition-colors">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
          <span v-if="passengerNotifications.length" class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(99,102,241,0.6)]">{{ passengerNotifications.length > 9 ? '9+' : passengerNotifications.length }}</span>
        </button>
        <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-1">
          <div v-if="bellOpen" class="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 z-50">
            <div class="p-3 border-b border-slate-800"><h3 class="text-xs font-bold text-white">Duyurular</h3></div>
            <div v-if="passengerNotifications.length === 0" class="p-5 text-center text-[11px] text-slate-600">Yeni duyuru yok</div>
            <div v-for="n in passengerNotifications" :key="n.id" class="px-3 py-2.5 border-b border-slate-800/50">
              <p class="text-[11px] font-semibold text-white">{{ n.title }}</p>
              <p class="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{{ n.message }}</p>
            </div>
          </div>
        </Transition>
      </div>
    </header>

    <!-- Router View with padding to prevent content from being obscured by the nav bar -->
    <main class="pb-28">
      <router-view />
    </main>
    
    <!-- Glassmorphism Bottom Navigation Bar -->
    <nav class="fixed bottom-0 left-0 right-0 h-24 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 rounded-t-[2rem] z-50">
      <div class="h-full flex justify-around items-center max-w-md mx-auto px-4">
        
        <router-link to="/passenger/dashboard" class="nav-link flex flex-col items-center justify-center text-slate-500 transition-all duration-300 w-20 h-16 rounded-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span class="text-xs font-medium tracking-wide">Dashboard</span>
        </router-link>

        <router-link to="/passenger/my-bus" class="nav-link flex flex-col items-center justify-center text-slate-500 transition-all duration-300 w-20 h-16 rounded-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="text-xs font-medium tracking-wide">Servisler</span>
        </router-link>

        <router-link to="/passenger/profile" class="nav-link flex flex-col items-center justify-center text-slate-500 transition-all duration-300 w-20 h-16 rounded-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span class="text-xs font-medium tracking-wide">Profil</span>
        </router-link>
        
      </div>
    </nav>
  </div>
</template>

<style scoped>
.router-link-exact-active {
  @apply text-indigo-400 bg-slate-800/60;
}
</style>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import api from '@/services/api';

const bellOpen = ref(false);
const passengerNotifications = ref([]);

async function fetchPassengerNotifications() {
  try {
    const res = await api.get('/announcements');
    passengerNotifications.value = res.data?.data ?? res.data ?? [];
  } catch { /* silent */ }
}

function closeBellOutside() { if (bellOpen.value) bellOpen.value = false; }

onMounted(() => {
  fetchPassengerNotifications();
  document.addEventListener('click', closeBellOutside);
});

onBeforeUnmount(() => document.removeEventListener('click', closeBellOutside));
</script>
