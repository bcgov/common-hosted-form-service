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
  <v-dialog
    v-model="dialog"
    :width="fcProactiveHelpImageUrl ? '70%' : '40%'"
    @click:outside="onCloseDialog"
  >
    <template #default>
      <div class="content">
        <v-toolbar density="compact" color="primary">
          <v-toolbar-title :lang="locale">{{
            component && component.componentName
          }}</v-toolbar-title>
          <v-btn icon
            ><v-icon icon="mdi:mdi-close" @click="onCloseDialog"></v-icon
          ></v-btn>
        </v-toolbar>
        <v-row class="flex-nowrap">
          <v-col
            class="flex-grow-1 flex-shrink-0 ma-2"
            style="min-width: 100px; max-width: 100%"
            cols="1"
            ><div
              ref="preview_text_field"
              class="ma-2 pa-2"
              data-cy="preview_text_field"
            >
              {{ component && component.description }}
            </div></v-col
          >
          <v-col
            v-if="fcProactiveHelpImageUrl"
            class="flex-grow-0 flex-shrink-0"
            cols="7"
            ><div class="ma-2 pa-2">
              <v-img
                data-cy="preview_image_field"
                :src="fcProactiveHelpImageUrl"
              ></v-img>
            </div>
          </v-col>
        </v-row>
        <v-row style="margin: 0">
          <v-col class="ma-2">
            <a
              :href="component && component.externalLink"
              :target="'_blank'"
              :class="{
                disabledLink: component && component.moreHelpInfoLink === '',
              }"
              style="padding: 0"
            >
              <div :lang="locale">
                {{ $t('trans.proactiveHelpPreviewDialog.learnMore') }}
                <v-icon icon="mdi:mdi-arrow-top-right-bold-box" /></div
            ></a>
          </v-col>
        </v-row>
      </div>
    </template>
  </v-dialog>
</template>

<style lang="scss">
.content {
  background: white;
}
</style>
