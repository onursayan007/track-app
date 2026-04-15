<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <h1 class="text-3xl font-bold text-gray-900">İhlal ve Alarmlar</h1>
      <div class="mt-4 sm:mt-0 flex items-center gap-2">
        <span class="text-sm font-semibold text-gray-600">Filtrele:</span>
        <div class="flex gap-1 bg-gray-200 p-1 rounded-lg">
          <button class="px-3 py-1 text-sm font-bold text-gray-800 bg-white rounded-md shadow">Tümü</button>
          <button class="px-3 py-1 text-sm font-bold text-gray-500 hover:text-gray-800">Yüksek Öncelik</button>
          <button class="px-3 py-1 text-sm font-bold text-gray-500 hover:text-gray-800">Orta</button>
        </div>
      </div>
    </div>

    <!-- Alarms Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tarih ve Saat</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Plaka</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">İhlal Tipi</th>
            <th scope="col" class="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Öncelik</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Konum</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="alarm in alarms" :key="alarm.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-700">{{ alarm.timestamp }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ alarm.plate }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-800 font-semibold">{{ alarm.type }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <span 
                class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full"
                :class="{
                  'bg-red-100 text-red-800': alarm.severity === 'Yüksek',
                  'bg-yellow-100 text-yellow-800': alarm.severity === 'Orta',
                  'bg-blue-100 text-blue-800': alarm.severity === 'Düşük'
                }"
              >
                {{ alarm.severity }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <a href="#" class="text-orange-600 hover:text-orange-900 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                Haritada Gör
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const alarms = ref([
  { id: 1, timestamp: '16.02.2026 14:32', plate: '27 GRS 001', type: 'Hız Sınırı Aşımı (102km/s)', severity: 'Yüksek', location: 'D400 Otoyolu' },
  { id: 2, timestamp: '16.02.2026 11:15', plate: '34 VZY 123', type: 'Rölanti İhlali - 15 dk', severity: 'Orta', location: 'Depo Alanı' },
  { id: 3, timestamp: '16.02.2026 09:05', plate: '27 ABC 99', type: 'Sanal Çit İhlali (Giriş)', severity: 'Yüksek', location: 'Yasak Bölge' },
  { id: 4, timestamp: '15.02.2026 22:40', plate: '27 GRS 002', type: 'Cihaz Söküldü', severity: 'Yüksek', location: 'Bilinmiyor' },
  { id: 5, timestamp: '15.02.2026 18:10', plate: '34 VZY 123', type: 'Mesai Dışı Kullanım', severity: 'Düşük', location: 'AVM Otoparkı' },
]);
</script>
