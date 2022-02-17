<template>
  <div class="about-layout">
    <v-sheet class="help-highlight pa-5 text-center">
      <v-row justify="center">
        <v-col lg="8">
          <h1 class="my-5 d-block">
            Create, publish forms, and receive submissions with the Common
            Hosted Forms Service.
          </h1>
          <p>
            All B.C. Government employees or contractors with an IDIR account
            can use our hosted version of Common
            Hosted Forms Service (CHEFS) to create forms.<br />
          </p>

          <v-btn :to="{ name: 'FormCreate' }" class="mb-5" color="primary">
            <span v-if="!authenticated" >Log in to get started</span>
            <span v-else>Create a Form</span>
          </v-btn>

          <h2 id="video" class="pt-5">
            Take a tour of CHEFS to see it in action.
          </h2>
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

    <v-row justify="center" class="example-text">
      <v-col cols="12" lg="4">
        <h2>Create custom forms with the CHEFS form builder</h2>
        <p>
          With CHEFS, you can create secure forms with an intuitive
          drag-and-drop interface. You can add form components, re-arrange them,
          and drop them into different layouts configurations.
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
        <h2>Manage access to your form</h2>
        <p>
          CHEFS allows you to create public forms, or you can manage access
          through IDIR or BCeID authentication.
        </p>
        <p>
          You can also assign roles to your team to manage all of your
          submissions.
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
          <h3 class="mb-5">Get started using CHEFS</h3>
          <p>
            Create online forms to collect information from your clients and
            improve your workflows.
          </p>
          <v-btn :to="{ name: 'FormCreate' }" class="mb-5" color="primary">
            <span v-if="!authenticated" >Log in to get Started</span>
            <span v-else>Create a Form</span>
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
  computed: mapGetters('auth', ['authenticated']),
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
