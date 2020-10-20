<template>
  <div ref="formio"></div>
</template>

<script>
import FormioFormBuilder from 'formiojs/FormBuilder';
import AllComponents from 'formiojs/components';
import Components from 'formiojs/components/Components';

export default {
  data() {
    return {
      builder: undefined,
      builderReady: undefined,
    };
  },
  props: {
    form: {
      default: () => {},
    },
    options: {
      default: () => {},
    },
  },
  methods: {
    initializeBuilder() {
      debugger;
      if (this.builder !== undefined) {
        this.builder.instance.destroy(true);
      }
      this.builder = new FormioFormBuilder(
        this.$refs.formio,
        this.form,
        this.options
      );
      this.builderReady = this.builder.ready;
      return this.builderReady.then(() => {
        this.builder.instance.events.onAny((...args) => {
          const eventParts = args[0].split('.');

          // Only handle formio events.
          const namespace = this.options.namespace || 'formio';
          if (eventParts[0] !== namespace || eventParts.length !== 2) {
            return;
          }

          // Remove formio. from event.
          args[0] = eventParts[1];

          this.$emit.apply(this, args);

          // Emit a change event if the schema changes.
          if (
            ['saveComponent', 'updateComponent', 'deleteComponent'].includes(
              eventParts[1]
            )
          ) {
            args[0] = 'change';
            this.$emit.apply(this, args);
          }
        });
      });
    },
  },
  watch: {
    form(newValue) {
      if (this.builder) {
        this.builder.instance.form = newValue;
      }
    },
  },
  mounted() {
    Components.setComponents(AllComponents);
    this.initializeBuilder();
  },
  destroyed() {
    if (this.builder) {
      this.builder.instance.destroy(true);
    }
  },
};
</script>

<style>
</style>
