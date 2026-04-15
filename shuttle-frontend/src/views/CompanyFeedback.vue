<template>
  <div class="h-full flex flex-col p-2 sm:p-4 md:p-6 bg-slate-950 text-slate-300">
    
    <div class="flex-shrink-0 mb-6">
      <h1 class="text-3xl font-black text-white tracking-tight">Geri Bildirim Yönetimi</h1>
      <p class="text-slate-400 mt-1">Yolculardan gelen değerlendirmeleri yönetin ve araçlarınız için QR kod oluşturun.</p>
    </div>

    <div class="flex border-b border-slate-800 mb-6">
      <button @click="activeTab = 'feedbacks'" :class="['px-6 py-3 font-bold text-sm transition-all relative', activeTab === 'feedbacks' ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300']">
        Gelen Bildirimler
        <span v-if="activeTab === 'feedbacks'" class="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-t-full shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
      </button>
      <button @click="activeTab = 'qr'" :class="['px-6 py-3 font-bold text-sm transition-all relative', activeTab === 'qr' ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300']">
        QR Kod ve Link Oluşturucu
        <span v-if="activeTab === 'qr'" class="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-t-full shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
      </button>
    </div>

    <div v-if="activeTab === 'feedbacks'" class="flex-grow flex flex-col lg:flex-row gap-6 overflow-hidden">
      
      <div class="w-full lg:w-1/3 xl:w-1/4 flex-shrink-0">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6">
          <h2 class="text-lg font-bold text-white mb-6">Genel Memnuniyet</h2>
          <div class="flex items-center gap-4 mb-8">
            <div class="text-5xl font-black text-white">{{ averageRating }}</div>
            <div>
              <div class="flex text-orange-400 text-lg">
                <span v-for="n in 5" :key="`avg-${n}`" :class="n <= roundedAverage ? 'text-orange-400' : 'text-slate-600'">★</span>
              </div>
              <p class="text-xs text-slate-400 mt-1">{{ visibleFeedbacks.length }} Değerlendirme</p>
            </div>
          </div>
          <div class="mb-6">
            <label class="text-xs text-slate-400 font-semibold">Kaynak Filtresi</label>
            <select v-model="sourceFilter" @change="fetchFeedbacks" class="mt-2 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
              <option value="ALL">Tümü</option>
              <option value="EXTERNAL_QR">QR Bildirimleri</option>
              <option value="INTERNAL_APP">Uygulama Bildirimleri</option>
            </select>
          </div>
          <div class="space-y-3">
            <div v-for="star in [5,4,3,2,1]" :key="`dist-${star}`" class="flex items-center text-sm">
              <span class="w-4 font-bold text-slate-400">{{ star }}</span>
              <span class="text-orange-400 text-xs mr-2">★</span>
              <div class="flex-grow h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-orange-500" :style="{ width: `${distributionPercent(star)}%` }"></div>
              </div>
              <span class="w-8 text-right text-xs text-slate-500">{{ distributionPercent(star) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-grow bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
        <div v-if="loading" class="text-center text-slate-400 py-16">Yükleniyor...</div>
        <div v-else-if="visibleFeedbacks.length === 0" class="text-center text-slate-500 py-16">Bu filtrede geri bildirim bulunamadı.</div>
        <div v-for="feedback in visibleFeedbacks" :key="feedback.id" class="bg-slate-950 border border-slate-800 p-5 rounded-xl flex flex-col sm:flex-row gap-4 sm:items-start group hover:border-slate-700 transition-colors">
          
          <div class="flex-shrink-0">
            <span v-if="feedback.status === 'PENDING'" class="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Bekliyor</span>
            <span v-else class="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Çözüldü</span>
          </div>

          <div class="flex-grow min-w-0">
            <div class="flex items-center justify-between mb-1">
              <h3 class="font-bold text-white text-base font-mono">{{ feedback.vehicle?.plate || 'Araç Yok' }}</h3>
              <span class="text-xs text-slate-500">{{ formatDate(feedback.createdAt) }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-2 text-xs mb-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded border border-indigo-500/30 text-indigo-300 bg-indigo-500/10">{{ feedback.source }}</span>
              <span class="text-slate-500">Şoför: {{ feedback.driver?.name || 'Atanamadı' }}</span>
              <span v-if="feedback.rating" class="text-orange-400">{{ feedback.rating }} ★</span>
            </div>
            <p class="text-sm text-slate-300 leading-relaxed">{{ feedback.message }}</p>
            <p v-if="feedback.mediaUrl && feedback.mediaExpiresAt" class="text-xs mt-2" :class="remainingDays(feedback.mediaExpiresAt) <= 3 ? 'text-rose-400' : 'text-slate-500'">
              Medya silinmesine kalan süre: {{ remainingDays(feedback.mediaExpiresAt) }} gün
            </p>
          </div>

          <div class="flex-shrink-0 sm:ml-4 flex items-center mt-3 sm:mt-0 gap-2">
            <button v-if="feedback.mediaUrl" @click="openMedia(feedback.mediaUrl)" class="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 hover:border-sky-500 transition-all">
              Medyayı Gör
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'qr'" class="flex-grow bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center animate-fade-in text-center">
      <div class="w-24 h-24 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
        <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
      </div>
      <h2 class="text-2xl font-bold text-white mb-2">Araca Özel QR Kod Üretin</h2>
      <p class="text-slate-400 mb-8 max-w-md">Yolcularınızın sadece kamerayı okutarak servise kayıt olmasını sağlamak için araç seçin.</p>
      
      <div class="flex gap-4 w-full max-w-md">
        <select v-model="selectedVehicleId" class="flex-grow bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors">
          <option value="" disabled>Araç Seçiniz</option>
          <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.plate }} - {{ v.brand }} {{ v.model }}</option>
        </select>
        <button @click="generateQr" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95">Oluştur</button>
      </div>
      <p v-if="vehicleLoading" class="mt-3 text-xs text-slate-400">Araçlar yükleniyor...</p>
      <p v-else-if="vehicleError" class="mt-3 text-xs text-rose-400">{{ vehicleError }}</p>
      <p v-else-if="!vehicles.length" class="mt-3 text-xs text-slate-500">Listelenecek araç bulunamadı.</p>
      <div v-if="reportUrl" class="mt-8 bg-slate-950 border border-slate-800 rounded-xl p-4 w-full max-w-md">
        <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR" class="w-56 h-56 mx-auto rounded-lg bg-white p-2" />
        <p class="text-xs text-slate-400 break-all mt-3">{{ reportUrl }}</p>
        <button @click="downloadQr" class="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg border border-slate-700">PNG İndir</button>
      </div>
    </div>

    <div v-if="mediaModal.open" class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" @click.self="closeMedia">
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl p-4">
        <div class="flex justify-end">
          <button @click="closeMedia" class="text-slate-400 hover:text-white">Kapat</button>
        </div>
        <img v-if="!isVideo(mediaModal.url)" :src="mediaModal.url" class="w-full max-h-[70vh] object-contain rounded-lg" alt="Feedback media" />
        <video v-else :src="mediaModal.url" controls class="w-full max-h-[70vh] rounded-lg"></video>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import QRCode from 'qrcode';
import api from '../services/api';

const activeTab = ref('feedbacks'); // 'feedbacks' or 'qr'
const feedbacks = ref([]);
const vehicles = ref([]);
const loading = ref(false);
const vehicleLoading = ref(false);
const vehicleError = ref('');
const sourceFilter = ref('ALL');
const selectedVehicleId = ref('');
const reportUrl = ref('');
const qrDataUrl = ref('');
const mediaModal = ref({ open: false, url: '' });

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const backendOrigin = apiBase.replace(/\/api\/v1\/?$/, '');

const roundedAverage = computed(() => {
  const rated = visibleFeedbacks.value.filter((item) => item.rating);
  if (!rated.length) return 0;
  const avg = rated.reduce((sum, item) => sum + Number(item.rating), 0) / rated.length;
  return Math.round(avg);
});

const averageRating = computed(() => {
  const rated = visibleFeedbacks.value.filter((item) => item.rating);
  if (!rated.length) return '0.0';
  const avg = rated.reduce((sum, item) => sum + Number(item.rating), 0) / rated.length;
  return avg.toFixed(1);
});

const visibleFeedbacks = computed(() => {
  if (sourceFilter.value === 'ALL') return feedbacks.value;
  return feedbacks.value.filter((item) => String(item.source || '').trim().toUpperCase() === sourceFilter.value);
});

function distributionPercent(star) {
  const rated = visibleFeedbacks.value.filter((item) => item.rating);
  if (!rated.length) return 0;
  const count = rated.filter((item) => Number(item.rating) === star).length;
  return Math.round((count / rated.length) * 100);
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleString('tr-TR');
}

function remainingDays(value) {
  if (!value) return 0;
  const now = Date.now();
  const expire = new Date(value).getTime();
  return Math.max(0, Math.ceil((expire - now) / (24 * 60 * 60 * 1000)));
}

function mediaAbsoluteUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${backendOrigin}${url}`;
}

function isVideo(url) {
  return /\.(mp4|mov|webm|ogg|m4v)$/i.test(url || '');
}

function openMedia(url) {
  mediaModal.value = { open: true, url: mediaAbsoluteUrl(url) };
}

function closeMedia() {
  mediaModal.value = { open: false, url: '' };
}

async function fetchFeedbacks() {
  loading.value = true;
  try {
    const params = {};
    if (sourceFilter.value !== 'ALL') params.source = sourceFilter.value;
    const res = await api.get('/tenant/feedbacks', { params });
    feedbacks.value = res?.data?.data || [];
  } finally {
    loading.value = false;
  }
}

async function fetchVehicles() {
  vehicleLoading.value = true;
  vehicleError.value = '';
  try {
    const res = await api.get('/tenant/vehicles');
    const list = res?.data?.data ?? res?.data ?? [];
    vehicles.value = Array.isArray(list) ? list : [];
  } catch (err) {
    vehicles.value = [];
    vehicleError.value = err?.response?.data?.message || 'Araç listesi alınamadı';
  } finally {
    vehicleLoading.value = false;
  }
}

async function generateQr() {
  const selected = vehicles.value.find((item) => item.id === selectedVehicleId.value);
  if (!selected || !selected.publicQrToken) return;
  reportUrl.value = `${window.location.origin}/report/${selected.publicQrToken}`;
  qrDataUrl.value = await QRCode.toDataURL(reportUrl.value, {
    width: 1024,
    margin: 1,
  });
}

function downloadQr() {
  if (!qrDataUrl.value) return;
  const selected = vehicles.value.find((item) => item.id === selectedVehicleId.value);
  const plate = selected?.plate || 'arac';
  const a = document.createElement('a');
  a.href = qrDataUrl.value;
  a.download = `${plate}-feedback-qr.png`;
  a.click();
}

onMounted(async () => {
  await fetchVehicles();
  await fetchFeedbacks();
});

watch(activeTab, async (tab) => {
  if (tab === 'qr' && vehicles.value.length === 0 && !vehicleLoading.value) {
    await fetchVehicles();
  }
});
</script>

<style>
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>