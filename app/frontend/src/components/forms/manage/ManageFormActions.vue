<script>
import { mapActions, mapState } from 'pinia';

import BaseDialog from '~/components/base/BaseDialog.vue';
import ShareForm from '~/components/forms/manage/ShareForm.vue';
import { useFormStore } from '~/store/form';

import { FormPermissions } from '~/utils/constants';

export default {
  components: {
    BaseDialog,
    ShareForm,
  },
  data() {
    return {
      showDeleteDialog: false,
    };
  },
  computed: {
    ...mapState(useFormStore, ['form', 'permissions', 'isRTL', 'lang']),
    canDeleteForm() {
      return this.permissions.includes(FormPermissions.FORM_DELETE);
    },
    canManageEmail() {
      return this.permissions.includes(FormPermissions.EMAIL_TEMPLATE_UPDATE);
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
        this.form?.versions?.length &&
        this.form.versions.some((v) => v.published)
      );
    },
  },
  methods: {
    ...mapActions(useFormStore, ['deleteCurrentForm']),
    async deleteForm() {
      this.showDeleteDialog = false;
      await this.deleteCurrentForm();
      this.$router.push({ name: 'UserForms' });
    },
  },
};
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <span>
      <ShareForm :form-id="form.id" :warning="!isPublished" />
    </span>

    <span v-if="canViewSubmissions">
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <router-link :to="{ name: 'FormSubmissions', query: { f: form.id } }">
            <v-btn
              class="mx-1"
              color="primary"
              v-bind="props"
              size="x-small"
              density="default"
              icon="mdi:mdi-list-box-outline"
            />
          </router-link>
        </template>
        <span :lang="lang">{{
          $t('trans.manageFormActions.viewSubmissions')
        }}</span>
      </v-tooltip>
    </span>

    <span v-if="canManageTeam">
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <router-link :to="{ name: 'FormTeams', query: { f: form.id } }">
            <v-btn
              class="mx-1"
              color="primary"
              v-bind="props"
              size="x-small"
              density="default"
              icon="mdi:mdi-account-multiple"
            />
          </router-link>
        </template>
        <span :lang="lang">{{
          $t('trans.manageFormActions.teamManagement')
        }}</span>
      </v-tooltip>
    </span>

    <span v-if="canManageEmail">
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <router-link :to="{ name: 'FormEmails', query: { f: form.id } }">
            <v-btn
              class="mx-1"
              color="primary"
              v-bind="props"
              size="x-small"
              density="default"
              icon="mdi:mdi-email"
            />
          </router-link>
        </template>
        <span :lang="lang">
          {{ $t('trans.manageFormActions.emailManagement') }}
          <v-icon icon="mdi:mdi-flask" size="small" />
        </span>
      </v-tooltip>
    </span>

    <span v-if="canDeleteForm">
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn
            class="mx-1"
            color="red"
            v-bind="props"
            size="x-small"
            density="default"
            icon="mdi:mdi-delete"
            @click="showDeleteDialog = true"
          />
        </template>
        <span
          ><span :lang="lang">{{
            $t('trans.manageFormActions.deleteForm')
          }}</span></span
        >
      </v-tooltip>

      <BaseDialog
        v-model="showDeleteDialog"
        type="CONTINUE"
        @close-dialog="showDeleteDialog = false"
        @continue-dialog="deleteForm"
      >
        <template #title
          ><span :lang="lang">
            {{ $t('trans.manageFormActions.confirmDeletion') }}
          </span></template
        >
        <template #text>
          <span :lang="lang"
            >{{ $t('trans.manageFormActions.deleteMessageA') }}
            <strong>{{ form.name }}</strong
            >? {{ $t('trans.manageFormActions.deleteMessageB') }}
          </span>
        </template>
        <template #button-text-continue>
          <span :lang="lang">{{
            $t('trans.manageFormActions.deleteForm')
          }}</span>
        </template>
      </BaseDialog>
    </span>
  </div>
</template>
