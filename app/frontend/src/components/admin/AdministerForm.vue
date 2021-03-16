<template>
  <div>
    <h3>{{ form.name }}</h3>
    <p>{{ form.description }}</p>

    <div v-if="form.active === false" class="red--text mb-6">
      (DELETED 1234)
      <v-btn
        color="primary"
        class="mt-0"
        @click="showRestoreDialog = true"
        text
        small
      >
        <v-icon class="mr-1">build_circle</v-icon>
        <span class="d-none d-sm-flex">Restore this form</span>
      </v-btn>
    </div>

    <h4>Form Details</h4>
    <pre>{{ form }}</pre>

    <BaseDialog
      v-model="showRestoreDialog"
      type="CONTINUE"
      @close-dialog="showRestoreDialog = false"
      @continue-dialog="restore"
    >
      <template #title>Confirm Restore</template>
      <template #text>
        <div v-if="restoreInProgress" class="text-center">
          <v-progress-circular indeterminate color="primary" :size="100">
            Restoring
          </v-progress-circular>
        </div>
        <div v-else>
          Restore <strong>{{ form.name }}</strong> to active state?
        </div>
      </template>
      <template #button-text-continue>
        <span>Restore</span>
      </template>
    </BaseDialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'AdministerForm',
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      showRestoreDialog: false,
      restoreInProgress: false,
    };
  },
  computed: {
    ...mapGetters('admin', ['form']),
  },
  methods: {
    ...mapActions('admin', ['readForm', 'restoreForm']),
    async restore() {
      this.restoreInProgress = true;
      await this.restoreForm(this.form.id);
      this.restoreInProgress = false;
      this.showRestoreDialog = false;
    },
  },
  async mounted() {
    await this.readForm(this.formId);
  },
};
</script>
