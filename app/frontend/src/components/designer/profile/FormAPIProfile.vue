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
      apiRules: [
        (v) => {
          return v != null || this.$t('trans.fileProfile.selectAPI');
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
        $t('trans.fileProfile.APIIntegration')
      }}</span></template
    >

    <v-radio-group v-model="form.apiIntegration" :rules="apiRules">
      <v-radio class="mb-4" :class="{ 'dir-rtl': isRTL }" :value="true">
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.fileProfile.Y') }}
          </span>
        </template>
      </v-radio>

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
