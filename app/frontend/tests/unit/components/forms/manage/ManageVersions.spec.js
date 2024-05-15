import ManageVersions from '~/components/forms/manage/ManageVersions.vue';
import { useFormStore } from "~/store/form";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import { setActivePinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import { beforeEach, expect, vi } from "vitest";
import getRouter from "~/router";

describe("ManageVersions.vue", () => {
  const pinia = createTestingPinia();
  const router = createRouter({
      history: createWebHistory(),
      routes: getRouter().getRoutes(),
  });
  
  setActivePinia(pinia);
  const formStore = useFormStore(pinia);
  
  beforeEach(() => {
      formStore.$reset();
  });

  it("publishes a draft when the status is toggled and continue is clicked", () => {
    // spy on updatePublish method
    const publishSpy = vi.spyOn(ManageVersions.methods, "updatePublish");
    // mock a draft
    formStore.drafts = [
      {
        id: '123-456',
        version: '1',
        published: false,
      },
    ];
    const wrapper = mount(ManageVersions, {
      global: {
          plugins: [router, pinia],
          mocks: {
              $filters: {
                formatDateLong: vi.fn().mockReturnValue("formatted date")
              }
            },
          provide: {
              formDesigner: false,
              draftId: '123-456',
              formId: '123-456',
          },
      },
      });
      // Call the togglePublish method (simulates user clicking the status toggle)
      wrapper.vm.togglePublish(true, '123-456', '1', true);
      // Find the BaseDialog with v-model="showPublishDialog"
      const baseDialog = wrapper.findAllComponents({ name: 'BaseDialog' })
      .find(w => w.props('type') === 'CONTINUE');
      // Emit the continue-dialog event (simulate clicking continue in the dialog)
      baseDialog.vm.$emit('continue-dialog');

      expect(publishSpy).toHaveBeenCalled();
  });

  it("does not publish a draft when the status is toggled and cancel is clicked", () => {
    // spy on updatePublish method
    const publishSpy = vi.spyOn(ManageVersions.methods, "updatePublish");
    // mock a draft
    formStore.drafts = [
      {
        id: '123-456',
        version: '1',
        published: false,
      },
    ];
    const wrapper = mount(ManageVersions, {
      global: {
          plugins: [router, pinia],
          mocks: {
              $filters: {
                formatDateLong: vi.fn().mockReturnValue("formatted date")
              }
            },
          provide: {
              formDesigner: false,
              draftId: '123-456',
              formId: '123-456',
          },
      },
      });
      // Call the togglePublish method (simulates user clicking the status toggle)
      wrapper.vm.togglePublish(true, '123-456', '2', true);
      // Find the BaseDialog with v-model="showPublishDialog"
      const baseDialog = wrapper.findAllComponents({ name: 'BaseDialog' })
      .find(w => w.props('type') === 'CONTINUE');
      // Emit the close-dialog event (simulate clicking cancel in the dialog)
      baseDialog.vm.$emit('close-dialog');

      expect(publishSpy).not.toHaveBeenCalled();
  });


});
