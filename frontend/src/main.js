import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

window.eventoGlobalPwa = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  window.eventoGlobalPwa = e;
});

createApp(App).mount('#app');
