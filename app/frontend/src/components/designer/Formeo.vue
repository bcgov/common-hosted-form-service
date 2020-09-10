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
      <v-btn color="primary" @click="save">
        <span>Save Form Design</span>
      </v-btn>
    </v-form>

    <div class="formeo-editor" v-once>Editor</div>

    <v-form>
      <v-btn color="primary" @click="render">
        <span>Render</span>
      </v-btn>
      <div class="formeo-render" v-once>Renderer</div>
      <v-btn color="primary" @click="debug">
        <span>Debug</span>
      </v-btn>
    </v-form>
  </div>
</template>

<script>
import('formeo/dist/formeo.min.js');
import('formeo/dist/formeo.min.css');
import { FormeoEditor, FormeoRenderer } from 'formeo';

export default {
  name: 'Formeo',
  props: {
    formId: String,
    formVersionId: String,
  },
  data() {
    return {
      editor: {},
      formData: undefined,
      formName: '',
      formDescription: '',
      renderer: {},
    };
  },
  methods: {
    debug() {
      console.log('debug', this.renderer.form); // eslint-disable-line no-console
    },
    refresh() {
      this.editor = new FormeoEditor(
        {
          editorContainer: '.formeo-editor',
          events: {
            formeoLoaded: (x) => console.log('editor event formeoLoaded', x), // eslint-disable-line no-console
            onSave: () => this.save(),
          },
        },
        this.formData
      );
      this.renderer = new FormeoRenderer(
        {
          renderContainer: '.formeo-render',
          actions: {
            click: {
              btn: (x) => console.log('render action click.btn', x), // eslint-disable-line no-console
              button: (x) => console.log('render action click.button', x), // eslint-disable-line no-console
            },
            save: (x) => console.log('render action save', x), // eslint-disable-line no-console
          },
          events: {
            formeoLoaded: (x) => console.log('render event formeoLoaded', x), // eslint-disable-line no-console
            onSave: (x) => console.log('render event onSave', x), // eslint-disable-line no-console
            onUpdate: () => console.log('render event onUpdate'), // eslint-disable-line no-console
            onRender: () => console.log('render event onRender'), // eslint-disable-line no-console
          },
        },
        this.formData
      );
    },
    render() {
      if (this.formData) {
        console.log('render', this.formData); // eslint-disable-line no-console
        this.renderer.render();
      }
    },
    save() {
      console.log('save', this.editor.formData); // eslint-disable-line no-console
      this.formData = this.editor.formData;
      this.refresh();
    },
  },
  mounted() {
    this.refresh();
  },
};
</script>
