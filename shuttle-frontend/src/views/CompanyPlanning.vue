<template>
  <div class="h-full flex flex-col p-2 sm:p-4 md:p-6 bg-slate-950">
    <!-- Header -->
    <div class="flex-shrink-0 flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-white">Tur ve Transfer Planlaması</h1>
        <p class="text-slate-400 mt-1">Tarih bazlı servis ve transfer organizasyonu.</p>
      </div>
      <button class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        <span>Yeni Planlama Ekle</span>
      </button>
    </div>

    <!-- Main Content -->
    <div class="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden">
      
      <!-- Left: Calendar -->
      <div class="w-full md:w-1/3 xl:w-1/4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col p-4">
        <div class="flex items-center justify-between mb-4 px-2">
          <button @click="prevMonth" class="p-2 rounded-full hover:bg-slate-800 transition-colors">
            <svg class="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 class="text-lg font-bold text-white">{{ currentMonthName }} {{ currentYear }}</h2>
          <button @click="nextMonth" class="p-2 rounded-full hover:bg-slate-800 transition-colors">
            <svg class="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-2">
          <div v-for="day in daysOfWeek" :key="day">{{ day }}</div>
        </div>
        <div class="grid grid-cols-7 gap-2">
          <div v-for="day in calendarDays" :key="day.date" 
               :class="[
                 'flex items-center justify-center h-12 w-full rounded-xl cursor-pointer transition-all duration-200 border-2',
                 day.isCurrentMonth ? 'text-slate-200' : 'text-slate-600',
                 day.isToday ? 'border-orange-500' : 'border-transparent',
                 day.isSelected ? 'bg-orange-500/90 text-white font-bold shadow-lg shadow-orange-500/20' : 'hover:bg-slate-800 hover:border-slate-700'
               ]"
               @click="selectDate(day)">
            {{ day.day }}
          </div>
        </div>
      </div>

      <!-- Right: Scheduled Tours -->
      <div class="flex-grow bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 overflow-y-auto">
        <h3 class="text-xl font-bold text-white mb-4">
          <span class="text-orange-400">{{ selectedDateFormatted }}</span> için Planlanan Turlar
        </h3>
        <div v-if="tours.length" class="space-y-4">
          <div v-for="tour in tours" :key="tour.id" class="bg-slate-800 p-4 rounded-lg border border-slate-700/50 flex items-center justify-between hover:border-orange-500/50 transition-all cursor-pointer">
            <div class="flex items-center gap-4">
              <div :class="`w-12 h-12 rounded-lg flex-shrink-0 flex flex-col items-center justify-center ${tour.type === 'Gidiş' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`">
                <span class="text-lg font-bold">{{ tour.time.split(':')[0] }}</span>
                <span class="text-xs">{{ tour.time.split(':')[1] }}</span>
              </div>
              <div>
                <p class="font-bold text-white">{{ tour.name }}</p>
                <p class="text-sm text-slate-400">{{ tour.vehicle }} • {{ tour.driver }}</p>
              </div>
            </div>
            <div class="text-right">
              <span :class="`px-2 py-1 text-xs font-semibold rounded-full ${tour.status === 'Tamamlandı' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`">{{ tour.status }}</span>
              <p class="text-xs text-slate-500 mt-1">{{ tour.passengers }} yolcu</p>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-16">
          <p class="text-slate-400">Bu tarih için planlanmış tur bulunmuyor.</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const daysOfWeek = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const currentDate = ref(new Date());
const selectedDay = ref(new Date().getDate());

const tours = ref([
  { id: 1, name: 'Sabah Vardiyası - Merkez', time: '07:00', vehicle: '34 ABC 123', driver: 'Ahmet Yılmaz', passengers: '22/25', status: 'Beklemede', type: 'Gidiş' },
  { id: 2, name: 'Öğle Servisi - AVM', time: '12:30', vehicle: '34 DEF 456', driver: 'Fatma Kaya', passengers: '10/15', status: 'Beklemede', type: 'Gidiş' },
  { id: 3, name: 'Akşam Vardiyası - Merkez', time: '18:00', vehicle: '34 ABC 123', driver: 'Ahmet Yılmaz', passengers: '24/25', status: 'Beklemede', type: 'Dönüş' },
]);

const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());
const currentMonthName = computed(() => currentDate.value.toLocaleString('tr-TR', { month: 'long' }));

const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const today = new Date();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 (Pzt) - 6 (Paz)

  const days = [];

  // Days from previous month
  const prevLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevLastDay - i),
      day: prevLastDay - i,
      isCurrentMonth: false,
    });
  }

  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      day: i,
      isCurrentMonth: true,
      isToday: date.toDateString() === today.toDateString(),
      isSelected: i === selectedDay.value && month === currentDate.value.getMonth() && year === currentDate.value.getFullYear(),
    });
  }
  
  // Days from next month
  const remainingSlots = 42 - days.length;
  for (let i = 1; i <= remainingSlots; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      day: i,
      isCurrentMonth: false,
    });
  }
  
  return days;
});

const selectedDateFormatted = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value, selectedDay.value);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
});

function prevMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
  selectedDay.value = -1; // Reset selection
}

function nextMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
  selectedDay.value = -1; // Reset selection
}

function selectDate(day) {
  if (!day.isCurrentMonth) {
    currentDate.value = new Date(day.date.getFullYear(), day.date.getMonth(), 1);
  }
  selectedDay.value = day.day;
  // Here you would typically fetch tours for the selected date
}

onMounted(() => {
  selectDate({ 
    day: new Date().getDate(),
    date: new Date(),
    isCurrentMonth: true 
  });
});
</script>
