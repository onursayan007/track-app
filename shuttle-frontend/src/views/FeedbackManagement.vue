<script setup>
import { ref, computed } from 'vue';

// --- MOCK DATA ---
const vehicles = ref([
  { id: 1, name: 'Servis Aracı 1', plate: '34 SERV 01' },
  { id: 2, name: 'Servis Aracı 2', plate: '34 SERV 02' },
  { id: 3, name: 'Personel Otobüsü', plate: '34 ABC 99' },
  { id: 4, name: 'Makam Aracı', plate: '34 VIP 123' },
]);

const feedbacks = ref([
  { 
    id: 1, 
    date: '2026-02-18 14:30', 
    plate: '34 ABC 99', 
    message: 'Araç trafikte çok tehlikeli makas atıyordu. Çoçuklarımızı taşıyor bu araçlar, lütfen daha dikkatli sürücüler seçin...', 
    media: true, 
    contact: 'Ahmet Yılmaz - 5551234567',
    status: 'Pending' 
  },
  { 
    id: 2, 
    date: '2026-02-17 09:15', 
    plate: '34 SERV 01', 
    message: 'Sabah servisi 15 dakika geç geldi ve şoför çok kaba davrandı.', 
    media: false, 
    contact: '',
    status: 'Pending' 
  },
  { 
    id: 3, 
    date: '2026-02-16 18:00', 
    plate: '34 SERV 02', 
    message: 'Şoför bey çok nazik ve yardımseverdi, kendisine teşekkür etmek istedim.', 
    media: false,
    contact: 'Ayşe Kaya', 
    status: 'Resolved' 
  },
]);

// --- COMPONENT STATE ---
const currentTab = ref('incoming'); // 'incoming' or 'generator'
const selectedVehicleId = ref(null);
const generatedData = ref(null);

const isModalOpen = ref(false);
const selectedFeedback = ref(null);

// --- COMPUTED ---
const generatedLink = computed(() => {
  if (generatedData.value) {
    const plate = generatedData.value.plate;
    return `https://thevortex.app/feedback/${plate}`;
  }
  return '';
});

// --- METHODS ---
const generateQrCode = () => {
  if (!selectedVehicleId.value) {
    alert('Lütfen bir araç seçin.');
    return;
  }
  const vehicle = vehicles.value.find(v => v.id === selectedVehicleId.value);
  generatedData.value = {
    plate: vehicle.plate,
  };
};

const openDetailsModal = (feedback) => {
  selectedFeedback.value = feedback;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedFeedback.value = null;
};

const copyLink = () => {
    navigator.clipboard.writeText(generatedLink.value).then(() => {
        alert('Bağlantı kopyalandı!');
    });
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-full">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Geri Bildirim Yönetimi</h1>
      <p class="mt-1 text-md text-gray-600 dark:text-gray-400">Genel kullanımdan gelen şikayet ve önerileri yönetin, araçlarınız için bildirim QR kodları oluşturun.</p>
    </header>

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex space-x-6" aria-label="Tabs">
        <button @click="currentTab = 'incoming'" :class="['whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm', currentTab === 'incoming' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300']">
          Gelen Bildirimler ({{ feedbacks.filter(f => f.status === 'Pending').length }})
        </button>
        <button @click="currentTab = 'generator'" :class="['whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm', currentTab === 'generator' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300']">
          QR Kod ve Link Oluşturucu
        </button>
      </nav>
    </div>

    <!-- Section A: Incoming Feedback -->
    <div v-if="currentTab === 'incoming'">
      <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <ul role="list" class="divide-y divide-gray-200 dark:divide-gray-700">
          <li v-for="feedback in feedbacks" :key="feedback.id" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0">
                 <span :class="['px-2 inline-flex text-xs leading-5 font-semibold rounded-full', feedback.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800']">
                    {{ feedback.status === 'Pending' ? 'Bekliyor' : 'Çözüldü' }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ feedback.plate }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ feedback.message }}</p>
              </div>
              <div class="hidden md:flex items-center space-x-4">
                 <span class="text-sm text-gray-500 dark:text-gray-400">{{ feedback.date }}</span>
                 <svg v-if="feedback.media" class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" /></svg>
              </div>
               <button @click="openDetailsModal(feedback)" class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900">
                Detayı Gör
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Section B: QR & Link Generator -->
    <div v-if="currentTab === 'generator'">
       <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Control Panel -->
            <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">Araç İçin Bildirim Oluştur</h3>
                <div class="mt-4">
                    <label for="vehicle-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Araç Seçiniz</label>
                    <select id="vehicle-select" v-model="selectedVehicleId" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option :value="null" disabled>-- Bir araç plakası seçin --</option>
                        <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
                            {{ vehicle.name }} ({{ vehicle.plate }})
                        </option>
                    </select>
                </div>
                <div class="mt-6">
                    <button @click="generateQrCode" :disabled="!selectedVehicleId" class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        QR Kod ve Bağlantı Oluştur
                    </button>
                </div>
            </div>

            <!-- Output UI -->
            <div v-if="generatedData" class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 flex flex-col items-center justify-center text-center animate-fade-in">
                 <h4 class="text-md font-semibold text-gray-800 dark:text-white mb-2">"Hatalıysam Ara" Sticker</h4>
                 <p class="text-lg font-bold text-gray-900 dark:text-white mb-4">{{ generatedData.plate }}</p>

                <!-- Mock QR Code -->
                <div class="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                    <svg class="w-24 h-24 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v.01M12 8v.01M12 12v.01M12 16v.01M12 20v.01M4 12h.01M8 12h.01M16 12h.01M20 12h.01M4 4h.01M4 8h.01M4 16h.01M4 20h.01M8 4h.01M8 8h.01M8 16h.01M8 20h.01M16 4h.01M16 8h.01M16 16h.01M16 20h.01M20 4h.01M20 8h.01M20 16h.01M20 20h.01" /></svg>
                </div>
                
                <div class="w-full">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Paylaşılabilir Bağlantı</label>
                    <input type="text" :value="generatedLink" readonly class="w-full bg-gray-100 dark:bg-gray-900/50 text-center border-gray-300 dark:border-gray-600 rounded-md mt-1 p-2 text-sm text-gray-600 dark:text-gray-300">
                </div>
                
                <div class="mt-6 flex space-x-3 w-full">
                    <button @click="copyLink" class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Linki Kopyala</button>
                    <button class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 dark:bg-gray-200 dark:text-gray-800 dark:hover:bg-white">Sticker Olarak Yazdır</button>
                </div>
            </div>
            <div v-else class="bg-gray-100 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center text-center p-6">
                <p class="text-gray-500 dark:text-gray-400">QR kod ve bağlantıyı görmek için bir araç seçip "Oluştur" butonuna tıklayın.</p>
            </div>
       </div>
    </div>

    <!-- Details Modal -->
    <div v-if="isModalOpen" class="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="closeModal"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-blue-600 dark:text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">Bildirim Detayı: {{ selectedFeedback.plate }}</h3>
                <div class="mt-4 space-y-4">
                   <p class="text-sm text-gray-600 dark:text-gray-300"><strong>Tarih:</strong> {{ selectedFeedback.date }}</p>
                   <p class="text-sm text-gray-600 dark:text-gray-300"><strong>İletişim:</strong> {{ selectedFeedback.contact || 'Belirtilmemiş' }}</p>
                   <p class="text-sm text-gray-500 dark:text-gray-400"><strong>Mesaj:</strong></p>
                   <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md max-h-40 overflow-y-auto">
                     <p class="text-sm text-gray-800 dark:text-gray-200">{{ selectedFeedback.message }}</p>
                   </div>
                   <div v-if="selectedFeedback.media">
                      <p class="text-sm text-gray-500 dark:text-gray-400"><strong>Medya Eki:</strong></p>
                      <div class="mt-1 flex items-center p-3 border rounded-md border-gray-200 dark:border-gray-600">
                        <svg class="w-10 h-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" /></svg>
                        <span class="ml-3 text-sm text-gray-600 dark:text-gray-300">mock-image.jpg</span>
                        <button class="ml-auto text-blue-500 text-sm hover:underline">Görüntüle</button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button v-if="selectedFeedback.status === 'Pending'" type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:ml-3 sm:w-auto sm:text-sm" @click="selectedFeedback.status = 'Resolved'; closeModal()">
              Çözüldü Olarak İşaretle
            </button>
            <button type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500" @click="closeModal">
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}
</style>