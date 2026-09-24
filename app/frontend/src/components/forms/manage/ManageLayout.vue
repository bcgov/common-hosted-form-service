<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ManageForm from '~/components/forms/manage/ManageForm.vue';
import ManageFormActions from '~/components/forms/manage/ManageFormActions.vue';
import { useFormStore } from '~/store/form';
import { useRecordsManagementStore } from '~/store/recordsManagement';
import { FormPermissions } from '~/utils/constants';

const { locale, t } = useI18n({ useScope: 'global' });

const properties = defineProps({
  f: {
    type: String,
    required: true,
  },
});

const loading = ref(true);

const recordsManagementStore = useRecordsManagementStore();

const { form, permissions, isRTL } = storeToRefs(useFormStore());

// A migrated form carries an audit row; a tenant-native one does not. Say which it is,
// since migration is irreversible and this record is its only trace.
const tenancyTooltip = computed(() => {
  const migratedAt = form.value?.migration?.migratedAt;
  if (!migratedAt) return t('trans.manageLayout.tenantChipTooltip');
  return t('trans.manageLayout.migratedChipTooltip', {
    date: new Date(migratedAt).toLocaleDateString(),
    by: form.value.migration.migratedBy,
  });
});

onMounted(async () => {
  loading.value = true;

  const formStore = useFormStore();

  // Access to this page is already enforced by BaseSecure (IDP permission) and
  // the backend form_read middleware, so anyone who reaches here is authorized.
  // Load the user's form permissions unconditionally; the version list is only
  // returned to designers, so it must not be used as an authorization signal.
  await Promise.all([
    formStore.fetchForm(properties.f),
    formStore.getFormPermissionsForUser(properties.f),
    recordsManagementStore.getFormRetentionPolicy(properties.f),
  ]);

  if (permissions.value.includes(FormPermissions.DESIGN_READ))
    await formStore.fetchDrafts(properties.f);

  loading.value = false;
});
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <div
      class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
    >
      <!-- page title -->
      <div>
        <h1 :lang="locale">{{ $t('trans.manageLayout.manageForm') }}</h1>
        <div class="d-flex align-center flex-wrap ga-2">
          <h3>{{ form.name }}</h3>
          <v-tooltip v-if="form.tenantId" location="bottom">
            <template #activator="{ props: tip }">
              <v-chip
                v-bind="tip"
                size="small"
                color="primary"
                variant="tonal"
                prepend-icon="mdi:mdi-account-group"
                :lang="locale"
              >
                {{
                  form.migration
                    ? $t('trans.manageLayout.migratedChip')
                    : $t('trans.manageLayout.tenantChip')
                }}
              </v-chip>
            </template>
            <span :lang="locale">{{ tenancyTooltip }}</span>
          </v-tooltip>
        </div>
      </div>
      <!-- buttons -->
      <div>
        <v-skeleton-loader :loading="loading" type="actions" class="bgtrans">
          <ManageFormActions />
        </v-skeleton-loader>
      </div>
    </div>
    <v-row no-gutters>
      <v-col cols="12" order="2">
        <v-skeleton-loader
          :loading="loading"
          type="list-item-two-line"
          class="bgtrans"
        >
          <ManageForm />
        </v-skeleton-loader>
      </v-col>
    </v-row>
  </div>
</template>

<style lang="scss" scoped>
.v-skeleton-loader {
  display: inline;
}
</style>
