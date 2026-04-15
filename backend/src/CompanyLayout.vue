<template>
  <div class="flex h-screen bg-gray-100 font-sans">
    <!-- Desktop Sidebar -->
    <aside class="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl z-20">
      <div class="p-6 flex items-center justify-center border-b border-slate-800">
        <h1 class="text-2xl font-bold tracking-wider text-orange-500">SHUTTLE<span class="text-white">OPS</span></h1>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent flex flex-col">
        <router-link to="/company/dashboard" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-orange-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13v-6m0 6l5.447 2.724A1 1 0 0015 20.382V9.618a1 1 0 00-1.447-.894L9 11m-3 4l6-3m0 0l6 3m-6-3v-6m0 0l6-3m-6 3L3 8" /></svg>
          <span class="font-medium text-sm">Canlı Operasyon</span>
        </router-link>
        <router-link to="/company/planning" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-orange-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          <span class="font-medium text-sm">Tur ve Transfer Planlaması</span>
        </router-link>
        <router-link to="/company/routes" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-orange-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          <span class="font-medium text-sm">Rotalar</span>
        </router-link>
        <router-link to="/company/fleet" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-orange-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l-2.293-2.293a1 1 0 010-1.414l7-7a1 1 0 011.414 0l7 7a1 1 0 010 1.414L17 21m-7-3h2" /></svg>
          <span class="font-medium text-sm">Filo ve Şoför Yönetimi</span>
        </router-link>
        <router-link to="/company/passengers" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-orange-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          <span class="font-medium text-sm">Yolcu ve Müşteri Listesi</span>
        </router-link>
        <router-link to="/company/reports" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-orange-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <span class="font-medium text-sm">Finans ve Raporlar</span>
        </router-link>
        <router-link to="/company/maintenance" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-orange-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          <span class="font-medium text-sm">Bakım ve Evrak Takibi</span>
        </router-link>
        <router-link to="/company/feedback" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-orange-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span class="font-medium text-sm">Geri Bildirim Yönetimi</span>
        </router-link>
        <router-link to="/company/alarms" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-orange-400 transition-all duration-200 group">
          <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0l3.443-3.443a1 1 0 00-1.414-1.414l-3.443 3.443m0 0l-3.443-3.443a1 1 0 00-1.414 1.414l3.443 3.443" /></svg>
          <span class="font-medium text-sm">İhlal ve Alarmlar</span>
        </router-link>
        <div class="mt-auto pt-4 border-t border-slate-800">
          <router-link to="/company/settings" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-orange-400 transition-all duration-200 group">
            <svg class="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.48.398.668 1.04.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.28z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span class="font-medium text-sm">Ayarlar</span>
          </router-link>
        </div>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden relative">
      <!-- Mobile Header -->
      <header class="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-20">
        <h1 class="text-xl font-bold text-orange-500">SHUTTLE<span class="text-white">OPS</span></h1>
        <div class="text-sm text-slate-300">Firma Paneli</div>
      </header>

      <!-- Content View -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 relative">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <!-- Mobile Bottom Navigation -->
      <nav class="md:hidden bg-white border-t border-gray-200 flex justify-around items-center h-16 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <router-link to="/company/dashboard" active-class="text-orange-600" class="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 13V7" />
          </svg>
          <span class="text-xs font-medium">Harita</span>
        </router-link>
        <a href="#" class="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span class="text-xs font-medium">Sürücüler</span>
        </a>
        <button @click="logout" class="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span class="text-xs font-medium">Çıkış</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  router.push('/login');
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>