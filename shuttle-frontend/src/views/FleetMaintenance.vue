<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Bakım ve Evrak Takibi</h1>
       <div class="mt-4 sm:mt-0 flex gap-2">
        <button class="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all">
          Yeni Bakım Kaydı Ekle
        </button>
      </div>
    </div>

    <!-- Maintenance Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div v-for="vehicle in vehicles" :key="vehicle.id" class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
        
        <!-- Vehicle Header -->
        <div class="flex items-center mb-4 pb-4 border-b border-gray-100">
           <img src="../assets/bus-icon.svg" class="h-9 w-9 mr-3" alt="Bus Icon" />
          <div>
            <p class="font-bold text-lg text-gray-800">{{ vehicle.plate }}</p>
            <p class="text-sm text-gray-500">{{ vehicle.model }}</p>
          </div>
        </div>

        <!-- Maintenance Items -->
        <div class="space-y-4 flex-grow">
          <!-- Next Maintenance -->
          <div class="flex items-start">
             <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 shrink-0">
                <svg class="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.471-2.471a1.125 1.125 0 00-1.591-1.591L9.828 13.586M11.42 15.17L15.17 11.42" /></svg>
             </div>
             <div>
                <p class="font-semibold text-gray-700">Sonraki Bakım</p>
                <p class="text-sm text-gray-500">{{ vehicle.maintenance.next }} <span class="font-medium"> (Kalan: {{ vehicle.maintenance.remaining }})</span></p>
             </div>
          </div>

          <!-- MOT Test -->
           <div class="flex items-start">
             <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 shrink-0">
                 <svg class="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 14.25h.008v.008H12v-.008z" /></svg>
             </div>
             <div>
                <p class="font-semibold text-gray-700">Araç Muayenesi</p>
                <p class="text-sm text-gray-500">{{ vehicle.mot.date }} <span class="font-medium text-blue-600"> (Kalan: {{ vehicle.mot.remaining }})</span></p>
             </div>
          </div>

           <!-- Insurance -->
           <div class="flex items-start">
             <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 shrink-0">
                  <svg class="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008H12v-.008z" /></svg>
             </div>
             <div>
                <p class="font-semibold text-gray-700">Trafik Sigortası</p>
                <p 
                    class="text-sm font-bold"
                    :class="vehicle.insurance.status === 'Süresi Doldu!' ? 'text-red-600' : 'text-gray-500'"
                >
                    {{ vehicle.insurance.status }}
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const vehicles = ref([
    { 
        id: 1, 
        plate: '27 GRS 001', 
        model: 'Ford Transit',
        maintenance: { next: '150.000 km', remaining: '2.300 km' },
        mot: { date: '12 Ekim 2026', remaining: '45 Gün' },
        insurance: { status: '12 Ekim 2026' }
    },
    { 
        id: 2, 
        plate: '34 VZY 123', 
        model: 'Mercedes Sprinter',
        maintenance: { next: '90.000 km', remaining: '8.150 km' },
        mot: { date: '01 Şubat 2027', remaining: '1 Yıl' },
        insurance: { status: '01 Şubat 2027' }
    },
    { 
        id: 3, 
        plate: '27 ABC 99', 
        model: 'Ford Transit',
        maintenance: { next: '220.000 km', remaining: '1.100 km' },
        mot: { date: '05 Ocak 2026', remaining: 'Süresi Doldu!' },
        insurance: { status: 'Süresi Doldu!' }
    },
    { 
        id: 4, 
        plate: '27 GRS 002', 
        model: 'Otokar Sultan',
        maintenance: { next: '185.000 km', remaining: '12.400 km' },
        mot: { date: '22 Temmuz 2026', remaining: '2 Ay' },
        insurance: { status: '22 Temmuz 2026' }
    }
]);
</script>
