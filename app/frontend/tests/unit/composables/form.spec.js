// @vitest-environment happy-dom
// happy-dom is required to access window.URL
import * as formComposables from '~/composables/form';

describe('form.js', () => {
  describe('exportFormSchema', () => {
    it('should export some schema and return a snek', () => {
      const { snek } = formComposables.exportFormSchema(
        'this is a form name',
        {
          id: '1',
          projectId: '123',
        },
        null
      );

      // it should transform the form name
      expect(snek).toEqual(
        'this is a form name'
          .replace(/\s+/g, '_')
          .replace(/[^-_0-9a-z]/gi, '')
          .toLowerCase()
      );
    });
  });
});
