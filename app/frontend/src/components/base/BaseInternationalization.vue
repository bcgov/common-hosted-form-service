<template>
  <div class="text-center">
    <v-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <v-btn dark outlined v-bind="attrs" v-on="on" class="ml-3">
          <font-awesome-icon icon="fa-solid fa-globe" class="mr-1" />
          {{ language }}
          <font-awesome-icon icon="fa-solid fa-caret-down" class="ml-3" />
        </v-btn>
      </template>
      <v-list>
        <v-list-item-group color="primary" v-model="languageIndex">
          <v-list-item
            v-for="(item, i) in items"
            :key="i"
            @click="languageSelected(item)"
          >
            <v-list-item-content>
              <v-list-item-title v-text="item.title"></v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { faCaretDown, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
library.add(faCaretDown, faGlobe);

export default {
  name: 'BaseInternationalization',
  computed: {
    hasLogin() {
      return this.$route && this.$route.meta && this.$route.meta.hasLogin;
    },
  },
  data: () => {
    return {
      language: 'English',
      lang: 'en',
      languageIndex: 0,
      items: [
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
      ],
    };
  },

  methods: {
    ...mapActions('form', ['setMultiLanguage']),
    languageSelected(lang) {
      this.language = lang.title;
      this.$root.$i18n.locale = lang.keyword;
      this.$vuetify.lang.current =
        lang.keyword == 'zh'
          ? 'zhHans'
          : lang.keyword == 'zh-TW'
          ? 'zhHant'
          : lang.keyword;
      this.setMultiLanguage(lang.keyword);
    },
  },
};
</script>

<style lang="scss" scoped>
.select {
  margin: 0px !important;
  margin-left: 8px !important;
  padding: 0px !important;
  height: 30px !important;

  float: right !important;
}
</style>
