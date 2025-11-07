/**
 * Popup entry point - Initializes Vue app for the extension popup
 */

import { createApp } from 'vue';
import Popup from './popup.vue';

const app = createApp(Popup);
app.mount('#app');
