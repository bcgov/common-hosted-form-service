import NProgress from 'nprogress';
import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

let isFirstTransition = true;

/**
 * @function createProps
 * Parses the route query and params to generate vue props
 * @param {object} route The route object
 * @returns {object} a Vue props object
 */
const createProps = route => ({ ...route.query, ...route.params });

/**
 * @function getRouter
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
        redirect: { name: 'About' }
      },
      {
        path: '/',
        name: 'About',
        component: () => import(/* webpackChunkName: "about" */ '@/views/About.vue'),
        meta: {
          hasLogin: true
        }
      },
      {
        path: '/form',
        component: () => import(/* webpackChunkName: "form" */ '@/views/Form.vue'),
        children: [
          {
            path: 'design',
            name: 'FormDesigner',
            component: () => import(/* webpackChunkName: "designer" */ '@/views/form/Design.vue'),
            meta: {
              breadcrumbTitle: 'Form Designer'
            },
            props: createProps
          },
          {
            path: 'manage',
            name: 'FormManage',
            component: () => import(/* webpackChunkName: "manage" */ '@/views/form/Manage.vue'),
            meta: {
              breadcrumbTitle: 'Manage Form'
            },
            props: createProps
          },
          {
            path: 'submissions',
            name: 'FormSubmissions',
            component: () => import(/* webpackChunkName: "submissions" */ '@/views/form/Submissions.vue'),
            meta: {
              breadcrumbTitle: 'Submissions'
            },
            props: createProps
          },
          {
            path: 'teams',
            name: 'FormTeams',
            component: () => import(/* webpackChunkName: "teams" */ '@/views/form/Teams.vue'),
            meta: {
              breadcrumbTitle: 'Team Management'
            },
            props: createProps
          },
          {
            path: 'submit',
            name: 'FormSubmit',
            component: () => import(/* webpackChunkName: "submit" */ '@/views/form/Submit.vue'),
            meta: {
              breadcrumbTitle: 'Submit Form',
              hideNavBar: true
            },
            props: createProps
          },
          {
            path: 'view',
            name: 'FormView',
            component: () => import(/* webpackChunkName: "viewsubmission" */ '@/views/form/ViewSubmission.vue'),
            meta: {
              breadcrumbTitle: 'View Submission'
            },
            props: createProps
          },
        ],
        meta: {
          requiresAuth: true,
          hasLogin: true
        }
      },
      {
        path: '/search',
        name: 'Search',
        component: () => import(/* webpackChunkName: "search" */ '@/views/Search.vue'),
        meta: {
          hasLogin: true
        }
      },
      {
        path: '/user',
        component: () => import(/* webpackChunkName: "user" */ '@/views/User.vue'),
        children: [
          {
            path: '',
            name: 'User',
            component: () => import(/* webpackChunkName: "designer" */ '@/views/user/Root.vue')
          },
          {
            path: 'forms',
            name: 'UserForms',
            component: () => import(/* webpackChunkName: "userforms" */ '@/views/user/Forms.vue'),
            meta: {
              breadcrumbTitle: 'My Forms'
            }
          },
          {
            path: 'history',
            name: 'UserHistory',
            component: () => import(/* webpackChunkName: "history" */ '@/views/user/History.vue'),
            meta: {
              breadcrumbTitle: 'History'
            }
          },
        ],
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
      const redirect = location.origin + basePath + to.path + location.search;
      const loginUrl = router.app.$keycloak.createLoginUrl({
        //idpHint: 'idir',
        redirectUri: redirect
      });
      window.location.replace(loginUrl);
    } else {
      document.title = to.meta.title ? to.meta.title : process.env.VUE_APP_TITLE;
      if (to.query.r && isFirstTransition) {
        router.replace({
          path: to.query.r.replace(basePath, ''),
          query: (({ r, ...q }) => q)(to.query) // eslint-disable-line no-unused-vars
        });
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
