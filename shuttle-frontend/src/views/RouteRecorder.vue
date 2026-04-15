<template>
  <div class="fixed inset-0 bg-slate-900 flex flex-col font-sans z-50">
    
    <div class="absolute top-0 left-0 right-0 z-20 bg-slate-900/90 p-4 border-b border-slate-700 flex justify-between items-center text-white backdrop-blur-md">
      <div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          <h2 class="font-bold text-lg tracking-wide">CANLI KAYIT MODU</h2>
        </div>
        <p class="text-xs text-gray-400">Durak noktasına gelince butona basın.</p>
      </div>
      <button @click="finishRecording" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors">
        KAYDET & BİTİR
      </button>
    </div>

    <div class="flex-1 relative">
      <div id="recorder-map" class="absolute inset-0 z-0 bg-slate-800"></div>
      
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <div class="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg pulse-ring"></div>
      </div>

      <div class="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent pt-12">
        <button 
          @click="markCurrentLocation"
          class="w-full h-24 bg-orange-600 active:bg-orange-700 text-white rounded-2xl shadow-[0_0_30px_rgba(234,88,12,0.4)] flex items-center justify-center gap-3 transition-transform active:scale-95 border-b-4 border-orange-800 active:border-b-0 active:translate-y-1"
        >
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          <span class="text-2xl font-black tracking-wider">ŞU ANKİ KONUMU EKLE</span>
        </button>
        <div class="text-center mt-3 text-gray-400 font-bold">
          {{ recordedStops.length }} Durak İşaretlendi
        </div>
      </div>
    </div>

    <div v-if="showSaveModal" class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
      <div class="bg-white w-full max-w-sm rounded-2xl p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Rotayı İsimlendir</h2>
        <input 
          v-model="routeName" 
          type="text" 
          placeholder="Örn: Organize Sanayi - Gece" 
          class="w-full bg-gray-100 text-gray-900 text-lg p-4 rounded-xl border border-gray-300 outline-none mb-6"
        >
        <div class="flex gap-3">
          <button @click="showSaveModal = false" class="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl">İptal</button>
          <button @click="confirmSave" class="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg">KAYDET</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const router = useRouter();
const showSaveModal = ref(false);
const routeName = ref('');
const recordedStops = ref([]);
let map = null;

// Mock GPS Hareketi (Test için - Gerçek GPS yerine simülasyon)
const mockMove = () => {
  if(!map) return;
  const currentCenter = map.getCenter();
  const newLat = currentCenter.lat + 0.0001; // Yukarı doğru hareket
  const newLng = currentCenter.lng + 0.0001; // Sağa doğru hareket
  map.panTo([newLat, newLng]); 
};

onMounted(async () => {
  await nextTick();
  initMap();
  
  // Test için otomatik hareket simülasyonunu başlat
  setInterval(mockMove, 1000);
});

const initMap = () => {
  // Başlangıç noktası (Gaziantep)
  const startCoords = [37.0662, 37.3833];
  
  map = L.map('recorder-map', { 
    zoomControl: false,
    dragging: false, // Şoför haritayı sürükleyemesin, sadece GPS takip etsin
    touchZoom: false,
    scrollWheelZoom: false
  }).setView(startCoords, 16);
  
  // Gece Modu Harita (Sürüş için göz yormaz)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);
};

const markCurrentLocation = () => {
  if (navigator.vibrate) navigator.vibrate(200); // Titreşim ile geri bildirim
  
  const center = map.getCenter();
  
  // Haritaya işaret koy (Geri bildirim için görsel nokta)
  L.circleMarker(center, {
    radius: 8,
    color: '#ea580c',
    fillColor: '#fff',
    fillOpacity: 1
  }).addTo(map);

  recordedStops.value.push({ lat: center.lat, lng: center.lng });
};

const finishRecording = () => {
  showSaveModal.value = true;
};

const confirmSave = () => {
  // Backend'e burada POST isteği atılacak
  console.log("Yeni Rota Kaydedildi:", { name: routeName.value, stops: recordedStops.value });
  
  // İşlem bitince listeye geri dön
  router.push('/driver/history'); 
};
</script>

<style>
/* Konum halkası animasyonu (Pulse Effect) */
.pulse-ring {
  box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  animation: pulse-blue 2s infinite;
}
@keyframes pulse-blue {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}
</style>