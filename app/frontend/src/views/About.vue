<script>
import { mapState } from 'pinia';
import BaseImagePopout from '../components/base/BaseImagePopout.vue';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';

export default {
  components: {
    BaseImagePopout,
  },
  computed: {
    ...mapState(useAuthStore, ['authenticated']),
    ...mapState(useFormStore, ['multiLanguage', 'isRTL']),
    howToVideoUrl() {
      return import.meta.env.VITE_HOWTOURL;
    },
    chefsTourVideoUrl() {
      return import.meta.env.VITE_CHEFSTOURURL;
    },
  },
};
</script>

<template>
  <div class="about-layout">
    <v-sheet class="help-highlight pa-5 text-center">
      <v-row justify="center">
        <v-col lg="8">
          <h1 class="my-5 d-block" locale="multiLanguage">
            {{ $t('trans.homePage.title') }}
          </h1>
          <p locale="multiLanguage">
            {{ $t('trans.homePage.subTitle') }}<br />
          </p>

          <v-btn
            :to="{ name: 'FormCreate' }"
            class="mb-5"
            color="primary"
            data-test="create-or-login-btn"
          >
            <span v-if="!authenticated" locale="multiLanguage">{{
              $t('trans.homePage.loginToStart')
            }}</span>
            <span v-else locale="multiLanguage">{{
              $t('trans.homePage.createFormLabel')
            }}</span>
          </v-btn>

          <h2 id="video" class="pt-5" locale="multiLanguage">
            {{ $t('trans.homePage.takeATourOfChefs') }}
          </h2>
          <div class="video-wrapper">
            <iframe
              width="100%"
              height="100%"
              :src="chefsTourVideoUrl"
              title="Introduction to the Common Hosted Forms Service (CHEFS)"
              frameborder="0"
              allowfullscreen
            >
            </iframe>
          </div>
        </v-col>
      </v-row>
    </v-sheet>

    <v-row justify="center" class="example-text">
      <v-col cols="12" lg="4">
        <h2 locale="multiLanguage">
          {{ $t('trans.homePage.chefsHowToTitle') }}
        </h2>
        <p locale="multiLanguage">
          {{ $t('trans.homePage.chefsHowToSub') }}
          <a :href="howToVideoUrl" target="_blank" locale="multiLanguage"
            >{{ $t('trans.homePage.getStarted') }}!</a
          >
        </p>
      </v-col>
      <v-col cols="12" lg="4">
        <BaseImagePopout
          alt="Drag and Drop demo"
          src="https://raw.githubusercontent.com/wiki/bcgov/common-hosted-form-service/images/quickstart.png"
          width="600px"
        />
      </v-col>
    </v-row>

    <v-row justify="center" class="example-text">
      <v-col cols="12" lg="4">
        <h2 locale="multiLanguage">
          {{ $t('trans.homePage.createCustomFormTitle') }}
        </h2>
        <p locale="multiLanguage">
          {{ $t('trans.homePage.createCustomFormSub1') }}
        </p>
      </v-col>
      <v-col cols="12" lg="4">
        <BaseImagePopout
          alt="Drag and Drop demo"
          src="https://raw.githubusercontent.com/wiki/bcgov/common-hosted-form-service/images/drag_drop.png"
          width="600px"
        />
      </v-col>
    </v-row>

    <v-row justify="center" class="example-text">
      <v-col cols="12" lg="4">
        <h2 locale="multiLanguage">
          {{ $t('trans.homePage.manageAccessTitle') }}
        </h2>
        <p locale="multiLanguage">
          {{ $t('trans.homePage.manageAccessSub1') }}
        </p>
        <p locale="multiLanguage">
          {{ $t('trans.homePage.manageAccessSub2') }}
        </p>
      </v-col>
      <v-col cols="12" lg="4">
        <BaseImagePopout
          alt="Export demo"
          src="https://raw.githubusercontent.com/wiki/bcgov/common-hosted-form-service/images/team-management.png"
          width="600px"
        />
      </v-col>
    </v-row>

    <v-sheet class="help-highlight pa-5 text-center">
      <v-row justify="center">
        <v-col lg="8">
          <h3 class="mb-5" locale="multiLanguage">
            {{ $t('trans.homePage.getStartedToChefs') }}
          </h3>
          <p locale="multiLanguage">
            {{ $t('trans.homePage.createOnlineTitle') }}
          </p>
          <v-btn :to="{ name: 'FormCreate' }" class="mb-5" color="primary">
            <span v-if="!authenticated" locale="multiLanguage">{{
              $t('trans.homePage.logInToGetStarted')
            }}</span>
            <span v-else locale="multiLanguage">{{
              $t('trans.homePage.createFormLabel')
            }}</span>
          </v-btn>
        </v-col>
      </v-row>
    </v-sheet>
  </div>
</template>

<style lang="scss" scoped>
.about-layout {
  margin: 0;
  .help-highlight {
    background-color: #f1f8ff;
  }

  .example-text {
    margin: 80px 0;
    padding: 0 5px;
  }
  .video-wrapper {
    max-width: 854px !important;
    max-height: 422px !important;
    height: 422px;
    margin: 0 auto;
  }
  .main-video {
    margin-top: 40px;
    margin-bottom: 20px;
  }
}
</style>
