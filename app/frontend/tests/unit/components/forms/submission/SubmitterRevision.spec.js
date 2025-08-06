import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRouter } from 'vue-router';

import SubmitterRevision from '~/components/forms/submission/SubmitterRevision.vue';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import { formService } from '~/services';

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

// Mock formService
vi.mock('~/services', () => ({
  formService: {
    checkSubmitterRevision: vi.fn(),
    performSubmitterRevision: vi.fn(),
  },
}));

// Mock i18n with all necessary exports
vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: vi.fn((key) => key),
    locale: 'en',
  })),
  createI18n: vi.fn(() => ({
    global: {
      t: vi.fn((key) => key),
    },
  })),
}));

describe('SubmitterRevision.vue', () => {
  const submissionId = '123-456-789';
  const pinia = createTestingPinia();
  const mockRouter = { push: vi.fn() };

  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  const notificationStore = useNotificationStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    notificationStore.$reset();
    vi.clearAllMocks();
    useRouter.mockReturnValue(mockRouter);
  });

  const createWrapper = (props = {}) => {
    return mount(SubmitterRevision, {
      props: {
        submissionId,
        ...props,
      },
      global: {
        plugins: [pinia],
        mocks: {
          $t: vi.fn((key) => key),
        },
        stubs: {
          VTooltip: {
            name: 'VTooltip',
            template:
              '<div class="v-tooltip-stub"><slot /><slot name="activator" /></div>',
            props: ['location'],
          },
          VBtn: {
            name: 'v-btn',
            template:
              '<div class="v-btn-stub" @click="$emit(\'click\')" :title="title"><slot /></div>',
            props: ['color', 'variant', 'title'],
            emits: ['click'],
          },
        },
      },
    });
  };

  describe('Component Rendering', () => {
    it('renders nothing when canReviseSubmission is false', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: false });

      const wrapper = createWrapper();

      await flushPromises();

      // Should not render button when canReviseSubmission is false
      expect(wrapper.find('.v-btn-stub').exists()).toBe(false);
    });

    it('renders button when canReviseSubmission is true', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });

      const wrapper = createWrapper();

      await flushPromises();

      expect(wrapper.find('.v-btn-stub').exists()).toBe(true);
      expect(wrapper.text()).toContain('trans.submitterRevision.recall');
    });

    it('applies custom class prop correctly', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });

      const wrapper = createWrapper({ class: 'custom-class' });

      await flushPromises();

      const span = wrapper.find('span');
      expect(span.classes()).toContain('custom-class');
    });

    it('applies RTL class when isRTL is true', async () => {
      formStore.isRTL = true;
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });

      const wrapper = createWrapper();

      await flushPromises();

      const span = wrapper.find('span');
      expect(span.classes()).toContain('dir-rtl');
    });
  });

  describe('checkCanReviseSubmission', () => {
    it('calls formService.checkSubmitterRevision on mount', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });

      createWrapper();

      await flushPromises();

      expect(formService.checkSubmitterRevision).toHaveBeenCalledWith(
        submissionId
      );
    });

    it('sets canReviseSubmission to true when service returns true', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });

      const wrapper = createWrapper();

      await flushPromises();

      expect(wrapper.vm.canReviseSubmission).toBe(true);
    });

    it('sets canReviseSubmission to false when service returns false', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: false });

      const wrapper = createWrapper();

      await flushPromises();

      expect(wrapper.vm.canReviseSubmission).toBe(false);
    });

    it('sets canReviseSubmission to false when service throws error', async () => {
      formService.checkSubmitterRevision.mockRejectedValue(
        new Error('Network error')
      );

      const wrapper = createWrapper();

      await flushPromises();

      expect(wrapper.vm.canReviseSubmission).toBe(false);
    });

    it('re-checks when submissionId changes', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });

      const wrapper = createWrapper();

      await flushPromises();

      // Change the prop
      await wrapper.setProps({ submissionId: 'new-submission-id' });

      await flushPromises();

      expect(formService.checkSubmitterRevision).toHaveBeenCalledTimes(3);
      expect(formService.checkSubmitterRevision).toHaveBeenLastCalledWith(
        'new-submission-id'
      );
    });
  });

  describe('handleRevision', () => {
    it('calls formService.performSubmitterRevision when button is clicked', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });
      formService.performSubmitterRevision.mockResolvedValue({ status: 200 });

      const wrapper = createWrapper();

      await flushPromises();

      const button = wrapper.find('.v-btn-stub');
      await button.trigger('click');

      expect(formService.performSubmitterRevision).toHaveBeenCalledWith(
        submissionId
      );
    });

    it('navigates to UserFormDraftEdit on successful response (200)', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });
      formService.performSubmitterRevision.mockResolvedValue({ status: 200 });

      const wrapper = createWrapper();

      await flushPromises();

      const button = wrapper.find('.v-btn-stub');
      await button.trigger('click');

      await flushPromises();

      expect(mockRouter.push).toHaveBeenCalledWith({
        name: 'UserFormDraftEdit',
        query: {
          s: submissionId,
        },
      });
    });

    it('hides button on 400 response', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });
      formService.performSubmitterRevision.mockResolvedValue({ status: 400 });

      const wrapper = createWrapper();

      await flushPromises();

      const button = wrapper.find('.v-btn-stub');
      await button.trigger('click');

      await flushPromises();

      expect(wrapper.vm.canReviseSubmission).toBe(false);
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('shows notification on error', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });
      formService.performSubmitterRevision.mockRejectedValue(
        new Error('Network error')
      );

      const wrapper = createWrapper();

      await flushPromises();

      const button = wrapper.find('.v-btn-stub');
      await button.trigger('click');

      await flushPromises();

      expect(notificationStore.addNotification).toHaveBeenCalledWith({
        text: 'trans.submitterRevision.recallErrMsg',
        consoleError: 'trans.submitterRevision.recallConsErrMsg',
      });
    });

    it('does not navigate on error', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });
      formService.performSubmitterRevision.mockRejectedValue(
        new Error('Network error')
      );

      const wrapper = createWrapper();

      await flushPromises();

      const button = wrapper.find('.v-btn-stub');
      await button.trigger('click');

      await flushPromises();

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Component Exposed Methods', () => {
    it('exposes handleRevision method', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });

      const wrapper = createWrapper();

      await flushPromises();

      expect(wrapper.vm.handleRevision).toBeDefined();
      expect(typeof wrapper.vm.handleRevision).toBe('function');
    });

    it('exposes canReviseSubmission ref', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });

      const wrapper = createWrapper();

      await flushPromises();

      expect(wrapper.vm.canReviseSubmission).toBeDefined();
      expect(wrapper.vm.canReviseSubmission).toBe(true);
    });

    it('exposes isEnablingRevision ref', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });

      const wrapper = createWrapper();

      await flushPromises();

      expect(wrapper.vm.isEnablingRevision).toBeDefined();
      expect(wrapper.vm.isEnablingRevision).toBe(false);
    });
  });

  describe('isEnablingRevision Loading State', () => {
    it('prevents multiple clicks while request is in progress', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });

      // Mock a delayed response to simulate network request
      formService.performSubmitterRevision.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ status: 200 }), 100)
          )
      );

      const wrapper = createWrapper();

      await flushPromises();

      const button = wrapper.find('.v-btn-stub');

      // First click - should start the request
      await button.trigger('click');

      // Immediately try to click again
      await button.trigger('click');

      // Wait a bit for the first request to start
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Check that only one request was made despite multiple clicks
      expect(formService.performSubmitterRevision).toHaveBeenCalledTimes(1);

      // Wait for the request to complete
      await flushPromises();
    });

    it('sets isEnablingRevision to true when request starts', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });

      // Mock a delayed response
      formService.performSubmitterRevision.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ status: 200 }), 100)
          )
      );

      const wrapper = createWrapper();

      await flushPromises();

      const button = wrapper.find('.v-btn-stub');

      // Initial state should be false
      expect(wrapper.vm.isEnablingRevision).toBe(false);

      // Click the button
      await button.trigger('click');

      // Wait a bit for the request to start
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should be true while request is in progress
      expect(wrapper.vm.isEnablingRevision).toBe(true);

      // Wait a bit more for the request to finish
      await new Promise((resolve) => setTimeout(resolve, 50));
      await flushPromises();

      // Should be false after request completes
      expect(wrapper.vm.isEnablingRevision).toBe(false);
    });

    it('resets isEnablingRevision to false on successful response', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });
      formService.performSubmitterRevision.mockResolvedValue({ status: 200 });

      const wrapper = createWrapper();

      await flushPromises();

      const button = wrapper.find('.v-btn-stub');

      // Initial state
      expect(wrapper.vm.isEnablingRevision).toBe(false);

      // Click the button
      await button.trigger('click');

      // Wait for request to complete
      await flushPromises();

      // Should be false after successful completion
      expect(wrapper.vm.isEnablingRevision).toBe(false);
    });

    it('resets isEnablingRevision to false on error response', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });
      formService.performSubmitterRevision.mockRejectedValue(
        new Error('Network error')
      );

      const wrapper = createWrapper();

      await flushPromises();

      const button = wrapper.find('.v-btn-stub');

      // Initial state
      expect(wrapper.vm.isEnablingRevision).toBe(false);

      // Click the button
      await button.trigger('click');

      // Wait for request to complete
      await flushPromises();

      // Should be false after error completion
      expect(wrapper.vm.isEnablingRevision).toBe(false);
    });

    it('resets isEnablingRevision to false on 400 response', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });
      formService.performSubmitterRevision.mockResolvedValue({ status: 400 });

      const wrapper = createWrapper();

      await flushPromises();

      const button = wrapper.find('.v-btn-stub');

      // Initial state
      expect(wrapper.vm.isEnablingRevision).toBe(false);

      // Click the button
      await button.trigger('click');

      // Wait for request to complete
      await flushPromises();

      // Should be false after 400 response
      expect(wrapper.vm.isEnablingRevision).toBe(false);
    });

    it('allows clicking again after request completes', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });
      formService.performSubmitterRevision.mockResolvedValue({ status: 200 });

      const wrapper = createWrapper();

      await flushPromises();

      const button = wrapper.find('.v-btn-stub');

      // First click
      await button.trigger('click');
      await flushPromises();

      // Should be able to click again
      await button.trigger('click');
      await flushPromises();

      // Should have been called twice
      expect(formService.performSubmitterRevision).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('has proper title attribute on button', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });

      const wrapper = createWrapper();

      await flushPromises();

      const button = wrapper.find('.v-btn-stub');
      expect(button.attributes('title')).toBe('trans.submitterRevision.recall');
    });

    it('has proper lang attribute on inner span', async () => {
      formService.checkSubmitterRevision.mockResolvedValue({ data: true });

      const wrapper = createWrapper();

      await flushPromises();

      // Find the inner span inside the button that has the lang attribute
      const innerSpan = wrapper.find('.v-btn-stub span');
      expect(innerSpan.attributes('lang')).toBe('en');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty submissionId gracefully', async () => {
      const wrapper = createWrapper({ submissionId: '' });

      await flushPromises();
      expect(wrapper).toBeDefined();
      expect(formService.checkSubmitterRevision).not.toHaveBeenCalled();
    });

    it('handles null submissionId gracefully', async () => {
      const wrapper = createWrapper({ submissionId: null });

      await flushPromises();
      expect(wrapper).toBeDefined();
      expect(formService.checkSubmitterRevision).not.toHaveBeenCalled();
    });

    it('handles undefined submissionId gracefully', async () => {
      const wrapper = createWrapper({ submissionId: undefined });

      await flushPromises();
      expect(wrapper).toBeDefined();
      expect(formService.checkSubmitterRevision).not.toHaveBeenCalled();
    });
  });
});
