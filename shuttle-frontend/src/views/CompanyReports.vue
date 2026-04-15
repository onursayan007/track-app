<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-white">Finans, Hakediş ve İsraf Raporları</h1>
      <p class="mt-2 text-slate-400">Operasyonel verimliliği ve maliyetleri analiz edin.</p>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-start justify-between">
        <div>
          <p class="text-sm font-medium text-slate-400">Aylık Toplam Gerçek KM</p>
          <p class="text-3xl font-bold text-white mt-1">128,450 km</p>
          <p class="text-xs text-emerald-400 flex items-center mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L12 11.586l3.293-3.293a1 1 0 011.414 0l-3.293 3.293z" clip-rule="evenodd" />
            </svg>
            +5.2% geçen aya göre
          </p>
        </div>
        <div class="p-3 rounded-full bg-indigo-500/10 border border-indigo-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h8.25M8.25 12h5.25m-5.25 5.25h3m-3-5.25H5.625c-.621 0-1.125.504-1.125 1.125v3.75c0 .621.504 1.125 1.125 1.125h.375m-3.75 0h3.75m-3.75 0h3.75v-1.5m-3.75 0h3.75M15 6.75v9.75m0-9.75H18c.621 0 1.125.504 1.125 1.125v7.5c0 .621-.504 1.125-1.125 1.125h-2.25" />
          </svg>
        </div>
      </div>
      <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-start justify-between">
        <div>
          <p class="text-sm font-medium text-slate-400">Toplam Rölanti Süresi</p>
          <p class="text-3xl font-bold text-white mt-1">218 saat</p>
           <p class="text-xs text-red-400 flex items-center mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L12 8.414l3.293 3.293a1 1 0 101.414-1.414l-4-4a1 1 0 00-1.414 0L8 8.586l-3.293-3.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0z" clip-rule="evenodd" />
            </svg>
            +11% geçen aya göre
          </p>
        </div>
         <div class="p-3 rounded-full bg-amber-500/10 border border-amber-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-start justify-between">
        <div>
          <p class="text-sm font-medium text-slate-400">Tahmini Rölanti İsrafı</p>
          <p class="text-3xl font-bold text-red-500 mt-1">₺9,810</p>
          <p class="text-xs text-slate-400 flex items-center mt-2">
            (1.5L/saat, 45₺/L üzerinden)
          </p>
        </div>
        <div class="p-3 rounded-full bg-red-500/10 border border-red-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
    </div>
    
    <!-- Generated Reports List -->
     <div class="bg-slate-900 border border-slate-800 rounded-2xl">
      <div class="p-4 sm:p-6 border-b border-slate-800">
        <h3 class="text-lg font-semibold text-white">Oluşturulan Raporlar</h3>
      </div>
      <ul role="list" class="divide-y divide-slate-800">
        <li v-for="report in reports" :key="report.id" class="flex items-center justify-between p-4 sm:p-6 hover:bg-slate-800/50 transition-colors">
          <div class="flex items-center min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-indigo-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            <div class="min-w-0 flex-auto sm:ml-4">
              <p class="text-sm font-semibold leading-6 text-white">{{ report.name }}</p>
              <p class="mt-1 truncate text-xs leading-5 text-slate-400">Oluşturulma: {{ report.date }}</p>
            </div>
          </div>
          <div class="flex items-center gap-x-4">
            <span class="inline-flex items-center rounded-md bg-slate-400/10 px-2 py-1 text-xs font-medium text-slate-400 ring-1 ring-inset ring-slate-400/20">{{ report.size }}</span>
            <button class="flex items-center justify-center px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors duration-200 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              İndir
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const reports = ref([
  {
    id: 1,
    name: 'Nisan 2024 - Aylık Taşeron Hakediş Raporu',
    date: '01.05.2024 09:30',
    size: '1.2 MB',
  },
  {
    id: 2,
    name: 'Nisan 2024 - Rölanti ve Yakıt İsraf Analizi',
    date: '01.05.2024 09:28',
    size: '450 KB',
  },
  {
    id: 3,
    name: 'Mart 2024 - Aylık Taşeron Hakediş Raporu',
    date: '01.04.2024 10:15',
    size: '1.1 MB',
  },
  {
    id: 4,
    name: 'Q1 2024 - Çeyrek Dönem Performans Özeti',
    date: '02.04.2024 11:00',
    size: '2.5 MB',
  },
    {
    id: 5,
    name: 'Şubat 2024 - Aylık Taşeron Hakediş Raporu',
    date: '01.03.2024 09:45',
    size: '1.3 MB',
  },
]);
</script>