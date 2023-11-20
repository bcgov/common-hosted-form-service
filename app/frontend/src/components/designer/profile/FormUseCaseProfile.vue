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
        $t('trans.fileProfile.useCaseType')
      }}</span></template
    >

    <v-radio-group>
      <v-radio
        label="Feedback Form to determine satisfaction, agreement, likelihood, or other qualitative questions"
        value="a"
      ></v-radio>
      <v-radio
        label="Applications that will be evaluated followed by a decision"
        value="b"
      ></v-radio>
      <v-radio
        label="Collection of Datasets, data submission"
        value="c"
      ></v-radio>
      <v-radio
        label="Reporting usually on a repeating schedule or event driven like follow-ups"
        value="d"
      ></v-radio>
      <v-radio
        label="Registrations or Sign up - no evaluation"
        value="e"
      ></v-radio>
    </v-radio-group>
  </BasePanel>
</template>
