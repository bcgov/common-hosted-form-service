import 'nprogress/nprogress.css';
import '@bcgov/bc-sans/css/BCSans.css';
import '@/assets/scss/style.scss';

import axios from 'axios';
import NProgress from 'nprogress';
import { createApp, h } from 'vue';

import App from '@/App.vue';
import { formatDate, formatDateLong } from '@/filters';
import auth from '@/store/modules/auth.js';
import getRouter from '@/router';
import store from '@/store';

// The Vue instance
const app = createApp({
  render: () => h(App),
});

app.config.globalProperties.$filters = {
  formatDate,
  formatDateLong,
};

// Add our custom components to the formio instance
// importing the main formio dependency (whether through vue-formio or directly)
// has to be done BEFORE the keycloak adapter for some reason or it breaks the keycloak library on non-Chromium MS Edge (or IE11).
// No idea why, probably a polyfill clash
import BcGovFormioComponents from '@/formio/lib';
import { Formio } from '@formio/vue';
Formio.use(BcGovFormioComponents);

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
/* add font awesome icon component */
app.component('FontAwesomeIcon', FontAwesomeIcon);

import VueKeycloakJs from '@/plugins/keycloak';
import vuetify from '@/plugins/vuetify';
app.use(vuetify);

/* import clipboard */
import Clipboard from 'vue3-clipboard';
app.use(Clipboard, {
  autoSetContainer: true,
  appendToBody: true,
});

// Globally register all components with base in the name
/*
const requireComponent = require.context(
  '@/components',
  true,
  /Base[A-Z]\w+\.(vue|js)$/
);
requireComponent.keys().forEach((fileName) => {
  const componentConfig = requireComponent(fileName);
  const componentName = fileName
    .split('/')
    .pop()
    .replace(/\.\w+$/, '');
  app.component(componentName, componentConfig.default || componentConfig);
});
*/
const modules = import.meta.glob('@/components/**/*.(vue|js)');
for (const path in modules) {
  if (path.includes('Base')) {
    modules[path]().then((mod) => {
      const componentName = mod.default.__file
        .split('/')
        .pop()
        .replace(/\.\w+$/, '');
      app.component(componentName, mod.default);
    });
  }
}

NProgress.configure({ showSpinner: false });
NProgress.start();

// IE11 Detection (https://stackoverflow.com/a/21825207)
if (!!window.MSInputMethodContext && !!document.documentMode) {
  document.write(`<div style="padding-top: 5em; text-align: center;">
    <h1>We're sorry but ${
      import.meta.env.VITE_TITLE
    } is not supported in Internet Explorer.</h1>
    <h1>Please use a modern browser instead (<a href="https://www.google.com/intl/en_ca/chrome/">Chrome</a>, <a href="https://www.mozilla.org/en-CA/firefox/">Firefox</a>, etc).</h1>
  </div>`);
  NProgress.done();
} else {
  loadConfig();
}

/**
 * @function initializeApp
 * Initializes and mounts the Vue instance
 * @param {boolean} [kcSuccess=false] is Keycloak initialized successfully?
 * @param {string} [basepath='/'] base server path
 */
function initializeApp(kcSuccess = false, basePath = '/') {
  if (kcSuccess && !store.hasModule('auth')) {
    store.registerModule('auth', auth(app));
  }

  const router = getRouter(basePath);
  app.use(router);
  router.app = app;
  app.use(store);

  app.mount('#app');

  NProgress.done();
}

/**
 * @function loadConfig
 * Acquires the configuration state from the backend server
 */
async function loadConfig() {
  // App publicPath is ./ - so use relative path here, will hit the backend server using relative path to root.
  const configUrl =
    import.meta.env.MODE === 'production'
      ? 'config'
      : `${import.meta.env.BASE_URL}/config`;
  const storageKey = 'config';
  try {
    // Get configuration if it isn't already in session storage
    if (sessionStorage.getItem(storageKey) === null) {
      const { data } = await axios.get(configUrl);
      sessionStorage.setItem(storageKey, JSON.stringify(data));
    }

    // Mount the configuration as a prototype for easier access from Vue
    const config = JSON.parse(sessionStorage.getItem(storageKey));
    app.config.globalProperties.$config = Object.freeze(config);

    if (
      !config ||
      !config.keycloak ||
      !config.keycloak.clientId ||
      !config.keycloak.realm ||
      !config.keycloak.serverUrl
    ) {
      throw new Error('Keycloak is misconfigured');
    }

    loadKeycloak(config);
  } catch (err) {
    sessionStorage.removeItem(storageKey);
    initializeApp(false); // Attempt to gracefully fail
    throw new Error(`Failed to acquire configuration: ${err.message}`);
  }
}

/**
 * @function loadKeycloak
 * Applies Keycloak authentication capabilities
 * @param {object} config A config object
 */
function loadKeycloak(config) {
  app.use(VueKeycloakJs, {
    init: { onLoad: 'check-sso' },
    config: {
      clientId: config.keycloak.clientId,
      realm: config.keycloak.realm,
      url: config.keycloak.serverUrl,
    },
    onReady: () => {
      initializeApp(true, config.basePath);
    },
    onInitError: (error) => {
      console.error('Keycloak failed to initialize'); // eslint-disable-line no-console
      console.error(error); // eslint-disable-line no-console
    },
  });
}
