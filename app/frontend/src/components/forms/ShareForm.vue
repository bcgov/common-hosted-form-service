<template>
  <span>
    <v-dialog v-model="dialog" width="900">
      <template v-slot:activator="{ on, attrs }">
        <v-btn color="blue" text small v-bind="attrs" v-on="on">
          <v-icon class="mr-1">share</v-icon>
          <span>Share</span>
        </v-btn>
      </template>

      <v-card>
        <v-card-title class="headline grey lighten-2">Get sharing link for this form</v-card-title>

        <v-card-text>
          <v-icon class="mr-1 my-5" color="primary">info</v-icon>
          <span>Use the link below to share with the users you wish to fill out this form (TEXT TBD)</span>
          <v-text-field readonly dense flat outlined label="URL" data-test="text-shareUrl" :value="formLink">
            <template v-slot:prepend>
              <v-icon v-on="on">link</v-icon>
            </template>
          </v-text-field>
          <p class="text-right">
            <v-btn color="blue" text small>
              <v-icon class="mr-1">share</v-icon>
              <span>Copy to clipboard</span>
            </v-btn>
          </p>
        </v-card-text>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>
export default {
  props: ['formId', 'versionId'],
  data() {
    return {
      dialog: false,
    };
  },
  computed: {
    formLink() {
      return `${process.env.BASE_URL}form/${this.formId}/versions/${this.versionId}`;
    },
  },
};
</script>

<style>
</style>
