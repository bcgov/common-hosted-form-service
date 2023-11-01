<script>
import { mapState, mapActions } from 'pinia';
import { i18n } from '~/internationalization';
import { useAdminStore } from '~/store/admin';
import { useFormStore } from '~/store/form';

export default {
  props: {
    showDialog: { type: Boolean, required: true },
    component: { type: Object, default: () => {} },
    componentName: { type: String, require: true, default: '' },
    groupName: { type: String, required: true },
  },
  emits: ['close-dialog'],
  data() {
    return {
      componentId: this?.component?.id ? this.component.id : undefined,
      componentName_: this?.component?.componentName
        ? this.component.componentName
        : this.componentName,
      description: this?.component?.description
        ? this.component.description
        : '',
      dialog: this.showDialog,
      files: [],
      isLinkEnabled: this?.component?.isLinkEnabled
        ? this.component.isLinkEnabled
        : '',
      image: '',
      imageSizeError: false,
      imageName: this?.component?.imageName ? this.component.imageName : '',
      imagePlaceholder: this?.component?.imageName
        ? this.component.imageName
        : undefined,
      linkError: false,
      moreHelpInfoLink: this?.component?.externalLink
        ? this.component.externalLink
        : '',
      rules: [
        (value) => {
          return (
            !value ||
            !value.length ||
            value[0].size < 500000 ||
            i18n.t('trans.proactiveHelpDialog.largeImgTxt')
          );
        },
      ],
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang']),
  },
  watch: {
    showDialog(value) {
      this.dialog = value;
    },
    componentName_(value) {
      this.componentName_ = value;
    },
  },
  methods: {
    ...mapActions(useAdminStore, ['addFCProactiveHelp']),
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
    async selectImage() {
      const img = this.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        this.image = e.target.result;
        this.imageName = img.name;
      };
      if (img) {
        await reader.readAsDataURL(img);
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
    },
  },
};
</script>

<template>
  <v-row justify="center" class="mb-5">
    <v-dialog
      v-model="dialog"
      scrollable
      width="70%"
      @click:outside="onCloseDialog"
    >
      <v-card :class="{ 'dir-rtl': isRTL }">
        <v-container>
          <v-row>
            <v-col>
              <span class="text-h5" style="font-weight: bold" :lang="lang">{{
                $t('trans.proactiveHelpDialog.componentInfoLink')
              }}</span>
            </v-col>
          </v-row>
          <v-row v-if="linkError">
            <v-col>
              <div
                style="margin: 0px; padding: 0px"
                class="text-red"
                :v-text="$t('trans.proactiveHelpDialog.learnMoreLinkTxt')"
                :lang="lang"
              />
            </v-col>
          </v-row>
          <v-row v-if="imageSizeError">
            <v-col>
              <div
                style="margin: 0px; padding: 0px"
                class="text-red"
                :v-text="$t('trans.proactiveHelpDialog.largeImgTxt')"
                :lang="lang"
              />
            </v-col>
          </v-row>

          <v-row class="mt-5" no-gutters>
            <span
              class="text-decoration-underline mr-2 blackColorWrapper"
              :lang="lang"
            >
              {{ $t('trans.proactiveHelpDialog.componentName') }}
            </span>
            <span class="blueColorWrapper" v-text="componentName_" />
          </v-row>
          <v-row class="mt-1" no-gutters>
            <v-col>
              <div class="d-flex flex-row align-center">
                <p
                  class="mr-2 mt-2 text-decoration-underline blueColorWrapper"
                  :lang="lang"
                >
                  {{ $t('trans.proactiveHelpDialog.learnMoreLink') }}
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
                    :class="{ 'dir-rtl': isRTL, label: isRTL }"
                  >
                  </v-text-field>
                </v-col>
                <v-checkbox v-model="isLinkEnabled" class="checkbox_data_cy">
                  <template #label>
                    <span class="v-label" :lang="lang">{{
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
            <v-col
              cols="12"
              sm="12"
              md="12"
              class="mb-2 blackColorWrapper"
              :class="{ 'dir-rtl': isRTL }"
            >
              <span :lang="lang">
                {{ $t('trans.proactiveHelpDialog.description') }}</span
              >
            </v-col>
            <v-col cols="12" sm="12" md="12">
              <v-textarea
                v-model="description"
                clear-icon="mdi-close-circle"
                variant="outlined"
                hide-details
                clearable
                data-cy="more_help_info_link_text_area"
                :model-value="description"
                class="text-style"
                :class="{ 'dir-rtl': isRTL, label: isRTL }"
              ></v-textarea>
            </v-col>
          </v-row>
          <v-row class="mt-2" no-gutters>
            <v-col>
              <div class="d-flex align-center">
                <v-icon
                  color="#1A5A96"
                  class="mr-1 mt-2"
                  size="x-large"
                  icon="mdi:mdi-upload"
                ></v-icon>
                <v-col>
                  <v-file-input
                    v-model="files"
                    :rules="rules"
                    style="width: 50%"
                    :prepend-icon="null"
                    show-size
                    counter
                    accept="image/*"
                    :label="
                      imagePlaceholder
                        ? imagePlaceholder
                        : $t('trans.proactiveHelpDialog.imageUpload')
                    "
                    class="file_upload_data-cy"
                    :lang="lang"
                    @update:model-value="selectImage"
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
                    :lang="lang"
                    @click="submit"
                  >
                    {{ $t('trans.proactiveHelpDialog.save') }}
                  </v-btn>
                  <v-btn
                    class="cancelButtonWrapper"
                    data-cy="more_help_info_link_cancel_button"
                    :lang="lang"
                    @click="onCloseDialog"
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
