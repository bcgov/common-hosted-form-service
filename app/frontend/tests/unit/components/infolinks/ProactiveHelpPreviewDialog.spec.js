import { shallowMount } from '@vue/test-utils';
import i18n from '@/internationalization';
import ProactiveHelpPreviewDialog from '@/components/infolinks/ProactiveHelpPreviewDialog.vue';

describe('ProactiveHelpPreviewDialog.vue', () => {

  it('preview dialog', async () => {

    const wrapper = shallowMount(ProactiveHelpPreviewDialog, {
      data() {
        return {
          description: 'dump text',
          link: 'url',
        };
      },
      i18n,
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
