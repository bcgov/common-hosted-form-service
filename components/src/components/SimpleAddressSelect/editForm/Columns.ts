export default [
    { components: [ {
      disabled:true,
      defaultValue:'Canada',
      label:'Country',
      key: 'country',
      type: 'select',
      input: true,
    }], width: 4, offset: 0, push: 0, pull: 0, size: 'md' },
    { components: [ {
      label:'Province',
      key: 'province',
      type: 'select',
      input: true,
      removeRow: 'Cancel',
      refreshOn: 'ID',
      clearOnRefresh: true,
      dataSrc: 'url',
      limit: -1,
validate: {
  required: true
},
template: '<span>{{ item.value }}</span>',
data: {
  url:`http://localhost:3000/provinces`
}
    }], width: 4, offset: 0, push: 0, pull: 0, size: 'md' },
    { components: [ {
      label:'City',
      key: 'city',
      limit: -1,
      type: 'select',
      removeRow: 'Cancel',
      input: true,
      refreshOn: 'province',
      clearOnRefresh: true,
      dataSrc: 'url',     
validate: {
  required: true
},
template: '<span>{{ item.value }}</span>',
data: {
  url:'http://localhost:3000/{{row.province.label}}'
}
    }], width: 4, offset: 0, push: 0, pull: 0, size: 'md' },
    { components: [ {
      label:'Postal Code',
      key: 'postalCode',
      type: 'textfield',
      mask: false,
      inputType: 'text',
      inputFormat: 'plain',
      input: true,
      spellcheck: true,
      validateOn: 'change',
validate: {
  required: true,
  pattern: '^(?!.*[DFIOQU])[A-VXY][0-9][A-Z] ?[0-9][A-Z][0-9]$',
},
errors:{
  'required':'Postal code is required. Try again.',
  'pattern':'Please enter a valid postal code.'}
  }], width: 3, offset: 0, push: 0, pull: 0, size: 'md' },
]