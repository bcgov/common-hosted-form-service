<script setup>
import { useI18n } from 'vue-i18n';
import { ref, watch } from 'vue';

const { locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  showDialog: { type: Boolean, required: true },
  component: { type: Object, default: () => {} },
  fcProactiveHelpImageUrl: undefined,
});

const emit = defineEmits(['close-dialog']);

const dialog = ref(properties.showDialog);

watch(
  () => properties.showDialog,
  (value) => {
    dialog.value = value;
  }
);

function onCloseDialog() {
  emit('close-dialog');
}

defineExpose({ onCloseDialog });
</script>

<template>
  <v-row justify="center" class="mb-5">
    <v-dialog
      v-model="dialog"
      :width="fcProactiveHelpImageUrl ? '70%' : '40%'"
      @click:outside="onCloseDialog"
    >
      <v-card>
        <v-container class="overflow-auto">
          <v-row>
            <v-col class="d-flex justify-space-between headerWrapper pa-4">
              <div class="align-self-center">
                {{ component && component.componentName }}
              </div>
              <div class="align-self-center cursor">
                <v-icon icon="mdi:mdi-close" @click="onCloseDialog" />
              </div>
            </v-col>
          </v-row>
          <v-row v-if="fcProactiveHelpImageUrl" class="mt-6">
            <v-col md="6">
              <div
                ref="preview_text_field"
                class="text"
                data-cy="preview_text_field"
              >
                {{ component && component.description }}
              </div>
            </v-col>
            <v-col md="6">
              <v-img
                data-cy="preview_image_field"
                :src="fcProactiveHelpImageUrl"
              ></v-img>
            </v-col>
          </v-row>
          <v-row v-else class="mt-6">
            <v-col cols="12">
              <div
                ref="preview_text_field"
                class="text"
                data-cy="preview_text_field"
              >
                {{ component && component.description }}
              </div>
            </v-col>
          </v-row>
          <v-row v-if="component && component.isLinkEnabled">
            <v-col
              class="d-flex flex-row align-center text-decoration-underline linkWrapper"
            >
              <a
                :href="component && component.externalLink"
                class="preview_info_link_field"
                :target="'_blank'"
                :class="{
                  disabledLink: component && component.moreHelpInfoLink === '',
                }"
              >
                <div class="mr-1 cursor" :lang="locale">
                  {{ $t('trans.proactiveHelpPreviewDialog.learnMore') }}
                  <v-icon icon="mdi:mdi-arrow-top-right-bold-box" /></div
              ></a>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>
  </v-row>
</template>
<style lang="scss" scoped>
.cursor {
  cursor: pointer !important;
}
.text {
  font-style: normal !important;
  font-weight: normal !important;
  font-size: 18px !important;
  font-family: BCSans !important;
  letter-spacing: 0px !important;
  color: #000000 !important;
  opacity: 1 !important;
}
.linkWrapper {
  text-align: left !important;
  text-decoration: underline !important;
  font-weight: normal !important;
  font-style: normal !important;
  font-family: BCSans !important;
  font-size: 18px !important;
  letter-spacing: 0px !important;
  color: #1a5a96 !important;
}
.headerWrapper {
  height: 40px !important;
  background: #1a5a96 0% 0% no-repeat padding-box !important;
  text-align: left !important;
  font-weight: normal !important;
  font-style: normal !important;
  font-family: BCSans !important;
  font-size: 25px !important;
  letter-spacing: 0px !important;
  color: #f2f2f2 !important;
  text-transform: capitalize !important;
}
.disabledLink {
  pointer-events: none;
}
</style>
