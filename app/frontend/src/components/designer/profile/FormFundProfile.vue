<script>
import { mapState, mapWritableState } from 'pinia';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';

export default {
  components: {
    BasePanel,
  },
  data() {
    return {
      fundRules: [
        (v) => {
          return v !== null || this.$t('trans.fileProfile.selectFund');
        },
      ],
    };
  },
  computed: {
    ...mapState(useFormStore, ['lang', 'isRTL']),
    ...mapWritableState(useFormStore, ['form']),
  },
};
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">{{
        $t('trans.fileProfile.fundingProfile')
      }}</span></template
    >

    <v-radio-group v-model="form.funding" :rules="fundRules">
      <v-radio class="mb-4" :class="{ 'dir-rtl': isRTL }" :value="true">
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.fileProfile.Y') }}
          </span>
        </template>
      </v-radio>
      <v-text-field
        v-if="form.funding"
        v-model="form.fundingCost"
        label="Projected funding request without CHEFS"
        prefix="$"
        type="number"
      ></v-text-field>
      <v-radio class="mb-4" :class="{ 'dir-rtl': isRTL }" :value="false">
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.fileProfile.N') }}
          </span>
        </template>
      </v-radio>
    </v-radio-group>
  </BasePanel>
</template>
