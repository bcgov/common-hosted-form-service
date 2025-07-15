export const STUBS = Object.freeze({
  VTooltip: {
    name: 'VTooltip',
    template: '<div class="v-tooltip-stub"><slot /></div>',
  },
  VBtn: {
    name: 'VBtn',
    template: '<div class="v-btn-stub"><slot /></div>',
  },
  VCheckbox: {
    name: 'VCheckbox',
    template: '<div class="v-checkbox-stub"><slot /></div>',
  },
  VTextField: {
    name: 'VTextField',
    template: '<div class="v-text-field-stub"><slot /></div>',
  },
  VDataTableServer: {
    template: '<div class="v-data-table-server"><slot /></div>',
    props: ['items', 'options', 'serverItemsLength', 'loading', 'pagination'],
  },
  VFileInput: {
    template: '<div class="v-file-input"><slot /></div>',
    props: ['value'],
    methods: {
      reset() {
        this.$emit('update:value', null);
      },
    },
  },
  VIcon: {
    name: 'VIcon',
    template: '<div class="v-icon-stub"><slot /></div>',
  },
  VDialog: {
    name: 'VDialog',
    template: '<div class="v-dialog-stub"><slot /></div>',
    props: ['modelValue'],
  },
});
