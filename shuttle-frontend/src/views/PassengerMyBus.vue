<template>
  <div class="relative min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-200 font-sans pb-24 overflow-hidden">
    
    <div class="p-6 pt-8 animate-fade-in">
      <h1 class="text-3xl font-black text-white tracking-tight mb-1">Servislerim</h1>
      <p class="text-sm text-slate-400">Servisim Geliyor ile kayıtlı servislerinizi ve araç bilgilerinizi kolayca yönetin.</p>
    </div>

    <div class="px-6 space-y-4 animate-fade-in">
      <div v-if="myServices.length === 0" class="text-center py-10 bg-slate-900/50 rounded-3xl border border-slate-800">
        <div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg class="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <p class="text-slate-400">Henüz bir servise kayıtlı değilsiniz.</p>
      </div>

      <div 
        v-for="service in myServices" 
        :key="service.id"
        @click="goToLiveMap(service.id)" 
        class="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative group flex items-center gap-4 hover:bg-slate-800/50 transition-colors cursor-pointer active:scale-[0.98]"
      >
        <button @click.stop="promptDelete(service)" class="absolute top-4 right-4 text-slate-500 hover:text-rose-500 transition-colors p-1.5 rounded-lg active:scale-90 bg-slate-800/50 z-10">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>

        <div class="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-500/20">
           <svg class="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4M4 17h16" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h1m5-10V5a3 3 0 013-3h4a3 3 0 013 3v1h1v6h-1m-10 4h4m-4 0h-1m10 0h-1" /></svg>
        </div>

        <div class="flex-1 min-w-0 pr-8">
          <h2 class="text-base font-bold text-white truncate">{{ service.name }}</h2>
          <div class="text-xs text-slate-400 mt-1 space-y-0.5">
            <p>Plaka: <span class="font-mono text-indigo-300 font-bold">{{ service.plate }}</span></p>
            <p>Şoför: <span class="text-slate-300">{{ service.driver }}</span></p>
          </div>
        </div>
      </div>
    </div>

    <div class="px-6 mt-6">
      <button @click="openAddModal" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Yeni Servise Katıl
      </button>
    </div>

    <div v-if="showAddModal" class="fixed inset-0 z-[2000] flex items-end justify-center">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" @click="closeAddModal"></div>
      
      <div class="relative w-full max-w-md bg-slate-900 rounded-t-[2.5rem] border-t border-slate-700 p-6 pt-4 animate-slide-up shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
        
        <div class="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-6"></div>

        <h3 class="text-2xl font-black text-white mb-1 text-center">Servise Katıl</h3>
        <p class="text-xs text-slate-400 text-center mb-6">Servisim Geliyor üzerinden QR kod okutun veya manuel servis kodunu girin.</p>

        <div class="flex bg-slate-950 p-1.5 rounded-2xl mb-6 border border-slate-800">
          <button @click="addMethod = 'manual'" :class="addMethod === 'manual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'" class="flex-1 py-3 rounded-xl text-sm font-bold transition-all">
            Manuel Kod Gir
          </button>
          <button @click="addMethod = 'qr'" :class="addMethod === 'qr' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'" class="flex-1 py-3 rounded-xl text-sm font-bold transition-all">
            Karekod Okut
          </button>
        </div>

        <div v-if="addMethod === 'manual'" class="space-y-4 pb-4 animate-fade-in">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Servis Plakası</label>
            <input v-model="newPlate" type="text" placeholder="Örn: 27 ABC 123" class="w-full bg-slate-950 border border-slate-700 text-white text-lg rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors uppercase" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Servis Kodu</label>
            <input v-model="newCode" type="text" placeholder="Şoförün verdiği 6 haneli kod" class="w-full bg-slate-950 border border-slate-700 text-white text-lg rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors tracking-widest font-mono" />
          </div>
          <button @click="joinService" :disabled="!newPlate || !newCode" :class="(!newPlate || !newCode) ? 'opacity-50 cursor-not-allowed bg-slate-800' : 'bg-indigo-600 shadow-lg shadow-indigo-600/30 hover:bg-indigo-500'" class="w-full text-white font-bold text-lg py-4 rounded-2xl transition-all active:scale-95 mt-2">
            Katıl
          </button>
        </div>

        <div v-if="addMethod === 'qr'" class="flex flex-col items-center pb-4 animate-fade-in">
          <div class="relative w-64 h-64 bg-slate-950 rounded-3xl border-2 border-dashed border-indigo-500/50 flex items-center justify-center overflow-hidden shadow-inner">
            <svg class="w-16 h-16 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            
            <div class="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
            <div class="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl"></div>
            <div class="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl"></div>
            <div class="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>

            <div class="absolute left-0 w-full h-[2px] bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,1)] animate-scan-line"></div>
          </div>
          <p class="text-xs text-indigo-400 mt-6 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
            Kamera izni bekleniyor...
          </p>
        </div>

      </div>
    </div>

    <div v-if="showDeleteModal" class="fixed inset-0 z-[3000] flex items-center justify-center p-6 backdrop-blur-sm">
      <div class="absolute inset-0 bg-black/80" @click="showDeleteModal = false"></div>
      <div class="relative w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700 p-8 text-center shadow-2xl animate-fade-in">
        <div class="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </div>
        <h2 class="text-2xl font-black text-white mb-2 tracking-tight">Servisten Çık?</h2>
        <p class="text-slate-400 mb-8 font-medium text-sm">
          <strong class="text-white">{{ serviceToDelete?.name }}</strong> servisinden çıkmak istediğinize emin misiniz?
        </p>
        <div class="flex flex-col gap-3">
          <button @click="confirmDelete" class="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-lg shadow-lg shadow-rose-600/30 transition-all active:scale-95">
            Evet, Servisten Çık
          </button>
          <button @click="showDeleteModal = false" class="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl border border-slate-700 transition-all active:scale-95">
            İptal
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// --- Router ---
const router = useRouter();

// --- State ---
const myServices = ref([
  { id: 1, name: 'Sabah Vardiyası - İbrahimli', plate: '27 GRS 01', driver: 'Ahmet Yılmaz' },
  { id: 2, name: 'Akşam Vardiyası - Karataş', plate: '34 XYZ 78', driver: 'Ayşe Kaya' }
]);

// Ekleme Modalı State
const showAddModal = ref(false);
const addMethod = ref('manual'); // 'manual' veya 'qr'
const newPlate = ref('');
const newCode = ref('');

// Silme Modalı State
const showDeleteModal = ref(false);
const serviceToDelete = ref(null);

// --- Fonksiyonlar ---

const goToLiveMap = (routeId) => {
  router.push({ path: '/passenger/dashboard/' + routeId });
};

// Yeni Servis Modalı Açma/Kapatma
const openAddModal = () => {
  addMethod.value = 'manual'; // Her açılışta manuele dönsün
  newPlate.value = '';
  newCode.value = '';
  showAddModal.value = true;
};

const closeAddModal = () => {
  showAddModal.value = false;
};

// Servise Katılma (Mock)
const joinService = () => {
  if (newPlate.value && newCode.value) {
    myServices.value.push({
      id: Date.now(),
      name: 'Yeni Eklenen Servis',
      plate: newPlate.value.toUpperCase(),
      driver: 'Yeni Şoför'
    });
    // Başarılı olunca popup'ı kapat
    closeAddModal();
  }
};

// Silme İşlemleri
const promptDelete = (service) => {
  serviceToDelete.value = service;
  showDeleteModal.value = true;
};

const confirmDelete = () => {
  if (serviceToDelete.value) {
    myServices.value = myServices.value.filter(s => s.id !== serviceToDelete.value.id);
  }
  showDeleteModal.value = false;
  serviceToDelete.value = null;
};
</script>

<style>
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
.animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

@keyframes fadeIn { 
  from { opacity: 0; } 
  to { opacity: 1; } 
}
@keyframes slideUp { 
  from { opacity: 0; transform: translateY(100%); } 
  to { opacity: 1; transform: translateY(0); } 
}

/* Lazer Animasyonu */
.animate-scan-line {
  animation: scan 2s linear infinite;
}
@keyframes scan {
  0% { top: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
</style>