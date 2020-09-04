import NProgress from 'nprogress';
import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

let isFirstTransition = true;

/**
 * Constructs and returns a Vue Router object
 * @param {string} [basePath='/'] the base server path
 * @returns {object} a Vue Router object
 */
export default function getRouter(basePath = '/') {
  const router = new VueRouter({
    base: basePath,
    mode: 'history',
    routes: [
      {
        path: '/',
        redirect: { name: 'Home' }
      },
      {
        path: '/',
        name: 'Home',
        component: () => import(/* webpackChunkName: "home" */ '@/views/Home.vue'),
        meta: {
          hasLogin: true
        }
      },
      // FormIO Editor
      {
        path: '/editor',
        component: () => import(/* webpackChunkName: "editor" */ '@/views/Editor.vue'),
        children: [
          {
            path: '',
            name: 'NewDesigner',
            component: () => import(/* webpackChunkName: "designer" */ '@/views/designer/Root.vue')
          },
          {
            path: ':formId/versions/:formVersionId',
            name: 'VersionDesigner',
            component: () => import(/* webpackChunkName: "designer" */ '@/views/designer/Root.vue'),
            props: true
          },
        ],
        meta: {
          requiresAuth: true,
          hasLogin: true
        }
      },
      // Actions for a specific form
      {
        path: '/form/:formId',
        component: () => import(/* webpackChunkName: "form" */ '@/views/Form.vue'),
        props: true,
        children: [
          {
            path: '/manage',
            name: 'FormManage',
            component: () => import(/* webpackChunkName: "formmanage" */ '@/views/form/FormManage.vue'),
            props: true,
            meta: {
              requiresAuth: true,
              hasLogin: true
            }
          },
          {
            path: '/submissions',
            name: 'FormSubmissions',
            component: () => import(/* webpackChunkName: "formsubmissions" */ '@/views/form/FormSubmissions.vue'),
            props: true,
            meta: {
              requiresAuth: true,
              hasLogin: true
            }
          },
          {
            path: '/submit',
            name: 'FormSubmit',
            component: () => import(/* webpackChunkName: "formsubmit" */ '@/views/form/FormSubmit.vue'),
            props: true,
            meta: {
              requiresAuth: true,
              hasLogin: true
            }
          },
        ],
        meta: {
          requiresAuth: true,
          hasLogin: true
        }
      },
      {
        path: '/myForms',
        name: 'MyForms',
        component: () => import(/* webpackChunkName: "myforms" */ '@/views/MyForms.vue'),
        meta: {
          requiresAuth: true,
          hasLogin: true
        }
      },
      {
        path: '/user',
        name: 'User',
        component: () => import(/* webpackChunkName: "user" */ '@/views/User.vue'),
        meta: {
          requiresAuth: true,
          hasLogin: true
        }
      },
      {
        path: '/404',
        alias: '*',
        name: 'NotFound',
        component: () => import(/* webpackChunkName: "not-found" */ '@/views/NotFound.vue'),
        meta: {
          hasLogin: true
        }
      }
    ]
  });

  router.beforeEach((to, _from, next) => {
    NProgress.start();
    if (to.matched.some(route => route.meta.requiresAuth)
      && router.app.$keycloak
      && router.app.$keycloak.ready
      && !router.app.$keycloak.authenticated) {
      const redirect = location.origin + basePath + to.path;
      const loginUrl = router.app.$keycloak.createLoginUrl({
        //idpHint: 'idir',
        redirectUri: redirect
      });
      window.location.replace(loginUrl);
    } else {
      document.title = to.meta.title ? to.meta.title : process.env.VUE_APP_TITLE;
      if (to.query.r && isFirstTransition) {
        router.replace({ path: to.query.r.replace(basePath, '') });
      }
      next();
    }
  });

  router.afterEach(() => {
    isFirstTransition = false;
    NProgress.done();
  });

  return router;
}
