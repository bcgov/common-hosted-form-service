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
      <template #[`item.componentName`]="{ item }">
        <div>
          <template>
            <div style="text-transform: capitalize" class="label">
              {{ item.componentName }}
            </div>
          </template>
        </div>
      </template>
      <template #[`item.actions`]="{ item, index }">
        <div class="d-flex flex-row justify-end align-center actions">
          <div>
            <v-btn
              data-cy="edit_button"
              color="primary"
              small
              text
              @click="onOpenDialog(item.componentName)"
            >
              <font-awesome-icon icon="fa-solid fa-pen-to-square" />
              <span class="d-none d-sm-flex" style="font-size: 16px">{{
                $t('trans.generalLayout.edit')
              }}</span>
            </v-btn>
          </div>
          <div>
            <v-btn
              data-cy="preview_button"
              color="primary"
              text
              small
              @click="onOpenPreviewDialog(item.componentName)"
              :disabled="canDisabled(item.componentName)"
            >
              <font-awesome-icon icon="fa-solid fa-eye" />
              <span class="d-none d-sm-flex" style="font-size: 16px">{{
                $t('trans.generalLayout.preview')
              }}</span>
            </v-btn>
          </div>
          <div>
            <v-btn
              data-cy="status_button"
              color="primary"
              text
              small
              :disabled="canDisabled(item.componentName)"
            >
              <v-switch
                small
                color="success"
                :input-value="isComponentPublish(item.componentName, index)"
                v-model="publish[index]"
                @change="onSwitchChange(item.componentName, index)"
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
      :showDialog="showDialog"
      v-if="showDialog"
      :groupName="groupName"
      :componentName="componentName"
      @close-dialog="onDialog"
      :component="component"
    />
    <ProactiveHelpPreviewDialog
      :showDialog="showPreviewDialog"
      v-if="showPreviewDialog"
      @close-dialog="onPreviewDialog"
      :fcProactiveHelpImageUrl="fcProactiveHelpImageUrl"
      :component="component"
    />
  </div>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core';
import { mapActions, mapGetters } from 'vuex';
import { faPenToSquare, faEye } from '@fortawesome/free-solid-svg-icons';
import ProactiveHelpDialog from '@/components/infolinks/ProactiveHelpDialog.vue';
import ProactiveHelpPreviewDialog from '@/components/infolinks/ProactiveHelpPreviewDialog.vue';

library.add(faPenToSquare, faEye);

export default {
  name: 'GeneralLayout',
  components: { ProactiveHelpDialog, ProactiveHelpPreviewDialog },
  data() {
    return {
      loading: false,
      showDialog: false,
      showPreviewDialog: false,
      publish: [],
      publishStatus: 'UNPUBLISHED',
      componentName: '',
      component: {},
      listLength: this.componentsList.length,
    };
  },
  computed: {
    headers() {
      return [
        {
          text: this.$t('trans.generalLayout.formTitle'),
          align: 'start',
          value: 'componentName',
          width: '1%',
        },
        {
          text: this.$t('trans.generalLayout.actions'),
          align: 'end',
          value: 'actions',
          filterable: false,
          sortable: false,
          width: '1%',
        },
      ];
    },
    ...mapGetters('admin', ['fcProactiveHelpImageUrl']),
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
    groupName: String,
  },
  methods: {
    ...mapActions('admin', [
      'updateFCProactiveHelpStatus',
      'getFCProactiveHelpImageUrl',
    ]),

    //used to open form component help information dialog
    onDialog() {
      this.showDialog = !this.showDialog;
    },
    //used to open form component help information preview dialog
    onPreviewDialog() {
      this.showPreviewDialog = !this.showPreviewDialog;
    },
    canDisabled(componentName) {
      return (
        this.componentsList.filter(
          (component) => component.componentName === componentName
        ).length == 0
      );
    },

    isComponentPublish(componentName, index) {
      for (let component of this.componentsList) {
        if (component.componentName === componentName) {
          this.publish[index] = component.status;
        }
      }
    },
    onOpenDialog(componentName) {
      this.getComponent(componentName);
      this.onDialog();
    },
    async onOpenPreviewDialog(componentName) {
      const item = this.componentsList.find(
        (item) => item.componentName === componentName
      );
      await this.getFCProactiveHelpImageUrl(item.id);
      this.getComponent(item.componentName);
      this.onPreviewDialog();
    },
    getComponent(componentName) {
      if (componentName) {
        this.componentName = componentName;
        this.component = this.componentsList.find((obj) => {
          return obj.componentName === this.componentName;
        });
      }
    },
    onSwitchChange(componentName, index) {
      for (const component of this.componentsList) {
        if (component.componentName === componentName) {
          this.updateFCProactiveHelpStatus({
            componentId: component.id,
            publishStatus: this.publish[index],
          });
        }
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.submissions-table >>> tbody tr {
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
