<script>
import { mapState } from 'pinia';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';

export default {
  components: {
    BasePanel,
  },
  computed: {
    ...mapState(useFormStore, ['lang']),
  },
};
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">{{
        $t('trans.fileProfile.productionLevel')
      }}</span></template
    >

    <v-radio-group>
      <v-radio label="Development" value="Development"></v-radio>
      <v-radio label="Test" value="Test"></v-radio>
      <v-radio label="Production" value="Production"></v-radio>
    </v-radio-group>
  </BasePanel>
</template>
