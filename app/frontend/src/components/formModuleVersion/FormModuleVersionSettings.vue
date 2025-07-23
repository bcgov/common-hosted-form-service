<script setup>
import { storeToRefs } from 'pinia';
import { ref, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFormModuleStore } from '~/store/formModule';
import { useNotificationStore } from '~/store/notification';

const { t, locale } = useI18n({ useScope: 'global' });

const formModuleStore = useFormModuleStore();
const notificationStore = useNotificationStore();
const { formModuleVersion } = storeToRefs(formModuleStore);

const externalUriRules = [
  (v) => !!v || t('trans.formModuleVersionSettings.externalUriRequired'),
  (v) =>
    (v && v.length <= 255) ||
    t('trans.formModuleVersionSettings.externalUriMaxLength', { length: 255 }),
];
const externalUriId = ref(1);
const isLoading = ref(true);

function addUri() {
  externalUriId.value++;
  formModuleVersion.value.externalUris.push({
    id: externalUriId.value,
    uri: '',
  });
}

function removeUri(item) {
  if (formModuleVersion.value.externalUris.length == 1) {
    notificationStore.addNotification({
      text: t('trans.formModuleVersionSettings.externalUriMinOne'),
    });
    return;
  }
  let index = formModuleVersion.value.externalUris
    .map((uri) => {
      return uri.id;
    })
    .indexOf(item.id);
  formModuleVersion.value.externalUris.splice(index, 1);
}

onMounted(() => {
  if (!formModuleVersion.value.id) {
    addUri();
  }
  nextTick(() => {
    isLoading.value = false;
  });
});
</script>

<template>
  <v-container class="px-0">
    <v-row>
      <v-col>
        <BasePanel class="fill-height">
          <template #title>{{
            $t('trans.formModuleVersionSettings.importData')
          }}</template>
          <v-textarea
            v-model="formModuleVersion.importData"
            name="importData"
            no-resize
          >
          </v-textarea>
        </BasePanel>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <BasePanel class="fill-height">
          <template #title
            ><span :lang="locale">{{
              $t('trans.formModuleVersionSettings.externalUris')
            }}</span></template
          >
          <div
            v-for="(item, index) in formModuleVersion.externalUris"
            :key="index"
          >
            <v-text-field v-model="item.uri" :rules="externalUriRules">
              <template #prepend>
                <v-btn
                  icon="mdi-minus"
                  color="red"
                  @click="removeUri(item)"
                ></v-btn>
              </template>
              <template #append>
                <v-btn
                  icon="mdi-plus"
                  color="primary"
                  @click="addUri()"
                ></v-btn>
              </template>
            </v-text-field>
          </div>
        </BasePanel>
      </v-col>
    </v-row>
  </v-container>
</template>
