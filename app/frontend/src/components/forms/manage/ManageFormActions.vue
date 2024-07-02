<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import BaseDialog from '~/components/base/BaseDialog.vue';
import ShareForm from '~/components/forms/manage/ShareForm.vue';
import { useFormStore } from '~/store/form';

import { FormPermissions } from '~/utils/constants';

const { locale } = useI18n({ useScope: 'global' });

const showDeleteDialog = ref(false);

const formStore = useFormStore();

const { form, permissions, isRTL } = storeToRefs(formStore);

const router = useRouter();

const canDeleteForm = computed(() =>
  permissions.value.includes(FormPermissions.FORM_DELETE)
);

const canManageEmail = computed(() =>
  permissions.value.includes(FormPermissions.EMAIL_TEMPLATE_UPDATE)
);

const canManageTeam = computed(() =>
  permissions.value.includes(FormPermissions.TEAM_UPDATE)
);

const canViewSubmissions = computed(() => {
  const perms = [
    FormPermissions.SUBMISSION_READ,
    FormPermissions.SUBMISSION_UPDATE,
  ];
  return permissions.value.some((p) => perms.includes(p));
});

const isPublished = computed(() => {
  return (
    form.value?.versions?.length && form.value.versions.some((v) => v.published)
  );
});

async function deleteForm() {
  showDeleteDialog.value = false;
  await formStore.deleteCurrentForm();
  router.push({ name: 'UserForms' });
}

defineExpose({
  canDeleteForm,
  canManageEmail,
  canManageTeam,
  canViewSubmissions,
  isPublished,
  deleteForm,
  showDeleteDialog,
});
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
              data-test="canViewFormSubmissions"
              :title="$t('trans.manageFormActions.viewSubmissions')"
            />
          </router-link>
        </template>
        <span :lang="locale">{{
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
              data-test="canManageTeammembers"
              :title="$t('trans.manageFormActions.teamManagement')"
            />
          </router-link>
        </template>
        <span :lang="locale">{{
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
              data-test="canUpdateEmail"
              :title="$t('trans.manageFormActions.emailManagement')"
            />
          </router-link>
        </template>
        <span :lang="locale">
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
            data-test="canRemoveForm"
            :title="$t('trans.manageFormActions.deleteForm')"
            @click="showDeleteDialog = true"
          />
        </template>
        <span
          ><span :lang="locale">{{
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
          ><span :lang="locale">
            {{ $t('trans.manageFormActions.confirmDeletion') }}
          </span></template
        >
        <template #text>
          <span :lang="locale"
            >{{ $t('trans.manageFormActions.deleteMessageA') }}
            <strong>{{ form.name }}</strong
            >? {{ $t('trans.manageFormActions.deleteMessageB') }}
          </span>
        </template>
        <template #button-text-continue>
          <span :lang="locale">{{
            $t('trans.manageFormActions.deleteForm')
          }}</span>
        </template>
      </BaseDialog>
    </span>
  </div>
</template>
