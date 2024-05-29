<script setup>
import { computed } from 'vue';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLocale } from 'vuetify';

import { useFormStore } from '~/store/form';

const { locale } = useI18n({ useScope: 'global' });

const items = ref([
  { title: 'English', keyword: 'en' },
  { title: 'عربى (Arabic)', keyword: 'ar' },
  { title: 'German (Germany)', keyword: 'de' },
  { title: 'Español (Spanish)', keyword: 'es' },
  { title: 'فارسی (Farsi)', keyword: 'fa' },
  { title: 'Français (French)', keyword: 'fr' },
  { title: 'हिंदी (Hindi)', keyword: 'hi' },
  { title: 'Italian (Italy)', keyword: 'it' },
  { title: '日本語 (Japanese)', keyword: 'ja' },
  { title: '한국어 (Korean)', keyword: 'ko' },
  { title: 'ਪੰਜਾਬੀ (Punjabi - Gurmukhi)', keyword: 'pa' },
  { title: 'Portuguese (Portugal)', keyword: 'pt' },
  { title: 'Русский (Russian)', keyword: 'ru' },
  { title: 'Tagalog (Filipino)', keyword: 'tl' },
  { title: 'Українська (Ukrainian)', keyword: 'uk' },
  { title: 'Tiếng Việt (Vietnamese)', keyword: 'vi' },
  { title: '简体中文 (Simplified Chinese)', keyword: 'zh' },
  { title: '繁體中文 (Traditional Chinese)', keyword: 'zhTW' },
]);

const { current } = useLocale();

function languageSelected(lang) {
  current.value = lang == 'zh' ? 'zhHans' : lang == 'zhTW' ? 'zhHant' : lang;
  useFormStore().$patch({
    isRTL: lang === 'ar' || lang === 'fa' ? true : false,
  });
}

const SELECTED_LANGUAGE_TITLE = computed(
  () => items.value.find((language) => language.keyword === locale.value).title
);
</script>

<template>
  <div class="text-center">
    <v-select
      v-model="$i18n.locale"
      class="ml-3"
      :items="$i18n.availableLocales"
      prepend-inner-icon="mdi:mdi-web"
      variant="outlined"
      density="compact"
      hide-details
      :title="SELECTED_LANGUAGE_TITLE"
      @update:model-value="languageSelected"
    >
      <template #selection="{ props, item }">
        <v-list-item
          v-bind="props"
          :title="items.find((language) => language.keyword === item.raw).title"
        ></v-list-item>
      </template>
      <template #item="{ props, item }">
        <v-list-item
          v-bind="props"
          :title="items.find((language) => language.keyword === item.raw).title"
        ></v-list-item>
      </template>
    </v-select>
  </div>
</template>
