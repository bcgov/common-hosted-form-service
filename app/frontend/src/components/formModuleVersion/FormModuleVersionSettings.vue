<template>
  <v-container class="px-0">
    <v-row>
      <v-col>
        <BasePanel class="fill-height">
          <template #title>Import Data (JSON)</template>
          <v-textarea
            name="importData"
            v-model="importData"
            no-resize
          >
          </v-textarea>
        </BasePanel>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <BasePanel class="fill-height">
          <template #title>External URIs</template>
          <div v-for="(item, index) in externalUris" :key="index">
            <v-text-field
              v-model="item.uri"
              :rules="externalUriRules"
            >
              <v-icon
                slot="append"
                color="red"
                @click="removeUri(item)"
              >
                remove
              </v-icon>
              <v-icon
                slot="prepend"
                color="green"
                @click="addUri()"
              >
                add
              </v-icon>
            </v-text-field>
          </div>
        </BasePanel>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions } from 'vuex';
import { mapFields } from 'vuex-map-fields';

export default {
  name: 'FormModuleSettings',
  data() {
    return {
      valid: false,
      externalUriRules: [
        (v) => !!v || 'External URI is invalid',
        (v) =>
          (v && v.length <= 255) || 'Form Module external uri must be 255 characters or less',
      ],
      externalUriId: 1,
      isLoading: true,
    };
  },
  computed: {
    ...mapFields('formModule', [
      'formModuleVersion.id',
      'formModuleVersion.importData',
      'formModuleVersion.externalUris',
    ]),
  },
  methods: {
    ...mapActions('formModule', ['setDirtyFlag']),
    ...mapActions('notifications', ['addNotification']),
    addUri() {
      this.externalUriId++;
      this.externalUris.push({ id: this.externalUriId, uri: '' });
    },
    removeUri(item) {
      if (this.externalUris.length == 1) {
        this.addNotification({
          message: 'You need at least one URI'
        });
        return;
      }
      let index = this.externalUris.map(uri => {
        return uri.id;
      }).indexOf(item.id);
      this.externalUris.splice(index, 1);
    },
  },
  mounted() {
    if (!this.id) {
      this.addUri();
    }
    this.$nextTick(() => {
      this.isLoading = false;
    });
  },
};
</script>

<style lang="scss" scoped>
@import '~font-awesome/css/font-awesome.min.css';
@import '~formiojs/dist/formio.builder.min.css';
</style>
