import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router.js';
import { vuetify } from './plugins/vuetify.js';
import 'vuetify/styles';
import './styles/app.css';

createApp(App).use(router).use(vuetify).mount('#app');
