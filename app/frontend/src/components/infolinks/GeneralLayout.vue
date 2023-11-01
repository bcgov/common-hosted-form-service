<script>
import { mapActions, mapState } from 'pinia';

import ProactiveHelpDialog from '~/components/infolinks/ProactiveHelpDialog.vue';
import ProactiveHelpPreviewDialog from '~/components/infolinks/ProactiveHelpPreviewDialog.vue';
import { i18n } from '~/internationalization';
import { useFormStore } from '~/store/form';
import { useAdminStore } from '~/store/admin';

export default {
  components: {
    ProactiveHelpDialog,
    ProactiveHelpPreviewDialog,
  },
  props: {
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
  },
  data() {
    return {
      component: {},
      componentName: '',
      loading: false,
      publish: [],
      publishStatus: 'UNPUBLISHED',
      showDialog: false,
      showPreviewDialog: false,
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang']),
    ...mapState(useAdminStore, ['fcProactiveHelpImageUrl']),
    headers() {
      return [
        {
          title: i18n.t('trans.generalLayout.formTitle'),
          align: 'start',
          key: 'componentName',
          width: '1%',
        },
        {
          title: i18n.t('trans.generalLayout.actions'),
          align: 'end',
          key: 'actions',
          filterable: false,
          sortable: false,
          width: '1%',
        },
      ];
    },
  },
  mounted() {
    let idx = 0;
    for (let layoutItem of this.layoutList) {
      for (let component of this.componentsList) {
        if (component.componentName === layoutItem.componentName) {
          this.publish[idx] = component.status;
        }
      }
      idx++;
    }
  },
  methods: {
    ...mapActions(useAdminStore, [
      'getFCProactiveHelpImageUrl',
      'updateFCProactiveHelpStatus',
    ]),
    //used to open form component help information dialog
    onDialog() {
      this.showDialog = !this.showDialog;
    },

    //used to open form component help information preview dialog
    onPreviewDialog() {
      this.showPreviewDialog = !this.showPreviewDialog;
    },

    canDisabled(compName) {
      return (
        this.componentsList.filter(
          (component) => component.componentName === compName
        ).length == 0
      );
    },

    onOpenDialog(compName) {
      this.getComponent(compName);
      this.onDialog();
    },

    async onOpenPreviewDialog(compName) {
      const item = this.componentsList.find(
        (item) => item.componentName === compName
      );
      await this.getFCProactiveHelpImageUrl(item.id);
      this.getComponent(item.componentName);
      this.onPreviewDialog();
    },

    getComponent(compName) {
      if (compName) {
        this.componentName = compName;
        this.component = this.componentsList.find((obj) => {
          return obj.componentName === this.componentName;
        });
      }
    },

    onSwitchChange(compName, index) {
      for (const comp of this.componentsList) {
        if (comp.componentName === compName) {
          this.updateFCProactiveHelpStatus({
            componentId: comp.id,
            publishStatus: this.publish[index],
          });
        }
      }
    },
  },
};
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
      :lang="lang"
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
              <span
                class="d-none d-sm-flex"
                style="font-size: 16px"
                :lang="lang"
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
              :disabled="canDisabled(item.raw.componentName)"
              @click="onOpenPreviewDialog(item.raw.componentName)"
            >
              <v-icon icon="mdi:mdi-eye"></v-icon>
              <span
                class="d-none d-sm-flex"
                style="font-size: 16px"
                :lang="lang"
                >{{ $t('trans.generalLayout.preview') }}</span
              >
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
                :class="{ 'dir-ltl': isRTL }"
                density="compact"
                hide-details
                color="success"
                @update:model-value="
                  onSwitchChange(item.raw.componentName, index)
                "
              ></v-switch>
              <span
                style="width: 120px !important; font-size: 16px"
                class="d-none d-sm-flex"
                :lang="lang"
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
