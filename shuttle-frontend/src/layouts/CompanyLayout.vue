<template>
  <div
    :class="[
      'company-shell flex h-screen font-sans selection:bg-orange-500 selection:text-white overflow-hidden',
      theme === 'dark' ? 'company-theme-dark bg-slate-950 text-slate-200' : 'company-theme-light bg-slate-100 text-slate-900',
    ]"
  >
    
    <aside
      :class="[
        isSidebarCollapsed ? 'md:w-20' : 'md:w-64',
        isMobileSidebarOpen ? 'translate-x-0 z-50' : '-translate-x-full md:translate-x-0 z-40',
      ]"
      class="fixed inset-y-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col shadow-xl transition-all duration-300 ease-in-out transform md:relative"
    >
      <div class="h-20 border-b border-slate-800 shrink-0">
        <div class="md:hidden h-full px-4 flex items-center justify-between">
          <h1 class="text-2xl font-black tracking-tight bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Servisim Geliyor</h1>
          <button
            @click="closeMobileSidebar"
            class="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-300 ease-in-out"
            title="Menüyü kapat"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          :class="isSidebarCollapsed ? 'justify-center px-2' : 'justify-start px-4'"
          class="hidden md:flex h-full items-center transition-all duration-300 ease-in-out"
        >
          <h1
            v-if="!isSidebarCollapsed"
            class="text-2xl font-black tracking-tight bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent transition-all duration-300 ease-in-out"
          >
            Servisim Geliyor
          </h1>
          <button
            v-else
            @click="toggleSidebar"
            class="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-300 ease-in-out"
            title="Menüyü genişlet"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <nav class="flex-1 min-h-0 px-4 py-6 space-y-1.5 overflow-y-auto flex flex-col">
        
        <!-- Dynamic Menu Items (non-settings) -->
        <template v-for="item in menuItems.filter(i => !isSettingsItem(i))" :key="item.route">
          <router-link :to="item.route" :class="isSidebarCollapsed ? 'md:justify-center md:px-2' : ''" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-orange-400 transition-all duration-200 group" @click="handleMenuItemClick">
            <svg :class="isSidebarCollapsed ? 'md:mr-0' : 'mr-3'" class="h-5 w-5 group-hover:scale-110 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path v-for="(seg, idx) in getIconPath(item.icon).split(' M').map((s, i) => i === 0 ? s : 'M' + s)" :key="idx" stroke-linecap="round" stroke-linejoin="round" :d="seg" />
            </svg>
            <span :class="isSidebarCollapsed ? 'md:hidden md:opacity-0 md:w-0 md:overflow-hidden' : 'opacity-100'" class="font-medium text-sm transition-all duration-300 ease-in-out">{{ item.label }}</span>
          </router-link>
        </template>

        <!-- Loading placeholder -->
        <template v-if="menuLoading">
          <div v-for="n in 6" :key="n" class="flex items-center px-4 py-3 gap-3">
            <div class="h-5 w-5 rounded bg-slate-800 animate-pulse"></div>
            <div class="h-3 rounded bg-slate-800 animate-pulse" :style="{ width: (50 + Math.random() * 40) + '%' }"></div>
          </div>
        </template>

        <!-- Settings (always at bottom) -->
        <div class="mt-auto pt-4 border-t border-slate-800">
          <template v-for="item in menuItems.filter(i => isSettingsItem(i))" :key="item.route">
            <router-link :to="item.route" :class="isSidebarCollapsed ? 'md:justify-center md:px-2' : ''" class="flex items-center px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-orange-400 transition-all duration-200 group" @click="handleMenuItemClick">
              <svg :class="isSidebarCollapsed ? 'md:mr-0' : 'mr-3'" class="h-5 w-5 group-hover:scale-110 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path v-for="(seg, idx) in getIconPath(item.icon).split(' M').map((s, i) => i === 0 ? s : 'M' + s)" :key="idx" stroke-linecap="round" stroke-linejoin="round" :d="seg" />
              </svg>
              <span :class="isSidebarCollapsed ? 'md:hidden md:opacity-0 md:w-0 md:overflow-hidden' : 'opacity-100'" class="font-medium text-sm transition-all duration-300 ease-in-out">{{ item.label }}</span>
            </router-link>
          </template>
        </div>
      </nav>

      <button
        @click="toggleSidebar"
        :class="isSidebarCollapsed ? 'md:justify-center md:px-2' : 'justify-start px-4 gap-2'"
        class="h-14 border-t border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-300 ease-in-out flex items-center shrink-0"
      >
        <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path v-if="isSidebarCollapsed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span :class="isSidebarCollapsed ? 'md:hidden md:opacity-0 md:w-0 md:overflow-hidden' : 'opacity-100'" class="text-sm font-medium transition-all duration-300 ease-in-out">Menüyü Daralt</span>
      </button>
    </aside>

    <div class="flex-1 flex flex-col relative overflow-hidden">
      
      <header class="h-20 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 flex justify-between items-center border-b border-slate-800 z-20">
        <div class="flex items-center">
          <button
            @click="openMobileSidebar"
            class="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 mr-3 transition-colors"
            title="Menüyü aç"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div class="relative hidden sm:block">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="search" 
              placeholder="Araç plakası, şoför veya rota ara..." 
              class="w-64 md:w-80 bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-orange-500 focus:bg-slate-800 transition-all outline-none"
            />
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <!-- Notification Bell -->
          <div class="relative" @click.stop data-bell>
            <button @click="bellOpen = !bellOpen" class="text-slate-400 hover:text-orange-400 transition-colors relative">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span v-if="companyNotifications.length" class="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(249,115,22,0.6)]">{{ companyNotifications.length > 9 ? '9+' : companyNotifications.length }}</span>
            </button>
            <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-1">
              <div v-if="bellOpen" class="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 z-50">
                <div class="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 class="text-sm font-bold text-white">Duyurular</h3>
                  <span class="text-[10px] text-slate-600">{{ companyNotifications.length }} aktif</span>
                </div>
                <div v-if="companyNotifications.length === 0" class="p-6 text-center text-xs text-slate-600">Yeni duyuru yok</div>
                <div v-for="n in companyNotifications" :key="n.id" class="px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                  <p class="text-xs font-semibold text-white truncate">{{ n.title }}</p>
                  <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{{ n.message }}</p>
                </div>
              </div>
            </Transition>
          </div>
          
          <div class="relative pl-4 border-l border-slate-700" data-profile-menu>
            <button @click="isProfileMenuOpen = !isProfileMenuOpen" class="flex items-center space-x-3 focus:outline-none group">
              <div class="text-right hidden sm:block">
                <div class="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">Onur Sayın</div>
                <div class="text-xs text-slate-500">Operasyon Müdürü</div>
              </div>
              <div class="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 border border-orange-500/50 text-sm font-bold shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-105">
                OS
              </div>
              <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            <div v-if="isProfileMenuOpen" class="absolute right-0 mt-3 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in z-50">
              <div class="p-4 border-b border-slate-700 bg-slate-900/50">
                <p class="text-sm text-white font-bold truncate">ABC Lojistik A.Ş.</p>
                <p class="text-xs text-slate-400 truncate">info@abclojistik.com</p>
              </div>
              <div class="p-2">
                <div class="px-3 py-2 mb-1">
                  <p class="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wide">Tema</p>
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-xs font-semibold text-slate-300">{{ isDarkMode ? 'Deep Dark Mode' : 'Light Mode' }}</span>
                    <button
                      type="button"
                      role="switch"
                      :aria-checked="isDarkMode"
                      @click="toggleTheme"
                      :class="isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-200 border-slate-300'"
                      class="relative inline-flex h-8 w-16 items-center rounded-full border transition-all duration-300 ease-in-out focus:outline-none"
                    >
                      <span
                        :class="isDarkMode ? 'translate-x-8 bg-sky-400/20 text-sky-300 border-sky-300/40' : 'translate-x-1 bg-amber-400/20 text-amber-400 border-amber-400/40'"
                        class="inline-flex h-6 w-6 items-center justify-center rounded-full border shadow transition-all duration-300 ease-in-out"
                      >
                        <svg v-if="!isDarkMode" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0L16.95 7.05M7.05 16.95l-1.414 1.414M12 16a4 4 0 100-8 4 4 0 000 8z" />
                        </svg>
                        <svg v-else class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>
                <router-link to="/company/settings" @click="isProfileMenuOpen = false" class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Firma Ayarları
                </router-link>
              </div>
              <div class="p-2 border-t border-slate-700">
                <button @click="logout" class="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main
        :class="[
          'flex-1 bg-slate-950 px-4 sm:px-6 pt-4 sm:pt-6 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent z-0 relative transition-all duration-300',
          isDashboardRoute ? 'pb-0' : 'pb-4 sm:pb-6',
        ]"
      >
        <div class="mx-auto w-full max-w-[1600px] min-h-full flex flex-col transition-all duration-300">
          <router-view class="flex-1 min-h-full" />
        </div>
      </main>
    </div>

    <div
      v-if="isMobileSidebarOpen"
      class="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
      @click="closeMobileSidebar"
    ></div>

    <!-- Suspension overlay (blocks entire layout when tenant is suspended) -->
    <SuspensionOverlay :visible="isTenantSuspended" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import SuspensionOverlay from '@/components/SuspensionOverlay.vue';

const authStore = useAuthStore();
const isSidebarCollapsed = ref(localStorage.getItem('companySidebarCollapsed') === '1');
const isMobileSidebarOpen = ref(false);
const isProfileMenuOpen = ref(false);
const isTenantSuspended = ref(false);
const theme = ref(localStorage.getItem('companyTheme') === 'light' ? 'light' : 'dark');
const route = useRoute();
const router = useRouter();
const isDashboardRoute = computed(() => route.path === '/company/dashboard');
const isDarkMode = computed(() => theme.value === 'dark');

// Notification bell
const bellOpen = ref(false);
const companyNotifications = ref([]);

async function fetchCompanyNotifications() {
  try {
    const res = await api.get('/announcements');
    companyNotifications.value = res.data?.data ?? res.data ?? [];
  } catch { /* silent */ }
}

function closeBellOnOutside(e) {
  if (bellOpen.value && !e.target.closest('[data-bell]')) bellOpen.value = false;
}

function setTheme(nextTheme) {
  theme.value = nextTheme;
  localStorage.setItem('companyTheme', nextTheme);
  syncDocumentThemeClass(nextTheme);
}

function toggleTheme() {
  setTheme(isDarkMode.value ? 'light' : 'dark');
}

function syncDocumentThemeClass(themeMode) {
  const shouldBeDark = themeMode === 'dark';
  document.documentElement.classList.toggle('dark', shouldBeDark);
  document.body.classList.toggle('dark', shouldBeDark);
}

function toggleSidebar() {
  if (window.innerWidth < 768) {
    isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
    return;
  }

  isSidebarCollapsed.value = !isSidebarCollapsed.value;
  localStorage.setItem('companySidebarCollapsed', isSidebarCollapsed.value ? '1' : '0');
}

function openMobileSidebar() {
  isMobileSidebarOpen.value = true;
}

function closeMobileSidebar() {
  isMobileSidebarOpen.value = false;
}

function handleMenuItemClick() {
  if (window.innerWidth < 768) {
    closeMobileSidebar();
  }
}

// ─── Dynamic Menu Items from API ────────────────────────────────────────────────
const menuItems = ref([])
const menuLoading = ref(false)

// Icon name → SVG path mapping (matches tenant-menu.controller default icons)
const iconPaths = {
  'map':          'M9.75 17L9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13v-6m0 6l5.447 2.724A1 1 0 0015 20.382V9.618a1 1 0 00-1.447-.894L9 11m-3 4l6-3m0 0l6 3m-6-3v-6m0 0l6-3m-6 3L3 8',
  'calendar':     'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  'location':     'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  'truck':        'M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l-2.293-2.293a1 1 0 010-1.414l7-7a1 1 0 011.414 0l7 7a1 1 0 010 1.414L17 21m-7-3h2',
  'users':        'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  'chart':        'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  'wrench':       'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.471-2.471a1.125 1.125 0 00-1.591-1.591L9.828 13.586M11.42 15.17L15.17 11.42',
  'chat':         'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  'bell':         'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  'cog':          'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
}

// Fallback icon if not found
const defaultIcon = 'M4 6h16M4 12h16M4 18h16'

function getIconPath(iconName) {
  return iconPaths[iconName] || defaultIcon
}

// Separate settings item from regular menu items
function isSettingsItem(item) {
  return item.icon === 'cog' || item.route?.includes('settings')
}

async function fetchMenus() {
  menuLoading.value = true
  try {
    const res = await api.get('/tenant/menus')
    const list = res.data?.data ?? res.data ?? []
    if (Array.isArray(list) && list.length) {
      menuItems.value = list.sort((a, b) => a.sortOrder - b.sortOrder)
    } else {
      menuItems.value = [
        { label: 'Canlı Operasyon', route: '/company/dashboard', icon: 'map', sortOrder: 0 },
        { label: 'Tur ve Planlama', route: '/company/planning', icon: 'calendar', sortOrder: 1 },
        { label: 'Rotalar', route: '/company/routes', icon: 'location', sortOrder: 2 },
        { label: 'Filo Yönetimi', route: '/company/fleet', icon: 'truck', sortOrder: 3 },
        { label: 'Şoför Yönetimi', route: '/company/drivers', icon: 'users', sortOrder: 4 },
        { label: 'Yolcu Listesi', route: '/company/passengers', icon: 'users', sortOrder: 5 },
        { label: 'Müşteri Yönetimi', route: '/company/clients', icon: 'users', sortOrder: 6 },
        { label: 'İletişim Merkezi', route: '/company/dispatch', icon: 'chat', sortOrder: 7 },
        { label: 'Finans ve Raporlar', route: '/company/reports', icon: 'chart', sortOrder: 8 },
        { label: 'Bakım ve Evrak', route: '/company/maintenance', icon: 'wrench', sortOrder: 9 },
        { label: 'Geri Bildirimler', route: '/company/feedback', icon: 'chat', sortOrder: 10 },
        { label: 'İhlal ve Alarmlar', route: '/company/alarms', icon: 'bell', sortOrder: 11 },
        { label: 'Ayarlar', route: '/company/settings', icon: 'cog', sortOrder: 99 },
      ]
    }
  } catch (e) {
    console.warn('Menü yüklenemedi:', e.message)
    // Fallback — keep sidebar usable with hardcoded items
    menuItems.value = [
      { label: 'Canlı Operasyon', route: '/company/dashboard', icon: 'map', sortOrder: 0 },
      { label: 'Tur ve Planlama', route: '/company/planning', icon: 'calendar', sortOrder: 1 },
      { label: 'Rotalar', route: '/company/routes', icon: 'location', sortOrder: 2 },
      { label: 'Filo Yönetimi', route: '/company/fleet', icon: 'truck', sortOrder: 3 },
      { label: 'Şoför Yönetimi', route: '/company/drivers', icon: 'users', sortOrder: 4 },
      { label: 'Yolcu Listesi', route: '/company/passengers', icon: 'users', sortOrder: 5 },
      { label: 'Müşteri Yönetimi', route: '/company/clients', icon: 'users', sortOrder: 6 },
      { label: 'İletişim Merkezi', route: '/company/dispatch', icon: 'chat', sortOrder: 7 },
      { label: 'Finans ve Raporlar', route: '/company/reports', icon: 'chart', sortOrder: 8 },
      { label: 'Bakım ve Evrak', route: '/company/maintenance', icon: 'wrench', sortOrder: 9 },
      { label: 'Geri Bildirimler', route: '/company/feedback', icon: 'chat', sortOrder: 10 },
      { label: 'İhlal ve Alarmlar', route: '/company/alarms', icon: 'bell', sortOrder: 11 },
      { label: 'Ayarlar', route: '/company/settings', icon: 'cog', sortOrder: 99 },
    ]
  } finally {
    menuLoading.value = false
  }
}

// Mobilde menü tıklandığında sol menüyü kapat
watch(route, () => {
  isProfileMenuOpen.value = false;
  bellOpen.value = false;
  closeMobileSidebar();
});

// Dropdown menüyü dışarı tıklandığında kapatma mantığı
const closeDropdown = (e) => {
  if (!e.target.closest('[data-profile-menu]')) {
    isProfileMenuOpen.value = false;
  }
};

onMounted(() => {
  syncDocumentThemeClass(theme.value);
  document.addEventListener('click', closeDropdown);
  document.addEventListener('click', closeBellOnOutside);
  fetchMenus();
  fetchCompanyNotifications();

  // Intercept TENANT_SUSPENDED response from any API call
  const interceptorId = api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 403 && error.response?.data?.code === 'TENANT_SUSPENDED') {
        isTenantSuspended.value = true;
      }
      return Promise.reject(error);
    }
  );

  // Store for cleanup
  _suspensionInterceptorId = interceptorId;
});

let _suspensionInterceptorId = null;

onBeforeUnmount(() => {
  document.removeEventListener('click', closeDropdown);
  document.removeEventListener('click', closeBellOnOutside);
  if (_suspensionInterceptorId !== null) {
    api.interceptors.response.eject(_suspensionInterceptorId);
  }
});

const logout = () => {
  authStore.logout();
};
</script>

<style scoped>
/* Aktif sayfa linkinin tasarımı */
.router-link-active {
  @apply bg-slate-800 text-orange-400 shadow-md shadow-orange-900/10;
}
.router-link-active svg {
  @apply text-orange-400;
}

.company-theme-light .router-link-active {
  @apply bg-orange-100 text-orange-700 shadow-none;
}
.company-theme-light .router-link-active svg {
  @apply text-orange-600;
}

/* Dropdown Açılış Animasyonu */
.animate-fade-in { 
  animation: fadeIn 0.15s ease-out forwards; 
}
@keyframes fadeIn { 
  from { opacity: 0; transform: translateY(-10px) scale(0.95); } 
  to { opacity: 1; transform: translateY(0) scale(1); } 
}

</style>