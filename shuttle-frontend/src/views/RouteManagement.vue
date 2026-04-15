<template>
  <div class="h-full flex flex-col p-2 sm:p-4 md:p-6 bg-slate-950 text-slate-300">
    <!-- Header -->
    <div class="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white">Rota Yönetimi</h1>
        <p class="text-slate-400 mt-1">Tanımlı servis rotalarını görüntüleyin ve yönetin.</p>
      </div>
      <button class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 self-end sm:self-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span>Yeni Rota Oluştur</span>
      </button>
    </div>

    <!-- Route Cards Grid -->
    <div class="flex-grow overflow-y-auto pr-2">
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        <div v-for="route in routes" :key="route.id" 
             class="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg hover:shadow-orange-500/10 hover:border-orange-500/30 transition-all duration-300 flex flex-col">
          
          <!-- Minimap Placeholder -->
          <div class="h-40 bg-slate-800/50 rounded-t-2xl flex items-center justify-center">
            <svg class="h-16 w-16 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          
          <div class="p-5 flex-grow flex flex-col">
            <h3 class="text-lg font-bold text-white mb-1">{{ route.name }}</h3>
            <p class="text-sm text-slate-400 mb-4 flex-grow">{{ route.description }}</p>

            <div class="grid grid-cols-2 gap-4 text-sm mb-4">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                </svg>
                <div>
                  <div class="text-slate-500">Durak Sayısı</div>
                  <div class="font-semibold text-white">{{ route.stopCount }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <div class="text-slate-500">Yolcu Sayısı</div>
                  <div class="font-semibold text-white">{{ route.passengerCount }}</div>
                </div>
              </div>
            </div>

            <div class="border-t border-slate-800 pt-4 mt-auto">
              <div class="flex justify-between items-center">
                 <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span class="font-semibold text-indigo-300">{{ route.assignedVehicle }}</span>
                 </div>
                 <button class="text-sm font-medium text-orange-400 hover:text-orange-300">
                   Detayları Gör
                 </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const routes = ref([
  {
    id: 1,
    name: 'Sabah İbrahimli Vardiyası',
    description: 'Şehrin batı yakasındaki ana sabah güzergahı.',
    stopCount: 12,
    passengerCount: '22/25',
    assignedVehicle: '27 ABC 01',
  },
  {
    id: 2,
    name: 'Akşam Karataş Vardiyası',
    description: 'Güney bölgesinden fabrika çıkış güzergahı.',
    stopCount: 18,
    passengerCount: '19/20',
    assignedVehicle: '27 DEF 02',
  },
  {
    id: 3,
    name: 'Gece Organize Sanayi Turu',
    description: 'OSB içindeki fabrikalar için gece vardiyası.',
    stopCount: 7,
    passengerCount: '11/15',
    assignedVehicle: '27 GHI 03',
  },
  {
    id: 4,
    name: 'Haftasonu Ek Sefer',
    description: 'Cumartesi mesaisi için özel planlanmış sefer.',
    stopCount: 9,
    passengerCount: '8/15',
    assignedVehicle: '27 JKL 04',
  },
  {
    id: 5,
    name: 'Yönetim Personeli Servisi',
    description: 'Yönetim kadrosu için özel, daha az duraklı rota.',
    stopCount: 5,
    passengerCount: '4/8',
    assignedVehicle: '27 VIP 05',
  },
    {
    id: 6,
    name: 'Üniversite Ring Seferi',
    description: 'Kampüs ve şehir merkezi arası ring seferi.',
    stopCount: 11,
    passengerCount: '25/25',
    assignedVehicle: '27 UVZ 06',
  },
]);
</script>
