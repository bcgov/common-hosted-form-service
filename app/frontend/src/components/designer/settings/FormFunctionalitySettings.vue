<script>
import { mapState, mapWritableState } from 'pinia';
import BasePanel from '~/components/base/BasePanel.vue';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { IdentityMode, IdentityProviders } from '~/utils/constants';

export default {
  components: {
    BasePanel,
  },
  data() {
    return {
      githubLinkBulkUpload:
        'https://github.com/bcgov/common-hosted-form-service/wiki/Allow-multiple-draft-upload',
      githubLinkCopyFromExistingFeature:
        'https://github.com/bcgov/common-hosted-form-service/wiki/Copy-an-existing-submission',
      githubLinkScheduleAndReminderFeature:
        'https://github.com/bcgov/common-hosted-form-service/wiki/Schedule-and-Reminder-notification',
      githubLinkEventSubscriptionFeature:
        'https://github.com/bcgov/common-hosted-form-service/wiki/Event-Subscription',
    };
  },
  computed: {
    ...mapState(useAuthStore, ['identityProvider']),
    ...mapState(useFormStore, ['isFormPublished', 'isRTL', 'lang']),
    ...mapWritableState(useFormStore, ['form']),
    ID_MODE() {
      return IdentityMode;
    },
    idirUser() {
      return this.identityProvider === IdentityProviders.IDIR;
    },
  },
  methods: {
    enableSubmitterDraftChanged() {
      if (!this.form.enableSubmitterChanged) {
        this.form.allowSubmitterToUploadFile = false;
      }
    },
    allowSubmitterToUploadFileChanged() {
      if (
        this.form.allowSubmitterToUploadFile &&
        !this.form.enableSubmitterDraft
      ) {
        this.form.enableSubmitterDraft = true;
      }
    },
  },
};
</script>

<template>
  <BasePanel class="fill-height">
    <template #title
      ><span :lang="lang">{{
        $t('trans.formSettings.formFunctionality')
      }}</span></template
    >
    <v-checkbox
      v-model="form.enableSubmitterDraft"
      hide-details="auto"
      class="my-0"
      :disabled="form.userType === ID_MODE.PUBLIC"
      @update:model-value="enableSubmitterDraftChanged"
    >
      <template #label>
        <span
          :class="{ 'mr-2': isRTL }"
          :lang="lang"
          v-html="$t('trans.formSettings.canSaveAndEditDraftLabel')"
        ></span>
      </template>
    </v-checkbox>

    <v-checkbox
      v-model="form.enableStatusUpdates"
      hide-details="auto"
      class="my-0"
    >
      <template #label>
        <span
          :class="{ 'mr-2': isRTL }"
          :lang="lang"
          v-html="$t('trans.formSettings.canUpdateStatusAsReviewer')"
        ></span>
      </template>
    </v-checkbox>

    <v-checkbox
      v-model="form.allowSubmitterToUploadFile"
      hide-details="auto"
      class="my-0"
      :disabled="form.userType === ID_MODE.PUBLIC"
      @update:model-value="allowSubmitterToUploadFileChanged"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span
            :lang="lang"
            v-html="$t('trans.formSettings.allowMultiDraft')"
          />
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="{ props }">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="props"
                icon="mdi:mdi-flask"
              />
            </template>
            <span :lang="lang"
              >{{ $t('trans.formSettings.experimental') }}
              <a
                :href="githubLinkBulkUpload"
                class="preview_info_link_field_white"
                :target="'_blank'"
                :hreflang="lang"
              >
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon
                  icon="mdi:mdi-arrow-top-right-bold-box-outline"
                ></v-icon></a
            ></span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-checkbox
      v-if="!isFormPublished"
      v-model="form.schedule.enabled"
      disabled
      hide-details="auto"
      class="my-0"
    >
      <template #label>
        <span :class="{ 'mr-2': isRTL }" :lang="lang"
          >{{ $t('trans.formSettings.formSubmissinScheduleMsg') }}
        </span>
      </template>
    </v-checkbox>

    <v-checkbox
      v-if="isFormPublished"
      v-model="form.schedule.enabled"
      hide-details="auto"
      class="my-0"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span :lang="lang">{{
            $t('trans.formSettings.formSubmissionsSchedule')
          }}</span>
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="{ props }">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="props"
                icon="mdi:mdi-flask"
              ></v-icon>
            </template>
            <span :lang="lang"
              >{{ $t('trans.formSettings.experimental') }}
              <a
                :href="githubLinkScheduleAndReminderFeature"
                class="preview_info_link_field_white"
                :target="'_blank'"
                :hreflang="lang"
              >
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon
                  icon="mdi:mdi-arrow-top-right-bold-box-outline"
                ></v-icon></a
            ></span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>

    <v-checkbox
      v-model="form.enableCopyExistingSubmission"
      hide-details="auto"
      class="my-0"
      :disabled="form.userType === ID_MODE.PUBLIC"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span
            style="max-width: 80%"
            :lang="lang"
            v-html="$t('trans.formSettings.submitterCanCopyExistingSubmissn')"
          />
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="{ props }">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="props"
                icon="mdi:mdi-flask"
              ></v-icon>
            </template>
            <span :lang="lang"
              >{{ $t('trans.formSettings.experimental') }}
              <a
                :href="githubLinkCopyFromExistingFeature"
                class="preview_info_link_field_white"
                :target="'_blank'"
                :hreflang="lang"
              >
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon
                  icon="mdi:mdi-arrow-top-right-bold-box-outline"
                ></v-icon></a
            ></span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>
    <v-checkbox
      v-model="form.subscribe.enabled"
      hide-details="auto"
      class="my-0"
      :disabled="idirUser === false || !isFormPublished"
    >
      <template #label>
        <div :class="{ 'mr-2': isRTL }">
          <span
            style="max-width: 80%"
            :lang="lang"
            v-html="$t('trans.formSettings.allowEventSubscription')"
          />
          <v-tooltip location="bottom" close-delay="2500">
            <template #activator="{ props }">
              <v-icon
                color="primary"
                class="ml-3"
                :class="{ 'mr-2': isRTL }"
                v-bind="props"
                icon="mdi:mdi-flask"
              ></v-icon>
            </template>
            <span :lang="lang"
              >{{ $t('trans.formSettings.experimental') }}
              <a
                :href="githubLinkEventSubscriptionFeature"
                class="preview_info_link_field_white"
                :target="'_blank'"
                :hreflang="lang"
              >
                {{ $t('trans.formSettings.learnMore') }}
                <v-icon
                  icon="mdi:mdi-arrow-top-right-bold-box-outline"
                ></v-icon></a
            ></span>
          </v-tooltip>
        </div>
      </template>
    </v-checkbox>
  </BasePanel>
</template>
