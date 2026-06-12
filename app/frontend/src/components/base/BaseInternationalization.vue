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

// Compact display code shown in the collapsed dropdown — uppercased locale
// keyword. Special-cased zhTW so it renders as ZH-TW instead of ZHTW.
function formatLocaleCode(code) {
  if (!code) return '';
  if (code === 'zhTW') return 'ZH-TW';
  return String(code).toUpperCase();
}
</script>

<template>
  <v-tooltip
    location="bottom"
    :text="SELECTED_LANGUAGE_TITLE"
    :open-delay="400"
  >
    <template #activator="{ props: tooltipProps }">
      <div v-bind="tooltipProps" class="text-center language-picker">
        <v-select
          v-model="$i18n.locale"
          class="language-select"
          :items="$i18n.availableLocales"
          prepend-inner-icon="mdi:mdi-web"
          variant="outlined"
          density="compact"
          hide-details
          :menu-props="{ minWidth: 220 }"
          @update:model-value="languageSelected"
        >
          <!-- Collapsed: short locale code (EN, ES, FR, ZH-TW, ...) -->
          <template #selection="{ item }">
            <span class="locale-code">{{ formatLocaleCode(item.raw) }}</span>
          </template>
          <!-- Open: full localized language name -->
          <template #item="{ props, item }">
            <v-list-item
              v-bind="props"
              :title="
                items.find((language) => language.keyword === item.raw).title
              "
            ></v-list-item>
          </template>
        </v-select>
      </div>
    </template>
  </v-tooltip>
</template>

<style scoped lang="scss">
.language-picker {
  display: flex;
  align-items: center;
}

.language-select {
  // Compact width — content is now a 2–5 char code, not a full word.
  width: 96px;
  min-width: 96px;

  // Compact on xs — globe + EN code + chevron, reduced but not zero padding.
  @media (max-width: 599px) {
    width: 88px;
    min-width: 88px;

    :deep(.v-field__input) {
      padding-inline: 3px !important;
    }
  }

  :deep(.v-field) {
    height: 40px !important;
    min-height: 40px !important;
    align-items: center;
  }

  :deep(.v-field__input) {
    opacity: 1 !important;
    padding-inline: 0.5rem;
    min-height: 40px;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  :deep(.v-icon) {
    opacity: 1;
  }
}

.locale-code {
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.04em;
  line-height: 1;
}
</style>
