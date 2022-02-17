<template>
  <div class="about-layout">
    <v-sheet class="help-highlight pa-5 text-center">
      <v-row justify="center">
        <v-col lg="8">
          <h1 class="my-5 d-block">
            Create, publish forms, and receive submissions with the Common Hosted Forms Service
          </h1>
          <p>
            CHEFS is a drag and drop hosted web form service that allows teams to create and publish their forms. With CHEFS, you can make secure forms with complex layouts. You can also manage who can access your form and assign admin roles to your team. All B.C. Government employees or contractors with an IDIR account can use our hosted version of CHEFS to create forms.<br />
            <a :href="createLoginUrl()">Log in to CHEFS to get started</a>.
          </p>
          <h2 id="video" class="pt-5">Watch the CHEFS tour video to see it in action</h2>
          <div class="video-wrapper">
            <video class="main-video" width="100%" controls>
              <source
                src="https://github.com/bcgov/common-hosted-form-service/wiki/videos/intro_720.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>
        </v-col>
      </v-row>
    </v-sheet>

    <v-sheet class="help-highlight pa-5">
      <v-row justify="center">
        <v-col lg="8">
          <FormDisclaimer />
        </v-col>
      </v-row>
    </v-sheet>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import FormDisclaimer from '@/components/designer/FormDisclaimer.vue';

export default {
  name: 'About',
  components: {
    FormDisclaimer
  },
  computed: mapGetters('auth', ['createLoginUrl']),
};
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
    margin: 0 auto;
  }
  .main-video {
    margin-top: 40px;
    margin-bottom: 20px;
  }
}
</style>
