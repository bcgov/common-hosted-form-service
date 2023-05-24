import { shallowMount } from '@vue/test-utils';

import InformationLinkPreviewDialog from '@/components/infolinks/InformationLinkPreviewDialog.vue';

describe('InformationLinkPreviewDialog.vue', () => {
  it('preview dialog', async () => {
    const wrapper = shallowMount(InformationLinkPreviewDialog, {
      data() {
        return {
          description: 'dump text',
          link: 'url',
        };
      },
      propsData: {
        component: { type: Object },
      },
    });

    await wrapper.setProps({
      component: { componentName: 'content', description: 'dump description', imageUrl: 'https://dumpurl.com', moreHelpInfoLink: 'https://dumpurl.com' },
    });
    const input = await wrapper.findComponent({ ref: 'preview_text_field' });
    expect(input).not.toBeNull();
  });
});
