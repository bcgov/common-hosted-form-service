import { createLocalVue, shallowMount } from '@vue/test-utils';

import { formService } from '@/services';
import Form from '@/views/Form.vue';

const localVue = createLocalVue();

describe('Form.vue', () => {
  const mockConsoleError = jest.spyOn(console, 'error');
  const readFormSpy = jest.spyOn(formService, 'readForm');

  beforeEach(() => {
    mockConsoleError.mockReset();
    readFormSpy.mockReset();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    readFormSpy.mockRestore();
  });

  it('renders without formId', () => {
    const wrapper = shallowMount(Form, {
      localVue,
      stubs: ['router-view'],
    });

    expect(wrapper.html()).toMatch('router-view');
    expect(readFormSpy).toHaveBeenCalledTimes(0);
  });

  it('renders with formId correctly', async () => {
    const name = 'test';
    readFormSpy.mockImplementation(() => ({ data: { name: name } }));
    const wrapper = shallowMount(Form, {
      localVue,
      propsData: { formId: '123' },
      stubs: ['router-view'],
    });
    await localVue.nextTick();

    expect(wrapper.html()).toMatch('router-view');
    expect(readFormSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.formName).toMatch(name);
  });

  it('renders with formId and logs error', async () => {
    readFormSpy.mockImplementation(() => {
      throw new Error('error');
    });
    const wrapper = shallowMount(Form, {
      localVue,
      propsData: { formId: '123' },
      stubs: ['router-view'],
    });
    await localVue.nextTick();

    expect(wrapper.html()).toMatch('router-view');
    expect(readFormSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.formName).toMatch('');
  });
});
