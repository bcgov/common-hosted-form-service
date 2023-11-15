<script>
import BaseStepper from '~/components/base/BaseStepper.vue';
import ManageForm from '~/components/forms/manage/ManageForm.vue';
import ManageFormActions from '~/components/forms/manage/ManageFormActions.vue';
import { mapActions, mapState } from 'pinia';
import { FormPermissions } from '~/utils/constants';
import { useFormStore } from '~/store/form';

export default {
  name: 'PublishForm',
  components: {
    BaseStepper,
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
      loading: true,
      showManageForm: false,
    };
  },
  computed: {
    ...mapState(useFormStore, ['permissions', 'form', 'lang']),
  },
  async beforeMount() {
    this.loading = true;

    await this.fetchForm(this.f);
    await this.getFormPermissionsForUser(this.f);
    if (this.permissions.includes(FormPermissions.DESIGN_READ)) {
      await this.fetchDrafts(this.f).then(() => (this.showManageForm = true));
    }

    this.loading = false;
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
        <!-- page title -->
        <div>
          <h1 :lang="lang">{{ $t('trans.manageLayout.manageForm') }}</h1>
          <h3>{{ form.name }}</h3>
        </div>
        <div>
          <ManageFormActions />
        </div>
      </div>
      <v-row no-gutters>
        <v-col cols="12" order="2">
          <v-skeleton-loader
            :loading="loading"
            type="list-item-two-line"
            class="bgtrans"
          >
            <ManageForm v-if="showManageForm" />
          </v-skeleton-loader>
        </v-col>
      </v-row>
    </template>
  </BaseStepper>
</template>
