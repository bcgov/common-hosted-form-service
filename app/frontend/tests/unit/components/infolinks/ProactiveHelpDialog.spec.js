import { shallowMount, createLocalVue } from '@vue/test-utils';
import i18n from '@/internationalization';
import ProactiveHelpDialog from '@/components/infolinks/ProactiveHelpDialog.vue';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('ProactiveHelpDialog.vue', () => {

  const mockisRTLGetter = jest.fn();
  let store;
  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        form: {
          namespaced: true,
          getters: {
            isRTL: mockisRTLGetter,
          },
        },
      },
    });
  });

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


    const wrapper = shallowMount(ProactiveHelpDialog, {localVue, i18n, store});

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
      localVue,
      i18n,
      store
    });

    wrapper.vm.resetDialog();
    expect(wrapper.vm.description).toBe('');
    expect(wrapper.vm.link).toBe('');
  });
});
