import { describe, expect, it } from 'vitest';
import getRouter from '~/router';

describe('router', () => {
  it('has base routes', () => {
    const router = getRouter();

    expect(router.hasRoute('Home')).toBeTruthy();
    expect(router.hasRoute('About')).toBeTruthy();
    expect(router.hasRoute('Alert')).toBeTruthy();
    expect(router.hasRoute('Error')).toBeTruthy();
    expect(router.hasRoute('Login')).toBeTruthy();
    expect(router.hasRoute('NotFound')).toBeTruthy();

    expect(router.getRoutes().length).toBe(33);
  });

  describe('Admin Routes', () => {
    it('has child routes', () => {
      const router = getRouter();

      const route = router.options.routes.filter(
        ({ path }) => path === '/admin'
      )[0];
      const routes = route.children;

      const ROUTES = ['Admin', 'AdministerForm', 'AdministerUser'];

      expect(routes.filter(({ name }) => ROUTES.includes(name)).length).toBe(
        ROUTES.length
      );
    });
  });

  describe('Form Routes', () => {
    it('has child routes', () => {
      const router = getRouter();

      const route = router.options.routes.filter(
        ({ path }) => path === '/form'
      )[0];
      const routes = route.children;

      const ROUTES = [
        'FormCreate',
        'FormDesigner',
        'SubmissionsExport',
        'FormManage',
        'FormPreview',
        'FormSubmissions',
        'FormSubmit',
        'FormSuccess',
        'FormTeams',
        'FormView',
      ];

      expect(routes.filter(({ name }) => ROUTES.includes(name)).length).toBe(
        ROUTES.length
      );
    });
  });

  describe('User Routes', () => {
    it('has child routes', () => {
      const router = getRouter();

      const route = router.options.routes.filter(
        ({ path }) => path === '/user'
      )[0];
      const routes = route.children;

      const ROUTES = [
        'User',
        'UserFormDraftEdit',
        'UserFormDuplicate',
        'UserForms',
        'UserHistory',
        'UserSubmissions',
        'UserFormView',
      ];

      expect(routes.filter(({ name }) => ROUTES.includes(name)).length).toBe(
        ROUTES.length
      );
    });
  });
});
