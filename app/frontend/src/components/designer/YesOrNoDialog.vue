<template>
  <v-row justify="center">
    <v-dialog
      transition="dialog-top-transition"
      v-model="dialog"
      scrollable
      width="auto"
      @click:outside="close"
    >
      <v-card>
        <v-card-text style="height: auto" class="p-4">
          <b class="text-center">Do you want to save this draft ?</b>
        </v-card-text>
        <v-card-actions class="mb-2">
          <v-btn color="primary" variant="text" @click="Yes">
            <span>Yes</span>
          </v-btn>
          <v-btn outlined @click="No">
            <span>No</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>
<script>
export default {
  name: 'YesOrNoDialog',
  components: {},
  props: {
    doYouWantToSaveTheDraft: Boolean,
  },
  data() {
    return {
      dialog: false,
    };
  },
  computed: {},
  methods: {
    Yes() {
      this.$emit('save-draft', true);
    },
    No() {
      this.$emit('save-draft', false);
    },
    close() {
      this.dialog = false;
      this.$emit('close-bulk-yes-or-no', false);
    },
  },
  watch: {
    doYouWantToSaveTheDraft: {
      handler(newValue) {
        this.dialog = newValue;
      },
    },
  },
};
</script>

<style lang="scss" scoped></style>
