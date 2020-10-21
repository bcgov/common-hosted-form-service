<template>
  <div class="about-layout">
    <v-sheet class="help-highlight pa-5 text-center">
      <v-row justify="center">
        <v-col lg="8">
          <h1 class="my-5">
            Create and publish forms, and receive submissions from your users
          </h1>
          <p>
            The Common Hosted Form Service is available to BC Government
            employees and contractors. Sign in now to try it out
          </p>
          <h2>(IMAGES TEMPORARY)</h2>
          <v-img
            alt="Drag and Drop demo"
            src="@/assets/images/drag-drop-demo.gif"
            width="100%"
          />
        </v-col>
      </v-row>
    </v-sheet>

    <v-row justify="center" class="my-5 px-5">
      <v-col cols="12" lg="4">
        <h2>Drag and Drop form components onto your form</h2>
        <p>
          Easily create forms with an intuitive drag-and-drop interface. Add new
          form components, re-arrange them, and drop them into formatting
          objects like columns and panels. Creating a Web form has never been so
          simple.
        </p>
      </v-col>
      <v-col cols="12" lg="4">
        <v-img
          alt="Drag and Drop demo"
          contain
          src="https://raw.githubusercontent.com/wiki/bcgov/common-hosted-form-service/images/drag_drop.png"
          width="600px"
        />
      </v-col>
    </v-row>

    <v-row justify="center" class="my-5 px-5">
      <v-col cols="12" lg="4">
        <h2>Export and import your form design templates</h2>
        <p>
          Learn how to export and import your form design template. Export to
          save the design to your computer as a backup or template and import to
          easily start from where you left off.
        </p>
      </v-col>
      <v-col cols="12" lg="4">
        <v-img
          alt="Drag and Drop demo"
          contain
          src="https://raw.githubusercontent.com/wiki/bcgov/common-hosted-form-service/images/export.png"
          width="600px"
        />
      </v-col>
    </v-row>

    <v-sheet class="help-highlight pa-5">
      <v-row justify="center">
        <v-col lg="8">
          <h2 class="mb-5">
            Disclaimer and statement of responsibility for Form Designers:
          </h2>
          <ul>
            <li>
              It is your responsibility to comply with Privacy laws governing
              the collection, use and disclosure of personally identifiable
              information.
            </li>
            <li>
              Access to this form designer tool does not inherently grant
              permission to collect, use or disclose any personally identifiable
              information.
            </li>
            <li>
              It is your responsibility to obtain consent to collect information
              as required by law.
            </li>
            <li>
              Before publishing or distributing your form you are required to
              discuss the intention of the form with your Ministry Privacy
              Officer and to complete assessments as required.
            </li>
          </ul>
        </v-col>
      </v-row>
    </v-sheet>
  </div>
</template>

<script>
export default {
  name: 'About',
};
</script>

<style lang="scss" scoped>
.about-layout {
  margin: 0;
  .help-highlight {
    background-color: #f1f8ff;
  }

  // TBD, placeholder images for now. Not sure what styles needed for video elements etc
  .main-video {
  }
}
</style>
