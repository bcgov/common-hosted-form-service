<template>
  <BaseStepper :step="3">
    <template #manageForm>
      <ManageForm v-if="showManageForm" />
    </template>
  </BaseStepper>
</template>

<script>
import ManageForm from '@/components/forms/manage/ManageForm.vue';
import { mapActions, mapGetters } from 'vuex';
import { FormPermissions } from '@/utils/constants';

export default {
  name: 'PublishForm',
  components: {
    ManageForm,
  },
  props: {
    f: {
      type: String,
      required: true,
    },
    d: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      showManageForm: false,
    };
  },
  provide() {
    return {
      formDesigner: true,
      draftId: this.d,
      formId: this.f,
    };
  },
  computed: {
    ...mapGetters('form', ['permissions', 'form']),
  },
  methods: {
    ...mapActions('form', [
      'fetchDrafts',
      'fetchForm',
      'getFormPermissionsForUser',
    ]),
  },
  async beforeMount() {
    await this.fetchForm(this.f);
    await this.getFormPermissionsForUser(this.f);
    if (this.permissions.includes(FormPermissions.DESIGN_READ)) {
      await this.fetchDrafts(this.f).then(() => (this.showManageForm = true));
    }
  },
};
</script>
