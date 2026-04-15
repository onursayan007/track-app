<template>
  <div class="space-y-8 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="text-center">
      <h1 class="text-3xl font-bold text-white">Global Sistem Ayarları</h1>
      <p class="mt-2 text-slate-400">Tüm sistemi etkileyen genel API anahtarlarını, entegrasyonları ve modları buradan yönetin.</p>
    </div>

    <div class="space-y-10">
      <!-- Mapbox Settings -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
        <div class="p-6 border-b border-slate-800">
          <h3 class="text-lg font-semibold text-white">Mapbox & Harita API</h3>
          <p class="text-sm text-slate-400 mt-1">Canlı harita ve rota optimizasyonu için kullanılan API anahtarı.</p>
        </div>
        <div class="p-6">
          <label for="mapbox-token" class="text-sm font-medium text-slate-300">Mapbox Access Token</label>
          <input 
            type="password" 
            id="mapbox-token"
            v-model="settings.mapboxToken"
            class="mt-2 block w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-4 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:bg-slate-800 transition-all outline-none"
            placeholder="pk.ey..."
          />
        </div>
      </div>

      <!-- SMS Provider Settings -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
        <div class="p-6 border-b border-slate-800">
          <h3 class="text-lg font-semibold text-white">SMS Sağlayıcı (Netgsm)</h3>
          <p class="text-sm text-slate-400 mt-1">Kullanıcı bildirimleri ve şifre sıfırlama için SMS API bilgileri.</p>
        </div>
        <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="netgsm-key" class="text-sm font-medium text-slate-300">API Key (Kullanıcı Adı)</label>
            <input type="text" id="netgsm-key" v-model="settings.netgsm.apiKey" class="mt-2 block w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-sm" />
          </div>
          <div>
            <label for="netgsm-secret" class="text-sm font-medium text-slate-300">API Secret (Şifre)</label>
            <input type="password" id="netgsm-secret" v-model="settings.netgsm.apiSecret" class="mt-2 block w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-sm" />
          </div>
        </div>
      </div>
      
      <!-- SMTP Settings -->
       <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
        <div class="p-6 border-b border-slate-800">
          <h3 class="text-lg font-semibold text-white">SMTP E-Posta Ayarları</h3>
          <p class="text-sm text-slate-400 mt-1">Rapor ve bildirim e-postalarını göndermek için kullanılan sunucu.</p>
        </div>
        <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="smtp-host" class="text-sm font-medium text-slate-300">Host</label>
              <input type="text" id="smtp-host" v-model="settings.smtp.host" class="mt-2 block w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-sm" />
            </div>
             <div>
              <label for="smtp-port" class="text-sm font-medium text-slate-300">Port</label>
              <input type="text" id="smtp-port" v-model="settings.smtp.port" class="mt-2 block w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-sm" />
            </div>
             <div>
              <label for="smtp-user" class="text-sm font-medium text-slate-300">Kullanıcı Adı</label>
              <input type="text" id="smtp-user" v-model="settings.smtp.user" class="mt-2 block w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-sm" />
            </div>
             <div>
              <label for="smtp-pass" class="text-sm font-medium text-slate-300">Şifre</label>
              <input type="password" id="smtp-pass" v-model="settings.smtp.pass" class="mt-2 block w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-sm" />
            </div>
        </div>
      </div>

      <!-- Maintenance Mode -->
      <div class="bg-red-900/20 border border-red-500/30 rounded-2xl shadow-lg">
        <div class="p-6 flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold text-red-300">Sistem Bakım Modu</h3>
            <p class="text-sm text-red-400/80 mt-1">Aktif edildiğinde, süper adminler hariç tüm kullanıcı erişimi engellenir.</p>
          </div>
          <button 
            @click="settings.maintenanceMode = !settings.maintenanceMode"
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            :class="settings.maintenanceMode ? 'bg-red-500' : 'bg-slate-700'">
            <span class="sr-only">Bakım modunu aktifleştir</span>
            <span aria-hidden="true" :class="settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'" class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Save Button -->
    <div class="pt-6 border-t border-slate-800 flex justify-end">
        <button class="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-semibold shadow-lg shadow-indigo-500/20">
          Değişiklikleri Kaydet
        </button>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';

const settings = ref({
  mapboxToken: 'pk.eyJ1Ijoic2F5aGFjZW0iLCJhIjoiY2s5ZzY2ZzAwMDZ3eDNkcGYzZnJsdG4zcyJ9.placeholder',
  netgsm: {
    apiKey: '850XXXXXXX',
    apiSecret: '**********',
  },
  smtp: {
    host: 'smtp.mailgun.org',
    port: 587,
    user: 'postmaster@mg.example.com',
    pass: '************',
  },
  maintenanceMode: false,
});
</script>