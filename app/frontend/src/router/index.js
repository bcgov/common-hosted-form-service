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
      {
        path: '/forms',
        name: 'Forms',
        component: () => import(/* webpackChunkName: "forms" */ '@/views/Forms.vue'),
        meta: {
          requiresAuth: true,
          hasLogin: true
        }
      },
      {
        path: '/form/edit',
        name: 'FormDesign',
        component: () => import(/* webpackChunkName: "formdesign" */ '@/views/FormDesign.vue'),
        meta: {
          requiresAuth: true,
          hasLogin: true
        }
      },
      {
        path: '/form/submisions',
        name: 'FormSubmissions',
        component: () => import(/* webpackChunkName: "formsubmissions" */ '@/views/FormSubmissions.vue'),
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
