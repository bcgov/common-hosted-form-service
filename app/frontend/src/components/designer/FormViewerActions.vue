<template>
  <v-row class="d-print-none">
    <v-col v-if="formId">
      <ul id="menu">
        <li class="active">
          <router-link :to="{ name: 'UserSubmissions', query: { f: formId } }">
            <span>Bulk Submissions</span>
          </router-link>
        </li>
        <li>
          <router-link :to="{ name: 'UserSubmissions', query: { f: formId } }">
            <span> View all submissions/drafts</span>
          </router-link>
        </li>

      </ul>
    </v-col>
    <v-col class="text-right">

      <span v-if="allowSubmitterToUploadFile" class="ml-2">
        <v-btn @click="switchView" color="primary">
          <span v-if="!bulkFile" >Switch to bulk submission</span>
          <span v-else>Switch to single submission</span>
        </v-btn>
      </span>

      <!-- Save a draft -->
      <span v-if="canSaveDraft && draftEnabled" class="ml-2">
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
          <span>Save as a Draft</span>
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
            <span>Edit this Draft</span>
          </v-tooltip>
        </router-link>
      </span>
      <!-- Go to draft edit -->
      <span v-if="submissionId && draftEnabled" class="ml-2">
        <ManageSubmissionUsers :isDraft="isDraft" :submissionId="submissionId" />
      </span>

    </v-col>
  </v-row>
</template>

<script>
import { FormPermissions } from '@/utils/constants';
import ManageSubmissionUsers from '@/components/forms/submission/ManageSubmissionUsers.vue';

export default {
  name: 'MySubmissionsActions',
  components: {
    ManageSubmissionUsers,
  },
  props: {
    bulkFile:{
      type: Boolean,
      default: false,
    },
    allowSubmitterToUploadFile:{
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
    }
  },
  methods:{
    switchView(){
      this.$emit('switchView');
    }
  }
};
</script>
<style lang="scss" scoped>
   ul#menu li {
    display:inline;
    margin:1% ;
    font-size:17px;
   }
   ul#menu li.active {
    font-weight: bold;
    border-bottom:3px solid #fcba19;
   }
   .element-right {
    button {
       float:right;
    }
   }
</style>
