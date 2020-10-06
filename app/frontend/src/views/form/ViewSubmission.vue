<template>
  <div>
    <v-breadcrumbs v-if="!success" :items="breadcrumbs" />
    <FormViewer
      :formId="f"
      :versionId="v"
      :submissionId="s"
      :success="success"
    />
  </div>
</template>

<script>
import FormViewer from '@/components/designer/FormViewer.vue';

export default {
  name: 'FormViewSubmission',
  props: {
    f: String,
    v: String,
    s: String,
    success: Boolean,
  },
  components: {
    FormViewer,
  },
  computed: {
    breadcrumbs() {
      const path = [
        {
          text: 'Form',
        },
        {
          text: 'Submissions'
        }
      ];
      if (this.$route.meta.breadcrumbTitle) {
        path.push({
          text: this.$route.meta.breadcrumbTitle,
        });
      }
      return path;
    },
  },
};
</script>
