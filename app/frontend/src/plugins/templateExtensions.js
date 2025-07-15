import { Templates } from '@formio/vue';

/**
 * Extend an existing template by first getting the current template function and then call that function in addition to your own
 * see: https://help.form.io/developers/form-templates#overriding-templates
 */
const currentTemplate = Templates.current;

export default Templates.current = {
  // template
  input: {
    // render mode
    form: (ctx) => {
      // add accessibility attributes for required fields
      if (ctx.component.validate.required) {
        ctx.input.attr['aria-required'] = 'true';
        ctx.input.attr['required'] = 'required';
      }
      return currentTemplate.input.form(ctx);
    },
  },
  checkbox: {
    form: (ctx) => {
      // add accessibility attributes for required fields
      if (ctx.component.validate.required) {
        ctx.input.attr['aria-required'] = 'true';
        ctx.input.attr['required'] = 'required';
      }
      return currentTemplate.checkbox.form(ctx);
    },
  },
  select: {
    form: (ctx) => {
      // add accessibility attributes for required fields
      if (ctx.component.validate.required) {
        ctx.input.attr['aria-required'] = 'true';
        ctx.input.attr['required'] = 'required';
      }
      return currentTemplate.select.form(ctx);
    },
  },
  radio: {
    form: (ctx) => {
      // add accessibility attributes for required fields
      if (ctx.component.validate.required) {
        ctx.input.attr['required'] = 'required';
      }
      return `<div role="radiogroup" aria-required="true">${currentTemplate.radio.form(
        ctx
      )}</div>`;
    },
  },
};
