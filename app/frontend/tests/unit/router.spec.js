import { describe, expect, it, vi } from 'vitest';
import getRouter from '~/router';

vi.mock('~/services', () => ({
  formService: {
    getSubmissionStatuses: vi.fn(),
  },
}));

import { formService } from '~/services';

describe('router', () => {
  it('has base routes', () => {
    const router = getRouter();

    expect(router.hasRoute('Home')).toBeTruthy();
    expect(router.hasRoute('About')).toBeTruthy();
    expect(router.hasRoute('Alert')).toBeTruthy();
    expect(router.hasRoute('Error')).toBeTruthy();
    expect(router.hasRoute('Login')).toBeTruthy();
    expect(router.hasRoute('NotFound')).toBeTruthy();

    expect(router.getRoutes().length).toBe(34);
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
        'FormEmails',
        'FormTeams',
        'FormGroups',
        'FormView',
      ];

      expect(routes.filter(({ name }) => ROUTES.includes(name)).length).toBe(
        ROUTES.length
      );
    });
  });

  describe('FormView beforeEnter guard', () => {
    it('calls next() without redirect on 401 so the auth guard can handle login', async () => {
      const router = getRouter();
      const formRoute = router.options.routes.find(
        ({ path }) => path === '/form'
      );
      const viewRoute = formRoute.children.find(
        ({ name }) => name === 'FormView'
      );

      formService.getSubmissionStatuses.mockRejectedValue({
        response: { status: 401 },
      });
      const next = vi.fn();

      await viewRoute.beforeEnter({ query: { s: 'sub-123' } }, {}, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith({ name: 'NotFound' });
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
