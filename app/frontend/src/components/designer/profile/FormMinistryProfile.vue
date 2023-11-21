<script>
import { mapState, mapWritableState } from 'pinia';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';

export default {
  components: {
    BasePanel,
  },
  computed: {
    ...mapState(useFormStore, ['lang']),
    ...mapWritableState(useFormStore, ['form']),
  },
};
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">{{
        $t('trans.fileProfile.ministryName')
      }}</span></template
    >

    <v-autocomplete
      v-model="form.ministry"
      label="Ministry"
      :items="[
        'CITZ',
        'HLTH',
        'EPRO',
        'FIN',
        'CITdZ',
        'HLdTH',
        'EPdRO',
        'FdIN',
        'CITdZ',
        'HLTsH',
        'EPRsO',
        'FIsN',
      ]"
    ></v-autocomplete>
  </BasePanel>
</template>
