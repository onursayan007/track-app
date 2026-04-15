<template>
  <div class="relative w-full h-[calc(100vh-4rem)] bg-slate-950 text-white font-sans flex flex-col overflow-hidden">

    <div v-if="viewState === 'routes'" class="flex-1 flex flex-col p-4 sm:p-6 w-full max-w-lg mx-auto animate-fade-in pb-24">
        <h1 class="text-2xl sm:text-3xl font-black text-white text-center mt-4 mb-2 tracking-tight">Durak Talepleri</h1>
        <p class="text-center text-slate-400 text-sm mb-8">
          <span class="text-indigo-400 font-bold">{{ activeVehicle }}</span> aracı için gelen talepler
        </p>
        
        <div class="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
            <div v-for="route in routesWithRequests" :key="route.id" @click="openRoute(route)" class="bg-slate-800 hover:bg-slate-750 p-5 rounded-3xl shadow-lg border border-slate-700 cursor-pointer transition-transform active:scale-95 group relative overflow-hidden">
                <div class="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-colors"></div>
                <div class="flex items-center justify-between relative z-10">
                  <div>
                    <span class="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1 block">Rota</span>
                    <h2 class="font-bold text-lg text-white pr-4">{{ route.name }}</h2>
                  </div>
                  <div class="flex items-center justify-center bg-orange-500 text-white font-black text-sm w-10 h-10 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)] border-2 border-slate-800 shrink-0 animate-bounce-slight">
                    {{ route.requestCount }}
                  </div>
                </div>
            </div>

             <div v-if="routesWithRequests.length === 0" class="flex flex-col items-center justify-center py-16 text-slate-500">
                <div class="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                  <svg class="w-10 h-10 text-emerald-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 class="text-lg font-bold text-white mb-1">Harika!</h3>
                <p class="text-sm">Bekleyen hiçbir durak talebi yok.</p>
             </div>
        </div>
    </div>

    <div v-else-if="viewState === 'list'" class="flex-1 flex flex-col p-4 sm:p-6 w-full max-w-lg mx-auto animate-slide-up pb-24">
        <div class="flex items-center gap-3 mb-6 mt-2">
          <button @click="backToRoutes" class="w-10 h-10 bg-slate-800 text-slate-300 hover:text-white rounded-xl flex items-center justify-center transition-colors active:scale-95 border border-slate-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <div class="flex-1">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none">Rota Talepleri</span>
            <h1 class="text-base font-bold text-white truncate pr-2">{{ selectedRoute?.name }}</h1>
          </div>
        </div>
        <div class="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
            <div v-for="stop in currentRouteRequests" :key="stop.id" @click="openReviewMap(stop)" class="bg-slate-800 hover:bg-slate-750 p-5 rounded-3xl shadow-lg border border-slate-700 flex items-center gap-4 cursor-pointer transition-transform active:scale-95 group">
                <div class="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center shrink-0 border border-orange-500/20 group-hover:bg-orange-500/20">
                  <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div class="flex-grow min-w-0">
                    <p class="font-bold text-lg text-white truncate">{{ stop.passengerName }}</p>
                    <p class="text-slate-400 text-sm truncate">{{ stop.location }}</p>
                </div>
                <svg class="w-5 h-5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
        </div>
    </div>

    <div v-else-if="viewState === 'map'" class="flex-1 relative flex flex-col animate-fade-in w-full h-full">
      <div class="absolute top-0 left-0 right-0 z-[1000] bg-slate-900/90 backdrop-blur-md p-4 pt-6 pb-4 flex justify-between items-center text-white border-b border-slate-800 shadow-2xl">
        <button @click="closeReviewMap" class="flex items-center gap-2 text-slate-300 hover:text-white font-medium bg-slate-800 p-2.5 rounded-xl transition-all border border-slate-700 active:scale-95">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          Geri
        </button>
        <div class="font-bold text-lg text-center pr-10">Talebi İncele</div>
      </div>
      <div v-if="isEditingPin" class="absolute top-24 left-4 right-4 z-[1000] bg-orange-500/95 backdrop-blur-md text-white font-bold text-sm text-center py-3 rounded-xl shadow-lg border border-orange-400 animate-slide-up">
        📍 Pini sürükleyerek veya haritaya tıklayarak yeni durağı belirleyin.
      </div>
      <div id="review-map" class="absolute inset-0 z-0 bg-slate-900"></div>
      <div class="absolute bottom-24 left-4 right-4 z-[1000]">
        <div class="bg-slate-800/95 backdrop-blur-md rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-6 border border-slate-700 animate-slide-up">
          <div class="flex items-center justify-between mb-5">
             <div class="flex-1 pr-4">
               <h2 class="text-xl font-bold text-white truncate">{{ selectedRequest?.passengerName }}</h2>
               <p class="text-slate-400 text-sm mt-1 flex items-center gap-1">
                 <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 <span class="truncate">{{ selectedRequest?.location }}</span>
               </p>
             </div>
             <div class="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 text-center shrink-0">
               <span class="block text-[10px] text-slate-500 uppercase font-bold">Mesafe</span>
               <span class="block text-indigo-400 font-bold text-sm">{{ selectedRequest?.distance }}</span>
             </div>
          </div>
          <div v-if="!isEditingPin" class="flex gap-2">
            <button @click="rejectRequest" class="flex-1 bg-slate-700 hover:bg-rose-500/20 text-rose-400 border border-slate-600 hover:border-rose-500/50 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex flex-col items-center justify-center gap-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              Reddet
            </button>
            <button @click="toggleEditPin" class="flex-1 bg-slate-700 hover:bg-orange-500/20 text-orange-400 border border-slate-600 hover:border-orange-500/50 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex flex-col items-center justify-center gap-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              Düzelt
            </button>
            <button @click="acceptRequest" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 border border-emerald-500 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex flex-col items-center justify-center gap-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              Onayla
            </button>
          </div>
          <div v-else class="flex gap-3">
            <button @click="isEditingPin = false" class="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3.5 rounded-xl font-bold transition-all active:scale-95 border border-slate-600">İptal</button>
            <button @click="savePin" class="flex-1 bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/30 border border-orange-400 py-3.5 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              Konumu Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const viewState = ref('routes'); 
const isEditingPin = ref(false);
const selectedRoute = ref(null);
const selectedRequest = ref(null);
const activeVehicle = ref(localStorage.getItem('active_vehicle') || '27 GR 001');

let reviewMap = null;
let reviewMarker = null;

// --- MOCK DATA (assignedPlate Eklendi) ---
const allRoutes = ref([
  { id: 1, name: 'İbrahimli - GATEM (Sabah)', assignedPlate: '27 GR 001' },
  { id: 2, name: 'Karataş - Başpınar (Akşam)', assignedPlate: '27 GR 001' },
  { id: 3, name: 'Kızılay - Çankaya (Öğrenci)', assignedPlate: '06 ABC 99' }
]);

const pendingStops = ref([
    { id: 1, routeId: 1, passengerName: 'Ayşe Yılmaz', distance: '500m', location: 'Organize Sanayi civarı', lat: 37.0650, lng: 37.3850 },
    { id: 2, routeId: 1, passengerName: 'Mehmet Öztürk', distance: '1.2km', location: 'Gazi Muhtar Paşa Blv.', lat: 37.0700, lng: 37.3800 },
    { id: 3, routeId: 3, passengerName: 'Selin Demir (Öğrenci)', distance: '100m', location: 'Tunus Caddesi', lat: 39.9035, lng: 32.8597 }
]);

// 1. ÖNCE AKTİF ARACA AİT ROTALARI FİLTRELE
const filteredRoutes = computed(() => {
  return allRoutes.value.filter(route => route.assignedPlate === activeVehicle.value);
});

// 2. SONRA BU ROTALARA AİT TALEPLERİ SAY
const routesWithRequests = computed(() => {
  return filteredRoutes.value.map(route => {
    const requestsForRoute = pendingStops.value.filter(stop => stop.routeId === route.id);
    return { ...route, requestCount: requestsForRoute.length };
  }).filter(route => route.requestCount > 0);
});

// 3. SEÇİLİ ROTANIN İÇİNDEKİLER
const currentRouteRequests = computed(() => {
  if (!selectedRoute.value) return [];
  return pendingStops.value.filter(stop => stop.routeId === selectedRoute.value.id);
});

const openRoute = (route) => { selectedRoute.value = route; viewState.value = 'list'; };
const backToRoutes = () => { selectedRoute.value = null; viewState.value = 'routes'; };
const openReviewMap = async (stop) => { selectedRequest.value = { ...stop }; viewState.value = 'map'; await nextTick(); initReviewMap(); };
const closeReviewMap = () => { selectedRequest.value = null; isEditingPin.value = false; if (reviewMap) { reviewMap.remove(); reviewMap = null; } viewState.value = 'list'; };

const initReviewMap = () => {
    if (!reviewMap && document.getElementById('review-map')) {
        reviewMap = L.map('review-map', { zoomControl: false }).setView([selectedRequest.value.lat, selectedRequest.value.lng], 16);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(reviewMap);
        const pinIcon = L.divIcon({ html: `<div class="w-10 h-10 bg-orange-500 rounded-full border-4 border-slate-900 shadow-[0_0_20px_rgba(249,115,22,0.6)] flex items-center justify-center text-white font-black text-lg">?</div>`, className: 'bg-transparent', iconSize: [40, 40], iconAnchor: [20, 20] });
        reviewMarker = L.marker([selectedRequest.value.lat, selectedRequest.value.lng], { icon: pinIcon, draggable: true }).addTo(reviewMap);
        reviewMarker.on('dragend', function (event) { if(!isEditingPin.value) return; var marker = event.target; var position = marker.getLatLng(); selectedRequest.value.lat = position.lat; selectedRequest.value.lng = position.lng; reviewMap.panTo(position); });
        reviewMap.on('click', function(e) { if(isEditingPin.value) { reviewMarker.setLatLng(e.latlng); selectedRequest.value.lat = e.latlng.lat; selectedRequest.value.lng = e.latlng.lng; reviewMap.panTo(e.latlng); } });
    }
};

const toggleEditPin = () => { isEditingPin.value = true; };
const savePin = () => { isEditingPin.value = false; alert("Yeni konum kaydedildi. (Backend'e iletilecek)"); };
const removeRequestFromList = () => {
    const index = pendingStops.value.findIndex(s => s.id === selectedRequest.value.id);
    if (index > -1) pendingStops.value.splice(index, 1);
    if (currentRouteRequests.value.length === 0) { backToRoutes(); } else { closeReviewMap(); }
};
const acceptRequest = () => { alert("Durak onaylandı ve rotaya eklendi."); removeRequestFromList(); };
const rejectRequest = () => { alert("Talep reddedildi."); removeRequestFromList(); };
</script>

<style>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
.animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.animate-bounce-slight { animation: bounceSlight 2s infinite; }
@keyframes bounceSlight { 0%, 100% { transform: translateY(-5%); } 50% { transform: translateY(5%); } }
</style>