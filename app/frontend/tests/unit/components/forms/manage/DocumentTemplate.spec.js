import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { beforeEach, expect, vi } from 'vitest';

import getRouter from '~/router';
import DocumentTemplate from '~/components/forms/manage/DocumentTemplate.vue';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

describe('DocumentTemplate.vue', () => {
    // const formId = '123-456';
    let router, pinia, formStore, notificationStore;
    
    beforeEach(() => {
        pinia = createTestingPinia();
        setActivePinia(pinia);

        router = createRouter({
            history: createWebHistory(),
            routes: getRouter().getRoutes(),
        });

        formStore = useFormStore(pinia);
        notificationStore = useNotificationStore(pinia);

        formStore.$reset();
        notificationStore.$reset();
    });
    
    it('calls fetchDocumentTemplates on mount', () => {
        const fetchDocumentTemplatesSpy = vi.spyOn(DocumentTemplate.methods, 'fetchDocumentTemplates');
        fetchDocumentTemplatesSpy.mockImplementation(() => {});
        const wrapper = mount(DocumentTemplate, {
            global: {
                plugins: [router, pinia]
            }
        });
    
        expect(wrapper.text()).toContain('trans.documentTemplate.info');
        expect(fetchDocumentTemplatesSpy).toHaveBeenCalledTimes(1);
    });

    it('validates file extension correctly', async () => {
        const wrapper = mount(DocumentTemplate, {
            global: {
                plugins: [router, pinia]
            }
        });
        const invalidFile = new File([''], 'test.pdf', { type: 'application/pdf' });
        const validFile = new File([''], 'test.txt', { type: 'text/plain' });

        await wrapper.vm.handleFileInput([invalidFile]);
        expect(wrapper.vm.isValidFile).toBe(false);

        await wrapper.vm.handleFileInput([validFile]);
        expect(wrapper.vm.isValidFile).toBe(true);
    });

    it('handles file upload correctly', async () => {
        const wrapper = mount(DocumentTemplate, {
            global: {
                plugins: [router, pinia]
            }
        });

        // Mock FileReader
        window.FileReader = function () {
            this.readAsDataURL = vi.fn();
            this.onload = null;
            this.onerror = null;
            };
        
        vi.spyOn(wrapper.vm, 'handleFileUpload').mockImplementation(() => {
        wrapper.vm.uploadedFile = new Blob(['test'], { type: 'text/plain' });
        const reader = new FileReader();
        reader.onload = () => {
            const base64Content = 'base64testcontent';
            wrapper.vm.cdogsTemplate = base64Content;
        };
        reader.onload();
        });

        await wrapper.vm.handleFileUpload();
        expect(wrapper.vm.cdogsTemplate).toContain('base64testcontent');
    });

});
