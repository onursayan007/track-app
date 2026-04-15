<template>
  <teleport to="body">
    <transition leave-active-class="transition ease-in duration-300" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <!-- Backdrop Overlay -->
      <div v-if="isOpen" @click="$emit('close')" class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"></div>
    </transition>

    <transition
      enter-active-class="transform transition ease-in-out duration-300"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition ease-in-out duration-300"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <!-- Drawer Panel -->
      <div v-if="isOpen" class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div v-if="!vehicle" class="flex items-center justify-center h-full">
           <p class="text-gray-500">Araç verisi yükleniyor...</p>
        </div>

        <template v-else>
          <!-- Header -->
          <div class="flex items-start justify-between p-6 border-b border-gray-200">
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ vehicle.plate }}</p>
              <p class="text-sm text-gray-600">{{ vehicle.driver }} - {{ vehicle.phone }}</p>
            </div>
            <button @click="$emit('close')" class="p-2 -mr-2 -mt-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <!-- Scrollable Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-8">
            
            <!-- Section A: Dynamic Telemetry -->
            <section>
              <h3 class="font-semibold text-gray-800 mb-3">Telemetri Verileri</h3>
              <!-- Advanced Telemetry for 'arvento' -->
              <div v-if="vehicle.device_type === 'arvento'" class="grid grid-cols-3 gap-4 text-center">
                <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p class="text-xs text-gray-500">Yakıt</p>
                  <p class="text-xl font-bold text-gray-900">45%</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p class="text-xs text-gray-500">Motor Isısı</p>
                  <p class="text-xl font-bold text-gray-900">80°C</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p class="text-xs text-gray-500">RPM</p>
                  <p class="text-xl font-bold text-gray-900">1.2k</p>
                </div>
              </div>
              <!-- Basic Telemetry for 'generic' -->
              <div v-else-if="vehicle.device_type === 'generic'" class="grid grid-cols-2 gap-4 text-center">
                 <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p class="text-xs text-gray-500">Hız</p>
                  <p class="text-xl font-bold text-gray-900">45 km/h</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p class="text-xs text-gray-500">GPS Sinyali</p>
                  <p class="text-xl font-bold text-green-600">İyi</p>
                </div>
              </div>
            </section>

            <!-- Immobilizer Section -->
            <section v-if="vehicle.device_type === 'generic'">
                 <h3 class="font-semibold text-gray-800 mb-3">Kritik Eylemler</h3>
                 <button @click="handleEngineCutoff" class="w-full flex items-center justify-center gap-3 text-left p-4 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg shadow-red-200 transition-all">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    <span class="font-bold">Motoru Blokla (Uzaktan Durdur)</span>
                 </button>
            </section>

             <!-- Section B: Daily Route Plan -->
            <section>
              <h3 class="font-semibold text-gray-800 mb-3">Günlük Sefer Planı</h3>
              <ul class="space-y-2">
                <li v-for="route in vehicle.daily_routes" :key="route" class="flex items-center text-gray-700">
                   <svg class="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>{{ route }}</span>
                </li>
              </ul>
            </section>

             <!-- Section C: Absent Passengers -->
            <section v-if="vehicle.absent_passengers && vehicle.absent_passengers.length > 0">
              <h3 class="font-semibold text-gray-800 mb-3">Bugün Gelmeyecek Personel</h3>
              <div class="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <div v-for="passenger in vehicle.absent_passengers" :key="passenger" class="flex items-center">
                    <div class="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center mr-3 text-xs font-bold">!</div>
                    <span class="text-red-800 font-medium">{{ passenger }}</span>
                </div>
              </div>
            </section>

            <!-- Section D: Access & Credentials -->
            <section>
              <h3 class="font-semibold text-gray-800 mb-3">Giriş Bilgileri</h3>
              <div class="grid grid-cols-2 gap-6 items-center">
                <!-- PIN Code -->
                <div class="text-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p class="text-sm text-gray-500">Yolcu PIN Kodu</p>
                  <p class="font-mono text-4xl font-bold tracking-widest text-gray-900 mt-2">{{ vehicle.pin }}</p>
                </div>
                <!-- QR Code -->
                <div class="text-center">
                    <div class="w-32 h-32 bg-gray-100 rounded-lg mx-auto flex items-center justify-center border-2 border-dashed">
                        <svg class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6.364 1.636l-.707.707M20 12h-1M4 12H3m1.636 6.364l.707-.707M12 20v-1m-6.364-1.636l.707-.707M6 12a6 6 0 016-6h0a6 6 0 016 6v0a6 6 0 01-6 6h0a6 6 0 01-6-6v0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                </div>
              </div>
               <div class="mt-4">
                  <button class="w-full text-center py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors">
                    QR Kodu Yazdır / İndir
                  </button>
                </div>
            </section>
          </div>
        </template>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  vehicle: {
    type: Object,
    default: null
  },
});

defineEmits(['close']);

const handleEngineCutoff = () => {
    if(window.confirm('DİKKAT! Bu işlem aracın motorunu UZAKTAN DURDURACAKTIR ve potansiyel olarak tehlikelidir. Bu komut yalnızca acil durumlarda kullanılmalıdır. Devam etmek istediğinizden kesinlikle emin misiniz?')) {
        console.log('Engine cut-off command sent!');
        alert('Motor blokaj komutu gönderildi.');
    }
}
</script>
