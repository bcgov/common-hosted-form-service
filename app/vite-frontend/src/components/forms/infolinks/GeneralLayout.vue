<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ProactiveHelpDialog from '~/components/forms/infolinks/ProactiveHelpDialog.vue';
import ProactiveHelpPreviewDialog from '~/components/forms/infolinks/ProactiveHelpPreviewDialog.vue';
import { useAdminStore } from '~/store/admin';

const { t } = useI18n({ useScope: 'global' });

const properties = defineProps({
  layoutList: {
    type: Array,
    required: true,
  },
  componentsList: {
    type: Array,
    default: () => [],
  },
  groupName: {
    type: String,
    required: true,
  },
});

const adminStore = useAdminStore();

const component = ref({});
const componentName = ref('');
const loading = ref(false);
const publish = ref([]);
const showDialog = ref(false);
const showPreviewDialog = ref(false);

const { fcProactiveHelpImageUrl } = storeToRefs(adminStore);

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

//used to open form component help information dialog
function onDialog() {
  showDialog.value = !showDialog.value;
}

//used to open form component help information preview dialog
function onPreviewDialog() {
  showPreviewDialog.value = !showPreviewDialog.value;
}

function canDisabled(compName) {
  return (
    properties.componentsList.filter(
      (component) => component.componentName === compName
    ).length == 0
  );
}

function isComponentPublish(compName, index) {
  for (let component of properties.componentsList) {
    if (component.componentName === compName) {
      publish.value[index] = component.status;
    }
  }
}

function onOpenDialog(compName) {
  getComponent(compName);
  onDialog();
}

async function onOpenPreviewDialog(compName) {
  const item = properties.componentsList.find(
    (item) => item.componentName === compName
  );
  await adminStore.getFCProactiveHelpImageUrl(item.id);
  getComponent(item.componentName);
  onPreviewDialog();
}

function getComponent(compName) {
  if (compName) {
    componentName.value = compName;
    component.value = properties.componentsList.find((obj) => {
      return obj.componentName === componentName.value;
    });
  }
}

function onSwitchChange(compName, index) {
  for (const comp of properties.componentsList) {
    if (comp.componentName === compName) {
      adminStore.updateFCProactiveHelpStatus({
        componentId: comp.id,
        publishStatus: publish.value[index],
      });
    }
  }
}
</script>

<template>
  <div>
    <v-data-table
      class="submissions-table"
      :headers="headers"
      hide-default-header
      hide-default-footer
      disable-pagination
      :items="layoutList"
      :loading="loading"
      :loading-text="$t('trans.generalLayout.loadingText')"
    >
      <template #item.componentName="{ item }">
        <div>
          <div style="text-transform: capitalize" class="label">
            {{ item.raw.componentName }}
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
              @click="onOpenDialog(item.raw.componentName)"
            >
              <v-icon icon="mdi:mdi-pencil-box-outline"></v-icon>
              <span class="d-none d-sm-flex" style="font-size: 16px">{{
                $t('trans.generalLayout.edit')
              }}</span>
            </v-btn>
          </div>
          <div>
            <v-btn
              data-cy="preview_button"
              color="primary"
              variant="text"
              size="small"
              :disabled="canDisabled(item.raw.componentName)"
              @click="onOpenPreviewDialog(item.raw.componentName)"
            >
              <v-icon icon="mdi:mdi-eye"></v-icon>
              <span class="d-none d-sm-flex" style="font-size: 16px">{{
                $t('trans.generalLayout.preview')
              }}</span>
            </v-btn>
          </div>
          <div>
            <v-btn
              data-cy="status_button"
              color="primary"
              variant="text"
              size="small"
              :disabled="canDisabled(item.raw.componentName)"
            >
              <v-switch
                v-model="publish[index]"
                small
                color="success"
                :model-value="isComponentPublish(item.raw.componentName, index)"
                @update:model-value="
                  onSwitchChange(item.raw.componentName, index)
                "
              ></v-switch>
              <span
                style="width: 120px !important; font-size: 16px"
                class="d-none d-sm-flex"
                >{{
                  publish[index]
                    ? $t('trans.generalLayout.published')
                    : $t('trans.generalLayout.unpublished')
                }}</span
              >
            </v-btn>
          </div>
        </div>
      </template>
    </v-data-table>
    <ProactiveHelpDialog
      v-if="showDialog"
      :show-dialog="showDialog"
      :group-name="groupName"
      :component-name="componentName"
      :component="component"
      @close-dialog="onDialog"
    />
    <ProactiveHelpPreviewDialog
      v-if="showPreviewDialog"
      :show-dialog="showPreviewDialog"
      :fc-proactive-help-image-url="fcProactiveHelpImageUrl"
      :component="component"
      @close-dialog="onPreviewDialog"
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
