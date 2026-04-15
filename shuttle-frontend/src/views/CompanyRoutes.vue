<template>
  <div class="h-full flex flex-col p-2 sm:p-4 md:p-6 bg-slate-950 text-slate-300 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 relative">
    
    <div class="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 class="text-3xl font-black text-white tracking-tight">Rota Yönetimi</h1>
        <p class="text-slate-400 mt-1">Tanımlı servis rotalarını yönetin ve kriz anlarında anlık aktarım yapın.</p>
      </div>
      <div class="flex gap-3 self-end sm:self-center">
        <button @click="openMapDrawMode" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center gap-2">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          Haritadan Rota Çiz
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 mb-6">
      Rotalar yükleniyor...
    </div>

    <div v-else-if="loadError" class="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-rose-200 text-sm mb-6">
      {{ loadError }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
      <div v-for="route in routes" :key="route.id" class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl hover:border-orange-500/30 transition-all duration-300 flex flex-col overflow-hidden group">
        
        <div class="h-32 bg-slate-800/50 relative flex items-center justify-center border-b border-slate-800">
          <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <svg class="h-12 w-12 text-slate-600 group-hover:text-orange-500/50 transition-colors relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          
          <div class="absolute top-3 right-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5">
            <span :class="route.typeLabel === 'Gidiş' ? 'text-emerald-400' : 'text-blue-400'">
              <svg v-if="route.typeLabel === 'Gidiş'" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </span>
            <span class="text-xs font-bold text-white">{{ route.typeLabel }}</span>
          </div>
        </div>
        
        <div class="p-5 flex-grow flex flex-col">
          <h3 class="text-lg font-bold text-white mb-1">{{ route.name }}</h3>
          <p class="text-xs text-slate-400 mb-4 line-clamp-2">{{ route.description || 'Harita üzerinden çizilmiş özel rota.' }}</p>

          <div class="grid grid-cols-2 gap-4 text-sm mb-5 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg>
              </div>
              <div>
                <div class="text-[10px] uppercase text-slate-500 font-bold">Durak</div>
                <div class="font-bold text-slate-200">{{ route.stopCount }} Nokta</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <div class="text-[10px] uppercase text-slate-500 font-bold">Yolcu</div>
                <div class="font-bold text-slate-200">{{ route.passengerCount }} Kişi</div>
              </div>
            </div>
          </div>

          <div class="mt-auto">
            <div class="flex items-center justify-between bg-slate-800/30 p-2.5 rounded-xl border border-slate-700/50 mb-3">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {{ getDriverName(route.driverId).charAt(0) }}
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-bold text-white truncate">{{ getDriverName(route.driverId) }}</p>
                  <p class="text-[10px] text-slate-400 font-mono">{{ getVehiclePlate(route.vehicleId) }}</p>
                </div>
              </div>
            </div>
            
            <div class="flex gap-2">
              <button class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2 rounded-lg transition-colors border border-slate-700">
                Detay
              </button>
              <button @click="openTransferModal(route)" class="flex-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-bold py-2 rounded-lg transition-all border border-rose-500/30 flex items-center justify-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4M4 17h16" /></svg>
                Aktar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    
    <div v-if="isMapDrawMode" class="fixed inset-0 z-[100] flex bg-slate-950 animate-fade-in">
      
      <div class="flex-1 flex flex-col relative">
        <div class="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-20 shadow-lg shrink-0">
          <div class="flex items-center gap-4">
            <button @click="closeMapDrawMode" class="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-lg">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <span class="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
                Rota Çizim Modu
              </h2>
              <p class="text-xs text-slate-400">Haritada durak eklemek istediğiniz noktalara tıklayın.</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button @click="openSaveRouteModal" v-if="drawnStops.length > 0" class="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              Rotayı Kaydet ({{ drawnStops.length }} Durak)
            </button>
          </div>
        </div>
        <div id="route-map" class="flex-1 w-full bg-slate-800 z-10 relative"></div>
      </div>

      <div class="w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-20 shadow-2xl shrink-0">
        <div class="p-5 border-b border-slate-800 bg-slate-800/30">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            Durak Sıralaması
          </h3>
          <p class="text-xs text-slate-400 mt-1">Numarayı değiştirerek durak sırasını anında kaydırabilirsiniz.</p>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
          <div v-if="drawnStops.length === 0" class="text-center text-slate-500 text-sm mt-10">
            Haritaya tıklayarak ilk durağı ekleyin.
          </div>
          
          <div v-for="(stop, index) in drawnStops" :key="stop.id" class="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-700 group hover:border-orange-500 transition-colors">
            <select :value="index + 1" @change="changeStopOrder(index, $event.target.value)" class="bg-orange-500 text-white font-bold text-center rounded-lg outline-none appearance-none cursor-pointer p-1.5 w-12 border border-orange-600 shadow-lg">
              <option v-for="n in drawnStops.length" :key="n" :value="n">{{ n }}</option>
            </select>
            
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-slate-200 truncate">Durak {{ index + 1 }}</p>
              <p class="text-[10px] text-slate-500 font-mono">{{ stop.lat.toFixed(4) }}, {{ stop.lng.toFixed(4) }}</p>
            </div>
            
            <button @click="removeStop(index)" class="text-slate-500 hover:text-rose-400 p-1.5 bg-slate-800 rounded-lg transition-colors" title="Durağı Sil">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
        
        <div class="p-4 border-t border-slate-800 bg-slate-800/30">
          <button @click="clearAllStops" v-if="drawnStops.length > 0" class="w-full text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500 py-2.5 rounded-xl text-sm font-bold border border-rose-500/20 hover:border-rose-500 transition-colors">
            Tüm Çizimi Temizle
          </button>
        </div>
      </div>
    </div>

    <div v-if="isSaveRouteModalOpen" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div class="bg-slate-800/80 p-5 border-b border-slate-700">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            Rotayı Sisteme Kaydet
          </h2>
        </div>
        
        <div class="p-6 space-y-5">
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rota Adı</label>
            <input v-model="newRouteForm.name" type="text" placeholder="Örn: OSB Gece Vardiyası" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4M4 17h16" /></svg>
              Bu Rotaya Araç/Şoför Ata
            </label>
            <select v-model="newRouteForm.vehicleId" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors font-mono">
              <option value="" disabled selected>Atanacak Aracı Seçin...</option>
              <option v-for="v in vehicles" :key="v.id" :value="v.id">
                {{ v.plate }} - {{ getAssignedDriverForVehicle(v.id) }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Operasyon Şoförü</label>
            <select v-model="newRouteForm.driverId" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors">
              <option value="" disabled>Atanacak Şoförü Seçin...</option>
              <option v-for="d in drivers" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Aylık Sözleşme Bedeli (₺)</label>
            <input v-model.number="newRouteForm.monthlyRevenue" type="number" min="0" step="0.01" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kurum/Şirket Sözleşmesi</label>
            <select v-model="newRouteForm.clientId" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors">
              <option value="">Bireysel / Tanımsız</option>
              <option v-for="client in clients" :key="client.id" :value="client.id">{{ client.name }} • {{ client.taxNumber }}</option>
            </select>
          </div>
          
          <div class="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between">
            <span class="text-xs font-bold text-emerald-400">Sıralanmış Durak Sayısı:</span>
            <span class="text-lg font-black text-white">{{ drawnStops.length }}</span>
          </div>
        </div>

        <div class="bg-slate-800/50 p-4 border-t border-slate-700 flex justify-end gap-3">
          <button @click="isSaveRouteModalOpen = false" class="px-5 py-2.5 rounded-xl font-bold text-slate-300 hover:bg-slate-700 transition-colors text-sm">Geri Dön</button>
          <button @click="confirmAndSaveNewRoute" :disabled="!newRouteForm.name || !newRouteForm.vehicleId || !newRouteForm.driverId || isSaving" class="px-6 py-2.5 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            Kaydet ve Aktifleştir
          </button>
        </div>
      </div>
    </div>

    <div v-if="isTransferModalOpen" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div class="bg-slate-800/80 p-5 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-white">Acil Durum / Kriz Yönetimi</h2>
              <p class="text-xs text-slate-400">Şoför değişikliği veya araç arızası işlemlerini buradan yönetin.</p>
            </div>
          </div>
          <button @click="closeTransferModal" class="text-slate-500 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div class="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Operasyon Şoförü</label>
              <select v-model="transferForm.driverId" class="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-orange-500 text-sm transition-colors">
                <option v-for="d in drivers" :key="d.id" :value="d.id">{{ d.name }}</option>
              </select>
            </div>
            <div class="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Kullanılacak Araç</label>
              <select v-model="transferForm.vehicleId" class="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-orange-500 text-sm transition-colors font-mono">
                <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.plate }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="bg-slate-800/50 p-4 border-t border-slate-700 flex justify-end gap-3 shrink-0">
          <button @click="closeTransferModal" class="px-5 py-2.5 rounded-xl font-bold text-slate-300 hover:bg-slate-700 transition-colors text-sm">İptal</button>
          <button @click="confirmTransfer" :disabled="isSaving" class="px-6 py-2.5 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg transition-all text-sm disabled:opacity-50">Değişiklikleri Uygula</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

const drivers = ref([]);
const vehicles = ref([]);
const routes = ref([]);
const clients = ref([]);
const isLoading = ref(false);
const isSaving = ref(false);
const loadError = ref('');

const ROUTE_TYPE_LABEL = {
  SHUTTLE: 'Gidiş',
  TRANSFER: 'Dönüş',
  SCHOOL: 'Gidiş',
  CORPORATE: 'Gidiş',
};

const mapRouteTypeLabel = (type) => ROUTE_TYPE_LABEL[type] || 'Gidiş';

const fetchDrivers = async () => {
  try {
    const res = await api.get('/tenant/drivers');
    const list = res.data?.data ?? res.data ?? [];
    drivers.value = Array.isArray(list) ? list : [];
  } catch {
    const res = await api.get('/tenant/users', { params: { role: 'DRIVER' } });
    const list = res.data?.data ?? res.data ?? [];
    drivers.value = Array.isArray(list) ? list : [];
  }
};

const fetchVehicles = async () => {
  const res = await api.get('/tenant/vehicles');
  const list = res.data?.data ?? res.data ?? [];
  vehicles.value = (Array.isArray(list) ? list : []).map((item) => ({
    id: item.id,
    plate: item.plate,
    assignedDriverId: item.driverId || item.assignedDriver?.id || null,
  }));
};

const fetchRoutes = async () => {
  const res = await api.get('/tenant/routes');
  const list = res.data?.data ?? res.data ?? [];
  routes.value = (Array.isArray(list) ? list : []).map((item) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    typeLabel: mapRouteTypeLabel(item.type),
    monthlyRevenue: Number(item.monthlyRevenue || 0),
    description: item.description || '',
    stopCount: item.stops?.length ?? 0,
    passengerCount: item.passengerCount ?? 0,
    clientId: item.clientId || item.client?.id || null,
    clientName: item.client?.name || 'Bireysel / Tanımsız',
    driverId: item.driverId || item.driver?.id || null,
    vehicleId: item.vehicleId || item.vehicle?.id || null,
  }));
};

const fetchClients = async () => {
  const res = await api.get('/tenant/clients');
  const list = res.data?.data ?? res.data ?? [];
  clients.value = Array.isArray(list) ? list : [];
};

const loadAll = async () => {
  isLoading.value = true;
  loadError.value = '';
  try {
    await Promise.all([fetchDrivers(), fetchVehicles(), fetchRoutes(), fetchClients()]);
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Rota verileri yüklenemedi.';
  } finally {
    isLoading.value = false;
  }
};

// Yardımcı Fonksiyonlar
const getDriverName = (id) => drivers.value.find(d => d.id === id)?.name || 'Bilinmiyor';
const getVehiclePlate = (id) => vehicles.value.find(v => v.id === id)?.plate || 'Plakasız';
const getAssignedDriverForVehicle = (vId) => {
  const v = vehicles.value.find(v => v.id === vId);
  return v ? getDriverName(v.assignedDriverId) : '';
};

// --- HARİTA VE ÇİZİM MANTIĞI (LEAFLET) ---
const isMapDrawMode = ref(false);
const isSaveRouteModalOpen = ref(false);
const drawnStops = ref([]);

let mapInstance = null;
let polylineLayer = null;
let markerLayers = [];

const newRouteForm = ref({ name: '', type: 'SHUTTLE', vehicleId: '', driverId: '', clientId: '', monthlyRevenue: 0 });

const openMapDrawMode = async () => {
  isMapDrawMode.value = true;
  drawnStops.value = [];
  
  await nextTick();
  initMap();
};

const initMap = () => {
  if (mapInstance) mapInstance.remove();
  
  mapInstance = L.map('route-map', { zoomControl: false }).setView([37.0662, 37.3833], 13);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(mapInstance);
  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

  mapInstance.on('click', (e) => {
    // Tıklanan noktayı listeye son durak olarak ekle
    drawnStops.value.push({
      id: Date.now(),
      lat: e.latlng.lat,
      lng: e.latlng.lng
    });
    renderRouteOnMap();
  });
};

// ==========================================
// PİNLERİ NUMARALI VE ÇİZGİLİ ÇİZME MANTIĞI
// ==========================================
const renderRouteOnMap = () => {
  // Eski pinleri ve çizgiyi temizle
  markerLayers.forEach(marker => mapInstance.removeLayer(marker));
  markerLayers = [];
  if (polylineLayer) mapInstance.removeLayer(polylineLayer);
  
  const latlngs = [];

  // Güncel sıralı listeye göre her durağı baştan çiz
  drawnStops.value.forEach((stop, index) => {
    latlngs.push([stop.lat, stop.lng]);
    
    // Rakamlı Özel İkon Oluştur (HTML ile)
    const numberedIcon = L.divIcon({
      className: 'custom-number-icon',
      html: `<div style="background-color: #f97316; color: white; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);">${index + 1}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker([stop.lat, stop.lng], { icon: numberedIcon }).addTo(mapInstance);
    markerLayers.push(marker);
  });

  // Çizgiyi çiz (Turuncu, kalın)
  if (latlngs.length > 1) {
    polylineLayer = L.polyline(latlngs, { 
      color: '#f97316', 
      weight: 4,
    }).addTo(mapInstance);
  }
};

// ==========================================
// DURAK SIRASINI DEĞİŞTİRME MANTIĞI (AKILLI ARRAY SHIFT)
// ==========================================
const changeStopOrder = (oldIndex, newIndexStr) => {
  const newIndex = parseInt(newIndexStr) - 1; // Kullanıcının gördüğü rakamı array indexine çevir
  
  if (newIndex === oldIndex) return; // Değişiklik yoksa çık
  
  // İlgili durağı arrayden kopar
  const movedStop = drawnStops.value.splice(oldIndex, 1)[0];
  
  // Koparılan durağı yeni hedefe yerleştir (Diğerleri otomatik kayar)
  drawnStops.value.splice(newIndex, 0, movedStop);
  
  // Haritadaki rakamları ve çizgileri yeni sıraya göre anında güncelle
  renderRouteOnMap();
};

const removeStop = (index) => {
  drawnStops.value.splice(index, 1);
  renderRouteOnMap();
};

const clearAllStops = () => {
  drawnStops.value = [];
  renderRouteOnMap();
};

const closeMapDrawMode = () => {
  isMapDrawMode.value = false;
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
};

const openSaveRouteModal = () => {
  newRouteForm.value = { name: '', type: 'SHUTTLE', vehicleId: '', driverId: '', clientId: '', monthlyRevenue: 0 };
  isSaveRouteModalOpen.value = true;
};

const confirmAndSaveNewRoute = async () => {
  isSaving.value = true;
  try {
    const payload = {
      name: newRouteForm.value.name,
      type: newRouteForm.value.type,
      vehicleId: newRouteForm.value.vehicleId,
      driverId: newRouteForm.value.driverId,
      clientId: newRouteForm.value.clientId || null,
      monthlyRevenue: Number(newRouteForm.value.monthlyRevenue || 0),
    };

    const res = await api.post('/tenant/routes', payload);
    const created = res.data?.data ?? res.data;

    if (created?.id && drawnStops.value.length) {
      await api.put(`/tenant/routes/${created.id}/stops`, {
        stops: drawnStops.value.map((stop, index) => ({
          name: `Durak ${index + 1}`,
          latitude: stop.lat,
          longitude: stop.lng,
          orderIndex: index + 1,
        })),
      });
    }

    await fetchRoutes();
    isSaveRouteModalOpen.value = false;
    closeMapDrawMode();
  } finally {
    isSaving.value = false;
  }
};

// --- KRİZ (TRANSFER) MODALI ---
const isTransferModalOpen = ref(false);
const selectedRoute = ref(null);
const transferForm = ref({ driverId: '', vehicleId: '' });

const openTransferModal = (route) => {
  selectedRoute.value = route;
  transferForm.value = { driverId: route.driverId, vehicleId: route.vehicleId };
  isTransferModalOpen.value = true;
};

const closeTransferModal = () => {
  isTransferModalOpen.value = false;
  selectedRoute.value = null;
};

const confirmTransfer = async () => {
  if (!selectedRoute.value?.id) return;
  isSaving.value = true;
  try {
    await api.put(`/tenant/routes/${selectedRoute.value.id}`, {
      driverId: transferForm.value.driverId,
      vehicleId: transferForm.value.vehicleId,
      clientId: selectedRoute.value.clientId || null,
      monthlyRevenue: Number(selectedRoute.value.monthlyRevenue || 0),
    });
    await fetchRoutes();
    closeTransferModal();
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  loadAll();
});
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>