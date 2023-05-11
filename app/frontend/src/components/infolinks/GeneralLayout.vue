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
      loading-text="Loading... Please wait"
    >
      <template v-slot:item.componentName="{ item }">
        <div>
          <template>
            <div style="text-transform: capitalize label">
              {{ item.raw.componentName }}
            </div>
          </template>
        </div>
      </template>
      <template v-slot:item.actions="{ item, index }">
        <div class="d-flex flex-row justify-end align-center actions">
          <div>
            <v-btn
              data-cy="edit_button"
              color="primary"
              size="small"
              variant="text"
              @click="onOpenDialog(item.raw.componentName)"
            >
              <font-awesome-icon icon="fa-solid fa-pen-to-square" />
              <span class="d-none d-sm-flex" style="font-size: 16px">EDIT</span>
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
              <font-awesome-icon icon="fa-solid fa-eye" />
              <span class="d-none d-sm-flex" style="font-size: 16px"
                >PREVIEW</span
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
                >{{ publish[index] ? 'PUBLISHED' : 'UNPUBLISHED' }}</span
              >
            </v-btn>
          </div>
        </div>
      </template>
    </v-data-table>
    <InformationLinkDialog
      v-if="showDialog"
      :show-dialog="showDialog"
      :group-name="groupName"
      :component-name="componentName"
      :component="component"
      @close-dialog="onDialog"
    />
    <InformationLinkPreviewDialog
      v-if="showPreviewDialog"
      :show-dialog="showPreviewDialog"
      :fc-proactive-help-image-url="fcProactiveHelpImageUrl"
      :component="component"
      @close-dialog="onPreviewDialog"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import InformationLinkDialog from '@src/components/infolinks/InformationLinkDialog.vue';
import InformationLinkPreviewDialog from '@src/components/infolinks/InformationLinkPreviewDialog.vue';

export default {
  name: 'GeneralLayout',
  components: { InformationLinkDialog, InformationLinkPreviewDialog },
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
      headers: [
        {
          title: 'Form Title',
          align: 'start',
          key: 'componentName',
          width: '1%',
        },
        {
          title: 'Actions',
          align: 'end',
          key: 'actions',
          filterable: false,
          sortable: false,
          width: '1%',
        },
      ],
    };
  },
  computed: {
    ...mapGetters('admin', ['fcProactiveHelpImageUrl']),
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
.submissions-table :deep(tbody) tr {
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
