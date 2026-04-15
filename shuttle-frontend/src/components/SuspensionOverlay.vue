<template>
  <Transition enter-active-class="transition duration-500 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-300 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
    <div v-if="visible" class="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div class="max-w-md w-full mx-4 text-center space-y-6 bg-slate-900/90 border border-red-500/30 rounded-3xl p-10 shadow-[0_0_80px_rgba(220,38,38,0.15)]">
        <!-- Warning icon -->
        <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-500/10 border-2 border-red-500/30 animate-pulse">
          <svg class="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>

        <!-- Title -->
        <h2 class="text-2xl font-bold text-red-400">Hesabınız Askıya Alındı</h2>

        <!-- Description -->
        <p class="text-sm text-slate-400 leading-relaxed">
          Ödenmemiş faturalarınız nedeniyle hesabınız askıya alınmıştır.
          Sistemi tekrar kullanabilmek için lütfen gecikmiş ödemelerinizi tamamlayın.
          <span class="block mt-3 text-xs text-slate-500">
            15 günlük ek süre dolmuştur. Ödeme sonrası hesabınız otomatik olarak aktifleştirilecektir.
          </span>
        </p>

        <!-- Action button -->
        <router-link
          to="/company/reports"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
          </svg>
          Finans ve Faturalar
        </router-link>

        <!-- Secondary info -->
        <p class="text-xs text-slate-600">
          Sorun yaşıyorsanız destek hattımızdan bize ulaşabilirsiniz.
        </p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})
</script>
