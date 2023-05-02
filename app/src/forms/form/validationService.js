const Validator = require('formio/src/resources/Validator.js');
const util = require('formio/src/util/util');

/**
 * As per new usage of validator.js we Need param (ie: router) to create
 * dummy hook and dummy DB model to perform validation on backend.
 * As we did not used validation on BE so validator.js needs some dummy
 * params. see more https://github.com/formio/formio/issues/1078#issuecomment-684025666
 **/

const router = {
  formio: {
    config: {
      schema: '3.1.4', //Give app a reference to our config.
    },
  },
};

const hook = require('formio/src/util/hook')(router.formio);

/**
 * This function will be used to validate submission data
 *
 * function validate
 * @param {*} data Form Submission data
 * @param {*} schema Form's schema
 * @returns validation errors if any
 */

function validate(data, schema) {
  return new Promise((resolve) => {
    /*
    let dataGridComponents = [];
    let inputComponents = []; //Array to be used for push all the components that are type of input.
    let inputComponentsTypes = [
      //All component types that we want to check validation on.
      'password',
      'simplepasswordadvanced',

      'select',
      'simpleselect',
      'simpleselectadvanced',
      'simpleselectboxesadvanced',
      
      'textfield',
      'simpletextfield',
      'simpletextfieldadvanced',

      'number',
      'simplenumber',
      'simplenumberadvanced',

      'textarea',
      'simpletextarea',
      'simpletextareaadvanced',
      
      'datetime',
      'simpledatetime',
      'simpledatetimeadvanced',
      
      'radio',
      'simpleradios',
      'simpleradioadvanced',

      'simplecheckbox',
      'simplecheckboxes',
      'simplecheckboxadvanced',
      
      'simpleemail',
      'simpleemailadvanced',
      
      'simpleparagraph',
      'simplephonenumber',
      
      'simpletime',
      'simpletimeadvanced',

      'simpleurladvanced',
      'simplephonenumberadvanced',
      
      'simpledayadvanced'
    ];

    function pushInputComponent(component) {
      if (util.isInputComponent(component) && inputComponentsTypes.includes(component.type)) {
        //Check if component is desired type and is a input type component
        inputComponents.push(component); //if needed component then let's add it to an array for validation check
      }
    }

    function extractGridData(data,dataGridComponents) {
      dataGridComponents.map((dgc) => {
        //Object.assign(data, dgc);
        data = {
          ...data,
          ...data[dgc][0]
        }
      });
      return data;
    }

    util.eachComponent(schema.components, function (component) {
      //Iterate each Form component
      pushInputComponent(component);
      if(component.type === 'datagrid'){
        dataGridComponents.push(component.key);
      }
    });
    // console.log(dataGridComponents);
    // console.log('extractGridData(data,dataGridComponents)-',extractGridData(data,dataGridComponents));
    */
   
    //This is wrapper of hook to supply to validator class as per new usage by formio validator.js
    hook.alter('validateSubmissionForm', schema, { data }, async () => {
      // eslint-disable-line max-statements
      const validator = new Validator(schema, {}, null, null, hook);
      validator.validate({ data }, (err) => {
        resolve(err);
      });
    });
  });
}

module.exports = {
  validate,
};
