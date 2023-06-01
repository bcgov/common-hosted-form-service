import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import hi from '@/internationalization/trans/vuetify/locale/hi';
import pa from '@/internationalization/trans/vuetify/locale/pa';
import tl from '@/internationalization/trans/vuetify/locale/tl';
import zhHans from 'vuetify/lib/locale/zh-Hans';
import zhHant from 'vuetify/lib/locale/zh-Hant';
import vi from 'vuetify/lib/locale/vi';
import uk from 'vuetify/lib/locale/uk';
import ru from 'vuetify/lib/locale/ru';
import pt from 'vuetify/lib/locale/pt';
import ko from 'vuetify/lib/locale/ko';
import ja from 'vuetify/lib/locale/ja';
import it from 'vuetify/lib/locale/it';
import fr from 'vuetify/lib/locale/fr';
import fa from 'vuetify/lib/locale/fa';
import de from 'vuetify/lib/locale/de';
import en from 'vuetify/lib/locale/en';
import es from 'vuetify/lib/locale/es';
import ar from 'vuetify/lib/locale/ar';

Vue.use(Vuetify);

export default new Vuetify({
  defaultAssets: {
    font: true,
    icons: 'md',
  },
  lang: {
    locales: {
      zhHans,
      zhHant,
      pt,
      vi,
      uk,
      ru,
      ko,
      ja,
      it,
      fr,
      fa,
      de,
      en,
      es,
      ar,
      hi,
      pa,
      tl,
    },
    current: 'en',
  },
  icons: {
    iconfont: 'md',
  },
  theme: {
    options: {
      customProperties: true,
    },
    themes: {
      light: {
        primary: '#003366',
        secondary: '#FCBA19',
        anchor: '#1A5A96',
        accent: '#82B1FF',
        error: '#D8292F',
        info: '#2196F3',
        success: '#2E8540',
        warning: '#FFC107',
      },
    },
  },
});
