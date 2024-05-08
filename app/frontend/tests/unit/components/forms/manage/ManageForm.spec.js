import ManageForm from "~/components/forms/manage/ManageForm.vue";
import { useFormStore } from "~/store/form";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import { setActivePinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import { beforeEach, expect, vi } from "vitest";
import getRouter from "~/router";
import { FormPermissions } from '~/utils/constants';

describe("ManageForm.vue", () => {

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
    
    it("does not call readFormSubscriptionData without permission", () => {
        const readFormSpy = vi.spyOn(formStore, "readFormSubscriptionData");
        formStore.permissions = [];
        const wrapper = mount(ManageForm, {
        global: {
            plugins: [router, pinia],
            mocks: {
                $filters: {
                  formatDate: vi.fn().mockReturnValue("formatted date")
                }
              },
            provide: {
                formDesigner: false,
                draftId: '123-456',
                formId: '123-456',
            },
        },
        });
        expect(readFormSpy).not.toHaveBeenCalled();
     });

     it("calls readFormSubscriptionData with correct permissions", () => {
        const readFormSpy = vi.spyOn(formStore, "readFormSubscriptionData");
        formStore.permissions = [FormPermissions.FORM_UPDATE];
        const wrapper = mount(ManageForm, {
        global: {
            plugins: [router, pinia],
            mocks: {
                $filters: {
                  formatDate: vi.fn().mockReturnValue("formatted date")
                }
              },
            provide: {
                formDesigner: false,
                draftId: '123-456',
                formId: '123-456',
            },
        },
        });
        expect(readFormSpy).toBeCalledTimes(1);
     });
    
});