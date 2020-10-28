<template>
  <div>
    <FormViewer :submissionId="s">
      <template #alert>
        <div class="mb-6">
          <h1>
            <v-icon large color="success">check_circle</v-icon>
            Your form has been submitted successfully
          </h1>
          <h3>
            If you wish to keep a record of this submission, you can keep the
            following Confirmation ID:
            <strong>{{ s.substring(0, 8).toUpperCase() }}</strong>
          </h3>
          <hr />
        </div>
      </template>
    </FormViewer>
  </div>
</template>

<script>
import FormViewer from '@/components/designer/FormViewer.vue';

export default {
  name: 'FormView',
  props: {
    s: String,
  },
  components: {
    FormViewer,
  },
};
</script>
