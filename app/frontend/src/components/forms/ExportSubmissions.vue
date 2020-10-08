<template>
  <span>
    <v-dialog v-model="dialog" width="900">
      <template v-slot:activator="{ on, attrs }">
        <v-btn color="blue" text small v-bind="attrs" v-on="on">
          <v-icon class="mr-1">cloud_download</v-icon>
          <span>Export CSV</span>
        </v-btn>
      </template>

      <v-card>
        <v-card-title class="headline">
          Export CSV
          <hr />
        </v-card-title>

        <v-card-text>
          <h3>Select the submission date</h3>
        </v-card-text>

        <v-card-actions class="justify-center">
          <v-btn class="mb-5 mr-5" color="primary" @click="dialog=false">
            <span>Export</span>
          </v-btn>
          <v-btn class="mb-5" outlined @click="dialog=false">
            <span>Cancel</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>
export default {
  data() {
    return {
      dialog: false,
    };
  },
};
</script>
