<template>
  <div>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          @click="submitFormSchema"
          color="primary"
          icon
          v-bind="attrs"
          v-on="on" >
          <v-icon>save</v-icon>
        </v-btn>
      </template>
      <span>Save Design</span>
    </v-tooltip>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          :disabled="!undoEnabled"
          class="mx-1"
          @click="onUndoClick"
          color="primary"
          icon
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>undo</v-icon>
          {{ undoCount }}
        </v-btn>
      </template>
      <span>Undo</span>
    </v-tooltip>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          :disabled="!redoEnabled"
          class="mx-1"
          @click="onRedoClick"
          color="primary"
          icon
          v-bind="attrs"
          v-on="on"
        >
          {{ redoCount }}
          <v-icon>redo</v-icon>
        </v-btn>
      </template>
      <span>Redo</span>
    </v-tooltip>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          @click="onExportClick"
          color="primary"
          icon
          v-bind="attrs"
          v-on="on">
          <v-icon>get_app</v-icon>
        </v-btn>
      </template>
      <span>Export Design</span>
    </v-tooltip>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          @click="$refs.uploader.click()"
          color="primary"
          icon
          v-bind="attrs"
          v-on="on">
          <v-icon>publish</v-icon>
          <input
            class="d-none"
            @change="loadFile"
            ref="uploader"
            type="file"
            accept=".json"/>
        </v-btn>
      </template>
      <span>Import Design</span>
    </v-tooltip>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <router-link
          :to="{ name: 'FormManage', query: { f: formId } }"
          :class="{ 'disabled-router': !formId }">
          <v-btn
            class="formSetting"
            color="primary"
            :disabled="!formId"
            icon
            v-bind="attrs"
            v-on="on">
            <v-icon>settings</v-icon>
          </v-btn>
        </router-link>
      </template>
      <span>Manage Form</span>
    </v-tooltip>
  </div>
</template>

<script>
export default {
  name:'FormDesignActionButton',
  props:['formId',
    'undoCount',
    'undoEnabled',
    'redoEnabled',
    'redoCount'],
  methods: {
    submitFormSchema(){
      this.$emit('form-schema-submit');
    },
    onExportClick(){
      this.$emit('form-schema-export');
    },
    loadFile(event){
      this.$emit('load-form-schema',event);
    },
    onRedoClick(){
      this.$emit('on-redo-schema');
    },
    onUndoClick(){
      this.$emit('on-undo-schema');
    }
  }
};
</script>

