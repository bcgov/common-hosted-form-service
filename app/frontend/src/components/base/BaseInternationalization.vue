<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFormStore } from '~/store/form';
import { useLocale } from 'vuetify';

const language = ref('English');
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

const { locale } = useI18n({ useScope: 'global' });
const { current } = useLocale();

function languageSelected(lang) {
  language.value = lang.title;
  locale.value = lang.keyword;
  current.value =
    lang.keyword == 'zh'
      ? 'zhHans'
      : lang.keyword == 'zhTW'
      ? 'zhHant'
      : lang.keyword;
  useFormStore().$patch({
    lang: lang.keyword,
    isRTL: lang.keyword === 'ar' || lang.keyword === 'fa' ? true : false,
  });
}
</script>

<template>
  <div class="text-center">
    <v-menu>
      <template #activator="{ props }">
        <v-btn variant="outlined" color="white" v-bind="props" class="ml-3">
          <v-icon class="mr-1" icon="mdi:mdi-web" />
          {{ language }}
          <v-icon class="ml-3" icon="mdi:mdi-menu-down" />
        </v-btn>
      </template>
      <v-list data-test="loc-list">
        <v-list-item
          v-for="loc in items"
          :key="loc.keyword"
          @click="languageSelected(loc)"
        >
          <v-list-item-title>{{ loc.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<style lang="scss" scoped>
.select {
  margin: 0px !important;
  margin-left: 8px !important;
  padding: 0px !important;
  height: 30px !important;

  float: right !important;
}
</style>
