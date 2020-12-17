<template>
  <div>
    UI Here TBD
    <br><br>
    <pre>{{ form }}</pre>
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
  computed: {
    ...mapGetters('admin', ['form']),
  },
  methods: {
    ...mapActions('admin', ['readForm']),
  },
  async mounted() {
    await this.readForm(this.formId);
  },
};
</script>
