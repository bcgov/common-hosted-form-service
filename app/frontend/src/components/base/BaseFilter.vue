<script>
import { i18n } from '~/internationalization';
import { mapState } from 'pinia';

import { useFormStore } from '~/store/form';

export default {
  props: {
    inputHeaders: {
      type: Array,
      default: () => [
        {
          title: i18n.t('trans.baseFilter.columnName'),
          align: 'start',
          sortable: true,
          key: 'title',
        },
      ],
    },
    // The data you will be filtering with
    inputData: {
      type: Array,
      default: () => [
        { title: i18n.t('trans.baseFilter.exampleText'), key: 'exampleText1' },
        { title: i18n.t('trans.baseFilter.exampleText2'), key: 'exampleText2' },
      ],
    },
    resetData: {
      type: Array,
      default: () => [],
    },
    // The default selected data
    preselectedData: {
      type: Array,
      default: () => [],
    },
    inputItemKey: {
      type: String,
      default: 'key',
    },
    inputFilterLabel: {
      type: String,
      default: '',
    },
    inputFilterPlaceholder: {
      type: String,
      default: i18n.t('trans.baseFilter.exampleText2'),
    },
    inputSaveButtonText: {
      type: String,
      default: i18n.t('trans.baseFilter.filter'),
    },
  },
  emits: ['saving-filter-data', 'cancel-filter-data'],
  data() {
    return {
      selectedData: this.preselectedData,
      inputFilter: '',
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang']),
  },
  methods: {
    savingFilterData() {
      this.inputFilter = '';
      this.$emit('saving-filter-data', this.selectedData);
    },
    onResetColumns() {
      this.selectedData = this.resetData;
      this.inputFilter = '';
    },
    cancelFilterData() {
      (this.selectedData = this.preselectedData),
        this.$emit('cancel-filter-data');
    },
  },
};
</script>

<template>
  <v-card :class="{ 'dir-rtl': isRTL }">
    <v-card-title class="text-h5 pb-0 titleWrapper">
      <slot name="filter-title"></slot>
    </v-card-title>
    <v-card-subtitle class="mt-1 d-flex subTitleWrapper">
      <slot name="filter-subtitle"></slot>
    </v-card-subtitle>
    <v-card-text class="mt-0 pt-0">
      <hr class="hr" />

      <div class="d-flex flex-row" style="gap: 10px">
        <v-text-field
          v-model="inputFilter"
          data-test="filter-search"
          :label="inputFilterLabel"
          :placeholder="inputFilterPlaceholder"
          clearable
          color="primary"
          prepend-inner-icon="search"
          variant="filled"
          density="compact"
          class="mt-3"
          :class="{ label: isRTL }"
          :lang="lang"
        >
        </v-text-field>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              color="primary"
              class="mx-1 align-self-center mb-3"
              icon
              v-bind="props"
              @click="onResetColumns"
            >
              <v-icon
                style="pointer-events: none"
                icon="mdi:mdi-repeat"
                size="xl"
              />
            </v-btn>
          </template>
          <span :lang="lang">{{ $t('trans.baseFilter.resetColumns') }}</span>
        </v-tooltip>
      </div>
      <v-data-table
        v-model="selectedData"
        data-test="filter-table"
        fixed-header
        show-select
        hide-default-footer
        height="300px"
        :headers="inputHeaders"
        :items="inputData"
        items-per-page="-1"
        :item-value="inputItemKey"
        :search="inputFilter"
        class="bg-grey-lighten-5 mb-3"
        disable-pagination
        return-object
        :lang="lang"
      >
      </v-data-table>
      <v-btn
        data-test="save-btn"
        class="bg-primary mt-3"
        :lang="lang"
        @click="savingFilterData"
      >
        {{ inputSaveButtonText }}
      </v-btn>
      <v-btn
        data-test="cancel-btn"
        class="mt-3 text-primary"
        :class="isRTL ? 'mr-3' : 'ml-3'"
        variant="outlined"
        :lang="lang"
        @click="cancelFilterData"
        >{{ $t('trans.baseFilter.cancel') }}</v-btn
      >
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.subTitleWrapper {
  font-style: normal !important;
  font-size: 18px !important;
  font-variant: normal !important;
  font-family: BCSans !important;
  font-weight: normal !important;
  color: #707070c1 !important;
  gap: 10px !important;
  padding-bottom: 0px !important;
  margin-bottom: 0px !important;
}
.titleWrapper {
  font-style: normal !important;
  font-size: 22px !important;
  font-weight: bold !important;
  font-variant: normal !important;
  font-family: BCSans !important;
  color: #000000 !important;
}
.hr {
  height: 1px;
  border: none;
  background-color: #707070c1;
  margin-bottom: 0px;
}
</style>
