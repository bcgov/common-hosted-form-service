<script>
import { mapActions, mapState } from 'pinia';
import { nextTick } from 'vue';
import BaseStepper from '~/components/base/BaseStepper.vue';
import FormDesigner from '~/components/designer/FormDesigner.vue';
import { useFormStore } from '~/store/form';

export default {
  components: {
    BaseStepper,
    FormDesigner,
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
  props: {
    d: {
      type: String,
      default: null,
    },
    f: {
      type: String,
      default: null,
    },
    sv: Boolean,
    v: {
      type: String,
      default: null,
    },
    svs: {
      type: String,
      default: null,
    },
    nv: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapState(useFormStore, ['form']),
  },
  async mounted() {
    await this.listFCProactiveHelp();
    nextTick(() => {
      this.onFormLoad();
    });
  },
  methods: {
    ...mapActions(useFormStore, ['listFCProactiveHelp', 'deleteCurrentForm']),
    onFormLoad() {
      if (this.$refs?.formDesigner) this.$refs.formDesigner.onFormLoad();
    },
  },
};
</script>

<template>
  <BaseStepper :step="2">
    <template #designForm>
      <v-btn color="primary" size="x-small" icon="mdi:mdi-help" />
      <FormDesigner
        ref="formDesigner"
        class="mt-6"
        :draft-id="d"
        :form-id="f"
        :saved="JSON.parse(sv)"
        :version-id="v"
        :is-saved-status="svs"
        :new-version="nv"
      />
    </template>
  </BaseStepper>
</template>
