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
      useCaseRules: [
        (v) => {
          return !!v || this.$t('trans.fileProfile.selectUseCase');
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
        $t('trans.fileProfile.useCaseType')
      }}</span></template
    >

    <v-radio-group v-model="form.useCaseType" :rules="useCaseRules">
      <v-radio class="mb-4" :class="{ 'dir-rtl': isRTL }" value="feedback">
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.fileProfile.feedback') }}
          </span>
        </template>
      </v-radio>

      <v-radio class="mb-4" :class="{ 'dir-rtl': isRTL }" value="application">
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.fileProfile.application') }}
          </span>
        </template>
      </v-radio>

      <v-radio class="mb-4" :class="{ 'dir-rtl': isRTL }" value="collection">
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.fileProfile.collection') }}
          </span>
        </template>
      </v-radio>

      <v-radio class="mb-4" :class="{ 'dir-rtl': isRTL }" value="report">
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.fileProfile.report') }}
          </span>
        </template>
      </v-radio>

      <v-radio class="mb-4" :class="{ 'dir-rtl': isRTL }" value="registration">
        <template #label>
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.fileProfile.registration') }}
          </span>
        </template>
      </v-radio>
    </v-radio-group>
  </BasePanel>
</template>
