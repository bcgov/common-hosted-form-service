<template>
  <div class="about-layout">
    <v-sheet class="help-highlight pa-5 text-center">
      <v-row justify="center">
        <v-col lg="8">
          <h1 class="my-5 d-block">
            {{ $t('trans.homePage.title') }}
          </h1>
          <p>{{ $t('trans.homePage.subTitle') }}<br /></p>

          <v-btn :to="{ name: 'FormCreate' }" class="mb-5" color="primary">
            <span v-if="!authenticated">{{
              $t('trans.homePage.loginToStart')
            }}</span>
            <span v-else>{{ $t('trans.homePage.createFormLabel') }}</span>
          </v-btn>

          <h2 id="video" class="pt-5">
            {{ $t('trans.homePage.takeATourOfChefs') }}
          </h2>
          <div class="video-wrapper">
            <iframe
              width="100%"
              height="100%"
              :src="chefsTourVideoUrl"
              title="Introduction to the Common Hosted Forms Service (CHEFS)"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            >
            </iframe>
          </div>
        </v-col>
      </v-row>
    </v-sheet>

    <v-row justify="center" class="example-text">
      <v-col cols="12" lg="4">
        <h2>{{ $t('trans.homePage.chefsHowToTitle') }}</h2>
        <p>
          {{ $t('trans.homePage.chefsHowToSub') }}
          <a :href="howToVideoUrl" target="_blank"
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
        <h2>{{ $t('trans.homePage.createCustomFormTitle') }}</h2>
        <p>
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
        <h2>{{ $t('trans.homePage.manageAccessTitle') }}</h2>
        <p>
          {{ $t('trans.homePage.manageAccessSub1') }}
        </p>
        <p>
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
          <h3 class="mb-5">{{ $t('trans.homePage.getStartedToChefs') }}</h3>
          <p>
            {{ $t('trans.homePage.createOnlineTitle') }}
          </p>
          <v-btn :to="{ name: 'FormCreate' }" class="mb-5" color="primary">
            <span v-if="!authenticated">{{
              $t('trans.homePage.logInToGetStarted')
            }}</span>
            <span v-else>{{ $t('trans.homePage.createFormLabel') }}</span>
          </v-btn>
        </v-col>
      </v-row>
    </v-sheet>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'About',
  computed: {
    ...mapGetters('auth', ['authenticated']),
    howToVideoUrl() {
      return process.env.VUE_APP_HOWTOURL;
    },
    chefsTourVideoUrl() {
      return process.env.VUE_APP_CHEFSTOURURL;
    },
  },
};
//
</script>

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
