import axios from 'axios';
import Vue from 'vue';

/**
 * @function appAxios
 * Returns an Axios instance with auth header and preconfiguration
 * @param {integer} [timeout=10000] Number of milliseconds before timing out the request
 * @returns {object} An axios instance
 */
export function appAxios(timeout = 10000) {
  const axiosOptions = { timeout: timeout };
  if (Vue.prototype.$config) {
    const config = Vue.prototype.$config;
    axiosOptions.baseURL = `${config.basePath}/${config.apiPath}`;
  }

  const instance = axios.create(axiosOptions);

  instance.interceptors.request.use(
    (cfg) => {
      if (
        Vue.prototype.$keycloak &&
        Vue.prototype.$keycloak.ready &&
        Vue.prototype.$keycloak.authenticated
      ) {
        cfg.headers.Authorization = `Bearer ${Vue.prototype.$keycloak.token}`;
      }
      return Promise.resolve(cfg);
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * @function subAxios
 * Returns an Axios instance with auth header for the subscribed endpoint
 * @param {string} endpointToken The token for the endpoint
 * @param {integer} [timeout=10000] Number of milliseconds before timing out the request
 * @returns {object} An axios instance
 */
export function subAxios(endpointToken, timeout = 10000) {
  const axiosOptions = { timeout: timeout };
  const instance = axios.create(axiosOptions);

  instance.interceptors.request.use(
    (cfg) => {
      cfg.headers.Authorization = `Bearer ${endpointToken}`;
      return Promise.resolve(cfg);
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
}