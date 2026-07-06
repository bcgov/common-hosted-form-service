<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseDialog from '~/components/base/BaseDialog.vue';
import { useAdminStore } from '~/store/admin';
import { useFormStore } from '~/store/form';

const { t } = useI18n({ useScope: 'global' });

const adminStore = useAdminStore();
const formStore = useFormStore();

const { featureFlags, featureFlag } = storeToRefs(adminStore);
const { isRTL, lang } = storeToRefs(formStore);

const loading = ref(true);
const manageDialog = ref(false);
const dialogTab = ref('forms');
const newFormId = ref('');
const newTenantId = ref('');
const formSearch = ref('');
const tenantSearch = ref('');

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const isUuid = (v) => UUID_REGEX.test((v || '').trim());

const headers = computed(() => [
  { title: t('trans.adminFeatureFlags.name'), key: 'name', align: 'start' },
  {
    title: t('trans.adminFeatureFlags.description'),
    key: 'description',
    align: 'start',
  },
  {
    title: t('trans.adminFeatureFlags.enabled'),
    key: 'enabled',
    align: 'start',
  },
  {
    title: t('trans.adminFeatureFlags.universal'),
    key: 'allowAll',
    align: 'start',
    sortable: false,
  },
  {
    title: t('trans.adminFeatureFlags.actions'),
    key: 'actions',
    align: 'end',
    sortable: false,
  },
]);

const allowlistHeaders = computed(() => [
  { title: t('trans.adminFeatureFlags.id'), key: 'id', align: 'start' },
  {
    title: t('trans.adminFeatureFlags.actions'),
    key: 'actions',
    align: 'end',
    sortable: false,
  },
]);

const formItems = computed(() =>
  (featureFlag.value?.forms ?? []).map((id) => ({ id }))
);
const tenantItems = computed(() =>
  (featureFlag.value?.tenants ?? []).map((id) => ({ id }))
);

onMounted(async () => {
  loading.value = true;
  await adminStore.getFeatureFlags();
  loading.value = false;
});

async function openManage(item) {
  newFormId.value = '';
  newTenantId.value = '';
  formSearch.value = '';
  tenantSearch.value = '';
  dialogTab.value = 'forms';
  await adminStore.getFeatureFlag(item.code);
  manageDialog.value = true;
}

async function addForm() {
  if (!featureFlag.value || !isUuid(newFormId.value)) return;
  await adminStore.addFeatureFlagForm(
    featureFlag.value.code,
    newFormId.value.trim()
  );
  newFormId.value = '';
}
async function removeForm(formId) {
  await adminStore.removeFeatureFlagForm(featureFlag.value.code, formId);
}
async function addTenant() {
  if (!featureFlag.value || !isUuid(newTenantId.value)) return;
  await adminStore.addFeatureFlagTenant(
    featureFlag.value.code,
    newTenantId.value.trim()
  );
  newTenantId.value = '';
}
async function removeTenant(tenantId) {
  await adminStore.removeFeatureFlagTenant(featureFlag.value.code, tenantId);
}
</script>

<template>
  <div>
    <v-data-table
      class="features-table"
      data-test="featureFlags-table"
      hover
      :headers="headers"
      :items="featureFlags"
      item-key="code"
      :loading="loading"
      :loading-text="$t('trans.adminFeatureFlags.loadingText')"
      :lang="lang"
    >
      <template #item.enabled="{ item }">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              :color="item.enabled ? 'success' : 'secondary'"
              size="small"
              label
            >
              {{
                item.enabled
                  ? $t('trans.adminFeatureFlags.on')
                  : $t('trans.adminFeatureFlags.off')
              }}
            </v-chip>
          </template>
          <span :lang="lang">{{
            $t('trans.adminFeatureFlags.enabledHint')
          }}</span>
        </v-tooltip>
      </template>

      <template #item.allowAll="{ item }">
        <v-switch
          :model-value="item.allowAll"
          color="primary"
          density="compact"
          hide-details
          inset
          :data-test="`featureFlags-allowAll-${item.code}`"
          :aria-label="$t('trans.adminFeatureFlags.universal')"
          @update:model-value="
            (val) => adminStore.setFeatureFlagAllowAll(item.code, val)
          "
        />
      </template>

      <template #item.actions="{ item }">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              color="primary"
              class="mx-1"
              icon
              variant="text"
              v-bind="props"
              :data-test="`featureFlags-manage-${item.code}`"
              :title="$t('trans.adminFeatureFlags.manage')"
              @click="openManage(item)"
            >
              <v-icon icon="mdi:mdi-cog"></v-icon>
            </v-btn>
          </template>
          <span :lang="lang">{{ $t('trans.adminFeatureFlags.manage') }}</span>
        </v-tooltip>
      </template>
    </v-data-table>

    <BaseDialog
      v-model="manageDialog"
      eager
      type="OK"
      show-close-button
      :class="{ 'dir-rtl': isRTL }"
      width="1200"
      @close-dialog="manageDialog = false"
    >
      <template #title>
        <span :lang="lang">{{
          featureFlag ? featureFlag.name || featureFlag.code : ''
        }}</span>
      </template>
      <template #text>
        <div v-if="featureFlag" class="text-left">
          <p v-if="featureFlag.description" class="mb-4">
            {{ featureFlag.description }}
          </p>

          <v-switch
            :model-value="featureFlag.allowAll"
            color="primary"
            density="compact"
            hide-details
            inset
            class="mb-2"
            data-test="featureFlags-dialog-allowAll"
            @update:model-value="
              (val) => adminStore.setFeatureFlagAllowAll(featureFlag.code, val)
            "
          >
            <template #label>
              <span :lang="lang">{{
                $t('trans.adminFeatureFlags.universalLabel')
              }}</span>
            </template>
          </v-switch>

          <v-tabs
            v-model="dialogTab"
            class="mt-2"
            :class="{ 'dir-rtl': isRTL }"
          >
            <v-tab
              value="forms"
              data-test="featureFlags-tab-forms"
              :lang="lang"
            >
              {{ $t('trans.adminFeatureFlags.formsAllowlist') }} ({{
                formItems.length
              }})
            </v-tab>
            <v-tab
              value="tenants"
              data-test="featureFlags-tab-tenants"
              :lang="lang"
            >
              {{ $t('trans.adminFeatureFlags.tenantsAllowlist') }} ({{
                tenantItems.length
              }})
            </v-tab>
          </v-tabs>

          <v-window v-model="dialogTab" class="mt-4">
            <!-- Forms allowlist -->
            <v-window-item value="forms">
              <v-row no-gutters align="center" class="mb-2">
                <v-col cols="12" sm="7">
                  <v-text-field
                    v-model="newFormId"
                    density="compact"
                    variant="outlined"
                    hide-details
                    data-test="featureFlags-form-input"
                    :label="$t('trans.adminFeatureFlags.formId')"
                    :lang="lang"
                    @keyup.enter="addForm"
                  />
                </v-col>
                <v-col cols="auto" class="ml-2">
                  <v-btn
                    color="primary"
                    variant="flat"
                    data-test="featureFlags-form-add"
                    :disabled="!isUuid(newFormId)"
                    @click="addForm"
                  >
                    <span :lang="lang">{{
                      $t('trans.adminFeatureFlags.add')
                    }}</span>
                  </v-btn>
                </v-col>
                <v-spacer />
                <v-col cols="12" sm="3">
                  <v-text-field
                    v-model="formSearch"
                    density="compact"
                    variant="underlined"
                    hide-details
                    single-line
                    append-inner-icon="mdi-magnify"
                    data-test="featureFlags-form-search"
                    :label="$t('trans.adminFeatureFlags.search')"
                    :lang="lang"
                  />
                </v-col>
              </v-row>
              <v-data-table
                class="features-table"
                data-test="featureFlags-forms-table"
                hover
                :headers="allowlistHeaders"
                :items="formItems"
                item-key="id"
                :search="formSearch"
                :no-data-text="$t('trans.adminFeatureFlags.noForms')"
                :lang="lang"
              >
                <template #item.id="{ item }">
                  <code>{{ item.id }}</code>
                </template>
                <template #item.actions="{ item }">
                  <v-btn
                    color="error"
                    icon
                    size="small"
                    variant="text"
                    :data-test="`featureFlags-form-remove-${item.id}`"
                    :title="$t('trans.adminFeatureFlags.remove')"
                    @click="removeForm(item.id)"
                  >
                    <v-icon icon="mdi:mdi-delete"></v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-window-item>

            <!-- Tenants allowlist -->
            <v-window-item value="tenants">
              <v-row no-gutters align="center" class="mb-2">
                <v-col cols="12" sm="7">
                  <v-text-field
                    v-model="newTenantId"
                    density="compact"
                    variant="outlined"
                    hide-details
                    data-test="featureFlags-tenant-input"
                    :label="$t('trans.adminFeatureFlags.tenantId')"
                    :lang="lang"
                    @keyup.enter="addTenant"
                  />
                </v-col>
                <v-col cols="auto" class="ml-2">
                  <v-btn
                    color="primary"
                    variant="flat"
                    data-test="featureFlags-tenant-add"
                    :disabled="!isUuid(newTenantId)"
                    @click="addTenant"
                  >
                    <span :lang="lang">{{
                      $t('trans.adminFeatureFlags.add')
                    }}</span>
                  </v-btn>
                </v-col>
                <v-spacer />
                <v-col cols="12" sm="3">
                  <v-text-field
                    v-model="tenantSearch"
                    density="compact"
                    variant="underlined"
                    hide-details
                    single-line
                    append-inner-icon="mdi-magnify"
                    data-test="featureFlags-tenant-search"
                    :label="$t('trans.adminFeatureFlags.search')"
                    :lang="lang"
                  />
                </v-col>
              </v-row>
              <v-data-table
                class="features-table"
                data-test="featureFlags-tenants-table"
                hover
                :headers="allowlistHeaders"
                :items="tenantItems"
                item-key="id"
                :search="tenantSearch"
                :no-data-text="$t('trans.adminFeatureFlags.noTenants')"
                :lang="lang"
              >
                <template #item.id="{ item }">
                  <code>{{ item.id }}</code>
                </template>
                <template #item.actions="{ item }">
                  <v-btn
                    color="error"
                    icon
                    size="small"
                    variant="text"
                    :data-test="`featureFlags-tenant-remove-${item.id}`"
                    :title="$t('trans.adminFeatureFlags.remove')"
                    @click="removeTenant(item.id)"
                  >
                    <v-icon icon="mdi:mdi-delete"></v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-window-item>
          </v-window>
        </div>
      </template>
    </BaseDialog>
  </div>
</template>

<style scoped>
.features-table :deep(thead tr th) {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
