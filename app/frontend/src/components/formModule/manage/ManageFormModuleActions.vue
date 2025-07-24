<script setup>
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormModuleStore } from '~/store/formModule';

const { locale } = useI18n({ useScope: 'global' });

const showActiveDialog = ref(false);

const formModuleStore = useFormModuleStore();

const { formModule } = storeToRefs(formModuleStore);

function toggleActive() {
  if (formModule.value.active) {
    showActiveDialog.value = true;
  } else {
    updateActive();
  }
}

function cancelDeactivate() {
  showActiveDialog.value = false;
  formModuleStore.fetchFormModule(formModule.value.id);
}

async function updateActive() {
  showActiveDialog.value = false;
  await formModuleStore.toggleFormModule({
    formModuleId: formModule.value.id,
    active: !formModule.value.active,
  });
  formModuleStore.fetchFormModule(formModule.value.id);
}
</script>

<template>
  <div>
    <span>
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <router-link
            :to="{
              name: 'FormModuleAddVersion',
              query: { fm: formModule.id },
            }"
          >
            <v-btn
              v-bind="props"
              class="mx-1"
              color="primary"
              icon="mdi-plus"
              size="x-small"
              :title="$t('trans.manageFormModuleActions.importFormModule')"
            >
            </v-btn>
          </router-link>
        </template>
        <span :lang="locale">{{
          $t('trans.manageFormModuleActions.importFormModule')
        }}</span>
      </v-tooltip>
    </span>
    <span>
      <v-switch
        color="success"
        class="float-right m-1"
        :model-value="formModule.active"
        :label="
          formModule.active
            ? $t('trans.manageFormModuleActions.active')
            : $t('trans.manageFormModuleActions.inactive')
        "
        @update:model-value="toggleActive"
      />

      <BaseDialog
        v-model="showActiveDialog"
        type="CONTINUE"
        @close-dialog="cancelDeactivate"
        @continue-dialog="updateActive"
      >
        <template #title>{{
          $t('trans.manageFormModuleActions.confirmDeactivationTitle')
        }}</template>
        <template #text>
          <p
            v-html="
              $t('trans.manageFormModuleActions.confirmDeactivationText', {
                pluginName: formModule.pluginName,
              })
            "
          ></p>
        </template>
        <template #button-text-continue>
          <span>{{ $t('trans.manageFormModuleActions.deactivate') }}</span>
        </template>
      </BaseDialog>
    </span>
  </div>
</template>
