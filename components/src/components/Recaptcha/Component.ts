
/* tslint:disable */
import {Components} from 'formiojs';
import { Constants } from '../Common/Constants';
import editForm from './Component.form';


const ParentComponent = (Components as any).components.recaptcha;

const ID = 'recaptcha';
const DISPLAY = 'ReCaptcha';

export default class Component extends (ParentComponent as any) {
    static schema(...extend) {

        return ParentComponent.schema({
            label: DISPLAY,
            type: ID,
            key: ID,
            settings: {
                recaptcha: {
                    isEnabled: true,
                    siteKey: "6LfPXuAmAAAAAGyK8fLkAZlV8MuEBdTjgytyreY3",
                    secretKey: "6LfPXuAmAAAAAHALt1ISGGfFAQE6b0P3ZqHorGOv"
                }
            }

        }, ...extend);
    }

    static get builderInfo() {
        return {
            title: 'reps',
            group: 'advanced',
            icon: 'address-book',
            weight: 90,
            documentation: Constants.DEFAULT_HELP_LINK,
            schema: Component.schema()
        };
    }

    public static editForm = editForm;

    createInput() {
        super.createInput();
    }


}
export {};
