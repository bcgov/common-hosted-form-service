import { createLocalVue, shallowMount } from '@vue/test-utils';

import * as permissionUtils from '@/utils/permissionUtils';
import Submit from '@/views/form/Submit.vue';

const localVue = createLocalVue();

describe('Submit.vue', () => {
  const determineFormNeedsAuthSpy = jest.spyOn(permissionUtils, 'determineFormNeedsAuth');

  beforeEach(() => {
    determineFormNeedsAuthSpy.mockReset();
  });

  afterEach(() => {
    determineFormNeedsAuthSpy.mockRestore();
  });

  it('renders', async () => {
    determineFormNeedsAuthSpy.mockImplementation(() => {});

    const wrapper = shallowMount(Submit, {
      localVue,
      stubs: ['FormViewer']
    });

    Submit.beforeRouteEnter.call(wrapper.vm, { query: 'q' }, undefined, undefined);
    await wrapper.vm.$nextTick();

    expect(wrapper.html()).toMatch('formviewer');
    expect(determineFormNeedsAuthSpy).toHaveBeenCalledTimes(1);
  });
});
