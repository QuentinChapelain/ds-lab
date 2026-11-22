import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router.js';
import { vuetify } from './plugins/vuetify.js';
import 'vuetify/styles';

createApp(App).use(router).use(vuetify).mount('#app');
