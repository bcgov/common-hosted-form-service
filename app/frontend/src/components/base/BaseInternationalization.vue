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
import { mapGetters, mapActions } from 'vuex';
import { faCaretDown, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
library.add(faCaretDown, faGlobe);

export default {
  name: 'BaseAuthButton',
  computed: {
    ...mapGetters('auth', ['authenticated', 'keycloakReady']),
    hasLogin() {
      return this.$route && this.$route.meta && this.$route.meta.hasLogin;
    },
  },
  data: () => {
    return {
      language: 'English',
      languageIndex: 0,
      items: [
        { title: 'English', keyword: 'en' },
        { title: 'Francais', keyword: 'fr' },
      ],
    };
  },

  methods: {
    ...mapActions('auth', ['login', 'logout']),
    languageSelected(lang) {
      this.language = lang.title;
      this.$root.$i18n.locale = lang.keyword;
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
