<script>
import { mapState } from 'pinia';
import ManageSubmissionUsers from '~/components/forms/submission/ManageSubmissionUsers.vue';
import PrintOptions from '~/components/forms/PrintOptions.vue';
import { FormPermissions } from '~/utils/constants';
import { useFormStore } from '~/store/form';

export default {
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
      default: () => [],
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
  emits: ['save-draft', 'switchView', 'showdoYouWantToSaveTheDraftModal'],
  computed: {
    ...mapState(useFormStore, ['lang', 'isRTL']),
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
};
</script>

<template>
  <div
    class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
    :class="{ 'dir-rtl': isRTL }"
  >
    <div v-if="formId">
      <v-btn
        color="primary"
        variant="outlined"
        @click="$emit('showdoYouWantToSaveTheDraftModal')"
      >
        <span :lang="lang">{{
          $t('trans.formViewerActions.viewMyDraftOrSubmissions')
        }}</span>
      </v-btn>
    </div>
    <div>
      <!-- Bulk button -->
      <span v-if="allowSubmitterToUploadFile && !block" class="ml-2">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              color="primary"
              icon
              v-bind="props"
              size="x-small"
              @click="$emit('switchView')"
            >
              <v-icon icon="mdi:mdi-repeat"></v-icon>
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
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              color="primary"
              icon
              v-bind="props"
              size="x-small"
              @click="$emit('save-draft')"
            >
              <v-icon icon="mdi:mdi-content-save"></v-icon>
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
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="primary"
                icon="mdi:mdi-pencil"
                size="x-small"
                density="default"
                v-bind="props"
              />
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
          :is-draft="isDraft"
          :submission-id="submissionId"
        />
      </span>
    </div>
  </div>
</template>
