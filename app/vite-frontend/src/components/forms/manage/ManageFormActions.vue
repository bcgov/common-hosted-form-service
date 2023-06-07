<script setup>
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import BaseDialog from '~/components/base/BaseDialog.vue';
import ShareForm from '~/components/forms/manage/ShareForm.vue';
import getRouter from '~/router';
import { useFormStore } from '~/store/form';

import { FormPermissions } from '~/utils/constants';

const showDeleteDialog = ref(false);

const router = getRouter();

const formStore = useFormStore();
const { form, permissions } = storeToRefs(formStore);

const canDeleteForm = computed(() =>
  permissions.value.includes(FormPermissions.FORM_DELETE)
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
const isPublished = computed(
  () =>
    form?.value?.versions?.length &&
    form.value.versions.some((v) => v.published)
);

function deleteForm() {
  showDeleteDialog.value = false;
  formStore.deleteCurrentForm();
  router.push({ name: 'UserForms' });
}
</script>

<template>
  <div>
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
              icon
              v-bind="props"
              size="small"
            >
              <v-icon icon="mdi:mdi-list-box-outline"></v-icon>
            </v-btn>
          </router-link>
        </template>
        <span>{{ $t('trans.manageFormActions.viewSubmissions') }}</span>
      </v-tooltip>
    </span>

    <span v-if="canManageTeam">
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <router-link :to="{ name: 'FormTeams', query: { f: form.id } }">
            <v-btn
              class="mx-1"
              color="primary"
              icon
              v-bind="props"
              size="small"
            >
              <v-icon icon="mdi:mdi-account-multiple"></v-icon>
            </v-btn>
          </router-link>
        </template>
        <span>{{ $t('trans.manageFormActions.teamManagement') }}</span>
      </v-tooltip>
    </span>

    <span v-if="canDeleteForm">
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn
            class="mx-1"
            color="red"
            icon
            v-bind="props"
            size="small"
            @click="showDeleteDialog = true"
          >
            <v-icon icon="mdi:mdi-delete"></v-icon>
          </v-btn>
        </template>
        <span>{{ $t('trans.manageFormActions.deleteForm') }}</span>
      </v-tooltip>

      <BaseDialog
        v-model="showDeleteDialog"
        type="CONTINUE"
        @close-dialog="showDeleteDialog = false"
        @continue-dialog="deleteForm"
      >
        <template #title>{{
          $t('trans.manageFormActions.confirmDeletion')
        }}</template>
        <template #text>
          {{ $t('trans.manageFormActions.deleteMessageA') }}
          <strong>{{ form.name }}</strong
          >? {{ $t('trans.manageFormActions.deleteMessageB') }}
        </template>
        <template #button-text-continue>
          <span>{{ $t('trans.manageFormActions.deleteForm') }}</span>
        </template>
      </BaseDialog>
    </span>
  </div>
</template>
