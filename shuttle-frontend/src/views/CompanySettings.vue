<template>
  <div class="flex flex-col p-2 sm:p-4 md:p-6 pb-24 bg-slate-950 text-slate-300">
    <div class="flex-shrink-0 mb-6">
      <h1 class="text-3xl font-black text-white tracking-tight">Firma Ayarları</h1>
      <p class="text-slate-400 mt-1">İşletme profilinizi, kural ayarlarınızı ve sanal çit bölgelerini yönetin.</p>
    </div>

    <div class="mb-6 border-b border-slate-800">
      <nav class="flex gap-2">
        <button @click="activeTab = 'company'" :class="tabClass(activeTab === 'company')">İşletme Bilgileri</button>
        <button @click="activeTab = 'rules'" :class="tabClass(activeTab === 'rules')">Kural ve İhlaller</button>
        <button @click="activeTab = 'geofence'" :class="tabClass(activeTab === 'geofence')">Sanal Çit Bölgeleri</button>
      </nav>
    </div>

    <div v-if="activeTab === 'company'" class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
        <h2 class="text-xl font-bold text-white mb-5">İşletme Bilgileri</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Firma Unvanı</label>
            <input type="text" v-model="company.name" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vergi Dairesi ve No</label>
            <input type="text" v-model="company.tax" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Merkez Adres</label>
            <textarea v-model="company.address" rows="3" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors resize-none"></textarea>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">İletişim E-Posta</label>
            <input type="email" v-model="company.email" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Telefon</label>
            <input type="text" v-model="company.phone" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors" />
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 class="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <svg class="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            Bildirimler
          </h2>
          <div class="space-y-4">
            <label class="flex items-center justify-between cursor-pointer group">
              <div>
                <p class="font-bold text-slate-200 group-hover:text-white transition-colors">Hız İhlali SMS'i</p>
                <p class="text-xs text-slate-500">Şoför hız yaparsa amire SMS gider.</p>
              </div>
              <div class="relative">
                <input type="checkbox" v-model="settings.speedSms" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </div>
            </label>
            <div class="h-px bg-slate-800 w-full"></div>
            <label class="flex items-center justify-between cursor-pointer group">
              <div>
                <p class="font-bold text-slate-200 group-hover:text-white transition-colors">Rölanti E-Postası</p>
                <p class="text-xs text-slate-500">Yakıt israfı uyarılarını mail al.</p>
              </div>
              <div class="relative">
                <input type="checkbox" v-model="settings.idleEmail" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </div>
            </label>
            <div class="h-px bg-slate-800 w-full"></div>
            <label class="flex items-center justify-between cursor-pointer group">
              <div>
                <p class="font-bold text-slate-200 group-hover:text-white transition-colors">Yolcu Şikayetleri</p>
                <p class="text-xs text-slate-500">Yeni geri bildirimde uyar.</p>
              </div>
              <div class="relative">
                <input type="checkbox" v-model="settings.feedbackAlert" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </div>
            </label>
          </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 class="text-xl font-bold text-white mb-4 flex items-center justify-between">
            <span class="flex items-center gap-2">Yöneticiler</span>
            <button class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors">Davet Et</button>
          </h2>
          <div class="space-y-3">
            <div v-for="user in subUsers" :key="user.id" class="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                  {{ user.initials }}
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-200">{{ user.name }}</p>
                  <p class="text-[10px] text-slate-500">{{ user.role }}</p>
                </div>
              </div>
              <button class="text-slate-500 hover:text-rose-400 transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'rules'" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-4xl">
      <h2 class="text-xl font-bold text-white mb-5">Kural ve İhlal Ayarları</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label class="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
          <span>Hız İhlali</span><input type="checkbox" v-model="alertSettings.enableSpeeding" class="h-4 w-4" />
        </label>
        <label class="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
          <span>Rölanti İhlali</span><input type="checkbox" v-model="alertSettings.enableIdling" class="h-4 w-4" />
        </label>
        <label class="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
          <span>Sanal Çit Kuralı</span><input type="checkbox" v-model="alertSettings.enableGeofence" class="h-4 w-4" />
        </label>
        <label class="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
          <span>Mesai Dışı Kullanım</span><input type="checkbox" v-model="alertSettings.enableShiftControl" class="h-4 w-4" />
        </label>
        <label class="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
          <span>Cihaz Sinyali Kesildi</span><input type="checkbox" v-model="alertSettings.enableOffline" class="h-4 w-4" />
        </label>
        <label class="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
          <span>Enerji Kesintisi</span><input type="checkbox" v-model="alertSettings.enablePowerCut" class="h-4 w-4" />
        </label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div>
          <label class="block text-xs text-slate-500 mb-2">Hız Limiti (km/h)</label>
          <input type="number" v-model.number="alertSettings.speedLimit" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3" />
        </div>
        <div>
          <label class="block text-xs text-slate-500 mb-2">Rölanti Limiti (dk)</label>
          <input type="number" v-model.number="alertSettings.idlingLimit" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3" />
        </div>
      </div>

      <button @click="saveAlertSettings" class="mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl">
        Kural Ayarlarını Kaydet
      </button>
    </div>

    <div v-if="activeTab === 'geofence'" class="space-y-5 max-w-5xl">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 class="text-xl font-bold text-white mb-4">Yeni Sanal Çit Bölgesi</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input v-model="newGeofence.name" placeholder="Bölge adı" class="bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5" />
          <input v-model.number="newGeofence.centerLat" type="number" step="0.000001" placeholder="Merkez Lat" class="bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5" />
          <input v-model.number="newGeofence.centerLng" type="number" step="0.000001" placeholder="Merkez Lng" class="bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5" />
          <input v-model.number="newGeofence.radiusKm" type="number" min="1" placeholder="Yarıçap (km)" class="bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5" />
        </div>
        <button @click="createGeofence" class="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl">
          Bölge Ekle
        </button>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 class="text-lg font-bold text-white mb-3">Tanımlı Bölgeler</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="text-slate-500">
              <tr>
                <th class="text-left py-2">Ad</th><th class="text-left py-2">Merkez</th><th class="text-left py-2">Yarıçap</th><th class="text-right py-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="g in geofences" :key="g.id" class="border-t border-slate-800">
                <td class="py-3 text-white">{{ g.name }}</td>
                <td class="py-3 text-slate-400">{{ g.centerLat }}, {{ g.centerLng }}</td>
                <td class="py-3 text-slate-400">{{ g.radiusKm }} km</td>
                <td class="py-3 text-right"><button @click="removeGeofence(g.id)" class="text-rose-400 hover:text-rose-300">Sil</button></td>
              </tr>
              <tr v-if="!geofences.length">
                <td colspan="4" class="py-6 text-center text-slate-500">Henüz sanal çit tanımlanmadı.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 lg:left-64 right-0 p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-40 flex justify-end">
      <button class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-95 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        Değişiklikleri Kaydet
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api from '../services/api';

const activeTab = ref('company');

const company = ref({
  name: 'ABC Lojistik ve Turizm A.Ş.',
  tax: 'Şahinbey VD - 1234567890',
  address: 'Mücahitler Mah. Ali Fuat Cebesoy Blv. No:45 Şehitkamil/Gaziantep',
  email: 'operasyon@abclojistik.com',
  phone: '+90 342 555 12 34'
});

const settings = ref({
  speedSms: true,
  idleEmail: false,
  feedbackAlert: true
});

const alertSettings = reactive({
  enableIgnitionOn: false,
  enableSpeeding: false,
  enableIdling: false,
  enableGeofence: false,
  enableGeofence_Master: false,
  enableOffline: false,
  enablePowerCut: false,
  speedLimit: 90,
  idlingLimit: 10,
  enableShiftControl: false,
});

const geofences = ref([]);
const newGeofence = reactive({
  name: '',
  centerLat: null,
  centerLng: null,
  radiusKm: 5,
});

const subUsers = ref([
  { id: 1, name: 'Onur Sayın', initials: 'OS', role: 'Operasyon Müdürü (Admin)' },
  { id: 2, name: 'Ahmet Yılmaz', initials: 'AY', role: 'Vardiya Amiri' }
]);

function tabClass(active) {
  return [
    'px-4 py-2.5 rounded-t-xl text-sm font-semibold border border-b-0 transition-colors',
    active
      ? 'bg-slate-900 border-slate-700 text-white'
      : 'bg-slate-950 border-transparent text-slate-400 hover:text-slate-200',
  ];
}

async function fetchAlertSettings() {
  try {
    const res = await api.get('/tenant/settings/alerts');
    const data = res.data?.data ?? res.data ?? {};
    Object.assign(alertSettings, data);
  } catch (e) {
    console.warn('Ayarlar alınamadı:', e.message);
  }
}

async function saveAlertSettings() {
  await api.put('/tenant/settings/alerts', {
    ...alertSettings,
    enableGeofence_Master: alertSettings.enableGeofence_Master || alertSettings.enableGeofence,
  });
}

async function fetchGeofences() {
  try {
    const res = await api.get('/tenant/settings/geofences');
    geofences.value = res.data?.data ?? res.data ?? [];
  } catch (e) {
    console.warn('Geofence listesi alınamadı:', e.message);
  }
}

async function createGeofence() {
  if (!newGeofence.name || newGeofence.centerLat === null || newGeofence.centerLng === null || !newGeofence.radiusKm) return;
  await api.post('/tenant/settings/geofences', { ...newGeofence });
  newGeofence.name = '';
  newGeofence.centerLat = null;
  newGeofence.centerLng = null;
  newGeofence.radiusKm = 5;
  await fetchGeofences();
}

async function removeGeofence(id) {
  await api.delete(`/tenant/settings/geofences/${id}`);
  await fetchGeofences();
}

onMounted(async () => {
  await Promise.all([fetchAlertSettings(), fetchGeofences()]);
});
</script>