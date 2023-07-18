<script>
import { mapState } from 'pinia';

import ManageForm from '~/components/forms/manage/ManageForm.vue';
import ManageFormActions from '~/components/forms/manage/ManageFormActions.vue';
import { useFormStore } from '~/store/form';
import { FormPermissions } from '~/utils/constants';

export default {
  components: {
    ManageForm,
    ManageFormActions,
  },
  props: {
    f: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
    };
  },
  computed: {
    ...mapState(useFormStore, ['form', 'permissions']),
  },
  async mounted() {
    this.loading = true;

    const formStore = useFormStore();

    await Promise.all([
      formStore.fetchForm(this.f),
      formStore.getFormPermissionsForUser(this.f),
    ]);

    if (this.permissions.includes(FormPermissions.DESIGN_READ))
      await formStore.fetchDrafts(this.f);

    this.loading = false;
  },
};
</script>

<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <!-- page title -->
      <v-col cols="12" sm="6" order="2" order-sm="1">
        <h1>{{ $t('trans.manageLayout.manageForm') }}</h1>
      </v-col>
      <!-- buttons -->
      <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
        <v-skeleton-loader :loading="loading" type="actions">
          <ManageFormActions />
        </v-skeleton-loader>
      </v-col>
      <!-- form name -->
      <v-col cols="12" order="3">
        <h3>{{ form.name }}</h3>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="12" order="2">
        <v-skeleton-loader :loading="loading" type="list-item-two-line">
          <ManageForm />
        </v-skeleton-loader>
      </v-col>
    </v-row>
  </div>
</template>

<style lang="scss" scoped>
.v-skeleton-loader {
  display: inline;
}
</style>
