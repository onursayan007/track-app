<template>
  <div class="relative w-full h-[calc(100vh-80px)] bg-slate-900 overflow-hidden">
    
    <div class="absolute top-6 left-4 right-4 z-[400] bg-slate-800/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-700 shadow-lg flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <h1 class="text-white font-semibold tracking-wide text-sm">Servisim Geliyor Canlı Güzergah</h1>
      </div>
      <div class="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-500/30">
        YOLDA
      </div>
    </div>

    <l-map 
      ref="map" 
      v-model:zoom="zoom" 
      :center="center" 
      :use-global-leaflet="false"
      class="h-full w-full z-0"
    >
      <l-tile-layer 
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
        layer-type="base" 
        name="CartoDB Dark" 
      ></l-tile-layer>

      <l-marker :lat-lng="busLocation">
        <l-icon 
          :icon-size="[60, 60]" 
          :icon-anchor="[30, 30]"
          class-name="bg-transparent border-none shadow-none"
        >
          <div class="relative flex items-center justify-center w-full h-full">
            <div class="absolute w-12 h-12 bg-indigo-500 rounded-full opacity-40 animate-ping"></div>
            <img src="/bus-icon.png" class="relative z-10 w-full h-full object-contain drop-shadow-2xl" alt="Servis Aracı" />
          </div>
        </l-icon>
      </l-marker>

      <l-marker :lat-lng="passengerLocation">
         <l-icon :icon-size="[24, 24]" :icon-anchor="[12, 12]">
           <div class="w-5 h-5 bg-white rounded-full border-4 border-slate-800 shadow-md"></div>
        </l-icon>
      </l-marker>
    </l-map>

    <button 
      @click="recenterMap" 
      class="absolute right-4 bg-slate-800 p-3 rounded-full shadow-xl z-[400] text-slate-300 border border-slate-700 hover:text-indigo-400 hover:bg-slate-700 transition-all duration-500 ease-in-out transform hover:scale-105"
      :class="isExpanded ? 'bottom-[280px]' : 'bottom-[120px]'"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <div class="absolute bottom-0 left-0 right-0 z-[400] bg-slate-800 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-slate-700 px-6 pt-4 pb-8 transition-all duration-500 ease-in-out">
      
      <div @click="toggleSheet" class="cursor-pointer">
        <div class="w-12 h-1.5 bg-slate-600 rounded-full mx-auto mb-4 transition-colors hover:bg-slate-500"></div>
        
        <div class="flex justify-between items-center mb-2">
          <div>
            <h2 class="text-xl font-bold text-white mb-0.5">Servisim Geliyor</h2>
            <p class="text-xs text-slate-400 transition-opacity duration-300" :class="isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'">
              {{ currentService.name }}
            </p>
          </div>
          <div class="text-right flex items-baseline gap-1">
            <span v-if="!isExpanded" class="text-xs text-slate-400 mr-1">Varış:</span>
            <p class="text-3xl font-bold text-indigo-400 leading-none">5 <span class="text-sm font-medium">dk</span></p>
          </div>
        </div>
      </div>
      
      <div 
        class="transition-all duration-500 ease-in-out overflow-hidden"
        :class="isExpanded ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'"
      >
        
        <div class="bg-slate-900/60 rounded-2xl p-4 border border-slate-700/50 flex items-center gap-4 mb-4">
          
          <div class="w-32 h-20 relative flex items-center justify-center flex-shrink-0">
             <img src="/temsa-prestij.png" alt="Temsa Prestij" class="w-full h-full object-contain relative z-10 drop-shadow-2xl scale-125">
          </div>

          <div class="flex-1 flex flex-col justify-center items-end text-right">
            <div class="mb-1">
              <span class="bg-white text-slate-900 font-mono font-bold px-2 py-0.5 rounded text-sm shadow-sm inline-block">
                {{ currentService.plate }}
              </span>
            </div>
            <p class="text-[11px] text-indigo-300 font-semibold tracking-wide mb-3">{{ currentService.vehicleModel }}</p>

            <div class="mt-auto">
              <p class="text-[13px] text-white font-medium leading-none">{{ currentService.driver }}</p>
            </div>
          </div>
          
        </div>

        <button 
          @click="toggleServiceStatus"
          :class="[
            'w-full font-semibold py-3.5 rounded-xl transition-all transform hover:-translate-y-0.5 text-sm border',
            isUsingService 
              ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
          ]"
        >
          {{ isUsingService ? 'Servisi Kullanmayacağım' : 'Servisi Tekrar Kullanacağım' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker, LIcon } from "@vue-leaflet/vue-leaflet";

// --- Mock Data ---
const mockServices = {
  '1': { id: 1, name: 'Sabah Vardiyası - İbrahimli', plate: '27 GRS 01', driver: 'Ahmet Yılmaz', vehicleModel: 'Temsa Prestij' },
  '2': { id: 2, name: 'Akşam Vardiyası - Karataş', plate: '34 XYZ 78', driver: 'Ayşe Kaya', vehicleModel: 'Otokar Sultan' }
};

// --- Route & Service Data ---
const route = useRoute();
const routeId = ref(route.params.routeId);
const currentService = computed(() => {
  return mockServices[routeId.value] || { name: 'Bilinmeyen Servis', plate: '?', driver: '?', vehicleModel: '?' };
});

console.log('Displaying map for route:', currentService.value);

// --- UI State ---
const isExpanded = ref(true);
const isUsingService = ref(true); // STEP 1: Add reactive state

const toggleSheet = () => {
  isExpanded.value = !isExpanded.value;
};

// STEP 3: Smart Toggle Logic
const toggleServiceStatus = async () => {
  if (isUsingService.value) {
    // Turning OFF
    const confirmed = window.confirm('Bugün bu servisi kullanmayacağınızı onaylıyor musunuz? Şoföre bilgi verilecektir.');
    if (confirmed) {
      isUsingService.value = false;
      alert('Şoföre bildirildi.'); // Placeholder for toast
      try {
        await fetch('/api/v1/passenger/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ routeId: routeId.value, status: 'cancelled' })
        });
      } catch (error) {
        console.error('API call failed:', error);
      }
    }
  } else {
    // Turning ON
    const confirmed = window.confirm('Servise tekrar katılacağınızı onaylıyor musunuz? Şoföre bilgi verilecektir.');
    if (confirmed) {
      isUsingService.value = true;
      alert('Durumunuz güncellendi.'); // Placeholder for toast
      try {
        await fetch('/api/v1/passenger/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ routeId: routeId.value, status: 'active' })
        });
      } catch (error) {
        console.error('API call failed:', error);
      }
    }
  }
};


const zoom = ref(15);
const center = ref([37.0662, 37.3833]);
const busLocation = ref([37.0662, 37.3833]);
const passengerLocation = ref([37.0600, 37.3800]);

onMounted(() => {
  setInterval(() => {
    const lat = busLocation.value[0] + (Math.random() - 0.5) * 0.001;
    const lng = busLocation.value[1] + (Math.random() - 0.5) * 0.001;
    busLocation.value = [lat, lng];
  }, 2000);
});

const recenterMap = () => {
  center.value = busLocation.value;
  zoom.value = 16;
};
</script>

<style>
.leaflet-control-zoom a {
  background-color: #1e293b !important;
  color: #94a3b8 !important;
  border-color: #334155 !important;
}
.leaflet-control-zoom a:hover {
  background-color: #334155 !important;
  color: #fff !important;
}
.leaflet-div-icon.bg-transparent {
  background: transparent !important;
  border: none !important;
}
.leaflet-control-attribution {
  display: none;
}
/* Harita zoom butonlarını üstteki başlığın altına itmek için */
.leaflet-top.leaflet-left {
  margin-top: 80px !important;
}
</style>