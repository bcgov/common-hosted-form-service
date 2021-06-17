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

  addTargetBlankToLinks = (html) => {
    if (html.includes('<a')) {
      html = html.replace(/<a(?![^>]+target=)/g, '<a target="_blank"');
    }
    return html;
  }

  constructor(component, options, data) {
    super(component, options, data);
    if (component.html) {
      component.html = this.addTargetBlankToLinks(component.html);
    }
  }
}
