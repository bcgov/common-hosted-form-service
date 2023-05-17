import VueI18n from 'vue-i18n';
import Vue from 'vue';

import en from '@/internationalization/en';
import fr from '@/internationalization/fr';
import tl from '@/internationalization/tl';
import ru from '@/internationalization/ru';
import uk from '@/internationalization/uk';
import hi from '@/internationalization/hi';
import ja from '@/internationalization/ja';
import vi from '@/internationalization/vi';
import ar from '@/internationalization/ar';
import es from '@/internationalization/es';
import ko from '@/internationalization/ko';
import pa from '@/internationalization/pa';
import zh from '@/internationalization/zh';
import zhTW from '@/internationalization/zh-TW';

Vue.use(VueI18n);

const messages = {
  en: en,
  fr: fr,
  tl: tl,
  ru: ru,
  uk: uk,
  hi: hi,
  ja: ja,
  vi: vi,
  ar: ar,
  es: es,
  ko: ko,
  pa: pa,
  zh: zh,
  zhTW: zhTW,
};

// Create VueI18n instance with options
export default new VueI18n({
  locale: 'en', // set locale
  messages, // set locale messages
});

// Create a Vue instance with `i18n` option
//new Vue({ i18n }).$mount('#app')
