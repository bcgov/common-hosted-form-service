/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.select;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simpleselect';
const DISPLAY = 'Select List';

export default class Component extends (ParentComponent as any) {
  static schema(...extend) {
    return ParentComponent.schema(
      {
        type: ID,
        label: DISPLAY,
        key: ID,
        dataSrc: 'values',
        dataType: 'auto',
        widget: 'choicesjs',
        idPath: 'id',
        data: {
          values: [],
          json: '',
          url: '',
          resource: '',
          custom: '',
        },
        clearOnRefresh: false,
        limit: 100,
        valueProperty: '',
        lazyLoad: true,
        filter: '',
        searchEnabled: true,
        searchField: '',
        minSearch: 0,
        readOnlyValue: false,
        authenticate: false,
        template: '<span>{{ item.label }}</span>',
        selectFields: '',
        searchThreshold: 0.3,
        uniqueOptions: false,
        tableView: true,
        fuseOptions: {
          include: 'score',
          threshold: 0.3,
        },
        customOptions: {},
      },
      ...extend
    );
  }

  public static editForm = editForm;

  static get builderInfo() {
    return {
      title: DISPLAY,
      group: 'simple',
      icon: 'list',
      weight: 3,
      documentation: Constants.DEFAULT_HELP_LINK,
      schema: Component.schema(),
    };
  }

  attach(element) {
    const attached = super.attach(element);

    setTimeout(() => {
      const autocompleteInputs = element.querySelectorAll(
        'input[ref=autocompleteInput]'
      );
      if (!autocompleteInputs.length) return;
      autocompleteInputs.array?.forEach((input, index) => {
        input.setAttribute('autocomplete', 'new-password');
        input.setAttribute('name', `${this.key}-dropdown-${index}`);
      });
    });

    return attached;
  }
}
