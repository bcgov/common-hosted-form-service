import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { fa as FONTAWESOME } from 'vuetify/iconsets/fa';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import { VDataTable, VDataTableServer } from 'vuetify/labs/VDataTable';
import { VSkeletonLoader } from 'vuetify/labs/VSkeletonLoader';
import {
  VStepper,
  VStepperHeader,
  VStepperItem,
  VStepperWindow,
  VStepperWindowItem,
} from 'vuetify/labs/VStepper';
import hi from '~/internationalization/trans/vuetify/locale/hi';
import pa from '~/internationalization/trans/vuetify/locale/pa';
import tl from '~/internationalization/trans/vuetify/locale/tl';
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

const chefsTheme = {
  dark: false,
  colors: {
    primary: '#003366',
    'surface-variant': '#003366',
    secondary: '#FCBA19',
    anchor: '#1A5A96',
    accent: '#82B1FF',
    error: '#D8292F',
    info: '#2196F3',
    success: '#2E8540',
    warning: '#FFC107',
  },
};

export default createVuetify({
  defaultAssets: {
    font: true,
    icons: 'mdi',
  },
  locale: {
    locale: 'en',
    messages: {
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
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
      FONTAWESOME,
    },
  },
  theme: {
    defaultTheme: 'chefsTheme',
    options: {
      customProperties: true,
    },
    themes: {
      chefsTheme,
    },
  },
  components: {
    ...components,
    VDataTable,
    VDataTableServer,
    VSkeletonLoader,
    VStepper,
    VStepperHeader,
    VStepperItem,
    VStepperWindow,
    VStepperWindowItem,
  },
  directives,
});
