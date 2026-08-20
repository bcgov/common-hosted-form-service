/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.select;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simpleselectadvanced';
const DISPLAY = 'Select';

export default class Component extends (ParentComponent as any) {
  static schema(...extend) {
    return ParentComponent.schema(
      {
        type: ID,
        label: DISPLAY,
        key: ID,
      },
      ...extend
    );
  }

  public static editForm = editForm;

  static get builderInfo() {
    return {
      title: DISPLAY,
      group: 'advanced',
      icon: 'th-list',
      weight: 820,
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
