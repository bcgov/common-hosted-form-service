/* tslint:disable */
import { Components } from 'formiojs';
const ParentComponent = (Components as any).components.datetime;
import editForm from './Component.form';

import { Constants } from '../Common/Constants';

const ID = 'simpledatetime';
const DISPLAY = 'Date / Time';

export default class Component extends (ParentComponent as any) {
  static schema(...extend) {
    return ParentComponent.schema(
      {
        type: ID,
        label: DISPLAY,
        key: ID,
        format: 'yyyy-MM-dd hh:mm a',
        useLocaleSettings: false,
        allowInput: true,
        enableDate: true,
        enableTime: false,
        defaultValue: '',
        defaultDate: '',
        displayInTimezone: 'viewer',
        timezone: '',
        datepickerMode: 'day',
        datePicker: {
          showWeeks: true,
          startingDay: 0,
          initDate: '',
          minMode: 'day',
          maxMode: 'year',
          yearRows: 4,
          yearColumns: 5,
          minDate: null,
          maxDate: null,
        },
        timePicker: {
          hourStep: 1,
          minuteStep: 1,
          showMeridian: true,
          readonlyInput: false,
          mousewheel: true,
          arrowkeys: true,
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
      icon: 'calendar',
      weight: 20,
      documentation: Constants.DEFAULT_HELP_LINK,
      schema: Component.schema(),
    };
  }

  constructor(component, options, data) {
    super(component, options, data);
    // if enableTime is set to false, manually add time fields since it get removed later on through Form IO
    if (!this.component.enableTime) {
      this.component.format = this.component.format.concat(' hh:mm a');
    }
  }
}
