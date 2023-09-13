import NProgress from 'nprogress';
import { createRouter, createWebHistory } from 'vue-router';

import i18n from '~/internationalization';
import { formService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { IdentityMode, IdentityProviders } from '~/utils/constants';

let isFirstTransition = true;
let router = undefined;

/**
 * @function createProps
 * Parses the route query and params to generate vue props
 * @param {object} route The route object
 * @returns {object} a Vue props object
 */
const createProps = (route) => ({ ...route.query, ...route.params });

/**
 * @function getErrorMessage
 * Gets the message to display for preflight errors. Expand this to add
 * friendlier messages for other errors.
 * @param {Object} options - The Object containing preflight request details.
 * @param {Error} error - The error that was produced.
 * @returns {string|undefined} - The error message to display, or undefined to
 *    use the default message.
 */
function getErrorMessage(options, error) {
  let errorMessage = undefined;
  if (options.formId) {
    const status = error?.response?.status;
    if (status === 404 || status === 422) {
      errorMessage = i18n.tc('trans.permissionUtils.formNotAvailable');
    }
  }
  return errorMessage;
}

/**
 * @function preFlightAuth
 * Determines whether to enter a route based on user authentication state and idpHint
 * @param {Object} options Object containing either a formId or submissionId attribute
 * @param {Object} next The callback function
 */
export async function preFlightAuth(options = {}, next) {
  const notificationStore = useNotificationStore();
  // Support lambda functions (Consider making them util functions?)
  const getIdpHint = (values) => {
    return Array.isArray(values) && values.length ? values[0] : undefined;
  };
  const isValidIdp = (value) =>
    Object.values(IdentityProviders).includes(value);

  // Determine current form or submission idpHint if available
  let idpHint = undefined;
  try {
    if (options.formId) {
      const { data } = await formService.readFormOptions(options.formId);
      idpHint = getIdpHint(data.idpHints);
    } else if (options.submissionId) {
      const { data } = await formService.getSubmissionOptions(
        options.submissionId
      );
      idpHint = getIdpHint(data.form.idpHints);
    } else {
      throw new Error(
        i18n.tc('trans.permissionUtils.missingFormIdAndSubmssId')
      );
    }
  } catch (error) {
    // Halt user with error page, use alertNavigate for "friendly" messages.
    const message = getErrorMessage(options, error);
    if (message) {
      // Don't display the 'An error has occurred...' popup notification.
      notificationStore.alertNavigate(
        'error',
        i18n.tc('trans.permissionUtils.formNotAvailable')
      );
    } else {
      notificationStore.addNotification({
        text: i18n.tc('trans.permissionUtils.loadingFormErrMsg'),
        consoleError: i18n.tc('trans.permissionUtils.loadingForm', {
          options: options,
          error: error,
        }),
      });
      notificationStore.errorNavigate();
    }

    return; // Short circuit this function - no point executing further logic
  }

  const authStore = useAuthStore();

  if (authStore.authenticated) {
    const userIdp = authStore.identityProvider;

    if (idpHint === IdentityMode.PUBLIC || !idpHint) {
      next(); // Permit navigation if public or team form
    } else if (isValidIdp(idpHint) && userIdp === idpHint) {
      next(); // Permit navigation if idps match
    } else {
      const msg = i18n.t('trans.permissionUtils.idpHintMsg', {
        idpHint: idpHint.toUpperCase(),
      });
      notificationStore.addNotification({
        text: msg,
        consoleError: msg,
      });
      notificationStore.errorNavigate(msg);
    }
  } else {
    if (idpHint === IdentityMode.PUBLIC) {
      next(); // Permit navigation if public form
    } else if (isValidIdp(idpHint)) {
      authStore.login(idpHint); // Force login flow with specified idpHint
    } else {
      authStore.login(); // Force login flow with user choice
    }
  }
}

/**
 * @function getRouter
 * Constructs and returns a Vue Router object
 * @param {string} [basePath='/'] the base server path
 * @returns {object} a Vue Router object
 */
export default function getRouter(basePath = '/') {
  // Return existing router object if already instantiated
  if (router) return router;

  // Create new router definition
  router = createRouter({
    history: createWebHistory(basePath),
    routes: [
      {
        path: '/',
        name: 'Home',
        redirect: { name: 'About' },
      },
      {
        path: '/',
        name: 'About',
        component: () => import('~/views/About.vue'),
        meta: {
          hasLogin: true,
        },
      },
      {
        path: '/admin',
        component: () => import('~/views/Admin.vue'),
        children: [
          {
            path: '',
            name: 'Admin',
            component: () => import('~/views/admin/Root.vue'),
          },
          {
            path: 'form',
            name: 'AdministerForm',
            component: () => import('~/views/admin/Form.vue'),
            props: createProps,
          },
          {
            path: 'user',
            name: 'AdministerUser',
            component: () => import('~/views/admin/User.vue'),
            props: createProps,
          },
        ],
        meta: {
          requiresAuth: true,
          hasLogin: true,
        },
      },
      {
        path: '/form',
        component: () => import('~/views/Form.vue'),
        children: [
          {
            path: 'create',
            name: 'FormCreate',
            component: () => import('~/views/form/Create.vue'),
            meta: {
              breadcrumbTitle: 'Form Designer',
              requiresAuth: IdentityProviders.IDIR,
              hasLogin: true,
            },
          },
          {
            path: 'design',
            name: 'FormDesigner',
            component: () => import('~/views/form/Design.vue'),
            meta: {
              breadcrumbTitle: 'Form Designer',
              requiresAuth: IdentityProviders.IDIR,
              hasLogin: true,
            },
            props: (route) => {
              return {
                ...route.query,
                ...route.params,
                nv:
                  String(route.query.nv).toLowerCase() === 'true' ||
                  route.query.nv === true,
                sv:
                  String(route.query.sv).toLowerCase() === 'true' ||
                  route.query.sv === true,
              };
            },
          },
          {
            path: 'export',
            name: 'SubmissionsExport',
            component: () => import('~/views/form/Export.vue'),
            meta: {
              breadcrumbTitle: 'Submissions Export',
              requiresAuth: true,
              hasLogin: true,
            },
            props: createProps,
          },
          {
            path: 'manage',
            name: 'FormManage',
            component: () => import('~/views/form/Manage.vue'),
            meta: {
              breadcrumbTitle: 'Manage Form',
              requiresAuth: IdentityProviders.IDIR,
              hasLogin: true,
            },
            props: createProps,
          },
          {
            path: 'preview',
            name: 'FormPreview',
            component: () => import('~/views/form/Preview.vue'),
            meta: {
              breadcrumbTitle: 'Preview Form',
              formSubmitMode: true,
              requiresAuth: IdentityProviders.IDIR,
              hasLogin: true,
            },
            props: createProps,
          },
          {
            path: 'submissions',
            name: 'FormSubmissions',
            component: () => import('~/views/form/Submissions.vue'),
            meta: {
              breadcrumbTitle: 'Submissions',
              requiresAuth: IdentityProviders.IDIR,
              hasLogin: true,
            },
            props: createProps,
          },
          {
            path: 'submit',
            name: 'FormSubmit',
            component: () => import('~/views/form/Submit.vue'),
            meta: {
              breadcrumbTitle: 'Submit Form',
              formSubmitMode: true,
            },
            props: createProps,
            beforeEnter(to, _from, next) {
              preFlightAuth({ formId: to.query.f }, next);
            },
          },
          {
            path: 'success',
            name: 'FormSuccess',
            component: () => import('~/views/form/Success.vue'),
            meta: {
              breadcrumbTitle: 'Submit Success',
              formSubmitMode: true,
            },
            props: createProps,
            beforeEnter(to, _from, next) {
              preFlightAuth({ submissionId: to.query.s }, next);
            },
          },
          {
            path: 'teams',
            name: 'FormTeams',
            component: () => import('~/views/form/Teams.vue'),
            meta: {
              breadcrumbTitle: 'Team Management',
              requiresAuth: IdentityProviders.IDIR,
              hasLogin: true,
            },
            props: createProps,
          },
          {
            path: 'view',
            name: 'FormView',
            component: () => import('~/views/form/View.vue'),
            meta: {
              breadcrumbTitle: 'View Submission',
              requiresAuth: true,
              hasLogin: true,
              formSubmitMode: true,
            },
            props: createProps,
          },
        ],
      },
      {
        path: '/user',
        component: () => import('~/views/User.vue'),
        children: [
          {
            path: '',
            name: 'User',
            component: () => import('~/views/user/Root.vue'),
            meta: {
              requiresAuth: true,
            },
          },
          {
            path: 'draft',
            name: 'UserFormDraftEdit',
            component: () => import('~/views/user/SubmissionDraftEdit.vue'),
            meta: {
              breadcrumbTitle: 'Edit Draft',
              formSubmitMode: true,
            },
            props: (route) => {
              return {
                ...route.query,
                ...route.params,
                sv:
                  String(route.query.sv).toLowerCase() === 'true' ||
                  route.query.sv === true,
              };
            },
            beforeEnter(to, _from, next) {
              preFlightAuth({ submissionId: to.query.s }, next);
            },
          },
          {
            path: 'duplicate',
            name: 'UserFormDuplicate',
            component: () => import('~/views/user/SubmissionDuplicate.vue'),
            meta: {
              breadcrumbTitle: 'Create from existing',
              formSubmitMode: true,
            },
            props: createProps,
            beforeEnter(to, _from, next) {
              preFlightAuth(
                { submissionId: to.query.s, formId: to.query.f, sv: true },
                next
              );
            },
          },
          {
            path: 'forms',
            name: 'UserForms',
            component: () => import('~/views/user/Forms.vue'),
            meta: {
              breadcrumbTitle: 'My Forms',
              requiresAuth: IdentityProviders.IDIR,
            },
          },
          {
            path: 'history',
            name: 'UserHistory',
            component: () => import('~/views/user/History.vue'),
            meta: {
              breadcrumbTitle: 'History',
              requiresAuth: true,
            },
          },
          {
            path: 'submissions',
            name: 'UserSubmissions',
            component: () => import('~/views/user/Submissions.vue'),
            meta: {
              breadcrumbTitle: 'Previous Submissions',
              formSubmitMode: true,
            },
            props: createProps,
            beforeEnter(to, _from, next) {
              preFlightAuth({ formId: to.query.f }, next);
            },
          },
          {
            path: 'view',
            name: 'UserFormView',
            component: () => import('~/views/user/SubmissionView.vue'),
            meta: {
              breadcrumbTitle: 'Submission',
              formSubmitMode: true,
            },
            props: createProps,
            beforeEnter(to, _from, next) {
              preFlightAuth({ submissionId: to.query.s }, next);
            },
          },
        ],
      },
      {
        path: '/alert',
        name: 'Alert',
        component: () => import('~/components/bcgov/BCGovAlertBanner.vue'),
        meta: {
          formSubmitMode: true,
          hasLogin: true,
        },
        props: createProps,
      },
      {
        path: '/error',
        name: 'Error',
        component: () => import('~/views/Error.vue'),
        meta: {
          formSubmitMode: true,
          hasLogin: true,
        },
        props: createProps,
      },
      {
        path: '/login',
        name: 'Login',
        component: () => import('~/views/Login.vue'),
        props: true,
        beforeEnter(to, from, next) {
          // Block navigation to login page if already authenticated
          NProgress.done();
          const authStore = useAuthStore();
          if (authStore.authenticated) next('/');
          else next();
        },
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('~/views/NotFound.vue'),
        meta: {
          hasLogin: true,
        },
      },
    ],
  });

  router.beforeEach((to, from, next) => {
    NProgress.start();

    const authStore = useAuthStore();

    if (isFirstTransition) {
      // Always call rbac/current if authenticated and on first page load
      if (authStore?.ready && authStore?.authenticated) {
        const formStore = useFormStore();
        formStore.getFormsForCurrentUser();
      }

      // Handle proper redirections on first page load
      if (to.query.r) {
        router.replace({
          path: to.query.r.replace(basePath, ''),
          query: (({ r, ...q }) => q)(to.query), // eslint-disable-line no-unused-vars
        });
      }
    }

    // Force login redirect if not authenticated
    // Note some pages (Submit and Success) only require auth if the form being loaded is secured
    // in those cases, see the beforeEnter navigation guards for auth loop determination
    if (
      to.matched.some((route) => route.meta.requiresAuth) &&
      authStore.ready &&
      !authStore.authenticated
    ) {
      const redirectUri =
        location.origin + basePath + to.path + location.search;
      authStore.redirectUri = redirectUri;

      // Determine what kind of redirect behavior is needed
      let idpHint = undefined;
      if (typeof to.meta.requiresAuth === 'string') {
        idpHint = to.meta.requiresAuth;
      }
      authStore.login(idpHint);
    }

    // Update document title if applicable
    document.title = to.meta.title ? to.meta.title : import.meta.env.VITE_TITLE;
    next();
  });

  router.afterEach(() => {
    isFirstTransition = false;
    NProgress.done();
  });

  return router;
}
