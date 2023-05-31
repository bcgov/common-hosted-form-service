<script setup>
import { ref, watch } from 'vue';

import { useAdminStore } from '~/store/admin';

const props = defineProps({
  showDialog: { type: Boolean, required: true },
  component: { type: Object, default: () => {} },
  componentName: { type: String, require: true, default: '' },
  groupName: { type: String, required: true },
});

const emits = defineEmits(['close-dialog']);

const adminStore = useAdminStore();

const componentName_ = ref(
  props?.component?.componentName
    ? props.component.componentName
    : props.componentName
);
const description = ref(
  props?.component?.description ? props.component.description : ''
);
const moreHelpInfoLink = ref(
  props?.component?.externalLink ? props.component.externalLink : ''
);
const isLinkEnabled = ref(
  props?.component?.isLinkEnabled ? props.component.isLinkEnabled : ''
);
const dialog = ref(props.showDialog);
const image = ref('');
const imageSizeError = ref(false);
const componentId = ref(props?.component?.id ? props.component.id : undefined);
const imageName = ref(
  props?.component?.imageName ? props.component.imageName : ''
);
const imagePlaceholder = ref(
  props?.component?.imageName ? props.component.imageName : undefined
);
const linkError = ref(false);

watch(props.showDialog, (newValue) => {
  dialog.value = newValue;
});
watch(props.componentName, (newValue) => {
  componentName_.value = newValue;
});
function onCloseDialog() {
  resetDialog();
  emits('close-dialog');
}
function validateLinkUrl() {
  let error = false;
  linkError.value = false;
  if (isLinkEnabled.value && moreHelpInfoLink.value === '') {
    error = true;
    linkError.value = true;
  }
  return error;
}
async function selectImage(img) {
  imageSizeError.value = false;
  if (img.size > 500000) {
    imageSizeError.value = true;
  } else {
    const reader = new FileReader();
    reader.onload = async (e) => {
      image.value = e.target.result;
      imageName.value = img.name;
    };
    if (img) {
      await reader.readAsDataURL(img);
    }
  }
}
function submit() {
  if (!validateLinkUrl()) {
    imageName.value = image.value !== '' ? imageName.value : '';
    moreHelpInfoLink.value = !isLinkEnabled.value ? '' : moreHelpInfoLink.value;
    adminStore.addFCProactiveHelp({
      componentId: componentId.value,
      componentName: componentName_.value,
      image: image.value,
      externalLink: moreHelpInfoLink.value,
      groupName: props.groupName,
      description: description.value,
      status:
        props.component && props.component.status
          ? props.component.status
          : false,
      isLinkEnabled: isLinkEnabled.value,
      imageName: imageName.value,
    });
    onCloseDialog();
  }
}
function resetDialog() {
  componentName_.value = '';
  moreHelpInfoLink.value = '';
  isLinkEnabled.value = false;
  image.value = '';
  imageName.value = '';
  imagePlaceholder.value = undefined;
  linkError.value = false;
  description.value = '';
}
</script>

<template>
  <v-row justify="center" class="mb-5">
    <v-dialog
      v-model="dialog"
      scrollable
      width="70%"
      @click:outside="onCloseDialog"
    >
      <v-card>
        <v-container>
          <v-row>
            <v-col>
              <span class="text-h5" style="font-weight: bold"
                >Component Information Link</span
              >
            </v-col>
          </v-row>
          <v-row v-if="linkError">
            <v-col>
              <div
                style="margin: 0px; padding: 0px"
                class="text-red"
                v-text="'Learn More Link field cannot be empty.'"
              />
            </v-col>
          </v-row>
          <v-row v-if="imageSizeError">
            <v-col>
              <div
                style="margin: 0px; padding: 0px"
                class="text-red"
                v-text="'Large image. Image size cannot be large than .5mb'"
              />
            </v-col>
          </v-row>

          <v-row class="mt-5" no-gutters>
            <span class="text-decoration-underline mr-2 blackColorWrapper">
              Component Name:
            </span>
            <span class="blueColorWrapper" v-text="componentName_" />
          </v-row>
          <v-row class="mt-1" no-gutters>
            <v-col>
              <div class="d-flex flex-row align-center">
                <p class="mr-2 mt-2 text-decoration-underline blueColorWrapper">
                  Learn More Link:
                </p>
                <v-col cols="5">
                  <v-text-field
                    v-model="moreHelpInfoLink"
                    density="compact"
                    enable
                    style="width: 100%"
                    :disabled="!isLinkEnabled"
                    :model-value="moreHelpInfoLink"
                    data-cy="more_help_info_link_text_field"
                    class="text-style"
                    color="#1A5A96"
                  >
                    {{ moreHelpInfoLink }}
                  </v-text-field>
                </v-col>
                <v-checkbox v-model="isLinkEnabled" class="checkbox_data_cy">
                  <template #label>
                    <span class="v-label">{{
                      !isLinkEnabled
                        ? 'Click to enable link'
                        : 'Click to disable link'
                    }}</span>
                  </template>
                </v-checkbox>
              </div>
            </v-col>
          </v-row>

          <v-row no-gutters>
            <v-col cols="12" sm="12" md="12" class="mb-2 blackColorWrapper">
              Description
            </v-col>
            <v-col cols="12" sm="12" md="12">
              <v-textarea
                v-model="description"
                clear-icon="mdi-close-circle"
                variant="outlined"
                hide-details
                clearable
                data-cy="more_help_info_link_text_area"
                model-value="description"
                class="text-style"
              ></v-textarea>
            </v-col>
          </v-row>
          <v-row class="mt-2" no-gutters>
            <v-col>
              <div class="d-flex align-center">
                <font-awesome-icon
                  icon="fa-solid fa-cloud-arrow-up"
                  size="xl"
                  color="#1A5A96"
                  class="mr-1 mt-2"
                />
                <v-col>
                  <v-file-input
                    style="width: 50%"
                    :prepend-icon="null"
                    show-size
                    counter
                    accept="image/*"
                    :label="
                      imagePlaceholder ? imagePlaceholder : 'Image Upload:'
                    "
                    class="file_upload_data-cy"
                    @change="selectImage"
                  ></v-file-input>
                </v-col>
              </div>
            </v-col>
          </v-row>
          <v-row class="mt-10">
            <v-col>
              <div class="d-flex flex-row justify-space-between align-end">
                <div>
                  <v-btn
                    class="mr-4 saveButtonWrapper"
                    data-cy="more_help_info_link_save_button"
                    @click="submit"
                  >
                    Save
                  </v-btn>
                  <v-btn
                    class="cancelButtonWrapper"
                    data-cy="more_help_info_link_cancel_button"
                    @click="onCloseDialog"
                  >
                    Cancel
                  </v-btn>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<style lang="scss" scoped>
.active:hover {
  text-decoration: underline !important;
  cursor: pointer !important;
}
.disabled {
  pointer-events: none !important;
}
.blueColorWrapper {
  text-align: left !important;
  font-style: normal !important;
  font-size: 18px !important;
  font-family: BCSans !important;
  font-weight: normal !important;
  letter-spacing: 0px !important;
  color: #1a5a96 !important;

  text-transform: capitalize !important;
}
.blackColorWrapper {
  text-align: left !important;
  text-decoration: underline !important;
  font-style: normal !important;
  font-size: 18px !important;
  font-family: BCSans !important;
  font-weight: normal !important;
  color: #313132 !important;
}

.v-label {
  text-align: left !important;
  text-decoration: none !important;
  font-style: normal !important;
  font-size: 16px !important;
  font-family: BCSans !important;
  font-weight: normal !important;
  color: #313132 !important;
}

.blackColorWrapper {
  text-align: left !important;
  text-decoration: underline !important;
  font-style: normal !important;
  font-family: BCSans !important;
  font-weight: normal !important;
  font-size: 18px !important;
  color: #313132 !important;
}

.v-text-field input {
  font-style: normal !important;
  font-family: BCSans !important;
  font-weight: normal !important;
  font-size: 18px !important;
  caret-color: #1a5a96 !important;
  letter-spacing: 0px !important;
  color: #1a5a96 !important;
  border-bottom: 1px solid #1a5a96 !important;
}
.text-style textarea {
  text-align: left !important;
  font-style: normal !important;
  font-family: BCSans !important;
  font-weight: normal !important;
  font-size: 18px !important;
  letter-spacing: 0px !important;
  caret-color: #1a5a96 !important;
  color: #1a5a96 !important;
}
.saveButtonWrapper {
  background: #003366 0% 0% no-repeat padding-box !important;
  border: 1px solid #707070;
  border-radius: 3px;
  font-style: normal !important;
  font-family: BCSans !important;
  font-weight: bold !important;
  font-size: 18px !important;
  letter-spacing: 0px !important;
  color: #f2f2f2;
  width: 117px;
  height: 36px;
  text-transform: capitalize;
}
.cancelButtonWrapper {
  border: 1px solid #003366 !important;
  background: #ffffff 0% 0% no-repeat padding-box !important;
  border-radius: 3px !important;
  font-style: normal !important;
  font-family: BCSans !important;
  font-weight: bold !important;
  font-size: 18px !important;
  letter-spacing: 0px !important;
  color: #38598a !important;
  width: 117px !important;
  height: 36px !important;
  text-transform: capitalize !important;
}
</style>
