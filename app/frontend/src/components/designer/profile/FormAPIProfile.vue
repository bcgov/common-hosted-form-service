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
        $t('trans.fileProfile.APIIntegration')
      }}</span></template
    >

    <v-radio-group>
      <v-radio label="Yes" value="Yes"></v-radio>
      <v-radio label="No" value="No"></v-radio>
    </v-radio-group>
  </BasePanel>
</template>
