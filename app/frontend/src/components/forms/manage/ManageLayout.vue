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
    ...mapState(useFormStore, ['form', 'permissions', 'isRTL', 'lang']),
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
  <div :class="{ 'dir-rtl': isRTL }">
    <div
      class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
    >
      <!-- page title -->
      <div>
        <h1 :lang="lang">{{ $t('trans.manageLayout.manageForm') }}</h1>
        <h3>{{ form.name }}</h3>
      </div>
      <!-- buttons -->
      <div>
        <v-skeleton-loader :loading="loading" type="actions" class="bgtrans">
          <ManageFormActions />
        </v-skeleton-loader>
      </div>
    </div>
    <v-row no-gutters>
      <v-col cols="12" order="2">
        <v-skeleton-loader
          :loading="loading"
          type="list-item-two-line"
          class="bgtrans"
        >
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
