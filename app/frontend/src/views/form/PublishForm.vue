<template>
  <BaseStepper :step="3">
    <template #manageForm>
      <div
        class="mt-6 mb-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse"
      >
        <div cols="12" sm="8">
          <!-- page title -->
          <h1 :lang="lang">{{ $t('trans.manageLayout.manageForm') }}</h1>
          <!-- form name -->
          <h3>{{ form.name }}</h3>
        </div>
        <div cols="12" sm="4">
          <ManageFormActions />
        </div>
      </div>
      <ManageForm v-if="showManageForm" />
    </template>
  </BaseStepper>
</template>

<script>
import ManageForm from '@/components/forms/manage/ManageForm.vue';
import { mapActions, mapGetters } from 'vuex';
import { FormPermissions } from '@/utils/constants';
import ManageFormActions from '@/components/forms/manage/ManageFormActions.vue';

export default {
  name: 'PublishForm',
  components: {
    ManageForm,
    ManageFormActions,
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
    fd: {
      type: Boolean,
    },
  },
  data() {
    return {
      showManageForm: false,
    };
  },
  provide() {
    return {
      formDesigner: JSON.parse(this.fd),
      draftId: this.d,
      formId: this.f,
    };
  },
  computed: {
    ...mapGetters('form', ['permissions', 'form', 'lang']),
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
