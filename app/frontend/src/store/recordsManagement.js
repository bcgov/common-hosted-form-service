import { defineStore } from 'pinia';

import { i18n } from '~/internationalization';
import { recordsManagementService } from '~/services';
import { useNotificationStore } from '~/store/notification';

const getInitialRetentionPolicy = () => ({
  retentionDays: null,
  retentionClassificationId: null,
  retentionClassificationDescription: null,
});

export const useRecordsManagementStore = defineStore('recordsManagement', {
  state: () => ({
    formRetentionPolicy: getInitialRetentionPolicy(),
  }),
  actions: {
    async getFormRetentionPolicy(formId) {
      try {
        const response = await recordsManagementService.getFormRetentionPolicy(
          formId
        );
        this.formRetentionPolicy = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        // We ignore 404 errors because it just means a policy doesn't exist yet
        if (error.response && error.response.status === 404) {
          return;
        }
        notificationStore.addNotification({
          text: i18n.t(
            'trans.store.recordsManagement.getFormRetentionPolicyErrMsg'
          ),
          consoleError: i18n.t(
            'trans.store.recordsManagement.getFormRetentionPolicyConsErrMsg',
            { formId: formId, error: error }
          ),
        });
      }
    },
    async configureRetentionPolicy(formId) {
      try {
        const response =
          await recordsManagementService.configureFormRetentionPolicy(
            formId,
            this.formRetentionPolicy
          );
        this.formRetentionPolicy = response.data;
      } catch (error) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification({
          text: i18n.t(
            'trans.store.recordsManagement.configureFormRetentionPolicyErrMsg'
          ),
          consoleError: i18n.t(
            'trans.store.recordsManagement.configureFormRetentionPolicyConsErrMsg',
            { formId: formId, error: error }
          ),
        });
      }
    },
  },
});
