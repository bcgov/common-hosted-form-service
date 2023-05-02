import axios from 'axios';
import { getCurrentInstance } from 'vue';

/**
 * @function appAxios
 * Returns an Axios instance with auth header and preconfiguration
 * @param {integer} [timeout=10000] Number of milliseconds before timing out the request
 * @returns {object} An axios instance
 */
export function appAxios(timeout = 10000) {
  const axiosOptions = { timeout: timeout };
  if (getCurrentInstance().config.globalProperties.$config) {
    const config = getCurrentInstance().config.globalProperties.$config;
    axiosOptions.baseURL = `${config.basePath}/${config.apiPath}`;
  }

  const instance = axios.create(axiosOptions);

  instance.interceptors.request.use(
    (cfg) => {
      console.log(getCurrentInstance());
      if (
        getCurrentInstance().config.globalProperties.$keycloak &&
        getCurrentInstance().config.globalProperties.$keycloak.ready &&
        getCurrentInstance().config.globalProperties.$keycloak.authenticated
      ) {
        cfg.headers.Authorization = `Bearer ${
          getCurrentInstance().config.globalProperties.$keycloak.token
        }`;
      }
      return Promise.resolve(cfg);
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
}
