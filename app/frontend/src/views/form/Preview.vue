<template>
  <div>
    <v-breadcrumbs v-if="!success" :items="breadcrumbs" />
    <FormViewer :formId="f" readOnly :versionId="v" />
  </div>
</template>

<script>
import FormViewer from '@/components/designer/FormViewer.vue';

export default {
  name: 'FormPreview',
  props: {
    f: String,
    v: String,
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
