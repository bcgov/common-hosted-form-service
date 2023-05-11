import NProgress from 'nprogress';
import { createRouter, createWebHistory } from 'vue-router';

import store from '@src/store';
import { IdentityProviders } from '@src/utils/constants';
import { preFlightAuth } from '@src/utils/permissionUtils';

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
        component: () =>
          import(/* webpackChunkName: "about" */ '@src/views/About.vue'),
        meta: {
          hasLogin: true,
        },
      },
      {
        path: '/admin',
        component: () =>
          import(/* webpackChunkName: "admin" */ '@src/views/Admin.vue'),
        children: [
          {
            path: '',
            name: 'Admin',
            component: () =>
              import(
                /* webpackChunkName: "adminroot" */ '@src/views/admin/Root.vue'
              ),
          },
          {
            path: 'form',
            name: 'AdministerForm',
            component: () =>
              import(
                /* webpackChunkName: "administerform" */ '@src/views/admin/Form.vue'
              ),
            props: createProps,
          },
          {
            path: 'user',
            name: 'AdministerUser',
            component: () =>
              import(
                /* webpackChunkName: "administeruser" */ '@src/views/admin/User.vue'
              ),
            props: createProps,
          },
        ],
        meta: {
          requiresAuth: true,
          hasLogin: true,
        },
      },
      {
        path: '/alert',
        name: 'Alert',
        component: () =>
          import(
            /* webpackChunkName: "alert" */
            '@src/components/bcgov/BCGovAlertBanner.vue'
          ),
        meta: {
          formSubmitMode: true,
          hasLogin: true,
        },
        props: createProps,
      },
      {
        path: '/error',
        name: 'Error',
        component: () =>
          import(/* webpackChunkName: "login" */ '@src/views/Login.vue'),
        props: createProps,
        beforeEnter(_to, _from, next) {
          // Block navigation to login page if already authenticated
          NProgress.done();
          next(!store.getters['auth/authenticated']);
        },
      },
      {
        path: '/file',
        component: () =>
          import(/* webpackChunkName: "file" */ '@src/views/File.vue'),
        children: [
          {
            path: 'download',
            name: 'Download',
            component: () =>
              import(
                /* webpackChunkName: "download" */ '@src/views/file/Download.vue'
              ),
            meta: {
              requiresAuth: true,
              hasLogin: true,
            },
            props: createProps,
          },
        ],
      },
      {
        path: '/form',
        component: () =>
          import(/* webpackChunkName: "form" */ '@src/views/Form.vue'),
        children: [
          {
            path: 'create',
            name: 'FormCreate',
            component: () =>
              import(
                /* webpackChunkName: "create" */ '@src/views/form/Create.vue'
              ),
            meta: {
              breadcrumbTitle: 'Form Designer',
              requiresAuth: IdentityProviders.IDIR,
              hasLogin: true,
            },
          },
          {
            path: 'design',
            name: 'FormDesigner',
            component: () =>
              import(
                /* webpackChunkName: "designer" */ '@src/views/form/Design.vue'
              ),
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
            component: () =>
              import(
                /* webpackChunkName: "export" */ '@src/views/form/Export.vue'
              ),
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
            component: () =>
              import(
                /* webpackChunkName: "manage" */ '@src/views/form/Manage.vue'
              ),
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
            component: () =>
              import(
                /* webpackChunkName: "viewsubmission" */ '@src/views/form/Preview.vue'
              ),
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
            component: () =>
              import(
                /* webpackChunkName: "submissions" */ '@src/views/form/Submissions.vue'
              ),
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
            component: () =>
              import(
                /* webpackChunkName: "submit" */ '@src/views/form/Submit.vue'
              ),
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
            component: () =>
              import(
                /* webpackChunkName: "submit" */ '@src/views/form/Success.vue'
              ),
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
            component: () =>
              import(
                /* webpackChunkName: "teams" */ '@src/views/form/Teams.vue'
              ),
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
            component: () =>
              import(
                /* webpackChunkName: "viewsubmission" */ '@src/views/form/View.vue'
              ),
            meta: {
              breadcrumbTitle: 'View Submission',
              requiresAuth: true,
              hasLogin: true,
            },
            props: createProps,
          },
        ],
      },
      {
        path: '/user',
        component: () =>
          import(/* webpackChunkName: "user" */ '@src/views/User.vue'),
        children: [
          {
            path: '',
            name: 'User',
            component: () =>
              import(
                /* webpackChunkName: "designer" */ '@src/views/user/Root.vue'
              ),
            meta: {
              requiresAuth: true,
            },
          },
          {
            path: 'draft',
            name: 'UserFormDraftEdit',
            component: () =>
              import(
                /* webpackChunkName: "userformdraftedit" */ '@src/views/user/SubmissionDraftEdit.vue'
              ),
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
            component: () =>
              import(
                /* webpackChunkName: "userformduplicate" */ '@src/views/user/SubmissionDuplicate.vue'
              ),
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
          // For when we have the recieve->review->send-back flow
          // This route can be used for the submitter to edit and see status stuff about their submission
          // Different from the draft one above, which can be used to simply edit drafts
          // {
          //   path: 'Edit',
          //   name: 'UserFormEdit',
          //   component: () => import(/* webpackChunkName: "userformtedit" */ '@src/views/user/SubmissionEdit.vue'),
          //   meta: {
          //     breadcrumbTitle: 'Edit Submission',
          //     formSubmitMode: true,
          //   },
          //   props: createProps
          // },
          {
            path: 'forms',
            name: 'UserForms',
            component: () =>
              import(
                /* webpackChunkName: "userforms" */ '@src/views/user/Forms.vue'
              ),
            meta: {
              breadcrumbTitle: 'My Forms',
              requiresAuth: IdentityProviders.IDIR,
            },
          },
          {
            path: 'history',
            name: 'UserHistory',
            component: () =>
              import(
                /* webpackChunkName: "history" */ '@src/views/user/History.vue'
              ),
            meta: {
              breadcrumbTitle: 'History',
              requiresAuth: true,
            },
          },
          {
            path: 'submissions',
            name: 'UserSubmissions',
            component: () =>
              import(
                /* webpackChunkName: "usersubmissions" */ '@src/views/user/Submissions.vue'
              ),
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
            component: () =>
              import(
                /* webpackChunkName: "userformview" */ '@src/views/user/SubmissionView.vue'
              ),
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
        meta: {
          hasLogin: true,
        },
      },
      {
        path: '/login',
        name: 'Login',
        component: () =>
          import(/* webpackChunkName: "login" */ '@src/views/Login.vue'),
        props: createProps,
        beforeEnter(_to, _from, next) {
          // Block navigation to login page if already authenticated
          NProgress.done();
          next(!store.getters['auth/authenticated']);
        },
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () =>
          import(/* webpackChunkName: "not-found" */ '@src/views/NotFound.vue'),
        meta: {
          hasLogin: true,
        },
      },
    ],
  });

  router.beforeEach((to, _from, next) => {
    NProgress.start();
    if (isFirstTransition) {
      // Always call rbac/current if authenticated and on first page load
      if (
        router.app.config.globalProperties.$keycloak &&
        router.app.config.globalProperties.$keycloak.ready &&
        router.app.config.globalProperties.$keycloak.authenticated
      ) {
        store.dispatch('form/getFormsForCurrentUser');
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
      router.app.config.globalProperties.$keycloak &&
      router.app.config.globalProperties.$keycloak.ready &&
      !router.app.config.globalProperties.$keycloak.authenticated
    ) {
      const redirectUri =
        location.origin + basePath + to.path + location.search;
      store.commit('auth/SET_REDIRECTURI', redirectUri);

      // Determine what kind of redirect behavior is needed
      let idpHint = undefined;
      if (typeof to.meta.requiresAuth === 'string') {
        idpHint = to.meta.requiresAuth;
      } else {
        const form = store.getters['form/form'];
        if (form.idps.length) idpHint = form.idps[0];
      }
      store.dispatch('auth/login', idpHint);
    }

    // Update document title if applicable
    document.title = to.meta.title ? to.meta.title : import.meta.env.VITE_TITLE;
    next();
  });

  router.afterEach(() => {
    window.onbeforeunload = null;
    isFirstTransition = false;
    NProgress.done();
  });
  return router;
}
