<template>
  <div class="flex flex-col gap-6 text-slate-300">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">Finans ve Raporlar</h1>
        <p class="text-slate-400 mt-1 text-sm">Gelir, gider ve operasyonel raporlarınızı tek panelden inceleyin.</p>
      </div>
      <button @click="fetchFinance" :disabled="isLoading" class="bg-slate-800 border border-slate-700 hover:border-orange-500/50 text-slate-300 hover:text-orange-400 text-sm font-medium rounded-xl px-4 py-2.5 transition-all disabled:opacity-50">
        Yenile
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <p class="text-xs font-medium text-slate-400 mb-1">Toplam Gelir</p>
        <p class="text-2xl font-black text-emerald-400">{{ formatCurrency(summary.totalIncome) }}</p>
        <p class="text-xs text-slate-500 mt-2">Bu ay</p>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <p class="text-xs font-medium text-slate-400 mb-1">Toplam Gider</p>
        <p class="text-2xl font-black text-rose-400">{{ formatCurrency(summary.totalExpense) }}</p>
        <p class="text-xs text-slate-500 mt-2">Bu ay</p>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <p class="text-xs font-medium text-slate-400 mb-1">Net Kâr</p>
        <p :class="['text-2xl font-black', summary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400']">{{ formatCurrency(summary.netProfit) }}</p>
        <p class="text-xs text-slate-500 mt-2">Gelir – Gider</p>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <p class="text-xs font-medium text-slate-400 mb-1">Bekleyen Fatura</p>
        <p class="text-2xl font-black text-amber-400">{{ summary.pendingInvoices }}</p>
        <p class="text-xs text-slate-500 mt-2">Ödenmemiş</p>
      </div>
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div class="p-6 border-b border-slate-800 flex justify-between items-center">
        <h2 class="text-lg font-bold text-white">Aylık Gelir/Gider ({{ chartYear }})</h2>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-12 gap-3 items-end h-64 w-full">
          <div v-for="item in chartData" :key="item.month" class="flex flex-col items-center gap-1">
            <div class="w-full flex items-end justify-center gap-1 h-52">
              <div class="w-3 sm:w-4 rounded-t bg-emerald-500/90" :style="{ height: `${barHeight(item.income)}px` }" title="Gelir"></div>
              <div class="w-3 sm:w-4 rounded-t bg-rose-500/90" :style="{ height: `${barHeight(item.expense)}px` }" title="Gider"></div>
            </div>
            <span class="text-[10px] text-slate-500 font-medium">{{ item.label }}</span>
          </div>
        </div>
        <div class="mt-4 flex items-center gap-4 text-xs text-slate-400">
          <span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded bg-emerald-500/90"></span> Gelir</span>
          <span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded bg-rose-500/90"></span> Gider</span>
        </div>
      </div>
    </div>

    <div class="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div class="p-6 border-b border-slate-800">
        <h2 class="text-lg font-bold text-white">Son İşlemler</h2>
      </div>
      <div class="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <table class="w-full min-w-[700px] text-sm text-left">
          <thead class="bg-slate-800/50">
            <tr>
              <th class="py-4 pl-6 pr-3 font-bold text-slate-400 uppercase tracking-wider text-xs">Açıklama</th>
              <th class="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Kategori</th>
              <th class="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Tarih</th>
              <th class="py-4 pl-3 pr-6 text-right font-bold text-slate-400 uppercase tracking-wider text-xs">Tutar</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/50">
            <tr v-for="tx in transactions" :key="tx.id" class="hover:bg-slate-800/40 transition-colors">
              <td class="py-4 pl-6 pr-3 text-white font-medium">{{ tx.description }}</td>
              <td class="px-4 py-4"><span class="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">{{ tx.category }}</span></td>
              <td class="px-4 py-4 text-slate-400">{{ formatDateTime(tx.date) }}</td>
              <td :class="['py-4 pl-3 pr-6 text-right font-mono font-bold', tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400']">{{ tx.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}</td>
            </tr>
            <tr v-if="!transactions.length && !isLoading">
              <td colspan="4" class="py-16 text-center text-slate-500">Bu döneme ait işlem bulunamadı.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div class="p-6 border-b border-slate-800">
        <h2 class="text-lg font-bold text-white">Müşteri Tahakkukları</h2>
      </div>
      <div class="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <table class="w-full min-w-[760px] text-sm text-left">
          <thead class="bg-slate-800/50">
            <tr>
              <th class="py-4 pl-6 pr-3 font-bold text-slate-400 uppercase tracking-wider text-xs">Müşteri</th>
              <th class="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-xs">Vergi No</th>
              <th class="px-4 py-4 text-right font-bold text-slate-400 uppercase tracking-wider text-xs">Aylık Ödenek</th>
              <th class="px-4 py-4 text-center font-bold text-slate-400 uppercase tracking-wider text-xs">Rota</th>
              <th class="px-4 py-4 text-right font-bold text-slate-400 uppercase tracking-wider text-xs">Bu Ay Gelir</th>
              <th class="py-4 pl-3 pr-6 text-right font-bold text-slate-400 uppercase tracking-wider text-xs"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/50">
            <tr v-for="item in clientAccruals" :key="item.clientId" class="hover:bg-slate-800/40 transition-colors">
              <td class="py-4 pl-6 pr-3 text-white font-medium">{{ item.clientName }}</td>
              <td class="px-4 py-4 text-slate-300 font-mono">{{ item.taxNumber }}</td>
              <td class="px-4 py-4 text-right text-amber-300 font-mono font-semibold">{{ formatCurrency(item.monthlyAllowance) }}</td>
              <td class="px-4 py-4 text-center text-slate-300">{{ item.routeCount }}</td>
              <td class="px-4 py-4 text-right text-emerald-400 font-mono font-bold">{{ formatCurrency(item.invoiceTargetAmount) }}</td>
              <td class="py-4 pl-3 pr-6 text-right">
                <div class="inline-flex items-center gap-2">
                  <button @click="downloadClientInvoicePdf(item)" :disabled="downloadingClientId === item.clientId" class="px-3 py-1.5 rounded-lg bg-slate-700/40 border border-slate-600 text-slate-200 hover:bg-slate-700/70 font-semibold text-xs disabled:opacity-60">
                    {{ downloadingClientId === item.clientId ? 'Hazırlanıyor...' : 'PDF İndir' }}
                  </button>
                  <button @click="sendClientInvoice(item)" :disabled="sendingClientId === item.clientId" class="px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30 font-semibold text-xs disabled:opacity-60">
                    {{ sendingClientId === item.clientId ? 'Gönderiliyor...' : 'E-posta ile Fatura Gönder' }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!clientAccruals.length && !isLoading">
              <td colspan="6" class="py-14 text-center text-slate-500">Bu ay müşteri tahakkuku bulunamadı.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="isLoading" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl px-6 py-4 shadow-2xl">
        <svg class="animate-spin h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        <span class="text-sm text-white font-medium">Finansal veriler yükleniyor...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api from '../services/api';

const isLoading = ref(false);
const chartYear = ref(new Date().getFullYear());

const summary = reactive({
  totalIncome: 0,
  totalExpense: 0,
  netProfit: 0,
  pendingInvoices: 0,
});

const chartData = ref([]);
const transactions = ref([]);
const clientAccruals = ref([]);
const sendingClientId = ref('');
const downloadingClientId = ref('');

const chartMax = computed(() => {
  const maxValue = chartData.value.reduce((max, item) => {
    return Math.max(max, Number(item.income || 0), Number(item.expense || 0));
  }, 0);
  return maxValue > 0 ? maxValue : 1;
});

function barHeight(value) {
  return Math.max(4, Math.round((Number(value || 0) / chartMax.value) * 208));
}

function formatCurrency(val) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(val ?? 0);
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
}

async function fetchFinance() {
  isLoading.value = true;
  try {
    const [summaryRes, chartRes, txRes, clientSummaryRes] = await Promise.all([
      api.get('/tenant/finance/summary'),
      api.get('/tenant/finance/chart'),
      api.get('/tenant/finance/transactions'),
      api.get('/tenant/finance/client-summary'),
    ]);

    const summaryData = summaryRes.data?.data ?? {};
    summary.totalIncome = Number(summaryData.totalIncome || 0);
    summary.totalExpense = Number(summaryData.totalExpense || 0);
    summary.netProfit = Number(summaryData.netProfit || 0);
    summary.pendingInvoices = Number(summaryData.pendingInvoices || 0);

    const chartPayload = chartRes.data?.data ?? {};
    chartYear.value = Number(chartPayload.year || new Date().getFullYear());
    chartData.value = Array.isArray(chartPayload.data) ? chartPayload.data : [];

    const txPayload = txRes.data?.data ?? [];
    transactions.value = Array.isArray(txPayload) ? txPayload : [];

    const clientPayload = clientSummaryRes.data?.data?.data ?? clientSummaryRes.data?.data ?? [];
    clientAccruals.value = Array.isArray(clientPayload) ? clientPayload : [];
  } catch (error) {
    console.warn('Finans verileri alınamadı:', error?.message || error);
    chartData.value = [];
    transactions.value = [];
    clientAccruals.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function sendClientInvoice(client) {
  sendingClientId.value = client.clientId;
  try {
    await api.post(`/tenant/finance/client-invoices/${client.clientId}/send`, {
      amount: Number(client.invoiceTargetAmount || 0),
    });
    window.alert(`${client.clientName} için fatura e-postası gönderildi.`);
    await fetchFinance();
  } catch (error) {
    const msg = error.response?.data?.message || error.message || 'Fatura e-postası gönderilemedi.';
    window.alert(msg);
  } finally {
    sendingClientId.value = '';
  }
}

async function downloadClientInvoicePdf(client) {
  downloadingClientId.value = client.clientId;
  try {
    const response = await api.get(`/tenant/finance/client-invoices/${client.clientId}/pdf`, {
      params: { amount: Number(client.invoiceTargetAmount || 0) },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (client.clientName || 'musteri').replace(/\s+/g, '-').toLowerCase();
    link.href = url;
    link.download = `${safeName}-tahakkuk.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    const msg = error.response?.data?.message || error.message || 'PDF indirilemedi.';
    window.alert(msg);
  } finally {
    downloadingClientId.value = '';
  }
}

onMounted(() => {
  fetchFinance();
});
</script>
