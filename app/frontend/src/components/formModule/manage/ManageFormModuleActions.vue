<template>
  <div>
    <span>
      <template>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <router-link :to="{ name: 'FormModuleAddVersion', query: { fm: formModule.id } }">
              <v-btn class="mx-1" color="primary" icon v-bind="attrs" v-on="on">
                <v-icon>add_circle</v-icon>
              </v-btn>
            </router-link>
          </template>
          <span>Import Form Module</span>
        </v-tooltip>
      </template>
    </span>
    <span v-if="canDisableFormModule">
      <template>
        <v-switch
          color="success"
          class="float-right m-1"
          :input-value="this.formModule.active"
          :label="this.formModule.active ? 'Active' : 'Disabled'"
          @change="toggleDisable"
        />
      </template>

      <BaseDialog
        v-model="showDisableDialog"
        type="CONTINUE"
        @close-dialog="cancelDisable"
        @continue-dialog="updateDisable"
      >
        <template #title>Confirm Disable</template>
        <template #text>
          Are you sure you wish to disable
          <strong>Placeholder form module name goes here</strong
          >? This form module will be disabled for all form designers.
          It will still be available for reviewers and submitters.
        </template>
        <template #button-text-continue>
          <span>Disable</span>
        </template>
      </BaseDialog>
    </span>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'ManageFormModuleActions',
  data() {
    return {
      showDisableDialog: false,
    };
  },
  computed: {
    ...mapGetters('formModule', ['formModule']),
    canDisableFormModule() {
      return true;
    },
  },
  methods: {
    ...mapActions('formModule', ['fetchFormModule', 'toggleFormModule']),
    disableFormModule(value) {
      this.showDisableDialog = value;
    },
    toggleDisable() {
      if (this.formModule.active) {
        this.showDisableDialog = true;
      } else {
        this.updateDisable();
      }
    },
    cancelDisable() {
      this.showDisableDialog = false;
      this.fetchFormModule(this.formModule.id);
    },
    async updateDisable() {
      this.showDisableDialog = false;
      await this.toggleFormModule({
        formModuleId: this.formModule.id,
        active: !this.formModule.active
      });
      this.fetchFormModule(this.formModule.id);
    },
  }
};
</script>
