<template>
  <div class="h-full flex flex-col p-2 sm:p-4 md:p-6 bg-slate-950 text-slate-300">
    <!-- Header -->
    <div class="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 class="text-3xl font-bold text-white">Yolcu ve Müşteri Listesi</h1>
        <p class="text-slate-400 mt-1">Sisteme kayıtlı tüm yolcuları yönetin ve filtreleyin.</p>
      </div>
      <button @click="openCreateModal" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 self-end sm:self-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 11a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1v-1z" />
        </svg>
        <span>Yeni Yolcu Ekle</span>
      </button>
    </div>

    <!-- Filters and Search -->
    <div class="flex-shrink-0 flex flex-col md:flex-row gap-4 mb-6">
      <div class="relative flex-grow">
        <svg class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
        </svg>
        <input v-model="searchQuery" type="text" placeholder="Yolcu adı, telefon veya durak ara..." class="w-full bg-slate-900 border border-slate-800 rounded-lg pl-11 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition">
      </div>
      <div class="flex gap-4">
        <select v-model="selectedRouteId" class="flex-grow md:flex-grow-0 w-full md:w-48 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition">
          <option value="">Tüm Rotalar</option>
          <option v-for="route in routes" :key="route.id" :value="route.id">{{ route.name }}</option>
        </select>
        <select v-model="selectedStatus" class="flex-grow md:flex-grow-0 w-full md:w-48 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition">
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
        </select>
      </div>
    </div>

    <!-- Data Table -->
    <div class="flex-grow overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <table class="min-w-full divide-y divide-slate-800">
        <thead class="bg-slate-800/50">
          <tr>
            <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">İsim</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-white">Atanan Rota</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-white hidden md:table-cell">Durak</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-white hidden lg:table-cell">Telefon</th>
            <th scope="col" class="px-3 py-3.5 text-center text-sm font-semibold text-white">Durum</th>
            <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span class="sr-only">Düzenle</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
          <tr v-if="isLoading">
            <td colspan="6" class="py-12 text-center text-slate-400">Yolcular yükleniyor...</td>
          </tr>
          <tr v-else-if="loadError">
            <td colspan="6" class="py-12 text-center text-rose-300">{{ loadError }}</td>
          </tr>
          <tr v-else-if="filteredPassengers.length === 0">
            <td colspan="6" class="py-12 text-center text-slate-500">Gösterilecek yolcu bulunamadı.</td>
          </tr>
          <tr v-else v-for="passenger in filteredPassengers" :key="passenger.id" class="hover:bg-slate-800/40 transition-colors">
            <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
              <div class="flex items-center">
                <div class="h-10 w-10 flex-shrink-0">
                  <img class="h-10 w-10 rounded-full object-cover" :src="passenger.avatar" alt="">
                </div>
                <div class="ml-4">
                  <div class="font-medium text-white">{{ passenger.name }}</div>
                  <div class="text-slate-400">{{ passenger.email }}</div>
                </div>
              </div>
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-400">
              <div class="text-white">{{ passenger.route.name }}</div>
              <div class="text-slate-500">{{ passenger.route.time }}</div>
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-400 hidden md:table-cell">
                {{ passenger.stop }}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-400 hidden lg:table-cell">{{ passenger.phone }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-center">
              <span :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', passenger.status === 'Aktif' ? 'bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/20' : 'bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20']">
                {{ passenger.status }}
              </span>
            </td>
            <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
              <button @click="openCreateModal" class="text-orange-400 hover:text-orange-300">Düzenle<span class="sr-only">, {{ passenger.name }}</span></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" @click.self="closeModal">
        <div class="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 class="text-lg font-bold text-white">Yeni Yolcu Ekle</h3>
            <button @click="closeModal" class="text-slate-400 hover:text-white">✕</button>
          </div>

          <div class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ad Soyad</label>
              <input v-model="passengerForm.name" type="text" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">E-posta</label>
                <input v-model="passengerForm.email" type="email" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Telefon</label>
                <input v-model="passengerForm.phone" type="text" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Şifre</label>
              <input v-model="passengerForm.password" type="password" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Atanan Rota</label>
              <select v-model="passengerForm.routeId" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3">
                <option value="">Rota seçiniz</option>
                <option v-for="route in routes" :key="route.id" :value="route.id">{{ route.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kurum/Şirket</label>
              <input
                v-model="clientSearchQuery"
                type="text"
                placeholder="Kurum ara..."
                class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 mb-2"
              />
              <select v-model="passengerForm.clientId" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3">
                <option value="">Bireysel / Tanımsız</option>
                <option v-for="client in filteredClients" :key="client.id" :value="client.id">{{ client.name }} • {{ client.taxNumber }}</option>
              </select>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button @click="closeModal" class="px-4 py-2 rounded-lg text-slate-400 hover:text-white">İptal</button>
              <button @click="submitPassenger" :disabled="isSaving" class="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-60">
                {{ isSaving ? 'Kaydediliyor...' : 'Kaydet' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api from '../services/api';

const passengers = ref([]);
const routes = ref([]);
const clients = ref([]);
const isLoading = ref(false);
const isSaving = ref(false);
const loadError = ref('');

const searchQuery = ref('');
const selectedRouteId = ref('');
const selectedStatus = ref('');
const clientSearchQuery = ref('');

const isModalOpen = ref(false);

const passengerForm = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  routeId: '',
  clientId: '',
});

const filteredClients = computed(() => {
  const query = clientSearchQuery.value.trim().toLowerCase();
  if (!query) return clients.value;
  return clients.value.filter((client) => {
    return (client.name || '').toLowerCase().includes(query) || (client.taxNumber || '').toLowerCase().includes(query);
  });
});

const routeMap = computed(() => {
  const map = new Map();
  routes.value.forEach((route) => map.set(route.id, route));
  return map;
});

const filteredPassengers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return passengers.value.filter((passenger) => {
    const routeMatch = !selectedRouteId.value || passenger.routeId === selectedRouteId.value;
    const statusMatch = !selectedStatus.value || (selectedStatus.value === 'active' ? passenger.isActive : !passenger.isActive);
    const searchMatch = !query ||
      passenger.name.toLowerCase().includes(query) ||
      (passenger.phone || '').toLowerCase().includes(query) ||
      (passenger.email || '').toLowerCase().includes(query);
    return routeMatch && statusMatch && searchMatch;
  });
});

const normalizePassenger = (user) => {
  const route = routeMap.value.get(user.routeId) || user.route || null;
  const initials = (user.name || '?')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    id: user.id,
    name: user.name || 'İsimsiz',
    email: user.email || '-',
    phone: user.phone || '-',
    routeId: user.routeId || user.route?.id || '',
    route: {
      name: route?.name || 'Atanmamış',
      time: route?.time || route?.departureTime || '-',
    },
    stop: user.stopName || '-',
    isActive: user.isActive !== false,
    status: user.isActive === false ? 'Pasif' : 'Aktif',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=1e293b&color=f8fafc`,
  };
};

const fetchRoutes = async () => {
  const res = await api.get('/tenant/routes');
  const list = res.data?.data ?? res.data ?? [];
  routes.value = (Array.isArray(list) ? list : []).map((route) => ({
    id: route.id,
    name: route.name,
    time: route.departureTime || '-',
  }));
};

const fetchPassengers = async () => {
  const res = await api.get('/tenant/users', { params: { role: 'PASSENGER' } });
  const list = res.data?.data ?? res.data ?? [];
  passengers.value = (Array.isArray(list) ? list : []).map(normalizePassenger);
};

const fetchClients = async () => {
  const res = await api.get('/tenant/clients');
  const list = res.data?.data ?? res.data ?? [];
  clients.value = Array.isArray(list) ? list : [];
};

const loadAll = async () => {
  isLoading.value = true;
  loadError.value = '';
  try {
    await fetchRoutes();
    await Promise.all([fetchPassengers(), fetchClients()]);
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Yolcu verileri alınamadı.';
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  passengerForm.name = '';
  passengerForm.email = '';
  passengerForm.phone = '';
  passengerForm.password = '';
  passengerForm.routeId = '';
  passengerForm.clientId = '';
  clientSearchQuery.value = '';
};

const openCreateModal = () => {
  resetForm();
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const submitPassenger = async () => {
  isSaving.value = true;
  try {
    await api.post('/tenant/users', {
      name: passengerForm.name,
      email: passengerForm.email || undefined,
      phone: passengerForm.phone || undefined,
      password: passengerForm.password,
      role: 'PASSENGER',
      routeId: passengerForm.routeId || null,
      clientId: passengerForm.clientId || null,
    });

    await fetchPassengers();
    closeModal();
  } catch (e) {
    loadError.value = e.response?.data?.message || e.message || 'Yolcu kaydedilemedi.';
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  loadAll();
});
</script>
