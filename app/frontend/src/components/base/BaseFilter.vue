<template>
  <v-card :class="{ 'dir-rtl': isRTL }">
    <v-card-title class="text-h5 pb-0 titleWrapper">
      <slot name="filter-title"></slot>
    </v-card-title>
    <v-card-subtitle class="mt-1 d-flex subTitleWrapper"> </v-card-subtitle>
    <v-card-text class="mt-0 pt-0">
      <hr class="hr" />

      <div class="d-flex flex-row" style="gap: 10px">
        <v-text-field
          v-model="inputFilter"
          :label="inputFilterLabel"
          :placeholder="inputFilterPlaceholder"
          clearable
          color="primary"
          prepend-inner-icon="search"
          filled
          dense
          class="mt-3"
          :class="{ label: isRTL }"
          :lang="lang"
        />
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              color="primary"
              class="mx-1 align-self-center mb-3"
              icon
              @click="onResetColumns"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>repeat</v-icon>
            </v-btn>
          </template>
          <span :lang="lang">{{ $t('trans.baseFilter.resetColumns') }}</span>
        </v-tooltip>
      </div>

      <v-data-table
        fixed-header
        show-select
        hide-default-footer
        height="300px"
        v-model="selectedData"
        :headers="inputHeaders"
        :items="tableData"
        :item-key="inputItemKey"
        :search="inputFilter"
        class="grey lighten-5"
        disable-pagination
        :lang="lang"
      >
      </v-data-table>
      <v-btn @click="savingFilterData" class="primary mt-3" :lang="lang">{{
        inputSaveButtonText
      }}</v-btn>
      <v-btn
        @click="cancelFilterData"
        class="mt-3 primary--text"
        :class="isRTL ? 'mr-3' : 'ml-3'"
        outlined
        :lang="lang"
        >{{ $t('trans.baseFilter.cancel') }}</v-btn
      >
    </v-card-text>
  </v-card>
</template>

<script>
import { mapGetters } from 'vuex';
import i18n from '@/internationalization';

export default {
  name: 'BaseFilter',
  props: {
    inputHeaders: {
      type: Array,
      default: () => [
        {
          text: i18n.t('trans.baseFilter.columnName'),
          align: 'start',
          sortable: true,
          value: 'text',
        },
      ],
    },
    // The data you will be filtering with
    inputData: {
      type: Array,
      default: () => [
        {
          text: i18n.t('trans.baseFilter.exampleText'),
          value: 'exampleText1',
        },
        {
          text: i18n.t('trans.baseFilter.exampleText2'),
          value: 'exampleText2',
        },
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
      default: 'value',
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
  computed: {
    ...mapGetters('form', ['isRTL', 'lang']),
  },
  data() {
    return {
      selectedData: this.preselectedData,
      inputFilter: '',
      tableData: this.inputData,
    };
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
  text-align: left !important;
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
