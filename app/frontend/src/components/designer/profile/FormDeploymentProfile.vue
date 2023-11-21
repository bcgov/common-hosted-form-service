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
      deploymentRequiredRules: [
        (v) => {
          console.log(v);
          return !!v || this.$t('trans.fileProfile.selectDeployment');
        },
      ],
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang']),
    ...mapWritableState(useFormStore, ['form']),
  },
};
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">{{
        $t('trans.fileProfile.deploymentLevel')
      }}</span></template
    >

    <v-radio-group
      v-model="form.deploymentLevel"
      :mandatory="true"
      :rules="deploymentRequiredRules"
    >
      <v-radio class="mb-4" :class="{ 'dir-rtl': isRTL }" value="Development">
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.fileProfile.development') }}
          </span>
        </template>
      </v-radio>

      <v-radio class="mb-4" :class="{ 'dir-rtl': isRTL }" value="Test">
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.fileProfile.test') }}
          </span>
        </template>
      </v-radio>

      <v-radio class="mb-4" :class="{ 'dir-rtl': isRTL }" value="Production">
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.fileProfile.production') }}
          </span>
        </template>
      </v-radio>
    </v-radio-group>
  </BasePanel>
</template>
