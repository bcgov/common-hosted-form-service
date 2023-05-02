import VueI18n from 'vue-i18n';
import Vue from 'vue';

import en from '@/internationalization/en';
import fr from '@/internationalization/fr';

Vue.use(VueI18n);

const messages = {
  en: en,
  fr: fr,
};

console.log('+++++++---->> ', messages);

// Create VueI18n instance with options
export default new VueI18n({
  locale: 'en', // set locale
  messages, // set locale messages
});

// Create a Vue instance with `i18n` option
//new Vue({ i18n }).$mount('#app')
