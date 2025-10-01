import 'nprogress/nprogress.css';
import '@bcgov/bc-sans/css/BCSans.css';
import '~/assets/scss/style.scss';

import axios from 'axios';
import Keycloak from 'keycloak-js';
import NProgress from 'nprogress';
import { createPinia } from 'pinia';
import { createApp, h } from 'vue';

import App from '~/App.vue';

import { formatDate, formatDateLong } from '~/filters';
import i18n from '~/internationalization';
import vuetify from '~/plugins/vuetify';
import getRouter from '~/router';
import { useAuthStore } from '~/store/auth';
import { useAppStore } from '~/store/app';
import { assertOptions, getConfig, sanitizeConfig } from '~/utils/keycloak';
import { rbacService } from './services';
import { useIdpStore } from '~/store/identityProviders';

let keycloak = null;
const pinia = createPinia();

const app = createApp({
  setup() {
    const { t } = useI18n();
    return { t };
  },
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
import BcGovFormioComponents from '~/formio/lib';
import { Formio } from '@formio/vue';
Formio.use(BcGovFormioComponents);

/* import clipboard */
import Clipboard from 'vue3-clipboard';
import { useI18n } from 'vue-i18n';
app.use(Clipboard, {
  autoSetContainer: true,
  appendToBody: true,
});

app.use(pinia);
app.use(vuetify);

NProgress.configure({ showSpinner: false });
NProgress.start();

// Look into a better way of importing the BaseComponents
import BaseAuthButton from '~/components/base/BaseAuthButton.vue';
import BaseCopyToClipboard from '~/components/base/BaseCopyToClipboard.vue';
import BaseDialog from '~/components/base/BaseDialog.vue';
import BaseFilter from '~/components/base/BaseFilter.vue';
import BaseImagePopout from '~/components/base/BaseImagePopout.vue';
import BaseInfoCard from '~/components/base/BaseInfoCard.vue';
import BaseInternationalization from '~/components/base/BaseInternationalization.vue';
import BaseNotificationBar from '~/components/base/BaseNotificationBar.vue';
import BaseNotificationContainer from '~/components/base/BaseNotificationContainer.vue';
import BasePanel from '~/components/base/BasePanel.vue';
import BasePrintButton from '~/components/base/BasePrintButton.vue';
import BaseSecure from '~/components/base/BaseSecure.vue';
app.component('BaseAuthButton', BaseAuthButton);
app.component('BaseCopyToClipboard', BaseCopyToClipboard);
app.component('BaseDialog', BaseDialog);
app.component('BaseFilter', BaseFilter);
app.component('BaseImagePopout', BaseImagePopout);
app.component('BaseInfoCard', BaseInfoCard);
app.component('BaseInternationalization', BaseInternationalization);
app.component('BaseNotificationBar', BaseNotificationBar);
app.component('BaseNotificationContainer', BaseNotificationContainer);
app.component('BasePanel', BasePanel);
app.component('BasePrintButton', BasePrintButton);
app.component('BaseSecure', BaseSecure);

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
  if (!kcSuccess) return;

  app.use(i18n);

  const router = getRouter(basePath);
  app.use(router);
  router.app = app;

  app.mount('#app');

  axios.defaults.baseURL = import.meta.env.BASE_URL;

  NProgress.done();
}

/**
 * @function loadIdentityProviders
 * Load Identity Provider configuration from API Server/database - NOT from Keycloak.
 */
async function loadIdentityProviders() {
  const idpStore = useIdpStore();
  try {
    // Get data if it isn't already in session storage
    if (!idpStore.providers) {
      const { data } = await rbacService.getIdentityProviders({ active: true });
      idpStore.providers = Object.freeze(data);
    }
    return true;
  } catch (err) {
    idpStore.providers = undefined;
    return false;
  }
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
    const appStore = useAppStore();
    appStore.config = Object.freeze(config);

    const idpsLoaded = await loadIdentityProviders();
    if (!idpsLoaded) {
      throw new Error('Could not load Identity Provider configuration.');
    }

    if (
      !config ||
      !config.oidc ||
      !config.oidc.clientId ||
      !config.oidc.realm ||
      !config.oidc.serverUrl
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
  const defaultParams = {
    config: window.__BASEURL__ ? `${window.__BASEURL__}/config` : '/config',
    init: { onLoad: 'login-required' },
  };

  const options = Object.assign({}, defaultParams, {
    init: { pkceMethod: 'S256', checkLoginIframe: false, onLoad: 'check-sso' },
    config: {
      clientId: config.oidc.clientId,
      realm: config.oidc.realm,
      url: config.oidc.serverUrl,
    },
    onReady: () => {
      initializeApp(true, config.basePath);
    },
    onInitError: (error) => {
      console.error('Keycloak failed to initialize'); // eslint-disable-line no-console
      console.error(error); // eslint-disable-line no-console
    },
  });

  if (assertOptions(options).hasError)
    throw new Error(`Invalid options given: ${assertOptions(options).error}`);

  getConfig(options.config)
    .then((cfg) => {
      const ctor = sanitizeConfig(cfg);

      const authStore = useAuthStore();
      authStore.logoutUrl = config.oidc.logoutUrl;

      keycloak = new Keycloak(ctor);
      keycloak.onReady = (authenticated) => {
        authStore.updateKeycloak(keycloak, authenticated);
        authStore.ready = true;
        typeof options.onReady === 'function' && options.onReady();
      };

      let updateTokenInterval;
      // The expired token is also used for general update token failures
      // i.e., network disconnection
      let expiredTokenInterval;

      function updateToken(seconds) {
        keycloak
          .updateToken(seconds)
          .then((refreshed) => {
            if (refreshed) {
              if (expiredTokenInterval) clearInterval(expiredTokenInterval);
            } else {
              // token is still valid
            }
          })
          .catch(() => {
            // We're failing to update the token
          });
      }

      keycloak.onAuthSuccess = () => {
        // Check token validity every 10 seconds (10 000 ms) and, if necessary, update the token.
        // Refresh token if it's valid for less then 60 seconds
        updateTokenInterval = setInterval(async () => {
          updateToken(60);
        }, 10000);
        authStore.logoutFn = () => {
          clearInterval(updateTokenInterval);
          clearInterval(expiredTokenInterval);
          authStore.updateKeycloak(keycloak, false);
        };
      };
      keycloak.onTokenExpired = () => {
        if (!expiredTokenInterval) {
          expiredTokenInterval = setInterval(() => {
            updateToken(60);
          }, 10000);
        }
        updateToken(60);
      };
      keycloak.onAuthRefreshSuccess = () => {
        authStore.updateKeycloak(keycloak, true);
      };
      keycloak.onAuthLogout = () => {
        authStore.updateKeycloak(keycloak, false);
      };
      keycloak.init(options.init).catch((err) => {
        typeof options.onInitError === 'function' && options.onInitError(err);
      });
    })
    .catch((err) => {
      console.log(err); // eslint-disable-line no-console
    });
}
