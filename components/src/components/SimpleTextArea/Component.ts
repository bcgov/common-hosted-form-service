/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.textarea;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simpletextarea';
const DISPLAY = 'Multi-line Text';

export default class Component extends (ParentComponent as any) {
  static schema(...extend) {
    return ParentComponent.schema(
      {
        type: ID,
        label: DISPLAY,
        key: ID,
        rows: 3,
        wysiwyg: false,
        editor: '',
        spellcheck: true,
        fixedSize: true,
        inputFormat: 'plain',
        validate: {
          minWords: '',
          maxWords: '',
        },
      },
      ...extend,
    );
  }

  public static editForm = editForm;

  static get builderInfo() {
    return {
      title: DISPLAY,
      group: 'simple',
      icon: 'font',
      weight: 2,
      documentation: Constants.DEFAULT_HELP_LINK,
      schema: Component.schema(),
    };
  }

  detach() {
    // CKEditor 5 destroy() blows up when the editor instance is wrapped in a
    // Vue 3 reactive Proxy (_events is non-configurable). Unwrap via __v_raw
    // and swallow any remaining proxy errors since the DOM is going away anyway.
    this.editors.forEach((editor) => {
      if (editor.destroy) {
        try {
          const rawEditor = (editor as any).__v_raw ?? editor;
          rawEditor.destroy();
        } catch (__error) {
          /* intentional */
        }
      }
    });
    this.editors = [];
    super.detach();
  }
}
