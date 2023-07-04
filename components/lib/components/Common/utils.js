import _ from 'lodash';
import Evaluator from './Evaluator';
var EditFormUtils = {
    sortAndFilterComponents: function (components) {
        return _.filter(_.sortBy(components, 'weight'), function (item) { return !item.ignore; });
    },
    getContextButtons: function (context) {
        var values = [];
        context.utils.eachComponent(context.instance.options.editForm.components, function (component) {
            if (component.type === 'button') {
                values.push({
                    label: "".concat(component.key, " (").concat(component.label, ")"),
                    value: component.key,
                });
            }
        });
        return values;
    },
    unifyComponents: function (objValue, srcValue) {
        if (objValue.key && srcValue.key) {
            if (objValue.skipMerge || srcValue.skipMerge) {
                return false;
            }
            if (objValue.key === srcValue.key) {
                // Create complete objects by including missing keys.
                _.each(objValue, function (value, prop) {
                    if (objValue.overrideEditForm || !srcValue.hasOwnProperty(prop)) {
                        srcValue[prop] = value;
                    }
                });
                _.each(srcValue, function (value, prop) {
                    if (srcValue.overrideEditForm || !objValue.hasOwnProperty(prop)) {
                        objValue[prop] = value;
                    }
                });
                if (objValue.components) {
                    srcValue.components = EditFormUtils.sortAndFilterComponents(_.unionWith(objValue.components, srcValue.components, EditFormUtils.unifyComponents));
                }
                return true;
            }
            else {
                return false;
            }
        }
        return _.isEqual(objValue, srcValue);
    },
    logicVariablesTable: function (additional) {
        additional = additional || '';
        return {
            type: 'htmlelement',
            tag: 'div',
            /* eslint-disable prefer-template */
            content: '<p>The following variables are available in all scripts.</p>' +
                '<table class="table table-bordered table-condensed table-striped">' +
                additional +
                '<tr><th>token</th><td>The decoded JWT token for the authenticated user.</td></tr>' +
                '<tr><th>user</th><td>The current logged in user</td></tr>' +
                '<tr><th>form</th><td>The complete form JSON object</td></tr>' +
                '<tr><th>submission</th><td>The complete submission object.</td></tr>' +
                '<tr><th>data</th><td>The complete submission data object.</td></tr>' +
                '<tr><th>row</th><td>Contextual "row" data, used within DataGrid, EditGrid, and Container components</td></tr>' +
                '<tr><th>component</th><td>The current component JSON</td></tr>' +
                '<tr><th>instance</th><td>The current component instance.</td></tr>' +
                '<tr><th>value</th><td>The current value of the component.</td></tr>' +
                '<tr><th>moment</th><td>The moment.js library for date manipulation.</td></tr>' +
                '<tr><th>_</th><td>An instance of <a href="https://lodash.com/docs/" target="_blank">Lodash</a>.</td></tr>' +
                '<tr><th>utils</th><td>An instance of the <a href="http://formio.github.io/formio.js/docs/identifiers.html#utils" target="_blank">FormioUtils</a> object.</td></tr>' +
                '<tr><th>util</th><td>An alias for "utils".</td></tr>' +
                '</table><br/>'
            /* eslint-enable prefer-template */
        };
    },
    javaScriptValue: function (title, property, propertyJSON, weight, exampleHTML, exampleJSON, additionalParams, excludeJSONLogic) {
        if (additionalParams === void 0) { additionalParams = ''; }
        var components = [
            this.logicVariablesTable(additionalParams),
            {
                type: 'panel',
                title: 'JavaScript',
                collapsible: true,
                collapsed: false,
                style: { 'margin-bottom': '10px' },
                key: "".concat(property, "-js"),
                customConditional: function () {
                    return !Evaluator.noeval || Evaluator.protectedEval;
                },
                components: [
                    {
                        type: 'textarea',
                        key: property,
                        rows: 5,
                        editor: 'ace',
                        hideLabel: true,
                        as: 'javascript',
                        input: true
                    },
                    {
                        type: 'htmlelement',
                        tag: 'div',
                        content: "<p>Enter custom javascript code.</p>".concat(exampleHTML)
                    }
                ]
            },
            {
                type: 'panel',
                title: 'JSONLogic',
                collapsible: true,
                collapsed: true,
                key: "".concat(property, "-json"),
                components: [
                    {
                        type: 'htmlelement',
                        tag: 'div',
                        /* eslint-disable prefer-template */
                        content: '<p>Execute custom logic using <a href="http://jsonlogic.com/" target="_blank">JSONLogic</a>.</p>' +
                            '<p>Full <a href="https://lodash.com/docs" target="_blank">Lodash</a> support is provided using an "_" before each operation, such as <code>{"_sum": {var: "data.a"}}</code></p>' +
                            exampleJSON
                        /* eslint-enable prefer-template */
                    },
                    {
                        type: 'textarea',
                        key: propertyJSON,
                        rows: 5,
                        editor: 'ace',
                        hideLabel: true,
                        as: 'json',
                        input: true
                    }
                ]
            }
        ];
        if (excludeJSONLogic) {
            components.splice(2, 1);
        }
        return {
            type: 'panel',
            title: "".concat(title),
            theme: 'default',
            collapsible: true,
            collapsed: true,
            key: "".concat(property, "Panel"),
            weight: "".concat(weight),
            components: components
        };
    }
};
export default EditFormUtils;
