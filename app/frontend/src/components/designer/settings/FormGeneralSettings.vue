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
      nameRules: [
        (v) => !!v || this.$t('trans.formSettings.formTitleReq'),
        (v) =>
          (v && v.length <= 255) ||
          this.$t('trans.formSettings.formTitlemaxChars'),
      ],
      descriptionRules: [
        (v) => {
          if (v) {
            return (
              v.length <= 255 ||
              this.$t('trans.formSettings.formDescriptnMaxChars')
            );
          } else return true;
        },
      ],
    };
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
        $t('trans.formSettings.formTitle')
      }}</span></template
    >
    <v-text-field
      v-model="form.name"
      density="compact"
      solid
      variant="outlined"
      :label="$t('trans.formSettings.formTitle')"
      data-test="text-name"
      :rules="nameRules"
      :lang="lang"
    />

    <v-text-field
      v-model="form.description"
      density="compact"
      solid
      variant="outlined"
      :label="$t('trans.formSettings.formDescription')"
      data-test="text-description"
      :rules="descriptionRules"
      :lang="lang"
    />
  </BasePanel>
</template>
