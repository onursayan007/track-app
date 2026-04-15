import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import 'leaflet/dist/leaflet.css';
import App from './App.vue'

console.log('Creating Vue app...');
const app = createApp(App)
console.log('App created.');

console.log('Creating Pinia...');
const pinia = createPinia()
console.log('Pinia created.');

console.log('Using Pinia...');
app.use(pinia)
console.log('Pinia used.');

console.log('Using router...');
app.use(router)
console.log('Router used.');

console.log('Mounting app...');
app.mount('#app')
console.log('App mounted.');
