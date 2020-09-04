<template>
  <div>
    <v-form>
      <v-row>
        <v-col cols="12" xl="4">
          <v-text-field dense flat label="Name" data-test="text-formName" v-model="formName" />
        </v-col>
        <v-col cols="12" xl="8">
          <v-text-field
            dense
            flat
            label="Description"
            data-test="text-formDescription"
            v-model="formDescription"
          />
        </v-col>
      </v-row>
      <v-btn color="primary" @click="submitFormSchema">
        <span>Save Form Design</span>
      </v-btn>
    </v-form>
    <FormBuilder :form="formSchema" @change="onChangeMethod" :options="{}" />
  </div>
</template>

<script>
import { FormBuilder } from 'vue-formio';
import formService from '@/services/formService';

export default {
  name: 'FormDesigner',
  components: {
    FormBuilder,
  },
  props: {
    formId: String,
    formVersionId: String,
  },
  data: () => ({
    formName: '',
    formDescription: '',
    formSchema: {},
  }),
  methods: {
    async getFormSchema() {
      this.formSchema = {};
      try {
        if (this.formId) {
          const form = await formService.readForm(this.formId);
          this.formName = form.data.name;
          this.formDescription = form.data.description;

          if (this.formVersionId) {
            const response = await formService.readVersion(
              this.formId,
              this.formVersionId
            );
            this.formSchema = response.data.schema;
          }
        }
      } catch (error) {
        console.error(`Error loading form schema: ${error}`); // eslint-disable-line no-console
      }
    },
    async submitFormSchema() {
      if (this.formId && this.formVersionId) {
        try {
          const response = await formService.updateVersion(
            this.formId,
            this.formVersionId,
            {
              schema: this.formSchema,
            }
          );
          const data = response.data;
          this.formSchema = data.schema;
        } catch (error) {
          console.error(`Error updating form schema version: ${error}`); // eslint-disable-line no-console
        }
      }
      // TODO: Implement logic for creating a new form
      // } else {
      //   try {
      //     const form = {
      //       name: this.formName,
      //       description: this.formDescription,
      //       schema: this.formSchema
      //     };
      //     const response = await formService.createForm(form);
      //     const data = response.data;
      //     this.formSchema = data.schema;
      //   } catch (error) {
      //     console.error(`Error creating new form : ${error}`); // eslint-disable-line no-console
      //   }
      // }
    },
    onChangeMethod(schema) {
      if (!this.formSchema) this.formSchema = {};
      this.formSchema = Object.assign(this.formSchema, schema);
    },
    created() {
      this.getFormSchema();
    },
  },
};
</script>
