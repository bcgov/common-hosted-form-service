<template>
  <div
    class="d-print-none d-flex flex-md-row justify-space-between flex-sm-row flex-xs-column-reverse"
    :class="{ 'dir-rtl': isRTL }"
  >
    <div v-if="formId">
      <v-btn outlined @click="goToAllSubmissionOrDraft">
        <span :lang="lang"
          >{{ $t('trans.formViewerActions.viewAllSubmissions') }}
        </span>
      </v-btn>
    </div>
    <div>
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
          <span :lang="lang">{{
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
          <span :lang="lang">{{
            $t('trans.formViewerActions.saveAsADraft')
          }}</span>
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
            <span :lang="lang">{{
              $t('trans.formViewerActions.editThisDraft')
            }}</span>
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
    </div>
  </div>
</template>

<script>
import { FormPermissions } from '@/utils/constants';
import ManageSubmissionUsers from '@/components/forms/submission/ManageSubmissionUsers.vue';
import PrintOptions from '@/components/forms/PrintOptions.vue';
import { mapGetters } from 'vuex';
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
    ...mapGetters('form', ['lang']),
    canSaveDraft() {
      return !this.readOnly;
    },
    showEditToggle() {
      return (
        this.readOnly &&
        this.permissions.includes(FormPermissions.SUBMISSION_UPDATE)
      );
    },
    ...mapGetters('form', ['isRTL']),
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
