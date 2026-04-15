<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-white">SaaS Genel Bakış</h1>
      <p class="mt-2 text-slate-400">Sistemin genel durumu, büyüme ve sağlık metrikleri.</p>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-start justify-between">
        <div>
          <p class="text-sm font-medium text-slate-400">Toplam Aktif Firma</p>
          <p class="text-3xl font-bold text-white mt-1">86</p>
        </div>
        <div class="p-3 rounded-full bg-indigo-500/10 border border-indigo-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18h16.5M2.25 12h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
        </div>
      </div>
      <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-start justify-between">
        <div>
          <p class="text-sm font-medium text-slate-400">Bağlı GPS Cihazı</p>
          <p class="text-3xl font-bold text-white mt-1">1,240</p>
        </div>
         <div class="p-3 rounded-full bg-cyan-500/10 border border-cyan-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.136 11.886c3.87-3.87 10.154-3.87 14.024 0M1.984 8.734c7.753-7.753 20.295-7.753 28.048 0" /></svg>
        </div>
      </div>
      <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-start justify-between">
        <div>
          <p class="text-sm font-medium text-slate-400">Aylık Tekrarlayan Gelir (MRR)</p>
          <p class="text-3xl font-bold text-white mt-1">₺125,400</p>
        </div>
        <div class="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" /></svg>
        </div>
      </div>
      <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-start justify-between">
        <div>
          <p class="text-sm font-medium text-slate-400">API Sağlığı (Son 24s)</p>
          <p class="text-3xl font-bold text-emerald-400 mt-1">99.98%</p>
        </div>
        <div class="p-3 rounded-full bg-slate-700/50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.412 15.655L9.75 21.75l3.745-4.012M9.255 9.75l7.33-4.512m-4.512 6.554l.048-.096l.048-.096l.048-.096l.048-.096M12 21a9 9 0 110-18 9 9 0 010 18z" /></svg>
        </div>
      </div>
    </div>
    
    <!-- Charts/Tables Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
        <div class="p-4 sm:p-6 border-b border-slate-800">
          <h3 class="text-lg font-semibold text-white">Aylık Büyüme Grafiği (MRR)</h3>
        </div>
        <div class="p-6 h-80 flex items-center justify-center">
            <div class="w-full text-center">
                <svg class="w-full h-full text-slate-800" fill="currentColor" viewBox="0 0 400 150">
                    <path opacity="0.1" d="M0 130 C 40 110, 80 60, 120 80 S 200 130, 240 100 S 320 20, 360 40 S 400 100, 400 100 V 150 H 0 Z" />
                    <path fill="none" stroke-width="2" class="text-indigo-500" stroke="currentColor" d="M0 130 C 40 110, 80 60, 120 80 S 200 130, 240 100 S 320 20, 360 40" />
                </svg>
                 <p class="text-sm text-slate-600 -mt-8">Grafik Alanı</p>
            </div>
        </div>
      </div>
      
      <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
        <div class="p-4 sm:p-6 border-b border-slate-800">
          <h3 class="text-lg font-semibold text-white">Son Eklenen Firmalar</h3>
        </div>
        <ul role="list" class="divide-y divide-slate-800">
          <li v-for="tenant in newTenants" :key="tenant.id" class="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors">
            <div class="flex items-center">
              <div class="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-sm border border-indigo-500/20">
                  {{ tenant.name.charAt(0) }}
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-white">{{ tenant.name }}</p>
                <p class="text-xs text-slate-400">{{ tenant.plan }} Paketi</p>
              </div>
            </div>
            <p class="text-sm font-mono text-slate-500">{{ tenant.joinDate }}</p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const newTenants = ref([
  { id: 1, name: 'Öz-El Lojistik', plan: 'Enterprise', joinDate: '2 gün önce' },
  { id: 2, name: 'Marmara Turizm', plan: 'Pro', joinDate: '5 gün önce' },
  { id: 3, name: 'Anadolu Taşımacılık', plan: 'Pro', joinDate: '1 hafta önce' },
  { id: 4, name: 'Ege VIP Transfer', plan: 'Enterprise', joinDate: '2 hafta önce' },
  { id: 5, name: 'Karadeniz Servis', plan: 'Standard', joinDate: '3 hafta önce' },
]);
</script>