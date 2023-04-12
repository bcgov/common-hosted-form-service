<template>
  <v-row justify="center">
    <v-dialog transition="dialog-top-transition" v-model="dialog" scrollable width="auto" @click:outside="cancel">
      <v-card>
        <v-card-title>Create</v-card-title>

        <v-card-text style="height: auto">
          <v-radio-group v-model="typeSubmissionSelected" column>
            <v-radio class="mt-4" label="Sigle Submission" :value="false"></v-radio>
            <v-radio class="mt-4" label="Multiple Submission upload" :value="true"></v-radio>
          </v-radio-group>
        </v-card-text>

        <v-card-actions class="mb-2">
          <v-btn color="primary" @click="typeSubmissionSelectedChanged">
            <span>Confirm</span>
          </v-btn>
          <v-btn outlined @click="cancel">
            <span>Cancel</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>
<script>
export default {
  name: 'FormBulkDialog',
  components: {},
  props: {},
  data() {
    return {
      dialog: true,
      typeSubmissionSelected: false,
    };
  },
  computed: {},
  methods: {
    typeSubmissionSelectedChanged() {
      this.dialog = false;
      this.$emit('set-bulk-file', this.typeSubmissionSelected);
    },
    cancel() {
      this.dialog = false;
      this.$emit('leave-this-page');
    },
  },
};
</script>

<style lang="scss" scoped></style>
