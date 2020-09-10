<template>
  <Formeo />
</template>

<script>
import Formeo from '@/components/designer/Formeo.vue';

export default {
  name: 'Editor',
  components: {
    Formeo
  },
  props: {
    formId: String,
    formVersionId: String
  }
};
</script>
