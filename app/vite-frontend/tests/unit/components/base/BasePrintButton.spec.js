// @vitest-environment happy-dom
// happy-dom is required to access window.location

import { mount } from '@vue/test-utils';
import { beforeEach, expect, vi } from 'vitest';

import BasePrintButton from '~/components/base/BasePrintButton.vue';

describe('BasePrintButton.vue', () => {
  const printSpy = vi.spyOn(window, 'print');
  beforeEach(() => {
    printSpy.mockReset();
    printSpy.mockImplementation(() => {});
  });

  afterAll(() => {
    printSpy.mockRestore();
  });

  it('renders nothing if authenticated, user', async () => {
    const wrapper = mount(BasePrintButton, {
      global: {
        plugins: [],
      },
    });

    await wrapper.find('[data-test="print-btn"]').trigger('click');

    expect(wrapper.html()).toContain('print');
    expect(printSpy).toHaveBeenCalledTimes(1);
  });
});
