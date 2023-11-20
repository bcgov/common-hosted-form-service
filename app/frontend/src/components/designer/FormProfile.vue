<script>
import { mapState } from 'pinia';
import FormProductionLevel from '~/components/designer/profile/FormProductionLevel.vue';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';

export default {
  components: {
    BasePanel,
    FormProductionLevel,
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang']),
  },
};
</script>

<template>
  <BasePanel class="my-6">
    <template #title>
      <span :lang="lang">{{ $t('trans.create.formProfile') }}</span>
    </template>

    <v-container class="px-0" :class="{ 'dir-rtl': isRTL }">
      <v-row>
        <v-col cols="12" md="6">
          <FormProductionLevel />
        </v-col>
      </v-row>
    </v-container>
  </BasePanel>
</template>
