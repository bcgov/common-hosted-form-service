<template>
  <BaseStepper :step="2">
    <template #designForm>
      <FormDesigner
        class="mt-6"
        :draftId="d"
        :formId="f"
        :saved="JSON.parse(sv)"
        :versionId="v"
        ref="formDesigner"
        :isSavedStatus="svs"
        :newVersion="JSON.parse(nv)"
      />
    </template>
  </BaseStepper>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import FormDesigner from '@/components/designer/FormDesigner.vue';

export default {
  name: 'FormDesign',
  components: {
    FormDesigner,
  },
  props: {
    d: String,
    f: String,
    sv: Boolean,
    v: String,
    svs: String,
    nv: {
      type: Boolean,
      default: false,
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.$refs.formDesigner.onFormLoad();
    });
  },
  computed: {
    ...mapGetters('form', ['form']),
  },
  methods: {
    ...mapActions('form', ['listFCProactiveHelp', 'deleteCurrentForm']),
  },
  beforeRouteLeave(_to, _from, next) {
    this.form.isDirty
      ? next(
          window.confirm(
            'Do you really want to leave this page? Changes you made will not be saved.'
          )
        )
      : next();
  },
  beforeMount() {
    this.listFCProactiveHelp();
  },
};
</script>
