<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { availableLocales, locale } = useI18n({ useScope: 'global' });

const locales = ref([
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
  { title: 'ਪੰਜਾਬੀ (Punjabi)', keyword: 'pa' },
  { title: 'Portuguese (Portugal)', keyword: 'pt' },
  { title: 'Русский (Russian)', keyword: 'ru' },
  { title: 'Tagalog (Filipino)', keyword: 'tl' },
  { title: 'Українська (Ukrainian)', keyword: 'uk' },
  { title: 'Tiếng Việt (Vietnamese)', keyword: 'vi' },
  { title: '简体中文 (Simplified Chinese)', keyword: 'zh' },
  { title: '繁體中文 (Traditional Chinese)', keyword: 'zhTW' },
]);

const LOCALES = computed(() =>
  locales.value.filter((l) => availableLocales.includes(l.keyword))
);

const CURRENT_LOCALE = computed(
  () => locales.value.find((l) => l.keyword === locale.value).title
);

function languageSelected(lang) {
  locale.value = lang;
}
</script>

<template>
  <div class="text-center">
    <v-menu>
      <template #activator="{ props }">
        <v-btn variant="outlined" color="white" v-bind="props" class="ml-3">
          <v-icon icon="mdi:mdi-web"></v-icon>
          {{ CURRENT_LOCALE }}
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="loc in LOCALES"
          :key="loc.keyword"
          @click="languageSelected(loc.keyword)"
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
