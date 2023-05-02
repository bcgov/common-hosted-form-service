<template>
  <div>
    <span>
      <ShareForm :form-id="form.id" :warning="!isPublished" />
    </span>

    <span v-if="canViewSubmissions">
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <router-link :to="{ name: 'FormSubmissions', query: { f: form.id } }">
            <v-btn class="mx-1" color="primary" icon v-bind="attrs" v-on="on">
              <v-icon class="mr-1">list_alt</v-icon>
            </v-btn>
          </router-link>
        </template>
        <span>View Submissions</span>
      </v-tooltip>
    </span>

    <span v-if="canManageTeam">
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <router-link :to="{ name: 'FormTeams', query: { f: form.id } }">
            <v-btn class="mx-1" color="primary" icon v-bind="attrs" v-on="on">
              <v-icon>group</v-icon>
            </v-btn>
          </router-link>
        </template>
        <span>Team Management</span>
      </v-tooltip>
    </span>

    <span v-if="canDeleteForm">
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            class="mx-1"
            color="red"
            icon
            v-bind="attrs"
            @click="showDeleteDialog = true"
            v-on="on"
          >
            <v-icon>delete</v-icon>
          </v-btn>
        </template>
        <span>Delete Form</span>
      </v-tooltip>

      <BaseDialog
        v-model="showDeleteDialog"
        type="CONTINUE"
        @close-dialog="showDeleteDialog = false"
        @continue-dialog="deleteForm"
      >
        <template #title>Confirm Deletion</template>
        <template #text>
          Are you sure you wish to delete
          <strong>{{ form.name }}</strong
          >? This form will no longer be accessible.
        </template>
        <template #button-text-continue>
          <span>Delete</span>
        </template>
      </BaseDialog>
    </span>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

import { FormPermissions } from '@/utils/constants';
import ShareForm from '@/components/forms/manage/ShareForm.vue';

export default {
  name: 'ManageFormActions',
  components: { ShareForm },
  data() {
    return {
      showDeleteDialog: false,
    };
  },
  computed: {
    ...mapGetters('form', ['form', 'permissions']),
    // Permission checks
    canDeleteForm() {
      return this.permissions.includes(FormPermissions.FORM_DELETE);
    },
    canManageTeam() {
      return this.permissions.includes(FormPermissions.TEAM_UPDATE);
    },
    canViewSubmissions() {
      const perms = [
        FormPermissions.SUBMISSION_READ,
        FormPermissions.SUBMISSION_UPDATE,
      ];
      return this.permissions.some((p) => perms.includes(p));
    },
    isPublished() {
      return (
        this.form.versions &&
        this.form.versions.length &&
        this.form.versions.some((v) => v.published)
      );
    },
  },
  methods: {
    ...mapActions('form', ['deleteCurrentForm']),
    deleteForm() {
      this.showDeleteDialog = false;
      this.deleteCurrentForm();
      this.$router.push({
        name: 'UserForms',
      });
    },
  },
};
</script>
