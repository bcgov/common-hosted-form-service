import { createVuetify } from 'vuetify';

export default createVuetify({
  defaultAssets: {
    font: true,
    icons: 'md',
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
