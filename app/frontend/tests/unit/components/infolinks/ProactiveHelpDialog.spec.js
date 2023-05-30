import { shallowMount } from '@vue/test-utils';
import i18n from '@/internationalization';
import ProactiveHelpDialog from '@/components/infolinks/ProactiveHelpDialog.vue';

const $t = () => {};
describe('ProactiveHelpDialog.vue', () => {

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

    const wrapper = shallowMount(ProactiveHelpDialog, {i18n});

    const fileReaderSpy = jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(() => null);
    const persistSpy = jest.spyOn(ProactiveHelpDialog.methods, 'uploadFCProactiveHelpImage');
    wrapper.vm.selectImage(event);
    expect(fileReaderSpy).toHaveBeenCalledWith(event);
    expect(persistSpy).toHaveBeenCalledTimes(0);
  });

  it('resetDialog', async () => {

    const wrapper = shallowMount(ProactiveHelpDialog, {
      data() {
        return {
          description: 'dump text',
          link: 'url',
        };
      },
      i18n
    });

    wrapper.vm.resetDialog();
    expect(wrapper.vm.description).toBe('');
    expect(wrapper.vm.link).toBe('');
  });
});
