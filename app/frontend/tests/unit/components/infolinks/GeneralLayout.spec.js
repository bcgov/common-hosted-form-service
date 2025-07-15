// @vitest-environment happy-dom
// happy-dom is required to access window.location

import { flushPromises, mount, shallowMount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, expect, vi } from 'vitest';

import getRouter from '~/router';
import GeneralLayout from '~/components/infolinks/GeneralLayout.vue';
import { useAdminStore } from '~/store/admin';
import { faL } from '@fortawesome/free-solid-svg-icons';

describe('GeneralLayout.vue', () => {
  const pinia = createTestingPinia();
  const adminStore = useAdminStore(pinia);
  const router = createRouter({
    history: createWebHistory(),
    routes: getRouter().getRoutes(),
  });

  setActivePinia(pinia);

  beforeEach(() => {
    adminStore.$reset();
  });

  it('renders', async () => {
    const wrapper = mount(GeneralLayout, {
      props: {
        formComponentData: [
          {
            componentName: 'Text/Images',
            description:
              'See Also: Content component and HTML Element component in the "advanced layout" section',
            externalLink: 'http://link.com',
            groupName: 'Basic Layout',
            id: '123-456',
            imageName: 'image.jpeg',
            isLinkEnabled: true,
            status: true,
          },
        ],
        formComponentNames: [
          { componentName: 'Text/Images' },
          { componentName: 'Columns - 2' },
        ],
        groupName: '',
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ProactiveHelpDialog: true,
          ProactiveHelpPreviewDialog: true,
        },
      },
    });

    await flushPromises();

    expect(wrapper.html()).toContain('Text/Images');
    expect(wrapper.html()).toContain('Columns - 2');
  });

  it('toggleProactiveHelpDialog should toggle the boolean for showProactiveHelpDialog', async () => {
    const wrapper = shallowMount(GeneralLayout, {
      props: {
        formComponentData: [
          {
            componentName: 'Text/Images',
            description:
              'See Also: Content component and HTML Element component in the "advanced layout" section',
            externalLink: 'http://link.com',
            groupName: 'Basic Layout',
            id: '123-456',
            imageName: 'image.jpeg',
            isLinkEnabled: true,
            status: true,
          },
        ],
        formComponentNames: [
          { componentName: 'Text/Images' },
          { componentName: 'Columns - 2' },
        ],
        groupName: '',
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ProactiveHelpDialog: true,
          ProactiveHelpPreviewDialog: true,
        },
      },
    });

    expect(wrapper.vm.showEditProactiveHelpDialog).toBeFalsy();
    wrapper.vm.toggleEditProactiveHelpDialog();
    expect(wrapper.vm.showEditProactiveHelpDialog).toBeTruthy();
  });

  it('togglePreviewDialog should toggle the boolean for showPreviewDialog', async () => {
    const wrapper = shallowMount(GeneralLayout, {
      props: {
        formComponentData: [
          {
            componentName: 'Text/Images',
            description:
              'See Also: Content component and HTML Element component in the "advanced layout" section',
            externalLink: 'http://link.com',
            groupName: 'Basic Layout',
            id: '123-456',
            imageName: 'image.jpeg',
            isLinkEnabled: true,
            status: true,
          },
        ],
        formComponentNames: [
          { componentName: 'Text/Images' },
          { componentName: 'Columns - 2' },
        ],
        groupName: '',
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ProactiveHelpDialog: true,
          ProactiveHelpPreviewDialog: true,
        },
      },
    });

    expect(wrapper.vm.showPreviewDialog).toBeFalsy();
    wrapper.vm.togglePreviewDialog();
    expect(wrapper.vm.showPreviewDialog).toBeTruthy();
  });

  it('isPreviewEnabled takes a component name and returns true if an admin has previously set data for a form component proactive help and false otherwise', async () => {
    const wrapper = shallowMount(GeneralLayout, {
      props: {
        formComponentData: [
          {
            componentName: 'Text/Images',
            description:
              'See Also: Content component and HTML Element component in the "advanced layout" section',
            externalLink: 'http://link.com',
            groupName: 'Basic Layout',
            id: '123-456',
            imageName: 'image.jpeg',
            isLinkEnabled: true,
            status: true,
          },
        ],
        formComponentNames: [
          { componentName: 'Text/Images' },
          { componentName: 'Columns - 2' },
        ],
        groupName: '',
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ProactiveHelpDialog: true,
          ProactiveHelpPreviewDialog: true,
        },
      },
    });

    expect(wrapper.vm.isPreviewEnabled('Text/Images')).toBeFalsy();
    expect(wrapper.vm.isPreviewEnabled('Columns - 2')).toBeTruthy();
  });

  it('onOpenEditDialog should set the component data and toggle the boolean for showProactiveHelpDialog', async () => {
    const wrapper = shallowMount(GeneralLayout, {
      props: {
        formComponentData: [
          {
            componentName: 'Text/Images',
            description:
              'See Also: Content component and HTML Element component in the "advanced layout" section',
            externalLink: 'http://link.com',
            groupName: 'Basic Layout',
            id: '123-456',
            imageName: 'image.jpeg',
            isLinkEnabled: true,
            status: true,
          },
        ],
        formComponentNames: [
          { componentName: 'Text/Images' },
          { componentName: 'Columns - 2' },
        ],
        groupName: '',
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ProactiveHelpDialog: true,
          ProactiveHelpPreviewDialog: true,
        },
      },
    });

    expect(wrapper.vm.showEditProactiveHelpDialog).toBeFalsy();
    expect(wrapper.vm.component).toEqual({});
    wrapper.vm.onOpenEditDialog('Text/Images');
    expect(wrapper.vm.component).toEqual({
      componentName: 'Text/Images',
      description:
        'See Also: Content component and HTML Element component in the "advanced layout" section',
      externalLink: 'http://link.com',
      groupName: 'Basic Layout',
      id: '123-456',
      imageName: 'image.jpeg',
      isLinkEnabled: true,
      status: true,
    });
    expect(wrapper.vm.showEditProactiveHelpDialog).toBeTruthy();
  });

  it('onOpenPreviewDialog should get the image URL, set the component data and toggle the boolean for showPreviewDialog', async () => {
    const wrapper = shallowMount(GeneralLayout, {
      props: {
        formComponentData: [
          {
            componentName: 'Text/Images',
            description:
              'See Also: Content component and HTML Element component in the "advanced layout" section',
            externalLink: 'http://link.com',
            groupName: 'Basic Layout',
            id: '123-456',
            imageName: 'image.jpeg',
            isLinkEnabled: true,
            status: true,
          },
        ],
        formComponentNames: [
          { componentName: 'Text/Images' },
          { componentName: 'Columns - 2' },
        ],
        groupName: '',
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ProactiveHelpDialog: true,
          ProactiveHelpPreviewDialog: true,
        },
      },
    });

    const getFCProactiveHelpImageUrlSpy = vi.spyOn(
      adminStore,
      'getFCProactiveHelpImageUrl'
    );
    getFCProactiveHelpImageUrlSpy.mockImplementation(() => {});

    expect(wrapper.vm.showPreviewDialog).toBeFalsy();
    expect(wrapper.vm.component).toEqual({});
    await wrapper.vm.onOpenPreviewDialog('Text/Images');
    expect(getFCProactiveHelpImageUrlSpy).toBeCalledTimes(1);
    expect(getFCProactiveHelpImageUrlSpy).toBeCalledWith('123-456');
    expect(wrapper.vm.component).toEqual({
      componentName: 'Text/Images',
      description:
        'See Also: Content component and HTML Element component in the "advanced layout" section',
      externalLink: 'http://link.com',
      groupName: 'Basic Layout',
      id: '123-456',
      imageName: 'image.jpeg',
      isLinkEnabled: true,
      status: true,
    });
    expect(wrapper.vm.showPreviewDialog).toBeTruthy();
  });

  it('onSwitchChange will set the published status for a component based on the switch value', async () => {
    const wrapper = shallowMount(GeneralLayout, {
      props: {
        formComponentData: [
          {
            componentName: 'Text/Images',
            description:
              'See Also: Content component and HTML Element component in the "advanced layout" section',
            externalLink: 'http://link.com',
            groupName: 'Basic Layout',
            id: '123-456',
            imageName: 'image.jpeg',
            isLinkEnabled: true,
            status: true,
          },
        ],
        formComponentNames: [
          { componentName: 'Text/Images' },
          { componentName: 'Columns - 2' },
        ],
        groupName: '',
      },
      global: {
        plugins: [router, pinia],
        stubs: {
          ProactiveHelpDialog: true,
          ProactiveHelpPreviewDialog: true,
        },
      },
    });

    const updateFCProactiveHelpStatusSpy = vi.spyOn(
      adminStore,
      'updateFCProactiveHelpStatus'
    );
    updateFCProactiveHelpStatusSpy.mockImplementation(() => {});
    await wrapper.vm.onSwitchChange('Text/Images', 0);
    expect(updateFCProactiveHelpStatusSpy).toBeCalledTimes(1);
    expect(updateFCProactiveHelpStatusSpy).toBeCalledWith({
      componentId: '123-456',
      publishStatus: true,
    });
    wrapper.vm.publish[0] = false;
    updateFCProactiveHelpStatusSpy.mockReset();
    await wrapper.vm.onSwitchChange('Text/Images', 0);
    expect(updateFCProactiveHelpStatusSpy).toBeCalledTimes(1);
    expect(updateFCProactiveHelpStatusSpy).toBeCalledWith({
      componentId: '123-456',
      publishStatus: false,
    });
  });
});
