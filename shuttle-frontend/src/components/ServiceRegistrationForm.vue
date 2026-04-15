<template>
  <div class="bg-gray-900 min-h-screen flex items-center justify-center text-white p-4">
    <div v-if="!showCamera" class="w-full max-w-md bg-gray-800 rounded-xl p-8 shadow-lg space-y-6">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-cyan-400">Servis Ekle</h1>
        <p class="text-gray-400 mt-2">Servisi takip etmek için plaka ve PIN kodunu girin.</p>
      </div>

      <form @submit.prevent="saveService" class="space-y-6">
        <div>
          <label for="plate" class="text-sm font-medium text-gray-300">Araç Plakası</label>
          <input
            v-model="plate"
            type="text"
            id="plate"
            class="w-full mt-2 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-cyan-500 focus:border-cyan-500 uppercase"
            placeholder="27 ABC 99"
            @input="plate = plate.toUpperCase()"
          />
        </div>

        <div>
          <label for="pin" class="text-sm font-medium text-gray-300">PIN Kodu</label>
          <input
            v-model="pin"
            type="password"
            id="pin"
            class="w-full mt-2 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-cyan-500 focus:border-cyan-500"
            placeholder="••••••"
          />
        </div>

        <div class="flex flex-col space-y-4">
          <button type="submit" class="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg transition duration-300">
            Servisi Kaydet
          </button>
          <button
            @click="openCamera"
            type="button"
            class="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition duration-300 flex items-center justify-center"
          >
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            QR Kod Tara
          </button>
        </div>
      </form>
    </div>

    <div v-if="showCamera" class="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        <p class="text-white text-lg mb-4">{{ error || 'QR Kodu okutun' }}</p>
        <qrcode-stream @detect="onDetect" @error="onError" class="w-full h-full"></qrcode-stream>
        <button @click="closeCamera" class="absolute top-5 right-5 bg-white text-black rounded-full p-2 z-50">
            Kapat
        </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';
import { useRouter } from 'vue-router';

const plate = ref('');
const pin = ref('');
const showCamera = ref(false);
const error = ref('');
const router = useRouter();

const emit = defineEmits(['service-registered']);

const saveService = () => {
  if (plate.value && pin.value) {
    localStorage.setItem('subscribed_plate', plate.value);
    // İsteğe bağlı: PIN'i veya diğer detayları da saklayabilirsiniz.
    // localStorage.setItem('shuttle_details', JSON.stringify({ plate: plate.value, pin: pin.value }));
    
    // Parent component'e haber ver
    emit('service-registered', plate.value);
    
    // Başarılı kayıt sonrası ana sayfaya (haritaya) yönlendir
    router.push({ name: 'PassengerHome' });

  } else {
    alert('Plaka ve PIN kodu boş bırakılamaz.');
  }
};

const openCamera = () => {
  showCamera.value = true;
  error.value = '';
};

const closeCamera = () => {
  showCamera.value = false;
};

const onDetect = (detectedCodes) => {
  if (detectedCodes && detectedCodes.length > 0) {
    try {
      const data = JSON.parse(detectedCodes[0].rawValue);
      if (data.plate && data.code) {
        plate.value = data.plate.toUpperCase();
        pin.value = data.code;
        closeCamera();
        saveService(); // Otomatik olarak kaydet
      } else {
        error.value = 'Geçersiz QR Kod Formatı';
      }
    } catch (e) {
      error.value = 'QR Kod Okunamadı';
    }
  }
};

const onError = (err) => {
    if (err.name === 'NotAllowedError') {
        error.value = "Kamera izni gerekli!";
    } else if (err.name === 'NotFoundError') {
        error.value = "Kamera bulunamadı.";
    } else {
        error.value = "Kamera hatası.";
    }
};
</script>
