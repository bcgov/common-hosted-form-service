<script>
import { mapState, mapWritableState } from 'pinia';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';
import { Ministries } from '~/utils/constants';

export default {
  components: {
    BasePanel,
  },
  data() {
    return {
      ministryRules: [
        (v) => {
          return !!v || this.$t('trans.fileProfile.selectMinistry');
        },
      ],
    };
  },
  computed: {
    ...mapState(useFormStore, ['lang']),
    ...mapWritableState(useFormStore, ['form']),
    MinistryList() {
      return Ministries;
    },
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
      :rules="ministryRules"
      :label="$t('trans.fileProfile.ministryName')"
      :items="MinistryList"
      item-title="text"
      item-value="id"
    ></v-autocomplete>
  </BasePanel>
</template>
