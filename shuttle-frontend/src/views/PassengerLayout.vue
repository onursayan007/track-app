<template>
  <div class="flex h-screen bg-gray-100 font-sans">
    <div class="flex-1 flex flex-col overflow-hidden relative">
      <!-- Mobile Header -->
      <header class="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-20">
        <h1 class="text-xl font-bold text-orange-500">SHUTTLE<span class="text-white">OPS</span></h1>
        <div class="text-sm text-slate-300">Yolcu</div>
      </header>

      <!-- Content View -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 relative">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <!-- Mobile Bottom Navigation -->
      <nav class="bg-white border-t border-gray-200 flex justify-around items-center h-16 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <router-link to="/passenger/dashboard" active-class="text-orange-600" class="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 13V7" />
          </svg>
          <span class="text-xs font-medium">Servis</span>
        </router-link>
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
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const logout = () => {
  authStore.logout();
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