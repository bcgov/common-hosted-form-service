import { shallowMount } from '@vue/test-utils';

import InformationLinkDialog from '@/components/infolinks/InformationLinkDialog.vue';

describe('InformationLinkDialog.vue', () => {
  it('selectImage()', async () => {
    const event = {
      target: {
        files: [
          {
            name: 'image.png',
            size: 50000,
            type: 'image/png',
          },
        ],
      },
    };

    const wrapper = shallowMount(InformationLinkDialog);

    const fileReaderSpy = jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(() => null);
    const persistSpy = jest.spyOn(InformationLinkDialog.methods, 'uploadFCProactiveHelpImage');
    wrapper.vm.selectImage(event);
    expect(fileReaderSpy).toHaveBeenCalledWith(event);
    expect(persistSpy).toHaveBeenCalledTimes(0);
  });

  it('resetDialog', async () => {
    const wrapper = shallowMount(InformationLinkDialog, {
      data() {
        return {
          description: 'dump text',
          link: 'url',
        };
      },
    });

    wrapper.vm.resetDialog();
    expect(wrapper.vm.description).toBe('');
    expect(wrapper.vm.link).toBe('');
  });
});
