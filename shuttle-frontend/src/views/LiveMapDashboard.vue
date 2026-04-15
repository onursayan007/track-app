<template>
  <div class="relative h-full w-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
    <!-- Map Container -->
    <div id="map" class="h-full w-full z-0 bg-slate-900"></div>

    <!-- Floating Info Panel -->
    <div class="absolute top-4 right-4 w-80 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl z-[1000] flex flex-col max-h-[calc(100%-2rem)]">
      <div class="p-4 border-b border-slate-700">
        <h2 class="text-lg font-bold text-white flex items-center">
          <span class="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          Canlı Filo Takibi
        </h2>
        <p class="text-xs text-slate-400 mt-1">Şu an aktif 12 araç izleniyor</p>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
        <div v-for="vehicle in activeVehicles" :key="vehicle.id" 
             class="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:border-slate-600 transition-all cursor-pointer group"
             @click="focusVehicle(vehicle)">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-bold text-slate-200 group-hover:text-orange-400 transition-colors">{{ vehicle.plate }}</div>
              <div class="text-xs text-slate-500">{{ vehicle.driver }}</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-mono text-emerald-400">{{ vehicle.speed }} km/h</div>
              <div class="text-[10px] text-slate-500">Son veri: 1dk</div>
            </div>
          </div>
          <div class="mt-2 w-full bg-slate-700 h-1 rounded-full overflow-hidden">
            <div class="bg-orange-500 h-full" :style="{ width: vehicle.progress + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import "leaflet/dist/leaflet.css";
import L from 'leaflet';

// Mock Data
const activeVehicles = ref([
  { id: 1, plate: '34 GRS 101', driver: 'Ahmet Y.', speed: 45, lat: 41.0082, lng: 28.9784, progress: 60 },
  { id: 2, plate: '34 GRS 102', driver: 'Mehmet K.', speed: 62, lat: 41.0122, lng: 28.9850, progress: 30 },
  { id: 3, plate: '34 GRS 103', driver: 'Ali V.', speed: 0, lat: 40.9900, lng: 29.0200, progress: 90 },
  { id: 4, plate: '34 GRS 104', driver: 'Veli D.', speed: 28, lat: 41.0400, lng: 29.0000, progress: 45 },
  { id: 5, plate: '34 GRS 105', driver: 'Hasan B.', speed: 55, lat: 41.0600, lng: 29.0500, progress: 75 },
]);

let map = null;
const markers = {};

onMounted(() => {
  initMap();
});

const initMap = () => {
  // Initialize Map
  map = L.map('map', {
    zoomControl: false,
    attributionControl: false
  }).setView([41.0082, 28.9784], 12);

  // CartoDB Dark Matter Tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);

  // Add Markers
  activeVehicles.value.forEach(v => {
    const icon = L.divIcon({
      className: 'bg-transparent border-none',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-full h-full bg-orange-500/30 rounded-full animate-ping"></div>
          <div class="relative w-4 h-4 bg-orange-500 border-2 border-white rounded-full shadow-lg"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([v.lat, v.lng], { icon }).addTo(map);
    marker.bindPopup(`<b style="color:#333">${v.plate}</b><br>${v.speed} km/h`);
    markers[v.id] = marker;
  });
};

const focusVehicle = (vehicle) => {
  map.flyTo([vehicle.lat, vehicle.lng], 15);
  markers[vehicle.id].openPopup();
};
</script>

<style>
/* Leaflet Dark Mode Overrides if needed */
.leaflet-popup-content-wrapper {
  @apply bg-white text-slate-900 rounded-lg shadow-xl font-sans text-sm;
}
</style>