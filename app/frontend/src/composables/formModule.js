import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFormModuleStore } from '~/store/formModule';
import { useNotificationStore } from '~/store/notification';
import { formModuleService } from '~/services';

export function useFormModuleVersion() {
  const { t } = useI18n({ useScope: 'global' });
  const formModuleStore = useFormModuleStore();
  const notificationStore = useNotificationStore();
  const { formModule, formModuleVersion } = storeToRefs(formModuleStore);

  const saving = ref(false);
  const valid = ref(false);

  /**
   * Parse config string to JSON object
   * @returns {Object|null} Parsed config or null if parsing failed
   */
  function parseConfig() {
    if (!formModuleVersion.value.config) return null;

    try {
      return JSON.parse(formModuleVersion.value.config);
    } catch (error) {
      notificationStore.addNotification({
        text: t('trans.formModuleAddVersion.invalidConfigErrMsg'),
        consoleError: t('trans.formModuleAddVersion.invalidConfigConsErrMsg', {
          error: error.message,
        }),
      });
      return null;
    }
  }

  /**
   * Submit the form module version
   * @returns {Promise<boolean>} Success state
   */
  async function submitFormModuleVersion() {
    try {
      saving.value = true;
      await formModuleStore.setDirtyFlag(false);

      const configValue = parseConfig();
      if (formModuleVersion.value.config && configValue === null) {
        saving.value = false;
        return;
      }

      const formModuleVersionData = {
        config: configValue,
        externalUris: formModuleVersion.value.externalUris.map((i) => i.uri),
      };

      await formModuleService.createFormModuleVersion(
        formModule.value.id,
        formModuleVersionData
      );
    } catch (error) {
      await formModuleStore.setDirtyFlag(true);
      throw error;
    } finally {
      saving.value = false;
    }
  }

  return {
    saving,
    valid,
    submitFormModuleVersion,
    parseConfig,
  };
}
