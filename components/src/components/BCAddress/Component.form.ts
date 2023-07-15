import baseEditForm from 'formiojs/components/_classes/component/Component.form';
import AddressEditProvider from './editForm/Address.edit.provider';
import AddressEditData from './editForm/Address.edit.data';
import AddressEditDisplay from './editForm/Address.edit.display';


export default function(...extend) {
    return baseEditForm([
        {
            label: 'Provider',
            key: 'provider',
            weight: 150,
            components: AddressEditProvider,
          },
          {
            label: 'Data',
            key: 'data',
            weight: 160,
            components: AddressEditData,
          },
          {
            label: 'Display',
            key: 'display',
            weight: 170,
            components: AddressEditDisplay,
          },
    ], ...extend);
}
