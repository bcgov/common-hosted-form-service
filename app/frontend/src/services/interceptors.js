import axios from 'axios';
import { useAppConfig } from '@src/main';

/**
 * @function appAxios
 * Returns an Axios instance with auth header and preconfiguration
 * @param {integer} [timeout=10000] Number of milliseconds before timing out the request
 * @returns {object} An axios instance
 */
export function appAxios(timeout = 10000) {
  const { globalProperties } = useAppConfig();
  const axiosOptions = { timeout: timeout };
  if (globalProperties.$config) {
    const config = globalProperties.$config;
    axiosOptions.baseURL = `${config.basePath}/${config.apiPath}`;
  }

  const instance = axios.create(axiosOptions);

  instance.interceptors.request.use(
    (cfg) => {
      if (
        globalProperties.$keycloak &&
        globalProperties.$keycloak.ready &&
        globalProperties.$keycloak.authenticated
      ) {
        cfg.headers.Authorization = `Bearer ${globalProperties.$keycloak.token}`;
      }
      return Promise.resolve(cfg);
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
}
