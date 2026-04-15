<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-white">GPS Cihaz ve Entegrasyon Havuzu</h1>
      <p class="mt-2 text-slate-400">Sisteme veri gönderen tüm fiziksel GPS cihazlarını yönetin ve firmalara atayın.</p>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-start justify-between">
        <div>
          <p class="text-sm font-medium text-slate-400">Aktif Dinlenen Portlar</p>
          <p class="text-3xl font-bold text-white mt-1">4</p>
        </div>
        <div class="p-3 rounded-full bg-indigo-500/10 border border-indigo-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" /></svg>
        </div>
      </div>
      <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-start justify-between">
        <div>
          <p class="text-sm font-medium text-slate-400">Son 5 Dk Veri Atan Cihaz</p>
          <p class="text-3xl font-bold text-green-400 mt-1">1,198</p>
        </div>
         <div class="p-3 rounded-full bg-green-500/10 border border-green-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.136 11.886c3.87-3.87 10.154-3.87 14.024 0M1.984 8.734c7.753-7.753 20.295-7.753 28.048 0" /></svg>
        </div>
      </div>
       <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-start justify-between">
        <div>
          <p class="text-sm font-medium text-slate-400">Offline / Kopuk Cihazlar</p>
          <p class="text-3xl font-bold text-red-500 mt-1">42</p>
        </div>
        <div class="p-3 rounded-full bg-red-500/10 border border-red-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-2.828-2.828a5 5 0 010-7.072m-2.828-2.828a1 1 0 010-1.414m-2.828-2.828a1 1 0 010-1.414M5.636 18.364a9 9 0 010-12.728m2.828 2.828a5 5 0 010 7.072m2.828 2.828a1 1 0 010 1.414m2.828 2.828a1 1 0 010 1.414" /></svg>
        </div>
      </div>
    </div>
    
    <!-- Devices Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left text-slate-300">
          <thead class="text-xs text-slate-400 uppercase bg-slate-900">
            <tr class="border-b border-slate-800">
              <th scope="col" class="px-6 py-4">IMEI / Cihaz ID</th>
              <th scope="col" class="px-6 py-4">Protokol</th>
              <th scope="col" class="px-6 py-4">Atanan Firma</th>
              <th scope="col" class="px-6 py-4">Son Veri</th>
              <th scope="col" class="px-6 py-4">Durum</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="device in devices" :key="device.id" class="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
              <th scope="row" class="px-6 py-4 font-mono font-bold text-white whitespace-nowrap">{{ device.imei }}</th>
              <td class="px-6 py-4 font-mono">{{ device.protocol }}</td>
              <td class="px-6 py-4">
                <span v-if="device.tenant" class="font-medium text-cyan-400">{{ device.tenant }}</span>
                <span v-else class="text-slate-500">--</span>
              </td>
              <td class="px-6 py-4 text-slate-400">{{ device.lastPing }}</td>
              <td class="px-6 py-4">
                 <span class="inline-flex items-center" :class="statusClass(device.status).text">
                  <span class="h-2 w-2 rounded-full mr-2" :class="statusClass(device.status).bg"></span>
                  {{ device.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const devices = ref([
  { id: 1, imei: '867598033345123', protocol: 'GT06', tenant: 'Öz-El Lojistik', lastPing: '3 sn önce', status: 'Online' },
  { id: 2, imei: 'arvento-api-991', protocol: 'Arvento API', tenant: 'Marmara Turizm', lastPing: '1 sn önce', status: 'Online' },
  { id: 3, imei: '358900123456789', protocol: 'Teltonika', tenant: 'Ege VIP Transfer', lastPing: '12 sn önce', status: 'Online' },
  { id: 4, imei: '867598033345888', protocol: 'GT06', tenant: null, lastPing: '2 yıl önce', status: 'Atanmamış' },
  { id: 5, imei: '867598033345221', protocol: 'GT06', tenant: 'Anadolu Taşımacılık', lastPing: '45 dk önce', status: 'Offline' },
  { id: 6, imei: '358900123456901', protocol: 'Teltonika', tenant: 'Gaziantep Lojistik', lastPing: '28 sn önce', status: 'Online' },
  { id: 7, imei: '867598033345432', protocol: 'GT06', tenant: 'Karadeniz Servis', lastPing: '3 saat önce', status: 'Offline' },
]);

const statusClass = (status) => {
  switch (status) {
    case 'Online': return { text: 'text-green-400', bg: 'bg-green-500' };
    case 'Offline': return { text: 'text-red-400', bg: 'bg-red-500' };
    case 'Atanmamış': return { text: 'text-slate-500', bg: 'bg-slate-500' };
    default: return { text: 'text-slate-500', bg: 'bg-slate-500' };
  }
};
</script>