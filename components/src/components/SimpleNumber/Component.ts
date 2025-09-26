/* tslint:disable */
import { Components } from 'formiojs';
import editForm from './Component.form';
import { addRoundingToSchema } from '../Common/Rounding.mixin';
import { Constants } from '../Common/Constants';

const ParentComponent = (Components as any).components.number;

const ID = 'simplenumber';
const DISPLAY = 'Number';

// Apply the mixin to create the final component class
export default class Component extends (ParentComponent as any) {
  static schema(...extend: any[]) {
    const baseSchema = ParentComponent.schema(
      {
        type: ID,
        label: DISPLAY,
        key: ID,
        validate: {
          min: '',
          max: '',
          step: 'any',
          integer: '',
        },
      },
      ...extend
    );

    return addRoundingToSchema(baseSchema);
  }

  public static editForm = editForm;

  static get builderInfo() {
    return {
      title: DISPLAY,
      group: 'simple',
      icon: 'hashtag',
      weight: 10,
      documentation: Constants.DEFAULT_HELP_LINK,
      schema: Component.schema(),
    };
  }

  formatValue(value: any) {
    if (
      this.component.requireDecimal &&
      value !== null &&
      value !== undefined &&
      value !== ''
    ) {
      const decimalPlaces = this.component.decimalLimit || 2;
      const multiplier = Math.pow(10, decimalPlaces);
      let numValue = Number.parseFloat(value);
      if (!Number.isNaN(numValue) && this.component.rounding) {
        switch (this.component?.rounding?.method) {
          case 'floor':
            numValue = Math.floor(numValue * multiplier) / multiplier;
            break;
          case 'ceil':
            numValue = Math.ceil(numValue * multiplier) / multiplier;
            break;
          case 'round':
          default:
            numValue = Math.round(numValue * multiplier) / multiplier;
            break;
        }
        return numValue.toFixed(decimalPlaces);
      }
    }

    return super.formatValue(value);
  }
}
