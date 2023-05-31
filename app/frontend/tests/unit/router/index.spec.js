import getRouter from '@/router';

describe('Router', () => {
  const router = getRouter();
  const routes = router.options.routes;

  it('has the correct number of routes', () => {
    expect(routes).toHaveLength(10);
  });

  it('has the expected routes', () => {
    const routeSet = new Set(routes);
    expect(routeSet).toContainEqual(expect.objectContaining({ name: 'About' }));
    expect(routeSet).toContainEqual(expect.objectContaining({ name: 'Alert' }));
    expect(routeSet).toContainEqual(expect.objectContaining({ name: 'Error' }));
    expect(routeSet).toContainEqual(expect.objectContaining({ name: 'Login' }));
    expect(routeSet).toContainEqual(expect.objectContaining({ name: 'NotFound' }));
  });
});
