<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';
import { checkFormManage, checkSubmissionView } from '~/utils/permissionUtils';

const { locale, t } = useI18n({ useScope: 'global' });

const formId = ref(null);
const showDescriptionDialog = ref(false);
const loading = ref(true);
const formDescription = ref(null);
const search = ref(null);
const sortBy = ref([{ key: 'name', order: 'asc' }]);

const formStore = useFormStore();
const idpStore = useIdpStore();

const { formList, isRTL } = storeToRefs(formStore);
const { user } = storeToRefs(useAuthStore());

const headers = computed(() => [
  {
    title: t('trans.formsTable.formTitle'),
    align: 'start',
    key: 'name',
    width: '1%',
  },
  {
    title: t('trans.formsTable.action'),
    align: 'end',
    key: 'actions',
    filterable: false,
    sortable: false,
    width: '1%',
  },
]);

const canCreateForm = computed(() =>
  idpStore.isPrimary(user?.value?.idp?.code)
);

const filteredFormList = computed(() =>
  formList.value.filter(
    (f) => checkFormManage(f.permissions) || checkSubmissionView(f.permissions)
  )
);

onMounted(async () => {
  await formStore.getFormsForCurrentUser();
  loading.value = false;
});

function onDescriptionClick(fId, fDescription) {
  formId.value = fId;
  formDescription.value = fDescription;
  showDescriptionDialog.value = true;
}

defineExpose({
  formId,
  formDescription,
  onDescriptionClick,
  showDescriptionDialog,
});
</script>

<template>
  <div class="forms-table" :class="{ 'dir-rtl': isRTL }">
    <div
      class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
    >
      <!-- page title -->
      <div>
        <h1 :lang="locale">{{ $t('trans.formsTable.myForms') }}</h1>
      </div>
      <!-- buttons -->
      <div v-if="canCreateForm">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <router-link
              v-slot="{ navigate }"
              :to="{ name: 'FormCreate' }"
              custom
            >
              <v-btn
                v-bind="props"
                class="mx-1"
                color="primary"
                icon="mdi-plus"
                role="link"
                size="x-small"
                :title="$t('trans.formsTable.createNewForm')"
                @click="navigate"
              >
              </v-btn>
            </router-link>
          </template>
          <span :lang="locale">{{ $t('trans.formsTable.createNewForm') }}</span>
        </v-tooltip>
      </div>
    </div>

    <v-row class="my-3" no-gutters>
      <v-spacer />
      <v-col cols="12" sm="4">
        <!-- search input -->
        <div class="submissions-search">
          <v-text-field
            v-model="search"
            density="compact"
            variant="underlined"
            append-inner-icon="mdi-magnify"
            single-line
            :label="$t('trans.formsTable.search')"
            class="pb-5"
            :class="{ label: isRTL }"
            :lang="locale"
          />
        </div>
      </v-col>
    </v-row>
  </div>

  <!-- table header -->
  <v-data-table
    class="submissions-table"
    hover
    :headers="headers"
    :items="filteredFormList"
    item-value="name"
    :loading="loading"
    :loading-text="$t('trans.formsTable.loadingText')"
    :search="search"
    :lang="locale"
    :sort-by="sortBy"
  >
    <template #item.name="{ item }">
      <router-link
        v-if="item.published"
        :to="{
          name: 'FormSubmit',
          query: { f: item.id },
        }"
        target="_blank"
      >
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ item.name }}</span>
          </template>
          <span :lang="locale">
            {{ $t('trans.formsTable.viewForm') }}
            <v-icon icon="mdi:mdi-open-in-new"></v-icon>
          </span>
        </v-tooltip>
      </router-link>
      <span v-else>{{ item.name }}</span>
      <v-icon
        v-if="item.description?.trim()"
        size="small"
        class="description-icon ml-2 mr-4"
        color="primary"
        icon="mdi:mdi-note-text"
        :aria-label="$t('trans.formsTable.description')"
        @click="onDescriptionClick(item.id, item.description)"
      ></v-icon>
    </template>
    <template #item.actions="{ item }">
      <router-link
        v-if="checkFormManage(item.permissions)"
        :to="{ name: 'FormManage', query: { f: item.id } }"
      >
        <v-btn
          color="primary"
          variant="text"
          size="small"
          :title="$t('trans.formsTable.manage')"
        >
          <v-icon :class="isRTL ? 'ml-1' : 'mr-1'" icon="mdi:mdi-cog"></v-icon>
          <span class="d-none d-sm-flex" :lang="locale">{{
            $t('trans.formsTable.manage')
          }}</span>
        </v-btn>
      </router-link>
      <router-link
        v-if="checkSubmissionView(item.permissions)"
        data-cy="formSubmissionsLink"
        :to="{ name: 'FormSubmissions', query: { f: item.id } }"
      >
        <v-btn
          color="primary"
          variant="text"
          size="small"
          :title="$t('trans.formsTable.submissions')"
        >
          <v-icon
            :class="isRTL ? 'ml-1' : 'mr-1'"
            icon="mdi:mdi-list-box-outline"
          ></v-icon>
          <span class="d-none d-sm-flex" :lang="locale">{{
            $t('trans.formsTable.submissions')
          }}</span>
        </v-btn>
      </router-link>
    </template>
  </v-data-table>

  <BaseDialog
    v-model="showDescriptionDialog"
    show-close-button
    @close-dialog="showDescriptionDialog = false"
  >
    <template #title>
      <span class="pl-5" :lang="locale">{{
        $t('trans.formsTable.Description')
      }}</span>
    </template>
    <template #text>
      <slot name="formDescription">{{ formDescription }}</slot>
    </template>
  </BaseDialog>
</template>

<style scoped>
.submissions-search {
  width: 100%;
}
@media (min-width: 600px) {
  .submissions-search {
    max-width: 20em;
    float: right;
  }
}
@media (max-width: 599px) {
  .submissions-search {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
