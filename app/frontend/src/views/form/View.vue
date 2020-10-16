<template>
  <div>
    <v-breadcrumbs :items="breadcrumbs" />
    <FormViewer
      :formId="f"
      :versionId="v"
      :submissionId="s"
    />
  </div>
</template>

<script>
import FormViewer from '@/components/designer/FormViewer.vue';

export default {
  name: 'FormView',
  props: {
    f: String,
    v: String,
    s: String,
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
