import axios from 'axios';
import { useAuthStore } from '~/store/auth';
import { useAppStore } from '~/store/app';
import { useTenantStore } from '~/store/tenant';

/**
 * @function appAxios
 * Returns an Axios instance with auth header and preconfiguration
 * @param {string} [version='v1'] The API version to use (v1, v2, etc.)
 * @param {integer} [timeout=60000] Number of milliseconds before timing out the request
 * @returns {object} An axios instance
 */
export function appAxios(version = 'v1', timeout = 60000) {
  // Handle case where first argument is a number (backward compatibility for timeout-only calls)
  if (typeof version === 'number') {
    timeout = version;
    version = 'v1';
  }
  // 2024-01-12 Urgent timeout increase from 10000 to help with performance.
  const appStore = useAppStore();
  const axiosOptions = { timeout: timeout };
  if (appStore.config) {
    axiosOptions.baseURL = `${appStore.config.basePath}/${appStore.config.apiPath}/${version}`;
  }

  const instance = axios.create(axiosOptions);

  const authStore = useAuthStore();
  const tenantStore = useTenantStore();

  instance.interceptors.request.use(
    (cfg) => {
      if (authStore?.ready && authStore?.authenticated) {
        cfg.headers.Authorization = `Bearer ${authStore.keycloak.token}`;
      }

      // Add tenant ID header if tenant is selected
      // EXCLUDE all requests from public/submitter routes — these pages operate
      // outside tenant scope (form submission, submission viewing, draft editing)
      const noTenantHeaderPaths = [
        '/form/submit',
        '/form/success',
        '/user/view',
        '/user/draft',
        '/user/duplicate',
      ];
      const isNoTenantRoute = noTenantHeaderPaths.some((p) =>
        globalThis.location.pathname.includes(p)
      );

      if (tenantStore?.selectedTenant?.id && !isNoTenantRoute) {
        cfg.headers['x-tenant-id'] = tenantStore.selectedTenant.id;
      }
      return Promise.resolve(cfg);
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 503) {
        window.dispatchEvent(
          new CustomEvent('service-unavailable', {
            detail: error.response?.data?.details || error,
          })
        );
      }
      return Promise.reject(error);
    }
  );

  return instance;
}
