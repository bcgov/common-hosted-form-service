<template>
  <v-row class="d-print-none">
    <v-col v-if="formId">
      <v-btn outlined @click="goToAllSubmissionOrDraft">
        <span>{{ $t('trans.formViewerActions.viewAllSubmissions') }}</span>
      </v-btn>
    </v-col>
    <v-col class="text-right">
      <!-- Bulk button -->
      <span v-if="allowSubmitterToUploadFile && !block" class="ml-2">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              @click="$emit('switchView')"
              color="primary"
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>repeat</v-icon>
            </v-btn>
          </template>
          <span>{{
            bulkFile
              ? $t('trans.formViewerActions.switchSingleSubmssn')
              : $t('trans.formViewerActions.switchMultiSubmssn')
          }}</span>
        </v-tooltip>
      </span>

      <span v-if="draftEnabled" class="ml-2">
        <PrintOptions :submission="submission" />
      </span>

      <!-- Save a draft -->
      <span v-if="canSaveDraft && draftEnabled && !bulkFile" class="ml-2">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              @click="$emit('save-draft')"
              color="primary"
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>save</v-icon>
            </v-btn>
          </template>
          <span>{{ $t('trans.formViewerActions.saveAsADraft') }}</span>
        </v-tooltip>
      </span>

      <!-- Go to draft edit -->
      <span v-if="showEditToggle && isDraft && draftEnabled" class="ml-2">
        <router-link
          :to="{
            name: 'UserFormDraftEdit',
            query: {
              s: submissionId,
            },
          }"
        >
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn color="primary" icon v-bind="attrs" v-on="on">
                <v-icon>mode_edit</v-icon>
              </v-btn>
            </template>
            <span>{{ $t('trans.formViewerActions.editThisDraft') }}</span>
          </v-tooltip>
        </router-link>
      </span>
      <!-- Go to draft edit -->
      <span v-if="submissionId && draftEnabled" class="ml-2">
        <ManageSubmissionUsers
          :isDraft="isDraft"
          :submissionId="submissionId"
        />
      </span>
    </v-col>
  </v-row>
</template>

<script>
import { FormPermissions } from '@/utils/constants';
import ManageSubmissionUsers from '@/components/forms/submission/ManageSubmissionUsers.vue';
import PrintOptions from '@/components/forms/PrintOptions.vue';

export default {
  name: 'MySubmissionsActions',
  components: {
    ManageSubmissionUsers,
    PrintOptions,
  },
  props: {
    block: {
      type: Boolean,
      default: false,
    },
    bulkFile: {
      type: Boolean,
      default: false,
    },
    allowSubmitterToUploadFile: {
      type: Boolean,
      default: false,
    },
    draftEnabled: {
      type: Boolean,
      default: false,
    },
    formId: {
      type: String,
      default: undefined,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    permissions: {
      type: Array,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    submissionId: {
      type: String,
      default: undefined,
    },
    submission: {
      type: Object,
      default: undefined,
    },
  },
  computed: {
    canSaveDraft() {
      return !this.readOnly;
    },
    showEditToggle() {
      return (
        this.readOnly &&
        this.permissions.includes(FormPermissions.SUBMISSION_UPDATE)
      );
    },
  },
  methods: {
    switchView() {
      this.$emit('switchView');
    },
    goToAllSubmissionOrDraft() {
      this.$emit('showdoYouWantToSaveTheDraftModal');
    },
  },
};
</script>
<style lang="scss" scoped>
ul#menu li {
  display: inline;
  margin: 1%;
  font-size: 17px;
}
ul#menu li.active {
  font-weight: bold;
  border-bottom: 3px solid #fcba19;
}
.element-right {
  button {
    float: right;
  }
}
</style>
