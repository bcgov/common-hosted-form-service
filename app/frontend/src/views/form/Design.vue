<template>
  <BaseSecure>
    <FormDesigner class="mt-6" :formId="f" :versionId="v" />
  </BaseSecure>
</template>

<script>
import { mapGetters } from 'vuex';
import FormDesigner from '@/components/designer/FormDesigner.vue';

export default {
  name: 'FormDesign',
  components: {
    FormDesigner,
  },
  props: {
    f: String,
    v: String,
  },
  computed: mapGetters('form', ['form']),
  beforeRouteLeave(to, from, next) {
    this.form.isDirty
      ? next(window.confirm('Do you really want to leave this page? Changes you made will not be saved.'))
      : next();
  },
};
</script>
