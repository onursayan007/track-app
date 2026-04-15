<template>
  <div class="h-[calc(100vh-64px)] bg-slate-950 text-slate-100 relative">
    <div class="absolute top-3 left-3 right-3 z-[1000] flex items-center gap-2">
      <button @click="goBack" class="h-10 w-10 rounded-xl border border-slate-700 bg-slate-900/90 backdrop-blur text-slate-200 flex items-center justify-center">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div class="flex-1 rounded-xl border border-slate-700 bg-slate-900/90 backdrop-blur px-3 py-2">
        <p class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Yeni Saha Rotası</p>
        <p class="text-sm font-bold text-white truncate">{{ routeName || 'Rota adı giriniz' }}</p>
      </div>
      <button @click="openNameModal" class="h-10 px-3 rounded-xl border border-slate-700 bg-slate-900/90 text-xs font-bold text-slate-200">Ad Değiştir</button>
    </div>

    <l-map
      ref="mapRef"
      v-model:zoom="zoom"
      :center="center"
      :use-global-leaflet="false"
      class="h-full w-full"
      @click="onMapClick"
    >
      <l-tile-layer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        layer-type="base"
        name="CartoDB Dark"
      />

      <l-polyline v-if="coordinates.length > 1" :lat-lngs="coordinates" color="#6366f1" :weight="4" :opacity="0.9" />

      <l-marker v-for="(stop, index) in stops" :key="stop.localId" :lat-lng="[stop.latitude, stop.longitude]" @click="removeStop(index)">
        <l-icon :icon-size="[30, 30]" :icon-anchor="[15, 30]" class-name="bg-transparent border-none">
          <div class="flex flex-col items-center">
            <div class="bg-indigo-600 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white border border-slate-200/20">
              {{ index + 1 }}
            </div>
            <div class="w-1 h-2 bg-slate-900"></div>
          </div>
        </l-icon>
      </l-marker>
    </l-map>

    <div class="absolute bottom-4 left-3 right-3 z-[1000] space-y-2">
      <p class="text-[11px] text-slate-300 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2">
        Haritaya dokunarak durak ekleyin. Durağa dokunarak silebilirsiniz.
      </p>
      <button
        @click="saveRoute"
        :disabled="saving || !routeName.trim() || stops.length < 2"
        class="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed py-3.5 text-sm font-black text-white"
      >
        {{ saving ? 'Kaydediliyor...' : `Rotayı Kaydet (${stops.length} durak)` }}
      </button>
    </div>

    <div v-if="showNameModal" class="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/75"></div>
      <div class="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-4">
        <h2 class="text-lg font-black text-white">Rota Adı</h2>
        <p class="text-xs text-slate-400 mt-1">Önce rota adını girin, sonra haritadan durakları seçin.</p>
        <input
          v-model="draftRouteName"
          type="text"
          placeholder="Örn: Akşam Vardiyası"
          class="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
        />
        <div class="mt-3 flex gap-2">
          <button @click="closeNameModal" class="flex-1 rounded-xl bg-slate-800 py-2.5 text-sm font-bold text-slate-200">İptal</button>
          <button @click="applyRouteName" class="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white">Devam</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LIcon, LMap, LMarker, LPolyline, LTileLayer } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import api from '@/services/api'

const router = useRouter()

const zoom = ref(13)
const center = ref([37.0662, 37.3833])
const mapRef = ref(null)

const routeName = ref('')
const draftRouteName = ref('')
const showNameModal = ref(true)

const stops = ref([])
const saving = ref(false)

const coordinates = computed(() => stops.value.map((stop) => [stop.latitude, stop.longitude]))

function goBack() {
  router.push('/driver/route')
}

function openNameModal() {
  draftRouteName.value = routeName.value
  showNameModal.value = true
}

function closeNameModal() {
  if (!routeName.value.trim()) return
  showNameModal.value = false
}

function applyRouteName() {
  const name = draftRouteName.value.trim()
  if (!name) return
  routeName.value = name
  showNameModal.value = false
}

function onMapClick(event) {
  if (!routeName.value.trim()) {
    showNameModal.value = true
    return
  }

  const lat = Number(event?.latlng?.lat)
  const lng = Number(event?.latlng?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

  stops.value.push({
    localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `Durak ${stops.value.length + 1}`,
    latitude: lat,
    longitude: lng,
  })
}

function removeStop(index) {
  stops.value.splice(index, 1)
  stops.value = stops.value.map((stop, idx) => ({
    ...stop,
    name: `Durak ${idx + 1}`,
  }))
}

async function saveRoute() {
  if (!routeName.value.trim() || stops.value.length < 2) return

  saving.value = true
  try {
    await api.post('/tenant/routes', {
      name: routeName.value.trim(),
      type: 'SHUTTLE',
      source: 'DRIVER',
      status: 'DRAFT',
      stops: stops.value.map((stop, index) => ({
        name: stop.name || `Durak ${index + 1}`,
        latitude: stop.latitude,
        longitude: stop.longitude,
      })),
    })

    router.push('/driver/route')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  const selected = localStorage.getItem('driver_last_location')
  if (!selected) return
  try {
    const parsed = JSON.parse(selected)
    if (Array.isArray(parsed) && parsed.length === 2) {
      center.value = [Number(parsed[0]), Number(parsed[1])]
    }
  } catch {
    // ignore local cache parse errors
  }
})
</script>

<style>
.leaflet-control-zoom,
.leaflet-control-attribution {
  display: none !important;
}
</style>
