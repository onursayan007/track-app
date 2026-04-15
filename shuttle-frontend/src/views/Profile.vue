<template>
  <div class="p-4 bg-slate-900 min-h-screen text-white">
    <div class="max-w-md mx-auto">
      <!-- User Details Section -->
      <div class="flex items-center mb-8">
        <div class="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-2xl font-bold mr-4">
          JD
        </div>
        <div>
          <p class="text-xl font-bold">John Doe</p>
          <p class="text-slate-400">+1 234 567 890</p>
        </div>
      </div>

      <!-- Action List -->
      <div class="space-y-4">
        <h3 class="text-slate-500 font-semibold text-sm px-2 mt-6">Hesap</h3>
         <div class="bg-slate-800 rounded-lg shadow-lg">
           <button @click="logout" class="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors rounded-t-lg">
            Çıkış Yap
          </button>
          <hr class="border-slate-700" />
          <button @click="deleteAccount" class="w-full text-left px-4 py-3 text-red-500 hover:bg-red-900/20 transition-colors rounded-b-lg">
            Hesabı Sil
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const deleteAccount = () => {
  if (confirm('Hesabınızı silmek istediğinizden emin misiniz? Tüm verileriniz kalıcı olarak silinecektir.')) {
    // Here you would typically make an API call to delete the user account
    localStorage.clear();
    alert('Hesap başarıyla silindi.');
    router.push('/');
  }
};

const logout = () => {
    authStore.logout();
};
</script>
