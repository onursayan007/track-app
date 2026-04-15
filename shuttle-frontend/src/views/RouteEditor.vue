<template>
  <div class="fixed inset-0 bg-gray-50 flex flex-col font-sans z-50">
    
    <div class="bg-white p-4 shadow-md z-20 flex justify-between items-center">
      <div class="flex items-center gap-3 flex-1">
        <button @click="$router.go(-1)" class="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <div class="flex-1">
          <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">ROTA ADI</label>
          <input 
            v-model="routeName" 
            type="text" 
            placeholder="Örn: Organize Sanayi - Gece" 
            class="w-full text-lg font-bold text-gray-900 outline-none bg-transparent placeholder-gray-300"
          >
        </div>
      </div>
      <button 
        @click="saveRoute" 
        class="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-200 flex items-center gap-2"
      >
        <span>💾</span> <span class="hidden sm:inline">KAYDET</span>
      </button>
    </div>

    <div class="flex-1 relative">
      <div id="editor-map" class="absolute inset-0 z-0 bg-slate-200"></div>

      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <svg class="w-8 h-8 text-orange-600 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
      </div>

      <div class="absolute bottom-8 left-4 right-4 z-20 flex flex-col gap-3">
        
        <div class="bg-white/90 backdrop-blur p-3 rounded-xl shadow-sm text-center border border-gray-200">
          <p class="text-xs text-gray-500">
            <span v-if="stops.length === 0">Haritayı sürükleyin ve durak ekleyin.</span>
            <span v-else>Eklenen Durak: <strong class="text-orange-600">{{ stops.length }}</strong> • Silmek için durağa tıklayın.</span>
          </p>
        </div>

        <button 
          @click="addStopAtCenter"
          class="w-full py-4 bg-orange-600 text-white font-black text-xl rounded-2xl shadow-xl shadow-orange-200 hover:bg-orange-700 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
          BURAYA DURAK EKLE
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const route = useRoute();
const router = useRouter();

// State
const routeName = ref('');
const stops = ref([]);
let map = null;
let markers = []; // Leaflet marker referanslarını tutar

onMounted(async () => {
  await nextTick();
  initMap();

  // DÜZENLEME MODU KONTROLÜ
  // Eğer URL'de bir ID varsa, o rotanın bilgilerini çek (Mock Data)
  if (route.query.id) {
    const routeId = route.query.id;
    console.log("Düzenleme Modu, ID:", routeId);
    
    // Örnek: Backend'den gelmiş gibi veri dolduralım
    routeName.value = route.query.name || 'Düzenlenen Rota';
    
    // Mock Duraklar (Gaziantep üzerinde rastgele noktalar)
    const mockStops = [
      { lat: 37.0662, lng: 37.3833 },
      { lat: 37.0682, lng: 37.3853 },
      { lat: 37.0702, lng: 37.3803 }
    ];
    
    mockStops.forEach(stop => addMarker(stop.lat, stop.lng));
  }
});

// Harita Başlatma
const initMap = () => {
  map = L.map('editor-map', { zoomControl: false }).setView([37.0662, 37.3833], 15);
  
  // Editör için daha aydınlık, sokakları net gösteren harita (Light Mode)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: 'CartoDB'
  }).addTo(map);
};

// Merkeze Durak Ekleme
const addStopAtCenter = () => {
  if (!map) return;
  const center = map.getCenter();
  addMarker(center.lat, center.lng);
};

// Haritaya Marker Koyma ve Silme Mantığı
const addMarker = (lat, lng) => {
  const marker = L.marker([lat, lng], {
    draggable: true // Sürüklenip yeri değiştirilebilsin
  }).addTo(map);

  // Tıklayınca SİLME Popup'ı
  marker.bindPopup(`
    <div class="text-center">
      <p class="mb-2 font-bold text-gray-700">Durak Silinsin mi?</p>
      <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded text-xs font-bold w-full">EVET SİL</button>
    </div>
  `);

  // Popup açıldığında içindeki butona event listener ekle
  marker.on('popupopen', () => {
    const btn = document.querySelector('.delete-btn');
    if (btn) {
      btn.onclick = () => {
        map.removeLayer(marker); // Haritadan sil
        stops.value = stops.value.filter(s => s.markerId !== marker._leaflet_id); // Listeden sil
      };
    }
  });

  // Listeye ekle
  stops.value.push({
    markerId: marker._leaflet_id,
    lat: lat,
    lng: lng
  });
};

const saveRoute = () => {
  if (!routeName.value) {
    alert("Lütfen rota adı giriniz!");
    return;
  }
  
  // Güncel koordinatları al (Sürüklenmiş olabilirler)
  const finalStops = stops.value.map(s => {
    // Leaflet'ten marker'ı bulup güncel konumu alabiliriz ama şimdilik basitleştiriyoruz
    return { lat: s.lat, lng: s.lng };
  });

  console.log("KAYDEDİLDİ:", {
    id: route.query.id || 'new', // Varsa güncelle, yoksa yeni
    name: routeName.value,
    stops: finalStops
  });

  // Listeye geri dön
  router.push('/driver/history');
};
</script>