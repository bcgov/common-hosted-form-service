import NProgress from 'nprogress';
import { createRouter, createWebHistory } from 'vue-router';

import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { IdentityProviders } from '~/utils/constants';
import { preFlightAuth } from '~/utils/permissionUtils';

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
            path: 'publish',
            name: 'PublishForm',
            component: () => import('~/views/form/PublishForm.vue'),
            meta: {
              breadcrumbTitle: 'Publish Form',
              requiresAuth: IdentityProviders.IDIR,
              hasLogin: true,
            },
            props: (route) => {
              return {
                ...route.query,
                ...route.params,
                fd:
                  String(route.query.fd).toLowerCase() === 'true' ||
                  route.query.fd === true,
              };
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
            path: 'emails',
            name: 'FormEmails',
            component: () => import('~/views/form/Emails.vue'),
            meta: {
              breadcrumbTitle: 'Email Management',
              requiresAuth: IdentityProviders.IDIR,
              hasLogin: true,
            },
            props: createProps,
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
        path: '/file',
        component: () => import('~/views/File.vue'),
        children: [
          {
            path: 'download',
            name: 'Download',
            component: () => import('~/views/file/Download.vue'),
            meta: {
              requiresAuth: true,
              hasLogin: true,
            },
            props: createProps,
          },
        ],
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
    scrollBehavior(_to, _from, savedPosition) {
      return savedPosition ? savedPosition : { top: 0 };
    },
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
