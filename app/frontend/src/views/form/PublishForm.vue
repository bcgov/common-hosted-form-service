<script>
import ManageForm from '~/components/forms/manage/ManageForm.vue';
import ManageFormActions from '~/components/forms/manage/ManageFormActions.vue';
import { mapActions, mapState } from 'pinia';
import { FormPermissions } from '~/utils/constants';
import { useFormStore } from '~/store/form';

export default {
  name: 'PublishForm',
  components: {
    ManageForm,
    ManageFormActions,
  },
  provide() {
    return {
      formDesigner: JSON.parse(this.fd),
      draftId: this.d,
      formId: this.f,
    };
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
  computed: {
    ...mapState(useFormStore, ['permissions', 'form', 'lang']),
  },
  async beforeMount() {
    await this.fetchForm(this.f);
    await this.getFormPermissionsForUser(this.f);
    if (this.permissions.includes(FormPermissions.DESIGN_READ)) {
      await this.fetchDrafts(this.f).then(() => (this.showManageForm = true));
    }
  },
  methods: {
    ...mapActions(useFormStore, [
      'fetchDrafts',
      'fetchForm',
      'getFormPermissionsForUser',
    ]),
  },
};
</script>

<template>
  <BaseStepper :step="3">
    <template #manageForm>
      <div
        class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
      >
        <ManageFormActions />
      </div>
      <ManageForm v-if="showManageForm" />
    </template>
  </BaseStepper>
</template>
