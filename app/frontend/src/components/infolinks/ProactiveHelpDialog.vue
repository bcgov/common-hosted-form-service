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
              <span class="text-h5" style="font-weight: bold">{{
                $t('trans.proactiveHelpDialog.componentInfoLink')
              }}</span>
            </v-col>
          </v-row>
          <v-row v-if="linkError">
            <v-col>
              <div
                style="margin: 0px; padding: 0px"
                :v-text="$t('trans.proactiveHelpDialog.learnMoreLinkTxt')"
                class="red--text"
              />
            </v-col>
          </v-row>
          <v-row v-if="imageSizeError">
            <v-col>
              <div
                style="margin: 0px; padding: 0px"
                :v-text="$t('trans.proactiveHelpDialog.largeImgTxt')"
                class="red--text"
              />
            </v-col>
          </v-row>

          <v-row class="mt-5" no-gutters>
            <span class="text-decoration-underline mr-2 blackColorWrapper">
              {{ $t('trans.proactiveHelpDialog.componentName') }}
            </span>
            <span v-text="componentName_" class="blueColorWrapper" />
          </v-row>
          <v-row class="mt-1" no-gutters>
            <v-col>
              <div class="d-flex flex-row align-center">
                <p class="mr-2 mt-2 text-decoration-underline blueColorWrapper">
                  {{ $t('trans.proactiveHelpDialog.learnMoreLink') }}
                </p>
                <v-col cols="5">
                  <v-text-field
                    dense
                    enable
                    style="width: 100%"
                    v-model="moreHelpInfoLink"
                    flat
                    :disabled="!isLinkEnabled"
                    :value="moreHelpInfoLink"
                    data-cy="more_help_info_link_text_field"
                    class="text-style"
                    color="#1A5A96"
                  >
                    {{ moreHelpInfoLink }}
                  </v-text-field>
                </v-col>
                <v-checkbox v-model="isLinkEnabled" class="checkbox_data_cy">
                  <template v-slot:label>
                    <span class="v-label">{{
                      !isLinkEnabled
                        ? $t('trans.proactiveHelpDialog.clickToEnableLink')
                        : $t('trans.proactiveHelpDialog.clickToDisableLink')
                    }}</span>
                  </template>
                </v-checkbox>
              </div>
            </v-col>
          </v-row>

          <v-row no-gutters>
            <v-col cols="12" sm="12" md="12" class="mb-2 blackColorWrapper">
              {{ $t('trans.proactiveHelpDialog.description') }}
            </v-col>
            <v-col cols="12" sm="12" md="12">
              <v-textarea
                clear-icon="mdi-close-circle"
                v-model="description"
                outlined
                hide-details
                clearable
                data-cy="more_help_info_link_text_area"
                value="description"
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
                      imagePlaceholder
                        ? imagePlaceholder
                        : this.$t('trans.proactiveHelpDialog.imageUpload')
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
                    @click="submit"
                    data-cy="more_help_info_link_save_button"
                  >
                    {{ $t('trans.proactiveHelpDialog.save') }}
                  </v-btn>
                  <v-btn
                    class="cancelButtonWrapper"
                    @click="onCloseDialog"
                    data-cy="more_help_info_link_cancel_button"
                  >
                    {{ $t('trans.proactiveHelpDialog.cancel') }}
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

<script>
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
library.add(faCloudArrowUp);

import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'ProactiveHelpDialog',
  data() {
    return {
      errors: [],
      componentName_:
        this.component && this.component.componentName
          ? this.component.componentName
          : this.componentName,
      description:
        this.component && this.component.description
          ? this.component.description
          : '',
      moreHelpInfoLink:
        this.component && this.component.externalLink
          ? this.component.externalLink
          : '',
      isLinkEnabled:
        this.component && this.component.isLinkEnabled
          ? this.component.isLinkEnabled
          : false,
      dialog: this.showDialog,
      color1: '#1A5A96',
      image: '',
      imageSizeError: false,
      componentId:
        this.component && this.component.id ? this.component.id : undefined,
      imageName:
        this.component && this.component.imageName
          ? this.component.imageName
          : '',
      imagePlaceholder:
        this.component && this.component.imageName
          ? this.component.imageName
          : undefined,
      linkError: false,
    };
  },
  props: {
    showDialog: { type: Boolean, required: true },
    component: { type: Object },
    componentName: { type: String, require: true, default: '' },
    groupName: { type: String, require: true },
  },
  methods: {
    ...mapActions('admin', [
      'addFCProactiveHelp',
      'uploadFCProactiveHelpImage',
      'getEachFCProactiveHelpVersion',
    ]),
    onCloseDialog() {
      this.resetDialog();
      this.$emit('close-dialog');
    },
    validateLinkUrl() {
      let error = false;
      this.linkError = false;
      if (this.isLinkEnabled && this.moreHelpInfoLink === '') {
        error = true;
        this.linkError = true;
      }
      return error;
    },
    async selectImage(image) {
      this.imageSizeError = false;
      if (image.size > 500000) {
        this.imageSizeError = true;
      } else {
        const reader = new FileReader();
        reader.onload = async (e) => {
          this.image = e.target.result;
          this.imageName = image.name;
        };
        if (image) {
          await reader.readAsDataURL(image);
        }
      }
    },
    submit() {
      if (!this.validateLinkUrl()) {
        this.imageName = this.image !== '' ? this.imageName : '';
        this.moreHelpInfoLink = !this.isLinkEnabled
          ? ''
          : this.moreHelpInfoLink;
        this.addFCProactiveHelp({
          componentId: this.componentId,
          componentName: this.componentName_,
          image: this.image,
          externalLink: this.moreHelpInfoLink,
          groupName: this.groupName,
          description: this.description,
          status:
            this.component && this.component.status
              ? this.component.status
              : false,
          isLinkEnabled: this.isLinkEnabled,
          imageName: this.imageName,
        });
        this.onCloseDialog();
      }
    },
    resetDialog() {
      this.componentName_ = '';
      this.moreHelpInfoLink = '';
      this.isLinkEnabled = false;
      this.image = '';
      this.imageName = '';
      this.imagePlaceholder = undefined;
      this.linkError = false;
      this.description = '';
      this.link = '';
    },
  },
  watch: {
    showDialog() {
      this.dialog = this.showDialog;
    },
    componentName() {
      this.componentName_ = this.componentName;
    },
  },
  computed: {
    ...mapGetters('admin', ['fcHelpInfoImageUpload', 'fcProactiveHelpVersion']),
  },
};
</script>
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
