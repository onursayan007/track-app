<template>
  <div class="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
    
    <aside 
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      class="fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto"
    >
      <div class="h-20 flex items-center justify-center px-4 border-b border-slate-800">
        <div class="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          Servisim Geliyor
        </div>
      </div>
      
      <nav class="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent flex flex-col">
        
        <router-link to="/super-admin/dashboard" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-all duration-200 group">
           <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span class="font-medium text-sm">Dashboard</span>
        </router-link>

        <router-link to="/super-admin/tenants" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-all duration-200 group">
           <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          <span class="font-medium text-sm">Firma/Müşteri Yönetimi</span>
        </router-link>

        <router-link to="/super-admin/vehicles" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.375 1.5-3 3 0 01-5.25 0 3 3 0 01-.375-1.5V17.25m4.5 0v1.007a3 3 0 00.375 1.5-3 3 0 005.25 0 3 3 0 00.375-1.5V17.25m-4.5 0h4.5m-4.5 0h-4.5m0 0a3 3 0 01-3-3V13.5a3 3 0 013-3h4.5a3 3 0 013 3v3.75a3 3 0 01-3 3m-4.5-12.75h4.5m-4.5 0h-4.5m0 0a3 3 0 01-3-3V4.5a3 3 0 013-3h4.5a3 3 0 013 3v3.75a3 3 0 01-3 3m-4.5-12.75h4.5" />
          </svg>
          <span class="font-medium text-sm">Araç & GPS Yönetimi</span>
        </router-link>

        <router-link to="/super-admin/vehicle-models" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21M3.375 14.25h.862c.227 0 .45.036.662.106l.727.242a3.375 3.375 0 0 0 2.124 0l.727-.242a2.25 2.25 0 0 1 .662-.106h4.111m0 0h2.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.25 2.25 0 0 0-.659-1.591l-2.482-2.482a2.25 2.25 0 0 0-1.591-.659H9.375c-.621 0-1.125.504-1.125 1.125v7.758" /></svg>
          <span class="font-medium text-sm">Araç Modelleri</span>
        </router-link>

        <router-link to="/super-admin/billing" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          <span class="font-medium text-sm">Abonelik ve Faturalar</span>
        </router-link>

        <router-link to="/super-admin/pricing" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-medium text-sm">Planlar ve Ücretlendirme</span>
        </router-link>

        <router-link to="/super-admin/m2m" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
          </svg>
          <span class="font-medium text-sm">M2M Hat Yönetimi</span>
        </router-link>

        <router-link to="/super-admin/system-health" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
          <span class="font-medium text-sm">Sistem Sağlığı</span>
        </router-link>

        <router-link to="/super-admin/announcements" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 0 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" /></svg>
          <span class="font-medium text-sm">Duyurular</span>
        </router-link>

        <router-link to="/super-admin/audit-logs" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg>
          <span class="font-medium text-sm">Denetim Kayıtları</span>
        </router-link>

        <div class="mt-auto border-t border-slate-800 pt-4">
            <router-link to="/super-admin/settings" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-all duration-200 group">
               <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.48.398.668 1.04.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.28z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span class="font-medium text-sm">Sistem Ayarları</span>
            </router-link>
        </div>
      </nav>
    </aside>

    <div class="flex-1 flex flex-col relative overflow-hidden">
      <header class="h-20 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 flex justify-between items-center border-b border-slate-800 z-10">
        <div class="flex items-center">
          <button @click="isSidebarOpen = !isSidebarOpen" class="text-slate-400 hover:text-white lg:hidden mr-4">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div class="text-lg font-medium text-slate-200">Genel Bakış</div>
        </div>
        <div class="flex items-center space-x-4">
          <!-- Notification Bell -->
          <div class="relative">
            <button @click="bellOpen = !bellOpen" class="relative text-slate-400 hover:text-cyan-400 transition-colors p-1">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
              <span v-if="notifications.length" class="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(6,182,212,0.6)]">{{ notifications.length > 9 ? '9+' : notifications.length }}</span>
            </button>
            <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-1">
              <div v-if="bellOpen" class="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 z-50" @click.stop>
                <div class="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 class="text-sm font-bold text-white">Duyurular</h3>
                  <span class="text-[10px] text-slate-600">{{ notifications.length }} aktif</span>
                </div>
                <div v-if="notifications.length === 0" class="p-6 text-center text-xs text-slate-600">Yeni duyuru yok</div>
                <div v-for="n in notifications" :key="n.id" class="px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                  <div class="flex items-start gap-2">
                    <span :class="{'text-blue-400': n.type==='INFO','text-amber-400': n.type==='WARNING','text-emerald-400': n.type==='SUCCESS'}" class="mt-0.5 shrink-0">
                      <svg v-if="n.type==='WARNING'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                      <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
                    </span>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-semibold text-white truncate">{{ n.title }}</p>
                      <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{{ n.message }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <div class="flex items-center space-x-3 border-r border-slate-700 pr-4">
            <div class="text-right hidden sm:block">
              <div class="text-sm font-medium text-white">Süper Admin</div>
              <div class="text-xs text-indigo-400">Sistem Yöneticisi</div>
            </div>
            <div class="h-9 w-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-500/10">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
          </div>
          <button @click="logout" class="text-slate-400 hover:text-rose-400 transition-colors" title="Çıkış Yap">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </header>

      <main class="flex-1 bg-slate-950 p-6 overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <router-view />
      </main>
    </div>

    <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';

const authStore = useAuthStore();
const isSidebarOpen = ref(false);
const route = useRoute();

// Notification bell
const bellOpen = ref(false);
const notifications = ref([]);

async function fetchNotifications() {
  try {
    const res = await api.get('/announcements');
    notifications.value = res.data?.data ?? res.data ?? [];
  } catch { /* silent */ }
}

// Close bell on outside click
function closeBell(e) { if (bellOpen.value) bellOpen.value = false; }
onMounted(() => {
  fetchNotifications();
  document.addEventListener('click', closeBell);
});
onBeforeUnmount(() => document.removeEventListener('click', closeBell));

// Close sidebar on mobile when navigating
watch(route, () => {
    if (window.innerWidth < 1024) {
        isSidebarOpen.value = false;
    }
});

const logout = () => {
  authStore.logout();
};
</script>

<style scoped>
/* Active link gets Indigo Highlight */
.router-link-active {
  @apply bg-slate-800 text-indigo-400 shadow-md shadow-indigo-900/10;
}
.router-link-active svg {
  @apply text-indigo-400;
}
</style>