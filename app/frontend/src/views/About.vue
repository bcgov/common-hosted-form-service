<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';

const { locale } = useI18n({ useScope: 'global' });

const router = useRouter();
const authStore = useAuthStore();
const formStore = useFormStore();
const idpStore = useIdpStore();

const { authenticated } = storeToRefs(authStore);
const { isRTL } = storeToRefs(formStore);
const { primaryIdpLoginHints } = storeToRefs(idpStore);

const howToVideoUrl = computed(() => import.meta.env.VITE_HOWTOURL);
const chefsTourVideoUrl = computed(() => import.meta.env.VITE_CHEFSTOURURL);

function handleCreateOrLogin() {
  if (authenticated.value) {
    router.push({ name: 'FormCreate' });
  } else {
    authStore.redirectUri =
      location.origin + router.resolve({ name: 'FormCreate' }).href;
    router.push({
      name: 'Login',
      query: { idpHint: primaryIdpLoginHints.value },
    });
  }
}
</script>

<template>
  <div class="about-layout" :class="{ 'dir-rtl': isRTL }">
    <v-sheet class="help-highlight pa-5 text-center">
      <v-row justify="center">
        <v-col lg="8">
          <h1 class="my-5 d-block" :lang="locale">
            {{ $t('trans.homePage.title') }}
          </h1>
          <p :lang="locale">{{ $t('trans.homePage.subTitle') }}<br /></p>

          <v-btn
            class="mb-5"
            color="primary"
            data-test="create-or-login-btn"
            :title="
              authenticated
                ? $t('trans.homePage.loginToStart')
                : $t('trans.homePage.createFormLabel')
            "
            @click="handleCreateOrLogin"
          >
            <span v-if="!authenticated" :lang="locale">{{
              $t('trans.homePage.loginToStart')
            }}</span>
            <span v-else :lang="locale">{{
              $t('trans.homePage.createFormLabel')
            }}</span>
          </v-btn>

          <h2 id="video" class="pt-5" :lang="locale">
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
        <h2 :lang="locale">
          {{ $t('trans.homePage.chefsHowToTitle') }}
        </h2>
        <p :lang="locale">
          {{ $t('trans.homePage.chefsHowToSub') }}
          <a
            :href="howToVideoUrl"
            target="_blank"
            rel="noopener noreferrer"
            :lang="locale"
            >{{ $t('trans.homePage.getStarted') }}!
          </a>
        </p>
      </v-col>
      <v-col cols="12" lg="4">
        <BaseImagePopout
          alt="Drag and Drop demo"
          src="images/quickstart.png"
          width="600px"
          :lang="locale"
        />
      </v-col>
    </v-row>

    <v-row justify="center" class="example-text">
      <v-col cols="12" lg="4">
        <h2 :lang="locale">
          {{ $t('trans.homePage.createCustomFormTitle') }}
        </h2>
        <p :lang="locale">
          {{ $t('trans.homePage.createCustomFormSub1') }}
        </p>
      </v-col>
      <v-col cols="12" lg="4">
        <BaseImagePopout
          alt="Drag and Drop demo"
          src="images/drag_drop.png"
          width="600px"
          :lang="locale"
        />
      </v-col>
    </v-row>

    <v-row justify="center" class="example-text">
      <v-col cols="12" lg="4">
        <h2 :lang="locale">
          {{ $t('trans.homePage.manageAccessTitle') }}
        </h2>
        <p :lang="locale">
          {{ $t('trans.homePage.manageAccessSub1') }}
        </p>
        <p :lang="locale">
          {{ $t('trans.homePage.manageAccessSub2') }}
        </p>
      </v-col>
      <v-col cols="12" lg="4">
        <BaseImagePopout
          alt="Export demo"
          src="images/team-management.png"
          width="600px"
          :lang="locale"
        />
      </v-col>
    </v-row>

    <v-sheet class="help-highlight pa-5 text-center">
      <v-row justify="center">
        <v-col lg="8">
          <h3 class="mb-5" :lang="locale">
            {{ $t('trans.homePage.getStartedToChefs') }}
          </h3>
          <p :lang="locale">
            {{ $t('trans.homePage.createOnlineTitle') }}
          </p>
          <v-btn
            class="mb-5"
            color="primary"
            :title="
              authenticated
                ? $t('trans.shareForm.shareForm')
                : $t('trans.homePage.createFormLabel')
            "
            @click="handleCreateOrLogin"
          >
            <span v-if="!authenticated" :lang="locale">{{
              $t('trans.homePage.logInToGetStarted')
            }}</span>
            <span v-else :lang="locale">{{
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
