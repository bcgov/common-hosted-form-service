<script>
import { mapWritableState } from 'pinia';
import BasePanel from '~/components/base/BasePanel.vue';
import { useFormStore } from '~/store/form';

export default {
  components: {
    BasePanel,
  },
  data() {
    return {
      nameRules: [
        (v) => !!v || 'Form Title is required',
        (v) =>
          (v && v.length <= 255) || 'Form Title must be 255 characters or less',
      ],
      descriptionRules: [
        (v) => {
          if (v) {
            return (
              v.length <= 255 ||
              'Form Description must be 255 characters or less'
            );
          } else return true;
        },
      ],
    };
  },
  computed: {
    ...mapWritableState(useFormStore, ['form']),
  },
};
</script>

<template>
  <BasePanel class="fill-height">
    <template #title>{{ $t('trans.formSettings.formTitle') }}</template>
    <v-text-field
      v-model="form.name"
      density="compact"
      solid
      variant="outlined"
      :label="$t('trans.formSettings.formTitle')"
      data-test="text-name"
      :rules="nameRules"
    />

    <v-text-field
      v-model="form.description"
      density="compact"
      solid
      variant="outlined"
      :label="$t('trans.formSettings.formDescription')"
      data-test="text-description"
      :rules="descriptionRules"
    />
  </BasePanel>
</template>
