import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { fa } from 'vuetify/iconsets/fa';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import { VDataTable } from 'vuetify/labs/VDataTable';
import { VSkeletonLoader } from 'vuetify/labs/VSkeletonLoader';

const chefsTheme = {
  dark: false,
  colors: {
    primary: '#003366',
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
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
      fa,
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
    VSkeletonLoader,
  },
  directives,
});
