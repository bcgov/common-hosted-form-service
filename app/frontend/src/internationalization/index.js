import VueI18n from 'vue-i18n';
import Vue from 'vue';

import ar from '@/internationalization/trans/chefs/ar';
import en from '@/internationalization/trans/chefs/en';
import es from '@/internationalization/trans/chefs/es';
import fa from '@/internationalization/trans/chefs/fa';
import fr from '@/internationalization/trans/chefs/fr';
import hi from '@/internationalization/trans/chefs/hi';
import ja from '@/internationalization/trans/chefs/ja';
import ko from '@/internationalization/trans/chefs/ko';
import pa from '@/internationalization/trans/chefs/pa';
import ru from '@/internationalization/trans/chefs/ru';
import tl from '@/internationalization/trans/chefs/tl';
import uk from '@/internationalization/trans/chefs/uk';
import vi from '@/internationalization/trans/chefs/vi';
import zh from '@/internationalization/trans/chefs/zh';
import zhTW from '@/internationalization/trans/chefs/zhTW';

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
