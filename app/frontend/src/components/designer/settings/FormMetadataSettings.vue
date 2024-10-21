<script setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { onMounted, ref } from 'vue';
import { useFormStore } from '~/store/form';

const { t, locale } = useI18n({ useScope: 'global' });
const { form, isRTL } = storeToRefs(useFormStore());
const techdocsLink =
  'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Integrations/Form-Metadata/';

const jsonStr = ref(null);

onMounted(async () => {
  jsonStr.value = JSON.stringify(form.value.formMetadata.metadata, null, 2);
});

function toJSON(str) {
  let result = null;
  try {
    if (Object.prototype.toString.call(str) === '[object String]') {
      let o = JSON.parse(str);
      // JSON.parse can return values that are strings not objects...
      if (Object.prototype.toString.call(o) === '[object Object]') {
        result = o;
      }
    }
  } catch {
    /* empty */
  }
  return result;
}

function updateMetadata(v) {
  const o = toJSON(v);
  if (o) {
    form.value.formMetadata.metadata = JSON.parse(v);
  }
}

function formatJSON(focus) {
  if (!focus) {
    const o = toJSON(jsonStr.value);
    if (o) {
      jsonStr.value = JSON.stringify(o, null, 2);
    }
  }
}

/* c8 ignore start */
const metadataRules = ref([
  (v) => {
    const o = toJSON(v);
    if (o) {
      return true;
    }
    return t('trans.formSettings.formMetadataJsonError');
  },
]);
/* c8 ignore stop */
defineExpose({ jsonStr, updateMetadata, formatJSON });
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="locale">{{
        $t('trans.formSettings.formMetadataTitle')
      }}</span></template
    >
    <div class="mb-6 ml-1 font-weight-bold" :lang="locale">
      {{ $t('trans.formSettings.formMetadataMessage') }}
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-icon
            color="primary"
            class="mx-1"
            :class="{ 'mx-1': isRTL }"
            v-bind="props"
            icon="mdi:mdi-help-circle-outline"
          ></v-icon>
        </template>
        <span>
          <a
            :href="techdocsLink"
            class="preview_info_link_field_white"
            target="_blank"
            :hreflang="locale"
          >
            {{ $t('trans.formSettings.learnMore') }}
            <v-icon icon="mdi:mdi-arrow-top-right-bold-box-outline"></v-icon>
          </a>
        </span>
      </v-tooltip>
    </div>

    <v-container class="px-0" :class="{ 'dir-rtl': isRTL }">
      <v-row>
        <v-col cols="12" md="12" class="p-0">
          <v-row class="mb-0 mt-0">
            <v-col class="mb-0 mt-0 pb-0 pt-0">
              <v-textarea
                v-model="jsonStr"
                density="compact"
                rows="4"
                solid
                variant="outlined"
                auto-grow
                :class="{ 'dir-rtl': isRTL, label: isRTL }"
                :lang="locale"
                :rules="metadataRules"
                data-test="json-test"
                @update:focused="formatJSON"
                @update:model-value="updateMetadata"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </BasePanel>
</template>
