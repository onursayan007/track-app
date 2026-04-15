<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import api from '../services/api';

const route = useRoute();
const qrToken = computed(() => route.params.qrToken);

const message = ref('');
const contactInfo = ref('');
const selectedFile = ref(null);
const submissionStatus = ref(null); // null, 'loading', 'success', 'error'
const errorMessage = ref('');

const onFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedFile.value = {
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
    };
  }
};

const submitFeedback = async () => {
  if (!message.value) {
    alert('Lütfen şikayet veya mesajınızı yazınız.');
    return;
  }

  submissionStatus.value = 'loading';
  errorMessage.value = '';

  try {
    const formData = new FormData();
    formData.append('message', `${message.value}${contactInfo.value ? `\n\nİletişim: ${contactInfo.value}` : ''}`);
    if (selectedFile.value?.file) {
      formData.append('media', selectedFile.value.file);
    }

    await api.post(`/public/feedback/${qrToken.value}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    submissionStatus.value = 'success';
  } catch (err) {
    submissionStatus.value = 'error';
    errorMessage.value = err?.response?.data?.message || 'Gönderim sırasında bir hata oluştu.';
  }
};
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
    <div class="w-full max-w-lg p-6 md:p-8 mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
      
      <div v-if="submissionStatus !== 'success'">
        <h1 class="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
          Araç Bildirim Formu
        </h1>

        <form @submit.prevent="submitFeedback">
          <div class="mb-5">
            <label for="plate" class="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">QR Token</label>
            <input 
              type="text" 
              id="plate"
              :value="qrToken"
              readonly
              class="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed"
            >
          </div>

          <div class="mb-5">
            <label for="message" class="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Mesajınız</label>
            <textarea 
              id="message" 
              rows="6" 
              v-model="message"
              class="block p-2.5 w-full text-sm text-gray-900 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:text-white dark:placeholder-gray-400" 
              placeholder="Lütfen şikayetinizi veya mesajınızı detaylı yazın..."
              required
            ></textarea>
          </div>

          <div class="mb-6">
             <label class="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Fotoğraf veya Video Yükle</label>
            <div class="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
              <input 
                type="file" 
                @change="onFileChange"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*,video/*"
              >
              <div v-if="!selectedFile" class="text-gray-500 dark:text-gray-400">
                <svg class="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                <p class="mt-1 text-sm">Dosya seçmek için tıklayın veya sürükleyin</p>
                <p class="text-xs">PNG, JPG, MP4 (MAX. 10MB)</p>
              </div>
              <div v-else class="text-green-600 dark:text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="mt-1 text-sm font-semibold">{{ selectedFile.name }}</p>
                <p class="text-xs">{{ selectedFile.size }}</p>
              </div>
            </div>
          </div>
          
          <div class="mb-6">
            <label for="contact" class="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">İletişim Bilgileri (İsteğe Bağlı)</label>
            <input 
              type="text" 
              id="contact"
              v-model="contactInfo"
              class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="Adınız Soyadınız - Telefon Numaranız"
            >
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Size dönüş yapabilmemiz için.</p>
          </div>

          <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">Yüklediğiniz medya dosyaları 15 gün sonra otomatik silinir.</p>

          <p v-if="submissionStatus === 'error'" class="mb-4 text-sm text-red-500">{{ errorMessage }}</p>

          <button 
            type="submit" 
            :disabled="submissionStatus === 'loading'"
            class="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-md px-5 py-3 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-wait transition-all duration-300"
          >
            <span v-if="submissionStatus === 'loading'">Gönderiliyor...</span>
            <span v-else>Bildirimi Gönder</span>
          </button>
        </form>
      </div>

      <!-- Success State -->
      <div v-if="submissionStatus === 'success'" class="text-center py-10">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white mt-4">Teşekkür Ederiz!</h2>
        <p class="text-gray-600 dark:text-gray-300 mt-2">
          Geri bildiriminiz başarıyla alınmıştır. En kısa sürede incelenecektir.
        </p>
        <p class="text-gray-500 dark:text-gray-400 mt-6 text-sm">
          Bu sayfayı kapatabilirsiniz.
        </p>
      </div>

    </div>
  </div>
</template>