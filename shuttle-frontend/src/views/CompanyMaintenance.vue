<template>
  <div class="h-full flex flex-col p-2 sm:p-4 md:p-6 bg-slate-950 text-slate-300 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
    <div class="flex-shrink-0 mb-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Bakım ve Evrak Takibi</h1>
          <p class="text-slate-400 mt-1 text-sm">Filodaki araçların sigorta, muayene ve periyodik bakımlarını yönetin.</p>
        </div>
        <button @click="openCreateModal" class="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center justify-center gap-2">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Yeni Kayıt Ekle
        </button>
      </div>

      <div class="mt-4 border-b border-slate-800">
        <nav class="flex gap-2">
          <button @click="activeTab = 'tracking'" :class="tabClass(activeTab === 'tracking')">Evrak ve Bakım Takibi</button>
          <button @click="activeTab = 'incoming'" :class="tabClass(activeTab === 'incoming')">Gelen Evraklar</button>
        </nav>
      </div>
    </div>

    <template v-if="activeTab === 'tracking'">
    <div v-if="isLoading" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 mb-6">
      Kayıtlar yükleniyor...
    </div>

    <div v-else-if="loadError" class="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-rose-200 text-sm mb-6">
      {{ loadError }}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-6 mb-6">
      
      <div class="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 shadow-[0_0_15px_rgba(225,29,72,0.1)] flex items-center justify-between relative overflow-hidden group">
        <div class="relative z-10">
          <p class="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">Gecikmiş / Biten</p>
          <div class="flex items-end gap-2">
            <p class="text-3xl font-black text-white">{{ summary.expired }}</p>
            <p class="text-xs text-slate-400 mb-1">Kritik evrak/bakım</p>
          </div>
        </div>
        <div class="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/50 shrink-0">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
      </div>

      <div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-[0_0_15px_rgba(245,158,11,0.1)] flex items-center justify-between relative overflow-hidden group">
        <div class="relative z-10">
          <p class="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Yaklaşanlar (&lt; 30 Gün)</p>
          <div class="flex items-end gap-2">
            <p class="text-3xl font-black text-white">{{ summary.approaching }}</p>
            <p class="text-xs text-slate-400 mb-1">İşlem bekliyor</p>
          </div>
        </div>
        <div class="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/50 shrink-0">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>

      <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center justify-between relative overflow-hidden group">
        <div class="relative z-10">
          <p class="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Geçerli Evraklar</p>
          <div class="flex items-end gap-2">
            <p class="text-3xl font-black text-white">{{ summary.valid }}</p>
            <p class="text-xs text-slate-400 mb-1">Sistemdeki kayıt</p>
          </div>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/50 shrink-0">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>

    </div>

    <div class="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div class="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 justify-between bg-slate-800/20">
        <div class="flex gap-2">
          <select v-model="selectedRecordType" class="bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
            <option value="">Tüm Kayıt Tipleri</option>
            <option v-for="type in selectableTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
          </select>
          <select v-model="selectedStatus" class="bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
            <option value="">Tüm Durumlar</option>
            <option value="Gecikmiş">Gecikmiş</option>
            <option value="Yaklaşıyor">Yaklaşıyor</option>
            <option value="Geçerli">Geçerli</option>
          </select>
        </div>
        <div class="relative">
          <input v-model="searchPlate" type="text" placeholder="Plaka ara..." class="w-full sm:w-64 bg-slate-950 border border-slate-700 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
          <svg class="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <div class="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <table class="w-full min-w-[850px] text-sm text-left">
          <thead class="bg-slate-800/50">
            <tr>
              <th scope="col" class="py-4 pl-6 pr-3 font-bold text-slate-400 uppercase tracking-wider text-xs">Plaka & Araç</th>
              <th scope="col" class="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Kayıt / Evrak Tipi</th>
              <th scope="col" class="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Son Geçerlilik</th>
              <th scope="col" class="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Kalan Süre</th>
              <th scope="col" class="px-4 py-4 text-center font-bold text-slate-400 uppercase tracking-wider text-xs">Durum</th>
              <th scope="col" class="py-4 pl-3 pr-6 text-right font-bold text-slate-400 uppercase tracking-wider text-xs">İşlem</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/50">
            <tr v-if="filteredTrackingRecords.length === 0">
              <td colspan="6" class="py-10 text-center text-slate-500">Kayıt bulunamadı.</td>
            </tr>
            <tr v-for="record in filteredTrackingRecords" :key="record.id" class="hover:bg-slate-800/40 transition-colors group">
              
              <td class="py-4 pl-6 pr-3 whitespace-nowrap">
                <div class="font-mono font-bold text-white text-base">{{ record.plate }}</div>
                <div class="text-xs text-slate-500">{{ record.model }}</div>
              </td>
              
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <div class="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                    <svg v-if="record.recordType === 'TRAFIK_SIGORTASI' || record.recordType === 'KASKO' || record.recordType === 'MUAYENE'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                  </div>
                  <span class="font-medium text-slate-200">{{ record.typeLabel }}</span>
                </div>
              </td>
              
              <td class="px-4 py-4 whitespace-nowrap text-slate-300">
                {{ record.expiryDateText }}
              </td>

              <td class="px-4 py-4 whitespace-nowrap">
                <span :class="['font-bold', record.status === 'Gecikmiş' ? 'text-rose-400' : record.status === 'Yaklaşıyor' ? 'text-amber-400' : 'text-slate-400']">
                  {{ record.remainingText }}
                </span>
              </td>

              <td class="px-4 py-4 text-center whitespace-nowrap">
                <span v-if="record.status === 'Gecikmiş'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> GECİKMİŞ
                </span>
                <span v-else-if="record.status === 'Yaklaşıyor'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> YAKLAŞIYOR
                </span>
                <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> GEÇERLİ
                </span>
              </td>

              <td class="py-4 pl-3 pr-6 text-right whitespace-nowrap">
                <a v-if="record.fileUrl" :href="fileDownloadUrl(record.fileUrl)" target="_blank" class="text-orange-400 hover:text-white font-medium text-sm transition-colors bg-orange-500/10 hover:bg-orange-500 px-4 py-1.5 rounded-lg border border-orange-500/20 hover:border-orange-500">
                  İndir
                </a>
                <span v-else class="text-slate-500 text-sm">Dosya Yok</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    </template>

    <template v-else>
      <div class="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div class="p-4 border-b border-slate-800 bg-slate-800/20 flex items-center justify-between">
          <p class="text-sm text-slate-300 font-semibold">Şoförlerden Gelen Evraklar (Fiş/Gider)</p>
          <button @click="downloadAllIncoming" :disabled="isSaving" class="bg-indigo-500/20 hover:bg-indigo-500 text-indigo-200 hover:text-white border border-indigo-500/30 px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50">
            Toplu İndir
          </button>
        </div>
        <div class="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table class="w-full min-w-[850px] text-sm text-left">
            <thead class="bg-slate-800/50">
              <tr>
                <th class="py-4 pl-6 pr-3 font-bold text-slate-400 uppercase tracking-wider text-xs">Araç (Plaka)</th>
                <th class="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Şoför</th>
                <th class="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Evrak Tipi</th>
                <th class="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Tarih</th>
                <th class="py-4 pl-3 pr-6 text-right font-bold text-slate-400 uppercase tracking-wider text-xs">Aksiyon</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/50">
              <tr v-if="incomingRecords.length === 0">
                <td colspan="5" class="py-10 text-center text-slate-500">Gelen evrak bulunamadı.</td>
              </tr>
              <tr v-for="record in incomingRecords" :key="record.id" class="hover:bg-slate-800/40 transition-colors">
                <td class="py-4 pl-6 pr-3 font-mono text-white">{{ record.plate }}</td>
                <td class="px-4 py-4 text-slate-300">{{ record.driverName }}</td>
                <td class="px-4 py-4 text-slate-300">{{ record.typeLabel }}</td>
                <td class="px-4 py-4 text-slate-400">{{ record.createdAtText }}</td>
                <td class="py-4 pl-3 pr-6 text-right">
                  <a v-if="record.fileUrl" :href="fileDownloadUrl(record.fileUrl)" target="_blank" class="text-cyan-400 hover:text-white font-medium text-sm transition-colors bg-cyan-500/10 hover:bg-cyan-500 px-4 py-1.5 rounded-lg border border-cyan-500/20 hover:border-cyan-500">İndir</a>
                  <span v-else class="text-slate-500 text-sm">Dosya Yok</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <Teleport to="body">
      <div v-if="isCreateModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" @click.self="closeCreateModal">
        <div class="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 class="text-lg font-bold text-white">Yeni Kayıt Ekle</h3>
            <button @click="closeCreateModal" class="text-slate-400 hover:text-white">✕</button>
          </div>

          <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Araç</label>
              <select v-model="createForm.vehicleId" :disabled="isVehicleLoading" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 disabled:opacity-60">
                <option value="">Araç Seçiniz</option>
                <option v-for="vehicle in vehicleOptions" :key="vehicle.id" :value="vehicle.id">{{ vehicle.plate }}</option>
              </select>
              <p v-if="isVehicleLoading" class="text-[11px] text-slate-500 mt-2">Araçlar yükleniyor...</p>
              <p v-else-if="vehicleLoadError" class="text-[11px] text-rose-400 mt-2">{{ vehicleLoadError }}</p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kayıt Tipi</label>
              <select v-model="createForm.recordType" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3">
                <option value="">Tip Seçiniz</option>
                <option v-for="type in recordTypeOptions" :key="type.value" :value="type.value">{{ type.label }}</option>
              </select>
            </div>

            <div v-if="showExpiryField" class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bitiş Tarihi</label>
              <input v-model="createForm.expiryDate" type="date" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3" />
            </div>

            <template v-if="showMaintenanceFields">
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mevcut KM</label>
                <input v-model.number="createForm.currentKm" type="number" min="0" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sonraki Bakım KM</label>
                <input v-model.number="createForm.nextMaintenanceKm" @input="nextKmManuallyEdited = true" type="number" min="0" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3" />
              </div>
            </template>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dosya <span class="text-rose-400">*</span></label>
              <input type="file" accept=".pdf,image/*" @change="onFileChange" required class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5" />
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Açıklama</label>
              <textarea v-model="createForm.description" rows="3" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 resize-none"></textarea>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">
            <button @click="closeCreateModal" class="px-4 py-2 rounded-lg text-slate-400 hover:text-white">İptal</button>
            <button @click="submitRecord" :disabled="isSaving" class="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-60">
              {{ isSaving ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-2">
      <div v-if="toastMessage" class="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-sm font-medium text-emerald-400 shadow-lg backdrop-blur-sm">
        {{ toastMessage }}
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import api from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

const activeTab = ref('tracking');
const isLoading = ref(false);
const isSaving = ref(false);
const isVehicleLoading = ref(false);
const loadError = ref('');
const vehicleLoadError = ref('');
const toastMessage = ref('');

const records = ref([]);
const vehicles = ref([]);

const selectedRecordType = ref('');
const selectedStatus = ref('');
const searchPlate = ref('');

const isCreateModalOpen = ref(false);
const uploadFile = ref(null);
const nextKmManuallyEdited = ref(false);

const recordTypeOptions = [
  { value: 'TRAFIK_SIGORTASI', label: 'Trafik Sigortası' },
  { value: 'KASKO', label: 'Kasko' },
  { value: 'MUAYENE', label: 'Araç Muayenesi' },
  { value: 'PERIYODIK_BAKIM', label: 'Periyodik Bakım' },
  { value: 'GIDER_FISI', label: 'Gider/Fiş' },
  { value: 'DIGER', label: 'Diğer' },
];

const selectableTypes = recordTypeOptions;

const createForm = reactive({
  vehicleId: '',
  recordType: '',
  expiryDate: '',
  currentKm: null,
  nextMaintenanceKm: null,
  description: '',
});

const typeLabelMap = recordTypeOptions.reduce((acc, item) => ({ ...acc, [item.value]: item.label }), {});

function tabClass(active) {
  return [
    'px-4 py-2.5 rounded-t-xl text-sm font-semibold border border-b-0 transition-colors',
    active
      ? 'bg-slate-900 border-slate-700 text-white'
      : 'bg-slate-950 border-transparent text-slate-400 hover:text-slate-200',
  ];
}

const showExpiryField = computed(() => ['TRAFIK_SIGORTASI', 'KASKO', 'MUAYENE'].includes(createForm.recordType));
const showMaintenanceFields = computed(() => createForm.recordType === 'PERIYODIK_BAKIM');

const vehicleOptions = computed(() => {
  if (vehicles.value.length) return vehicles.value;

  const fallbackMap = new Map();
  for (const record of records.value) {
    const vehicle = record?.vehicle;
    if (vehicle?.id && vehicle?.plate && !fallbackMap.has(vehicle.id)) {
      fallbackMap.set(vehicle.id, {
        id: vehicle.id,
        plate: vehicle.plate,
      });
    }
  }
  return Array.from(fallbackMap.values());
});

const normalizedRecords = computed(() => records.value.map((item) => {
  const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / 86_400_000) : null;

  let status = 'Geçerli';
  if (daysLeft !== null) {
    if (daysLeft < 0) status = 'Gecikmiş';
    else if (daysLeft <= 30) status = 'Yaklaşıyor';
  }

  const plate = item.vehicle?.plate || '-';
  const model = [item.vehicle?.brand, item.vehicle?.model].filter(Boolean).join(' ') || '-';

  return {
    ...item,
    plate,
    model,
    daysLeft,
    status,
    recordType: item.recordType,
    typeLabel: typeLabelMap[item.recordType] || item.recordType,
    expiryDateText: expiryDate ? formatDate(expiryDate) : '-',
    createdAtText: formatDate(item.createdAt),
    remainingText: daysLeft === null
      ? (item.recordType === 'PERIYODIK_BAKIM' && item.currentKm && item.nextMaintenanceKm
          ? `${Math.max(item.nextMaintenanceKm - item.currentKm, 0)} KM Kaldı`
          : 'Takip Yok')
      : (daysLeft < 0 ? `${Math.abs(daysLeft)} Gün Gecikti` : `${daysLeft} Gün Kaldı`),
    driverName: item.driver?.name || '-',
  };
}));

const trackingRecords = computed(() => normalizedRecords.value.filter((item) => item.recordType !== 'GIDER_FISI'));

const filteredTrackingRecords = computed(() => {
  return trackingRecords.value.filter((item) => {
    const typeMatch = !selectedRecordType.value || item.recordType === selectedRecordType.value;
    const statusMatch = !selectedStatus.value || item.status === selectedStatus.value;
    const plateMatch = !searchPlate.value || item.plate.toLowerCase().includes(searchPlate.value.toLowerCase());
    return typeMatch && statusMatch && plateMatch;
  });
});

const summary = computed(() => {
  let expired = 0;
  let approaching = 0;
  let valid = 0;

  trackingRecords.value.forEach((item) => {
    if (item.status === 'Gecikmiş') expired += 1;
    else if (item.status === 'Yaklaşıyor') approaching += 1;
    else valid += 1;
  });

  return { expired, approaching, valid };
});

const incomingRecords = computed(() => normalizedRecords.value
  .filter((item) => ['GIDER_FISI', 'DIGER'].includes(item.recordType) && item.driverId)
  .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()));

function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function fileDownloadUrl(fileUrl) {
  if (!fileUrl) return '#';
  if (fileUrl.startsWith('http')) return fileUrl;
  return `${API_BASE}${fileUrl}`;
}

async function fetchRecords() {
  const response = await api.get('/tenant/vehicle-records');
  records.value = response.data?.data ?? response.data ?? [];
}

async function fetchVehicles() {
  isVehicleLoading.value = true;
  vehicleLoadError.value = '';
  try {
    const response = await api.get('/tenant/vehicles');
    const list = response.data?.data ?? response.data ?? [];
    vehicles.value = Array.isArray(list) ? list : [];
  } catch (error) {
    vehicles.value = [];
    vehicleLoadError.value = error.response?.data?.message || error.message || 'Araç listesi alınamadı.';
    throw error;
  } finally {
    isVehicleLoading.value = false;
  }
}

async function loadAll() {
  isLoading.value = true;
  loadError.value = '';
  try {
    await fetchVehicles();
    await fetchRecords();
  } catch (error) {
    loadError.value = error.response?.data?.message || error.message || 'Bakım/Evrak verileri yüklenemedi.';
  } finally {
    isLoading.value = false;
  }
}

async function openCreateModal() {
  createForm.vehicleId = '';
  createForm.recordType = '';
  createForm.expiryDate = '';
  createForm.currentKm = null;
  createForm.nextMaintenanceKm = null;
  createForm.description = '';
  uploadFile.value = null;
  nextKmManuallyEdited.value = false;

  if (vehicleOptions.value.length === 0) {
    try {
      await fetchVehicles();
    } catch {
      // fallback options records içinden üretiliyor
    }
  }

  isCreateModalOpen.value = true;
}

function closeCreateModal() {
  isCreateModalOpen.value = false;
}

function onFileChange(event) {
  const target = event.target;
  uploadFile.value = target.files?.[0] || null;
}

async function autoFillMaintenanceKm() {
  if (!showMaintenanceFields.value || !createForm.vehicleId || nextKmManuallyEdited.value) return;

  try {
    const response = await api.get(`/tenant/vehicle-records/vehicle/${createForm.vehicleId}/last-maintenance`);
    const last = response.data?.data ?? response.data ?? null;
    if (!last) return;

    const interval = last.currentKm && last.nextMaintenanceKm
      ? Math.max(last.nextMaintenanceKm - last.currentKm, 1000)
      : 15000;

    const baseKm = createForm.currentKm || last.currentKm;
    if (baseKm) {
      createForm.nextMaintenanceKm = baseKm + interval;
    }
  } catch {
    if (createForm.currentKm) {
      createForm.nextMaintenanceKm = Number(createForm.currentKm) + 15000;
    }
  }
}

watch(() => [createForm.vehicleId, createForm.recordType], () => {
  if (createForm.recordType !== 'PERIYODIK_BAKIM') {
    nextKmManuallyEdited.value = false;
  }
  autoFillMaintenanceKm();
});

watch(() => createForm.currentKm, () => {
  if (!showMaintenanceFields.value || nextKmManuallyEdited.value) return;
  autoFillMaintenanceKm();
});

async function submitRecord() {
  if (!createForm.vehicleId || !createForm.recordType || !uploadFile.value) return;

  isSaving.value = true;
  try {
    const formData = new FormData();
    formData.append('vehicleId', createForm.vehicleId);
    formData.append('recordType', createForm.recordType);
    if (createForm.description) formData.append('description', createForm.description);
    if (showExpiryField.value && createForm.expiryDate) formData.append('expiryDate', createForm.expiryDate);
    if (showMaintenanceFields.value && createForm.currentKm !== null) formData.append('currentKm', String(createForm.currentKm));
    if (showMaintenanceFields.value && createForm.nextMaintenanceKm !== null) formData.append('nextMaintenanceKm', String(createForm.nextMaintenanceKm));
    formData.append('file', uploadFile.value);

    await api.post('/tenant/vehicle-records', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    await fetchRecords();
    closeCreateModal();
    showToast('Kayıt başarıyla eklendi.');
  } catch (error) {
    loadError.value = error.response?.data?.message || error.message || 'Kayıt eklenemedi.';
  } finally {
    isSaving.value = false;
  }
}

async function downloadAllIncoming() {
  isSaving.value = true;
  try {
    const response = await api.get('/tenant/vehicle-records/incoming/download-all', {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/zip' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `gelen-evraklar-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);

    showToast('Toplu indirme tamamlandı.');
  } catch (error) {
    loadError.value = error.response?.data?.message || error.message || 'Toplu indirme başarısız.';
  } finally {
    isSaving.value = false;
  }
}

function showToast(message) {
  toastMessage.value = message;
  setTimeout(() => {
    toastMessage.value = '';
  }, 2500);
}

onMounted(() => {
  loadAll();
});
</script>