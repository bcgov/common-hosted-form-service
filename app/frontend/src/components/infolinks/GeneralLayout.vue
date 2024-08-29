<script setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref } from 'vue';

import ProactiveHelpDialog from '~/components/infolinks/ProactiveHelpDialog.vue';
import ProactiveHelpPreviewDialog from '~/components/infolinks/ProactiveHelpPreviewDialog.vue';
import { useFormStore } from '~/store/form';
import { useAdminStore } from '~/store/admin';

const { t, locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  // This is a list of the components that exist in this grouping
  formComponentNames: {
    type: Array,
    required: true,
  },
  // This is the actual component data
  formComponentData: {
    type: Array,
    default: () => [],
  },
  groupName: {
    type: String,
    required: true,
  },
});

const component = ref({});
const loading = ref(false);
const publish = ref([]);
const showEditProactiveHelpDialog = ref(false);
const showPreviewDialog = ref(false);

const adminStore = useAdminStore();
const formStore = useFormStore();

const { fcProactiveHelpImageUrl } = storeToRefs(adminStore);
const { isRTL } = storeToRefs(formStore);

const headers = computed(() => [
  {
    title: t('trans.generalLayout.formTitle'),
    align: 'start',
    key: 'componentName',
    width: '1%',
  },
  {
    title: t('trans.generalLayout.actions'),
    align: 'end',
    key: 'actions',
    filterable: false,
    sortable: false,
    width: '1%',
  },
]);

onMounted(() => {
  for (let [
    idx,
    formComponentName,
  ] of properties.formComponentNames.entries()) {
    for (let formComponentData of properties.formComponentData) {
      if (formComponentData.componentName === formComponentName.componentName) {
        publish.value[idx] = formComponentData.status;
      }
    }
  }
});

// Toggles the visibility of the edit proactive help dialog
function toggleEditProactiveHelpDialog() {
  showEditProactiveHelpDialog.value = !showEditProactiveHelpDialog.value;
}

// Should preview the proactive help dialog
function togglePreviewDialog() {
  showPreviewDialog.value = !showPreviewDialog.value;
}

function isPreviewEnabled(compName) {
  return (
    properties.formComponentData.filter((component) => {
      return component.componentName === compName;
    }).length == 0
  );
}

function onOpenEditDialog(compName) {
  setComponent(compName);
  toggleEditProactiveHelpDialog();
}

async function onOpenPreviewDialog(compName) {
  loading.value = true;
  const item = properties.formComponentData.find(
    (item) => item.componentName === compName
  );
  await adminStore.getFCProactiveHelpImageUrl(item.id);
  setComponent(item.componentName);
  togglePreviewDialog();
  loading.value = false;
}

/*
 * Sets the component data for the dialogs to use.
 *
 * @param compName The name of the component
 */
function setComponent(compName) {
  if (compName) {
    component.value = properties.formComponentData.find((obj) => {
      return obj.componentName === compName;
    });
  }
}

async function onSwitchChange(compName, index) {
  loading.value = true;
  for (const comp of properties.formComponentData) {
    if (comp.componentName === compName) {
      await adminStore.updateFCProactiveHelpStatus({
        componentId: comp.id,
        publishStatus: publish.value[index],
      });
    }
  }
  loading.value = false;
}

defineExpose({
  component,
  isPreviewEnabled,
  onOpenEditDialog,
  onOpenPreviewDialog,
  onSwitchChange,
  publish,
  showEditProactiveHelpDialog,
  toggleEditProactiveHelpDialog,
});
</script>

<template>
  <div>
    <v-data-table
      class="submissions-table"
      :headers="headers"
      hide-default-header
      hide-default-footer
      disable-pagination
      :items="formComponentNames"
      :loading="loading"
      :loading-text="$t('trans.generalLayout.loadingText')"
      :lang="locale"
    >
      <template #item.componentName="{ item }">
        <div>
          <div style="text-transform: capitalize" class="label">
            {{ item.componentName }}
          </div>
        </div>
      </template>
      <template #item.actions="{ item, index }">
        <div class="d-flex flex-row justify-end align-center actions">
          <div>
            <v-btn
              data-cy="edit_button"
              color="primary"
              size="small"
              variant="text"
              :title="$t('trans.generalLayout.edit')"
              @click="onOpenEditDialog(item.componentName)"
            >
              <v-icon icon="mdi:mdi-pencil-box-outline"></v-icon>
              <span
                class="d-none d-sm-flex"
                style="font-size: 16px"
                :lang="locale"
                >{{ $t('trans.generalLayout.edit') }}</span
              >
            </v-btn>
          </div>
          <div>
            <v-btn
              data-cy="preview_button"
              color="primary"
              variant="text"
              size="small"
              :disabled="isPreviewEnabled(item.componentName)"
              :title="$t('trans.generalLayout.preview')"
              @click="onOpenPreviewDialog(item.componentName)"
            >
              <v-icon icon="mdi:mdi-eye"></v-icon>
              <span
                class="d-none d-sm-flex"
                style="font-size: 16px"
                :lang="locale"
                >{{ $t('trans.generalLayout.preview') }}</span
              >
            </v-btn>
          </div>
          <div>
            <v-switch
              v-model="publish[index]"
              :class="{ 'dir-ltl': isRTL }"
              density="compact"
              hide-details
              color="success"
              @update:model-value="onSwitchChange(item.componentName, index)"
            >
              <template #label>
                <span
                  style="width: 120px !important; font-size: 16px"
                  class="d-none d-sm-flex"
                  :lang="locale"
                  >{{
                    publish[index]
                      ? $t('trans.generalLayout.published')
                      : $t('trans.generalLayout.unpublished')
                  }}</span
                >
              </template>
            </v-switch>
          </div>
        </div>
      </template>
    </v-data-table>
    <ProactiveHelpDialog
      v-if="showEditProactiveHelpDialog"
      :show-dialog="showEditProactiveHelpDialog"
      :group-name="groupName"
      :component-name="component.componentName"
      :component="component"
      @close-dialog="toggleEditProactiveHelpDialog"
    />
    <ProactiveHelpPreviewDialog
      v-if="showPreviewDialog"
      :show-dialog="showPreviewDialog"
      :fc-proactive-help-image-url="fcProactiveHelpImageUrl"
      :component="component"
      @close-dialog="togglePreviewDialog"
    />
  </div>
</template>

<style lang="scss" scoped>
.submissions-table :deep(tbody tr) {
  background: #bfbdbd14 !important;
  border: 1px solid #7070703f !important;
  margin-bottom: 35px !important;
  border-spacing: 15px 50px !important;
}

.actions > div {
  border-left: 1px solid #7070703f !important;
  padding-left: 10px !important;
  padding-right: 10px !important;
  display: flex !important;
  justify-content: center !important;
}

.label {
  text-align: left !important;
  font-style: normal !important;
  font-size: 18px !important;
  font-family: BCSans !important;
  font-weight: normal !important;
  color: #003366 !important;
}

.actions > div:last-child {
  border-left: 1px solid #7070703f !important;
  width: 240px !important;
  display: flex !important;
  justify-content: center !important;
}
</style>
