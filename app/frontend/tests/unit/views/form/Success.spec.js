import { createLocalVue, shallowMount } from '@vue/test-utils';

import Success from '@/views/form/Success.vue';

const localVue = createLocalVue();

jest.mock('@/utils/permissionUtils', () => (
  {
    ...(jest.requireActual('@/utils/permissionUtils')),
    determineFormNeedsAuth: jest.fn()
  }
));

import { determineFormNeedsAuth } from '@/utils/permissionUtils';

describe('Success.vue', () => {
  it('renders', () => {
    const wrapper = shallowMount(Success, {
      localVue,
      stubs: ['FormViewer']
    });

    expect(wrapper.html()).toMatch('formviewer');
  });

  it('beforeRouteEnter guard calls the permission checker', () => {
    const next = jest.fn();
    const wrapper = shallowMount(Success, {
      localVue,
      stubs: ['FormViewer']
    });
    Success.beforeRouteEnter.call(wrapper.vm, { query: { s: 's' } }, undefined, next);

    expect(determineFormNeedsAuth).toHaveBeenCalledTimes(1);
    expect(determineFormNeedsAuth).toHaveBeenCalledWith(undefined, 's', next);
  });
});
