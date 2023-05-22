import VueI18n from 'vue-i18n';
import Vue from 'vue';

import ar from '@/internationalization/ar';
import en from '@/internationalization/en';
import es from '@/internationalization/es';
import fa from '@/internationalization/fa';
import fr from '@/internationalization/fr';
import hi from '@/internationalization/hi';
import ja from '@/internationalization/ja';
import ko from '@/internationalization/ko';
import pa from '@/internationalization/pa';
import ru from '@/internationalization/ru';
import tl from '@/internationalization/tl';
import uk from '@/internationalization/uk';
import vi from '@/internationalization/vi';
import zh from '@/internationalization/zh';
import zhTW from '@/internationalization/zh-TW';

Vue.use(VueI18n);

const messages = {
  ar: ar,
  en: en,
  es: es,
  fa: fa,
  fr: fr,
  hi: hi,
  ja: ja,
  ko: ko,
  pa: pa,
  ru: ru,
  tl: tl,
  uk: uk,
  vi: vi,
  zh: zh,
  zhTW: zhTW,
};

// Create VueI18n instance with options
export default new VueI18n({
  locale: 'en', // set locale
  fallbackLocale: 'en',
  messages, // set locale messages
});

// Create a Vue instance with `i18n` option
//new Vue({ i18n }).$mount('#app')
