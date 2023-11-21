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
      items: ['Unity', 'myForms'],
    };
  },
  computed: {
    ...mapState(useFormStore, ['lang']),
    ...mapWritableState(useFormStore, ['form']),
  },
  methods: {
    remove(item) {
      this.chips.splice(this.chips.indexOf(item), 1);
    },
  },
};
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">{{ $t('trans.fileProfile.tags') }}</span></template
    >
    <v-combobox
      v-model="form.tags"
      :items="items"
      chips
      clearable
      label="Tags"
      multiple
      variant="solo"
    >
      <template #selection="{ attrs, item, select, selected }">
        <v-chip
          v-bind="attrs"
          :model-value="selected"
          closable
          @click="select"
          @click:close="remove(item)"
        >
          <strong>{{ item }}</strong
          >&nbsp;
          <span>(interest)</span>
        </v-chip>
      </template>
    </v-combobox>
  </BasePanel>
</template>
