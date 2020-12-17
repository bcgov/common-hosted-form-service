<template>
  <div>
    UI TBD
    <pre>{{ user }}</pre>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'AdministerUser',
  props: {
    userId: {
      type: String,
      required: true,
    },
  },
  computed: {
    ...mapGetters('admin', ['user']),
  },
  methods: {
    ...mapActions('admin', ['readUser']),
  },
  async mounted() {
    await this.readUser(this.userId);
  },
};
</script>
