<script setup>
import { FormBuilder } from '@formio/vue';
import { compare, applyPatch, deepClone } from 'fast-json-patch';

import templateExtensions from '~/plugins/templateExtensions';
import { formService } from '~/services';
import { IdentityMode } from '~/utils/constants';
import { generateIdps } from '~/utils/transformUtils';

const props = defineProps({
  draftId: {
    type: String,
    default: null,
  },
  formId: {
    type: String,
    default: null,
  },
  saved: {
    type: Boolean,
    default: false,
  },
  newVersion: {
    type: Boolean,
    default: false,
  },
  isSavedStatus: {
    type: String,
    default: 'Save',
  },
  versionId: {
    type: String,
    default: null,
  },
});
</script>

<template>
  <div>
    <v-row class="mt-6" no-gutters>
      <!-- page title -->
      <v-col cols="12" sm="6" order="2" order-sm="1">
        <h1>Form Design</h1>
      </v-col>
      <!-- buttons -->
      <v-col class="text-right" cols="12" sm="6" order="1" order-sm="2">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              class="mx-1"
              color="primary"
              icon
              v-bind="props"
              @click="onExportClick"
            >
              <v-icon>get_app</v-icon>
            </v-btn>
          </template>
          <span>Export Design</span>
        </v-tooltip>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              class="mx-1"
              color="primary"
              icon
              v-bind="props"
              @click="$refs.uploader.click()"
            >
              <v-icon>publish</v-icon>
              <input
                ref="uploader"
                class="d-none"
                type="file"
                accept=".json"
                @change="loadFile"
              />
            </v-btn>
          </template>
          <span>Import Design</span>
        </v-tooltip>
      </v-col>
      <!-- form name -->
      <v-col cols="12" order="3">
        <h3 v-if="name">{{ name }}</h3>
      </v-col>
      <!-- version number-->
      <v-col cols="12" order="4">
        <em>Version: {{ displayVersion }}</em>
      </v-col>
    </v-row>
    <BaseInfoCard class="my-6">
      <h4 class="text-primary">
        <v-icon class="mr-1" color="primary">info</v-icon>IMPORTANT!
      </h4>
      <p class="my-0">
        Use the <strong>SAVE DESIGN</strong> button when you are done building
        this form.
      </p>
      <p class="my-0">
        The <strong>SUBMIT</strong> button is provided for your user to submit
        this form and will be activated after it is saved.
      </p>
    </BaseInfoCard>
    <FormBuilder
      :form="FORM_SCHEMA"
      :key="reRenderFormIo"
      ref="formioForm"
      :options="designerOptions"
      class="form-designer"
      @change="onChangeMethod"
      @render="onRenderMethod"
      @initialized="init"
      @addComponent="onAddSchemaComponent"
      @removeComponent="onRemoveSchemaComponent"
      @formLoad="onFormLoad"
    />
  </div>
</template>

<style lang="scss" scoped>
/* disable router-link */
.disabled-router {
  pointer-events: none;
}

.formSubmit {
  background-color: red;
}

.formExport {
  position: sticky;
  top: 0;
  right: 0;

  position: -webkit-sticky;
}

.formImport {
  position: sticky;
  top: 0;
  right: 0;

  position: -webkit-sticky;
}

.formSetting {
  position: sticky;
  top: 0;
  right: 0;

  position: -webkit-sticky;
}
</style>
