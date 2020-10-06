<template>
  <v-container>
    <transition name="component-fade" mode="out-in">
      <router-view />
    </transition>
  </v-container>
</template>

<script>
import formService from '@/services/formService';

export default {
  name: 'Form',
  props: ['formId'],
  data() {
    return {
      formName: '',
    };
  },
  methods: {
    async getForm() {
      if (this.formId) {
        try {
          // Get this form
          const response = await formService.readForm(this.formId);
          this.formName = response.data.name;
        } catch (error) {
          console.error(`Error getting form data: ${error}`); // eslint-disable-line no-console
        }
      }
    },
  },
  mounted() {
    this.getForm();
  },
};
</script>

<style scoped>
.component-fade-enter-active,
.component-fade-leave-active {
  transition: opacity 0.3s ease;
}
.component-fade-enter,
.component-fade-leave-to {
  opacity: 0;
}
</style>
