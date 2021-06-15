/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.content;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simplecontent';
const DISPLAY = 'Static Text';

export default class Component extends (ParentComponent as any) {
  static schema(...extend) {
    return ParentComponent.schema({
      type: ID,
      label: DISPLAY,
      key: ID,
      input: false,
      html: ''
    }, ...extend);
  }

  public static editForm = editForm;

  static get builderInfo() {
    return {
      title: DISPLAY,
      group: 'simple',
      icon: 'pencil-square-o',
      weight: 40,
      documentation: Constants.DEFAULT_HELP_LINK,
      schema: Component.schema()
    };
  }

  get defaultSchema() {
    return Component.schema();
  }

  addTargetBlankToLinks = (html) => {
    let result = '';
    if (html.includes('<a href=')) {
      result = html.replace(/<a href=/g, '<a target="_blank" href=');
    }
    return result;
  }

  attach(element) {
    this.loadRefs(element, { html: 'single' });
    this.refs.html.innerHTML = this.addTargetBlankToLinks(this.refs.html.innerHTML);
  }
}
