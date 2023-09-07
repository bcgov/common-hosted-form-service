<template>
  <v-container class="px-0" :class="{ 'dir-rtl': isRTL }">
    <v-row>
      <v-col cols="12" md="6">
        <BasePanel class="fill-height">
          <template #title
            ><span :lang="lang"
              >{{ $t('trans.formSettings.formTitle') }}
            </span></template
          >
          <v-text-field
            dense
            flat
            solid
            outlined
            :label="$t('trans.formSettings.formTitle')"
            data-test="text-name"
            v-model="name"
            :rules="nameRules"
            :lang="lang"
          />

          <v-text-field
            dense
            flat
            solid
            outlined
            :label="$t('trans.formSettings.formDescription')"
            data-test="text-description"
            v-model="description"
            :rules="descriptionRules"
            :lang="lang"
          />
        </BasePanel>
      </v-col>

      <v-col cols="12" md="6">
        <BasePanel class="fill-height">
          <template #title>
            <span :lang="lang">
              {{ $t('trans.formSettings.formAccess') }}
            </span></template
          >
          <v-radio-group
            class="my-0"
            v-model="userType"
            :mandatory="false"
            :rules="loginRequiredRules"
            @change="userTypeChanged"
          >
            <v-radio
              class="mb-4"
              :class="{ 'dir-rtl': isRTL }"
              :value="ID_MODE.PUBLIC"
            >
              <template #label>
                <span :class="{ 'mr-2': isRTL }" :lang="lang">
                  {{ $t('trans.formSettings.public') }}
                </span>
              </template>
            </v-radio>

            <v-expand-transition>
              <BaseInfoCard
                v-if="userType == ID_MODE.PUBLIC"
                class="mr-4 mb-3"
                :class="{ 'dir-rtl': isRTL }"
              >
                <h4 class="primary--text" :lang="lang">
                  <v-icon class="mr-1" color="primary">info</v-icon
                  >{{ $t('trans.formSettings.important') }}!
                </h4>
                <p class="mt-2 mb-0" :lang="lang">
                  {{ $t('trans.formSettings.info') }}
                  <a
                    href="https://engage.gov.bc.ca/govtogetherbc/"
                    target="_blank"
                  >
                    govTogetherBC.
                    <v-icon small color="primary">open_in_new</v-icon>
                  </a>
                </p>
              </BaseInfoCard>
            </v-expand-transition>
            <v-radio class="mb-4" value="login">
              <template #label>
                <span :class="{ 'mr-2': isRTL }" :lang="lang">
                  {{ $t('trans.formSettings.loginRequired') }}
                </span>
              </template>
            </v-radio>
            <v-expand-transition>
              <v-row v-if="userType === ID_MODE.LOGIN" class="pl-6">
                <v-radio-group class="my-0" v-model="idps[0]">
                  <v-radio class="mx-2" :value="ID_PROVIDERS.IDIR">
                    <template #label>
                      <span :class="{ 'mr-2': isRTL }"> IDIR </span>
                    </template>
                  </v-radio>
                  <v-radio class="mx-2" :value="ID_PROVIDERS.BCEIDBASIC">
                    <template #label>
                      <span :class="{ 'mr-2': isRTL }"> Basic BCeID </span>
                    </template>
                  </v-radio>
                  <v-radio class="mx-2" :value="ID_PROVIDERS.BCEIDBUSINESS">
                    <template #label>
                      <span :class="{ 'mr-2': isRTL }"> Business BCeID </span>
                    </template>
                  </v-radio>
                  <!-- Mandatory BCeID process notification -->
                  <v-expand-transition>
                    <BaseInfoCard
                      v-if="
                        idps[0] &&
                        [
                          ID_PROVIDERS.BCEIDBASIC,
                          ID_PROVIDERS.BCEIDBUSINESS,
                        ].includes(idps[0])
                      "
                      class="mr-4"
                      :class="{ 'dir-rtl': isRTL }"
                    >
                      <h4 class="primary--text" :lang="lang">
                        <v-icon class="mr-1" color="primary">info</v-icon
                        >{{ $t('trans.formSettings.important') }}!
                      </h4>
                      <p class="my-2" :lang="lang">
                        {{ $t('trans.formSettings.idimNotifyA') }} (<a
                          href="mailto:IDIM.Consulting@gov.bc.ca"
                          >IDIM.Consulting@gov.bc.ca</a
                        >) {{ $t('trans.formSettings.idimNotifyB') }}
                      </p>
                      <p class="mt-2 mb-0" :lang="lang">
                        {{ $t('trans.formSettings.referenceGuideA') }}
                        <a
                          href="https://github.com/bcgov/common-hosted-form-service/wiki/Accessing-forms#Notify-the-idim-team-if-you-are-using-bceid"
                          :hreflang="lang"
                          >{{ $t('trans.formSettings.referenceGuideB') }}</a
                        >
                        {{ $t('trans.formSettings.referenceGuideC') }}.
                      </p>
                    </BaseInfoCard>
                  </v-expand-transition>
                </v-radio-group>
              </v-row>
            </v-expand-transition>
            <v-radio value="team">
              <template #label>
                <span :class="{ 'mr-2': isRTL }" :lang="lang">
                  {{ $t('trans.formSettings.specificTeamMembers') }}
                </span>
              </template>
            </v-radio>
          </v-radio-group>
        </BasePanel>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <BasePanel class="fill-height">
          <template #title
            ><span :lang="lang">{{
              $t('trans.formSettings.formFunctionality')
            }}</span></template
          >
          <v-checkbox
            class="my-0"
            @change="enableSubmitterDraftChanged"
            v-model="enableSubmitterDraft"
            :disabled="userType === ID_MODE.PUBLIC"
          >
            <template #label>
              <span
                :class="{ 'mr-2': isRTL }"
                v-html="$t('trans.formSettings.canSaveAndEditDraftLabel')"
                :lang="lang"
              />
            </template>
          </v-checkbox>

          <v-checkbox class="my-0" v-model="enableStatusUpdates">
            <template #label>
              <span
                :class="{ 'mr-2': isRTL }"
                v-html="$t('trans.formSettings.canUpdateStatusAsReviewer')"
                :lang="lang"
              />
            </template>
          </v-checkbox>

          <v-checkbox
            @change="allowSubmitterToUploadFileChanged"
            class="my-0"
            v-model="allowSubmitterToUploadFile"
            :disabled="userType === ID_MODE.PUBLIC"
          >
            <template #label>
              <div :class="{ 'mr-2': isRTL }">
                <span
                  v-html="$t('trans.formSettings.allowMultiDraft')"
                  :lang="lang"
                />
                <v-tooltip close-delay="3000" bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <font-awesome-icon
                      icon="fa-solid fa-flask"
                      color="primary"
                      class="ml-3"
                      v-bind="attrs"
                      v-on="on"
                      :class="{ 'mr-2': isRTL }"
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
                      <font-awesome-icon
                        icon="fa-solid fa-square-arrow-up-right"
                    /></a>
                  </span>
                </v-tooltip>
              </div>
            </template>
          </v-checkbox>

          <v-checkbox v-if="!isFormPublished" disabled class="my-0">
            <template #label>
              <span :class="{ 'mr-2': isRTL }" :lang="lang"
                >{{ $t('trans.formSettings.formSubmissinScheduleMsg') }}
              </span>
            </template>
          </v-checkbox>

          <v-checkbox
            v-if="isFormPublished"
            class="my-0"
            v-model="schedule.enabled"
          >
            <template #label>
              <div :class="{ 'mr-2': isRTL }">
                <span :lang="lang">{{
                  $t('trans.formSettings.formSubmissionsSchedule')
                }}</span>
                <v-tooltip bottom close-delay="2500">
                  <template v-slot:activator="{ on, attrs }">
                    <font-awesome-icon
                      icon="fa-solid fa-flask"
                      color="primary"
                      class="ml-3"
                      :class="{ 'mr-2': isRTL }"
                      v-bind="attrs"
                      v-on="on"
                    />
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
                      <font-awesome-icon
                        icon="fa-solid fa-square-arrow-up-right" /></a
                  ></span>
                </v-tooltip>
              </div>
            </template>
          </v-checkbox>

          <v-checkbox
            class="my-0"
            v-model="enableCopyExistingSubmission"
            :disabled="userType === ID_MODE.PUBLIC"
          >
            <template #label>
              <div :class="{ 'mr-2': isRTL }">
                <span
                  style="max-width: 80%"
                  v-html="
                    $t('trans.formSettings.submitterCanCopyExistingSubmissn')
                  "
                  :lang="lang"
                />
                <v-tooltip bottom close-delay="2500">
                  <template v-slot:activator="{ on, attrs }">
                    <font-awesome-icon
                      icon="fa-solid fa-flask"
                      color="primary"
                      class="ml-3"
                      :class="{ 'mr-2': isRTL }"
                      v-bind="attrs"
                      v-on="on"
                    />
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
                      <font-awesome-icon
                        icon="fa-solid fa-square-arrow-up-right" /></a
                  ></span>
                </v-tooltip>
              </div>
            </template>
          </v-checkbox>
          <v-checkbox
            class="my-0"
            v-model="subscribe.enabled"
            :disabled="idirUser === false || !isFormPublished"
          >
            <template #label>
              <div :class="{ 'mr-2': isRTL }">
                <span
                  style="max-width: 80%"
                  v-html="$t('trans.formSettings.allowEventSubscription')"
                  :lang="lang"
                />
                <v-tooltip bottom close-delay="2500">
                  <template v-slot:activator="{ on, attrs }">
                    <font-awesome-icon
                      icon="fa-solid fa-flask"
                      color="primary"
                      class="ml-3"
                      :class="{ 'mr-2': isRTL }"
                      v-bind="attrs"
                      v-on="on"
                    />
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
                      <font-awesome-icon
                        icon="fa-solid fa-square-arrow-up-right" /></a
                  ></span>
                </v-tooltip>
              </div>
            </template>
          </v-checkbox>
        </BasePanel>
      </v-col>

      <v-col cols="12" md="6">
        <BasePanel class="fill-height">
          <template #title
            ><span :lang="lang">
              {{ $t('trans.formSettings.afterSubmission') }}
            </span></template
          >
          <v-checkbox
            class="my-0"
            v-model="showSubmissionConfirmation"
            :class="{ 'dir-rtl': isRTL }"
          >
            <template #label>
              <div :class="{ 'mr-2': isRTL }">
                <span :lang="lang">
                  {{ $t('trans.formSettings.submissionConfirmation') }}</span
                >

                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon
                      color="primary"
                      class="ml-3"
                      v-bind="attrs"
                      v-on="on"
                      :class="{ 'mr-2': isRTL }"
                    >
                      help_outline
                    </v-icon>
                  </template>
                  <span>
                    <span
                      v-html="
                        $t('trans.formSettings.submissionConfirmationToolTip')
                      "
                      :lang="lang"
                    />
                    <ul>
                      <li :lang="lang">
                        {{ $t('trans.formSettings.theConfirmationID') }}
                      </li>
                      <li :lang="lang">
                        {{ $t('trans.formSettings.infoB') }}
                      </li>
                    </ul>
                  </span>
                </v-tooltip>
              </div>
            </template>
          </v-checkbox>

          <v-checkbox class="my-0" v-model="sendSubRecieviedEmail">
            <template #label>
              <div :class="{ 'mr-2': isRTL }">
                <span :lang="lang">
                  {{ $t('trans.formSettings.emailNotificatnToTeam') }}</span
                >

                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon
                      color="primary"
                      class="ml-3"
                      v-bind="attrs"
                      v-on="on"
                      :class="{ 'mr-2': isRTL }"
                    >
                      help_outline
                    </v-icon>
                  </template>
                  <span :lang="lang">
                    {{ $t('trans.formSettings.emailNotificatnToTeamToolTip') }}
                  </span>
                </v-tooltip>
              </div>
            </template>
          </v-checkbox>

          <v-combobox
            v-if="sendSubRecieviedEmail"
            v-model="submissionReceivedEmails"
            :rules="emailArrayRules"
            dense
            flat
            solid
            outlined
            hide-selected
            clearable
            :hint="$t('trans.formSettings.addMoreValidEmailAddrs')"
            :label="$t('trans.formSettings.notificationEmailAddrs')"
            multiple
            small-chips
            deletable-chips
            :delimiters="[' ', ',']"
            append-icon=""
            :lang="lang"
          >
            <template v-slot:no-data>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    <span
                      v-html="$t('trans.formSettings.pressToAddMultiEmail')"
                      :lang="lang"
                    />
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-combobox>
        </BasePanel>
      </v-col>

      <v-expand-transition>
        <v-col cols="12" md="6" v-if="schedule.enabled && isFormPublished">
          <BasePanel class="fill-height">
            <template #title
              ><span :lang="lang">
                {{ $t('trans.formSettings.formScheduleSettings') }}</span
              ></template
            >
            <v-row class="m-0">
              <v-col cols="8" md="8" class="pl-0 pr-0 pb-0">
                <v-menu
                  v-model="openSubmissionDateDraw"
                  data-test="menu-form-openSubmissionDateDraw"
                  :close-on-content-click="false"
                  :nudge-right="40"
                  transition="scale-transition"
                  offset-y
                  min-width="290px"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field
                      v-model="schedule.openSubmissionDateTime"
                      :placeholder="$t('trans.date.date')"
                      v-on:click:append="openSubmissionDateDraw = true"
                      :label="$t('trans.formSettings.opensubmissions')"
                      v-on="on"
                      dense
                      outlined
                      :lang="lang"
                      :rules="scheduleOpenDate"
                    >
                      <template v-if="isRTL" #prepend-inner>
                        <v-icon>event</v-icon>
                      </template>
                      <template v-if="!isRTL" #append>
                        <v-icon>event</v-icon>
                      </template>
                    </v-text-field>
                  </template>
                  <v-date-picker
                    @change="openDateTypeChanged"
                    :class="{ 'mr-2': isRTL }"
                    v-model="schedule.openSubmissionDateTime"
                    data-test="picker-form-openSubmissionDateDraw"
                    @input="openSubmissionDateDraw = false"
                  >
                  </v-date-picker>
                </v-menu>
              </v-col>

              <v-col cols="12" md="12" class="p-0">
                <template>
                  <p class="font-weight-black" :lang="lang">
                    {{ $t('trans.formSettings.submissionsDeadline') }}
                  </p>
                </template>
                <v-expand-transition>
                  <v-row>
                    <v-radio-group
                      class="my-0"
                      v-model="schedule.scheduleType"
                      :rules="scheduleTypedRules"
                      @change="scheduleTypeChanged"
                    >
                      <v-radio
                        class="mx-2"
                        :class="{ 'mr-2': isRTL }"
                        :value="SCHEDULE_TYPE.MANUAL"
                      >
                        <template #label>
                          <span :class="{ 'mr-2': isRTL }" :lang="lang"
                            >{{
                              $t(
                                'trans.formSettings.keepSubmissnOpenTilUnplished'
                              )
                            }}
                          </span>
                        </template>
                      </v-radio>
                      <v-radio
                        class="mx-2"
                        :class="{ 'mr-2': isRTL }"
                        :value="SCHEDULE_TYPE.CLOSINGDATE"
                      >
                        <template #label>
                          <span :class="{ 'mr-2': isRTL }" :lang="lang"
                            >{{
                              $t('trans.formSettings.submissionsClosingDate')
                            }}
                          </span>
                        </template>
                      </v-radio>
                      <v-radio
                        class="mx-2"
                        :class="{ 'mr-2': isRTL }"
                        :value="SCHEDULE_TYPE.PERIOD"
                      >
                        <template #label>
                          <span :class="{ 'mr-2': isRTL }" :lang="lang"
                            >{{ $t('trans.formSettings.submissionPeriod') }}
                          </span>
                        </template>
                      </v-radio>
                    </v-radio-group>
                  </v-row>
                </v-expand-transition>
              </v-col>

              <v-col
                cols="8"
                md="8"
                class="pl-0 pr-0 pb-0"
                v-if="schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE"
              >
                <v-menu
                  v-model="closeSubmissionDateDraw"
                  data-test="menu-form-closeSubmissionDateDraw"
                  :close-on-content-click="false"
                  :nudge-right="40"
                  transition="scale-transition"
                  offset-y
                  min-width="290px"
                >
                  <template v-slot:activator="{ on }">
                    <v-text-field
                      v-model="schedule.closeSubmissionDateTime"
                      :placeholder="$t('trans.date.date')"
                      v-on:click:append="closeSubmissionDateDraw = true"
                      :label="$t('trans.formSettings.closeSubmissions')"
                      v-on="on"
                      dense
                      outlined
                      :rules="scheduleCloseDate"
                      :class="{ 'dir-rtl': isRTL }"
                      :lang="lang"
                    >
                      <template v-if="isRTL" #prepend-inner>
                        <v-icon>event</v-icon>
                      </template>
                      <template v-if="!isRTL" #append>
                        <v-icon>event</v-icon>
                      </template>
                    </v-text-field>
                  </template>
                  <v-date-picker
                    v-model="schedule.closeSubmissionDateTime"
                    data-test="picker-form-closeSubmissionDateDraw"
                    @input="closeSubmissionDateDraw = false"
                  >
                  </v-date-picker>
                </v-menu>
              </v-col>

              <v-col
                cols="4"
                md="4"
                class="pl-0 pr-0 pb-0"
                v-if="schedule.scheduleType === SCHEDULE_TYPE.PERIOD"
              >
                <v-text-field
                  :label="$t('trans.formSettings.keepOpenFor')"
                  value="0"
                  type="number"
                  dense
                  flat
                  solid
                  outlined
                  v-model="schedule.keepOpenForTerm"
                  class="m-0 p-0"
                  :rules="roundNumber"
                  :class="{ 'dir-rtl': isRTL }"
                  :lang="lang"
                />
              </v-col>

              <v-col
                cols="4"
                md="4"
                class="pl-0 pr-0 pb-0"
                v-if="schedule.scheduleType === SCHEDULE_TYPE.PERIOD"
              >
                <v-select
                  :items="['days', 'weeks', 'months', 'quarters', 'years']"
                  :label="$t('trans.formSettings.period')"
                  dense
                  flat
                  solid
                  outlined
                  class="mr-2 pl-2"
                  v-model="schedule.keepOpenForInterval"
                  :rules="intervalType"
                  :lang="lang"
                />
              </v-col>
            </v-row>

            <v-checkbox
              class="my-0 m-0 p-0"
              v-model="schedule.allowLateSubmissions.enabled"
              v-if="
                [SCHEDULE_TYPE.CLOSINGDATE, SCHEDULE_TYPE.PERIOD].includes(
                  schedule.scheduleType
                )
              "
              :rules="allowLateSubmissionRule"
            >
              <template #label>
                <div :class="{ 'mr-2': isRTL }">
                  <span :lang="lang">
                    {{ $t('trans.formSettings.allowLateSubmissions') }}
                  </span>
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-icon
                        color="primary"
                        class="ml-3"
                        v-bind="attrs"
                        v-on="on"
                        :class="{ 'mr-2': isRTL }"
                      >
                        help_outline
                      </v-icon>
                    </template>
                    <span :lang="lang">
                      {{ $t('trans.formSettings.allowLateSubmissionsInfoTip') }}
                    </span>
                  </v-tooltip>
                </div>
              </template>
            </v-checkbox>

            <v-expand-transition
              v-if="
                schedule.allowLateSubmissions.enabled &&
                [SCHEDULE_TYPE.CLOSINGDATE, SCHEDULE_TYPE.PERIOD].includes(
                  schedule.scheduleType
                )
              "
              class="pl-3"
            >
              <v-row class="m-0">
                <v-col cols="4" md="4" class="m-0 p-0">
                  <v-text-field
                    :label="$t('trans.formSettings.afterCloseDateFor')"
                    value="0"
                    type="number"
                    dense
                    flat
                    solid
                    outlined
                    v-model="schedule.allowLateSubmissions.forNext.term"
                    class="m-0 p-0"
                    :rules="roundNumber"
                    :class="{ 'dir-rtl': isRTL }"
                    :lang="lang"
                  />
                </v-col>
                <v-col cols="4" md="4" class="m-0 p-0">
                  <v-select
                    :items="['days', 'weeks', 'months', 'quarters', 'years']"
                    :label="$t('trans.formSettings.period')"
                    dense
                    flat
                    solid
                    outlined
                    class="mr-1 pl-2"
                    v-model="schedule.allowLateSubmissions.forNext.intervalType"
                    :rules="intervalType"
                    :lang="lang"
                  />
                </v-col>
              </v-row>
            </v-expand-transition>

            <v-checkbox
              class="my-0 pt-0"
              @change="repeatSubmissionChanged"
              v-model="schedule.repeatSubmission.enabled"
              v-if="schedule.scheduleType === SCHEDULE_TYPE.PERIOD"
            >
              <template #label>
                <span :class="{ 'mr-2': isRTL }" :lang="lang">
                  {{ $t('trans.formSettings.repeatPeriod') }}
                </span>
              </template>
            </v-checkbox>

            <v-expand-transition
              v-if="
                schedule.scheduleType === SCHEDULE_TYPE.PERIOD &&
                schedule.repeatSubmission.enabled
              "
            >
              <v-row class="m-0">
                <v-col cols="4" class="m-0 p-0">
                  <v-text-field
                    :label="$t('trans.formSettings.every')"
                    value="0"
                    type="number"
                    dense
                    flat
                    solid
                    outlined
                    v-model="schedule.repeatSubmission.everyTerm"
                    class="m-0 p-0"
                    :rules="repeatTerm"
                    :class="{ 'dir-rtl': isRTL, label: isRTL }"
                    :lang="lang"
                  />
                </v-col>

                <v-col cols="4" class="m-0 p-0">
                  <v-select
                    :items="AVAILABLE_PERIOD_OPTIONS"
                    dense
                    flat
                    solid
                    outlined
                    class="mr-2 pl-2"
                    v-model="schedule.repeatSubmission.everyIntervalType"
                    :rules="repeatIntervalType"
                    :label="$t('trans.formSettings.period')"
                    :lang="lang"
                  />
                </v-col>

                <v-col cols="4" class="m-0 p-0">
                  <v-menu
                    v-model="repeatUntil"
                    data-test="menu-form-repeatUntil"
                    :close-on-content-click="false"
                    :nudge-right="40"
                    transition="scale-transition"
                    offset-y
                    min-width="290px"
                  >
                    <template v-slot:activator="{ on }">
                      <v-text-field
                        v-model="schedule.repeatSubmission.repeatUntil"
                        :placeholder="$t('trans.date.date')"
                        append-icon="event"
                        v-on:click:append="repeatUntil = true"
                        v-on="on"
                        dense
                        outlined
                        :rules="repeatUntilDate"
                        :label="$t('trans.formSettings.repeatUntil')"
                        :class="{ 'dir-rtl': isRTL, label: isRTL }"
                        :lang="lang"
                      />
                    </template>
                    <v-date-picker
                      v-model="schedule.repeatSubmission.repeatUntil"
                      data-test="picker-form-repeatUntil"
                      @input="repeatUntil = false"
                    ></v-date-picker>
                  </v-menu>
                </v-col>
              </v-row>
            </v-expand-transition>

            <v-row
              class="p-0 m-0"
              v-if="
                schedule.enabled &&
                schedule.openSubmissionDateTime &&
                schedule.openSubmissionDateTime.length &&
                (schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE
                  ? schedule.closeSubmissionDateTime &&
                    schedule.closeSubmissionDateTime.length
                  : true) &&
                [SCHEDULE_TYPE.CLOSINGDATE, SCHEDULE_TYPE.PERIOD].includes(
                  schedule.scheduleType
                )
              "
            >
              <v-col class="p-0 m-0" cols="12" md="12"
                ><template>
                  <p class="font-weight-black m-0" :lang="lang">
                    {{ $t('trans.formSettings.summary') }}
                  </p>
                </template></v-col
              >

              <v-col
                class="p-0 m-0"
                cols="12"
                md="12"
                v-if="
                  schedule.openSubmissionDateTime &&
                  schedule.openSubmissionDateTime.length
                "
              >
                <span :lang="lang">
                  {{ $t('trans.formSettings.submissionsOpenDateRange') }}
                  <b :lang="lang">{{ schedule.openSubmissionDateTime }}</b>
                  {{ $t('trans.formSettings.to') }}
                  <b>
                    {{
                      schedule.scheduleType === SCHEDULE_TYPE.PERIOD
                        ? AVAILABLE_DATES &&
                          AVAILABLE_DATES[0] &&
                          AVAILABLE_DATES[0]['closeDate'] &&
                          AVAILABLE_DATES[0]['closeDate'].split(' ')[0]
                        : ''
                    }}

                    {{
                      schedule.scheduleType === SCHEDULE_TYPE.CLOSINGDATE
                        ? schedule.closeSubmissionDateTime
                        : ''
                    }}
                  </b>
                </span>
                <span :lang="lang">{{
                  schedule.allowLateSubmissions.enabled &&
                  schedule.allowLateSubmissions.forNext.intervalType &&
                  schedule.allowLateSubmissions.forNext.term
                    ? $t('trans.formSettings.allowLateSubmissnInterval') +
                      schedule.allowLateSubmissions.forNext.term +
                      ' ' +
                      schedule.allowLateSubmissions.forNext.intervalType +
                      '.'
                    : '.'
                }}</span>
                <span
                  v-if="
                    schedule.scheduleType === SCHEDULE_TYPE.PERIOD &&
                    schedule.repeatSubmission.enabled === true &&
                    schedule.repeatSubmission.everyTerm &&
                    schedule.repeatSubmission.repeatUntil &&
                    schedule.repeatSubmission.everyIntervalType &&
                    AVAILABLE_DATES[1]
                  "
                  :lang="lang"
                  >{{ $t('trans.formSettings.scheduleRepetition') }}
                  <b>{{ schedule.repeatSubmission.everyTerm }} </b>
                  <b>{{ schedule.repeatSubmission.everyIntervalType }}</b>
                  {{ $t('trans.formSettings.until') }}
                  <b>{{ schedule.repeatSubmission.repeatUntil }}</b
                  >.
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                      <v-icon
                        color="primary"
                        class="ml-3"
                        v-bind="attrs"
                        v-on="on"
                        :class="{ 'mr-2': isRTL }"
                      >
                        help_outline
                      </v-icon>
                    </template>
                    <span :lang="lang">
                      <!-- MORE FUTURE OCCURENCES -->
                      {{ $t('trans.formSettings.datesOfSubmissnInfo') }}
                      <ul>
                        <li
                          :key="date.startDate + Math.random()"
                          v-for="date in AVAILABLE_DATES"
                          :lang="lang"
                        >
                          {{ $t('trans.formSettings.formOpenInterval') }}
                          {{ date.startDate.split(' ')[0] }}
                          <span v-if="schedule.enabled" :lang="lang">
                            {{ $t('trans.formSettings.to') }}
                            {{ date.closeDate.split(' ')[0] }}
                            <span
                              v-if="
                                schedule.allowLateSubmissions.enabled &&
                                date.closeDate !== date.graceDate
                              "
                              :lang="lang"
                              >{{
                                $t('trans.formSettings.allowDateSubmissionDate')
                              }}
                              {{ date.graceDate.split(' ')[0] }}</span
                            ></span
                          >
                        </li>
                      </ul>
                    </span>
                  </v-tooltip>
                </span>
              </v-col>
            </v-row>

            <hr
              v-if="
                [SCHEDULE_TYPE.CLOSINGDATE, SCHEDULE_TYPE.PERIOD].includes(
                  schedule.scheduleType
                ) ||
                (this.userType === 'team' &&
                  schedule.scheduleType !== null &&
                  enableReminderDraw &&
                  schedule.openSubmissionDateTime)
              "
            />
            <v-row
              class="p-0 m-0"
              v-if="
                [SCHEDULE_TYPE.CLOSINGDATE, SCHEDULE_TYPE.PERIOD].includes(
                  schedule.scheduleType
                )
              "
            >
              <v-col cols="12" md="12" class="p-0">
                <v-checkbox
                  class="my-0 pt-0"
                  v-model="schedule.closingMessageEnabled"
                >
                  <template #label>
                    <div>
                      <span :class="{ 'mr-2': isRTL }" :lang="lang">
                        {{ $t('trans.formSettings.customClosingMessage') }}
                      </span>
                      <v-tooltip bottom>
                        <template v-slot:activator="{ on, attrs }">
                          <v-icon
                            color="primary"
                            class="ml-3"
                            v-bind="attrs"
                            v-on="on"
                            :class="{ 'mr-2': isRTL }"
                          >
                            help_outline
                          </v-icon>
                        </template>
                        <span :lang="lang">
                          {{
                            $t('trans.formSettings.customClosingMessageToolTip')
                          }}
                        </span>
                      </v-tooltip>
                    </div>
                  </template>
                </v-checkbox>
              </v-col>

              <v-col cols="12" md="12" class="p-0">
                <v-expand-transition v-if="schedule.closingMessageEnabled">
                  <v-row class="mb-0 mt-0">
                    <v-col class="mb-0 mt-0 pb-0 pt-0">
                      <template #title
                        ><span :lang="lang">
                          {{ $t('trans.formSettings.closingMessage') }}</span
                        ></template
                      >
                      <v-textarea
                        dense
                        rows="2"
                        flat
                        solid
                        outlined
                        :label="$t('trans.formSettings.closingMessage')"
                        data-test="text-name"
                        v-model="schedule.closingMessage"
                        :rules="closeMessage"
                        :class="{ 'dir-rtl': isRTL, label: isRTL }"
                        :lang="lang"
                      />
                    </v-col>
                  </v-row>
                </v-expand-transition>
              </v-col>
            </v-row>

            <v-row class="p-0 m-0">
              <v-col cols="12" md="12" class="p-0">
                <v-expand-transition
                  v-if="
                    this.userType === 'team' &&
                    schedule.scheduleType !== null &&
                    enableReminderDraw &&
                    schedule.openSubmissionDateTime
                  "
                >
                  <v-row class="mb-0 mt-0">
                    <v-col class="mb-0 mt-0 pb-0 pt-0">
                      <template #title
                        ><span :lang="lang">{{
                          $t('trans.formSettings.sendReminderEmail')
                        }}</span></template
                      >
                      <v-checkbox
                        class="my-0 m-0 p-0"
                        v-model="reminder_enabled"
                      >
                        <template #label>
                          <div :class="{ 'mr-2': isRTL }">
                            <span :lang="lang">
                              {{ $t('trans.formSettings.sendReminderEmail') }}
                            </span>
                            <v-tooltip close-delay="2500" bottom>
                              <template v-slot:activator="{ on, attrs }">
                                <v-icon
                                  color="primary"
                                  class="ml-3"
                                  v-bind="attrs"
                                  v-on="on"
                                  :class="{ 'mr-2': isRTL }"
                                >
                                  help_outline
                                </v-icon>
                              </template>
                              <span :lang="lang">
                                {{
                                  $t(
                                    'trans.formSettings.autoReminderNotificatnToolTip'
                                  )
                                }}
                                <a
                                  :href="githubLinkScheduleAndReminderFeature"
                                  class="preview_info_link_field_white"
                                  :target="'_blank'"
                                  :hreflang="lang"
                                >
                                  {{ $t('trans.formSettings.learnMore') }}
                                  <font-awesome-icon
                                    icon="fa-solid fa-square-arrow-up-right"
                                /></a>
                              </span>
                            </v-tooltip>
                          </div>
                        </template>
                      </v-checkbox>
                    </v-col>
                  </v-row>
                </v-expand-transition>
              </v-col>
            </v-row>
          </BasePanel>
        </v-col>
      </v-expand-transition>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { mapFields } from 'vuex-map-fields';
import {
  IdentityMode,
  IdentityProviders,
  Regex,
  ScheduleType,
} from '@/utils/constants';
import {
  getAvailableDates,
  calculateCloseDate,
  isDateValidForMailNotification,
} from '@/utils/transformUtils';
import moment from 'moment';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faFlask,
  faXmark,
  faSquareArrowUpRight,
} from '@fortawesome/free-solid-svg-icons';
library.add(faFlask, faXmark, faSquareArrowUpRight);

export default {
  name: 'FormSettings',
  props: {
    formId: String,
  },
  data() {
    // debugger;
    return {
      githubLinkBulkUpload:
        'https://github.com/bcgov/common-hosted-form-service/wiki/Allow-multiple-draft-upload',
      githubLinkCopyFromExistingFeature:
        'https://github.com/bcgov/common-hosted-form-service/wiki/Copy-an-existing-submission',
      githubLinkScheduleAndReminderFeature:
        'https://github.com/bcgov/common-hosted-form-service/wiki/Schedule-and-Reminder-notification',
      githubLinkEventSubscriptionFeature:
        'https://github.com/bcgov/common-hosted-form-service/wiki/Event-Subscription',
      repeatUntil: false,
      closeSubmissionDateDraw: false,
      openSubmissionDateDraw: false,
      enableReminderDraw: true,
      valid: false,
      // Validation
    };
  },
  computed: {
    ...mapFields('form', [
      'form.description',
      'form.enableSubmitterDraft',
      'form.enableCopyExistingSubmission',
      'form.enableStatusUpdates',
      'form.allowSubmitterToUploadFile',
      'form.id',
      'form.idps',
      'form.name',
      'form.sendSubRecieviedEmail',
      'form.showSubmissionConfirmation',
      'form.submissionReceivedEmails',
      'form.userType',
      'form.schedule',
      'form.subscribe',
      'form.reminder_enabled',
      'form.versions',
    ]),
    ...mapGetters('auth', ['identityProvider']),
    ...mapGetters('form', ['isRTL', 'lang']),
    ID_MODE() {
      return IdentityMode;
    },
    ID_PROVIDERS() {
      return IdentityProviders;
    },
    idirUser() {
      return this.identityProvider === IdentityProviders.IDIR;
    },
    isFormPublished() {
      return (
        this.versions &&
        this.versions.length &&
        this.versions.some((v) => v.published)
      );
    },
    loginRequiredRules() {
      return [
        (v) =>
          v !== 'login' ||
          this.idps.length === 1 ||
          this.$t('trans.formSettings.selectLoginType'),
      ];
    },
    descriptionRules() {
      return [
        (v) =>
          !v ||
          v.length <= 255 ||
          this.$t('trans.formSettings.formDescriptnMaxChars'),
      ];
    },
    nameRules() {
      return [
        (v) => !!v || this.$t('trans.formSettings.formTitleReq'),
        (v) =>
          (v && v.length <= 255) ||
          this.$t('trans.formSettings.formTitlemaxChars'),
      ];
    },
    emailArrayRules() {
      return [
        (v) =>
          !this.sendSubRecieviedEmail ||
          v.length > 0 ||
          this.$t('trans.formSettings.atLeastOneEmailReq'),
        (v) =>
          !this.sendSubRecieviedEmail ||
          v.every((item) => new RegExp(Regex.EMAIL).test(item)) ||
          this.$t('trans.formSettings.validEmailRequired'),
      ];
    },
    scheduleOpenDate() {
      return [
        (v) => !!v || this.$t('trans.formSettings.fieldRequired'),
        (v) =>
          (v &&
            new RegExp(
              /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
            ).test(v)) ||
          this.$t('trans.formSettings.correctDateFormat'),
      ];
    },
    scheduleCloseDate() {
      return [
        (v) => !!v || this.$t('trans.formSettings.fieldRequired'),
        (v) =>
          (v &&
            new RegExp(
              /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
            ).test(v)) ||
          this.$t('trans.formSettings.correctDateFormat'),
        (v) =>
          moment(v).isAfter(this.schedule.openSubmissionDateTime, 'day') ||
          this.$t('trans.formSettings.dateDiffMsg'),
      ];
    },
    roundNumber() {
      return [
        (v) => !!v || this.$t('trans.formSettings.fieldRequired'),
        (v) =>
          (v && new RegExp(/^[1-9]\d{0,5}(?:\.\d{1,2})?$/g).test(v)) ||
          this.$t('trans.formSettings.valueMustBeNumber'),
      ];
    },
    repeatTerm() {
      return [
        (v) => !!v || this.$t('trans.formSettings.fieldRequired'),
        (v) =>
          (v && new RegExp(/^[1-9]\d{0,5}(?:\.\d{1,2})?$/g).test(v)) ||
          this.$t('trans.formSettings.valueMustBeNumber'),
      ];
    },
    scheduleTypedRules() {
      return [(v) => !!v || this.$t('trans.formSettings.selectAnOptions')];
    },
    allowLateSubmissionRule() {
      return [
        // (v) => !!v || 'This field is required'
      ];
    },
    intervalType() {
      return [(v) => !!v || this.$t('trans.formSettings.fieldRequired')];
    },
    repeatIntervalType() {
      return [
        (v) => !!v || this.$t('trans.formSettings.fieldRequired'),
        (v) =>
          this.AVAILABLE_PERIOD_OPTIONS.includes(v) ||
          this.$t('trans.formSettings.validInterval'),
      ];
    },
    repeatIntervalTypeReminder() {
      return [
        (v) => !!v || this.$t('trans.formSettings.fieldRequiredAndInterval'),
        (v) =>
          this.AVAILABLE_PERIOD_INTERVAL.includes(v) ||
          this.$t('trans.formSettings.fieldRequiredAndInterval'),
      ];
    },
    closeMessage() {
      return [(v) => !!v || this.$t('trans.formSettings.fieldRequired')];
    },
    repeatUntilDate() {
      return [
        (v) => !!v || this.$t('trans.formSettings.fieldRequired'),
        (v) =>
          (v &&
            new RegExp(
              /^(19|20)\d\d[- /.](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/g
            ).test(v)) ||
          this.$t('trans.formSettings.correctDateFormat'),
        (v) =>
          moment(v).isAfter(this.schedule.openSubmissionDateTime, 'day') ||
          this.$t('trans.formSettings.dateGrtOpenSubmissnDate'),
      ];
    },
    AVAILABLE_DATES() {
      //return [];
      const getDates = getAvailableDates(
        this.schedule.keepOpenForTerm,
        this.schedule.keepOpenForInterval,
        this.schedule.openSubmissionDateTime,
        this.schedule.repeatSubmission.everyTerm,
        this.schedule.repeatSubmission.everyIntervalType,
        this.schedule.allowLateSubmissions.forNext.term,
        this.schedule.allowLateSubmissions.forNext.intervalType,
        this.schedule.repeatSubmission.repeatUntil,
        this.schedule.scheduleType,
        this.schedule.closeSubmissionDateTime
      );
      return getDates;
    },
    CALCULATE_CLOSE_DATE() {
      const closeDateCalculated = calculateCloseDate(
        this.schedule.closeSubmissionDateTime,
        this.schedule.allowLateSubmissions.forNext.term,
        this.schedule.allowLateSubmissions.forNext.intervalType
      );
      return closeDateCalculated;
    },
    AVAILABLE_PERIOD_OPTIONS() {
      let arrayOfOption = ['weeks', 'months', 'quarters', 'years'];
      let diffInDays = 0;
      if (
        this.schedule.openSubmissionDateTime &&
        this.schedule.keepOpenForInterval &&
        this.schedule.keepOpenForTerm
      ) {
        diffInDays = moment
          .duration({
            [this.schedule.keepOpenForInterval]: this.schedule.keepOpenForTerm,
          })
          .asDays(); // moment.duration(this.schedule.keepOpenForTerm, this.schedule.keepOpenForInterval).days();

        if (
          this.schedule.allowLateSubmissions.enabled &&
          this.schedule.allowLateSubmissions.forNext.term &&
          this.schedule.allowLateSubmissions.forNext.intervalType
        ) {
          let durationoflatesubInDays = 0;
          if (
            this.schedule.allowLateSubmissions.forNext.intervalType === 'days'
          ) {
            durationoflatesubInDays =
              this.schedule.allowLateSubmissions.forNext.term;
          } else {
            durationoflatesubInDays = moment
              .duration({
                [this.schedule.allowLateSubmissions.forNext.intervalType]:
                  this.schedule.allowLateSubmissions.forNext.term,
              })
              .asDays();
          }

          diffInDays = Number(diffInDays) + Number(durationoflatesubInDays);
        }
      }

      switch (true) {
        case diffInDays > 7 && diffInDays <= 30:
          arrayOfOption = ['months', 'quarters', 'years'];
          break;

        case diffInDays > 30 && diffInDays <= 91:
          arrayOfOption = ['quarters', 'years'];
          break;

        case diffInDays > 91:
          arrayOfOption = ['years'];
          break;

        default:
          arrayOfOption = ['weeks', 'months', 'quarters', 'years'];
          break;
      }
      return arrayOfOption;
    },
    INTERVAL_OPEN() {
      return moment
        .duration({
          [this.schedule.keepOpenForInterval]: this.schedule.keepOpenForTerm,
        })
        .asDays();
    },
    AVAILABLE_PERIOD_INTERVAL() {
      let arrayOfOption = [
        'Daily',
        'Weekly',
        'Bi-weekly',
        'Monthly',
        'Quarterly',
        'Semi-Annually',
        'Annually',
      ];
      let diffInDays = this.INTERVAL_OPEN;
      switch (true) {
        case diffInDays <= 7:
          arrayOfOption = ['Daily'];
          break;
        case diffInDays > 7 && diffInDays <= 14:
          arrayOfOption = ['Daily', 'Weekly'];
          break;
        case diffInDays > 14 && diffInDays <= 31:
          arrayOfOption = ['Daily', 'Weekly', 'Bi-weekly'];
          break;
        case diffInDays > 31 && diffInDays <= 91:
          arrayOfOption = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly'];
          break;
        case diffInDays > 91 && diffInDays <= 183:
          arrayOfOption = [
            'Daily',
            'Weekly',
            'Bi-weekly',
            'Monthly',
            'Quarterly',
          ];
          break;
        case diffInDays > 183 && diffInDays <= 365:
          arrayOfOption = [
            'Daily',
            'Weekly',
            'Bi-weekly',
            'Monthly',
            'Quarterly',
            'Semi-Annually',
          ];
          break;
        default:
          arrayOfOption = [
            'Daily',
            'Weekly',
            'Bi-weekly',
            'Monthly',
            'Quarterly',
            'Semi-Annually',
            'Annually',
          ];
          break;
      }
      return arrayOfOption;
    },
    SCHEDULE_TYPE() {
      return ScheduleType;
    },
  },
  watch: {},
  methods: {
    ...mapActions('form', ['fetchForm']),
    userTypeChanged() {
      // if they checked enable drafts then went back to public, uncheck it
      if (this.userType === this.ID_MODE.PUBLIC) {
        this.enableSubmitterDraft = false;
        this.allowSubmitterToUploadFile = false;
        this.enableCopyExistingSubmission = false;
      }
      if (this.userType !== 'team') {
        this.reminder_enabled = false;
      }
    },
    openDateTypeChanged() {
      if (
        isDateValidForMailNotification(this.schedule.openSubmissionDateTime)
      ) {
        this.enableReminderDraw = false;
        this.reminder_enabled = false;
      } else {
        this.enableReminderDraw = true;
      }
    },
    repeatSubmissionChanged() {
      if (!this.schedule.repeatSubmission.enabled) {
        this.schedule.repeatSubmission.everyTerm = null;
        this.schedule.repeatSubmission.everyIntervalType = null;
        this.schedule.repeatSubmission.repeatUntil = null;
      }
    },
    scheduleTypeChanged() {
      if (this.schedule.scheduleType === ScheduleType.MANUAL) {
        this.schedule.keepOpenForTerm = null;
        this.schedule.keepOpenForInterval = null;
        this.schedule.closingMessageEnabled = null;
        this.schedule.closingMessage = null;
        this.schedule.closeSubmissionDateTime = null;
        (this.schedule.repeatSubmission = {
          enabled: null,
          repeatUntil: null,
          everyTerm: null,
          everyIntervalType: null,
        }),
          (this.schedule.allowLateSubmissions = {
            enabled: null,
            forNext: {
              term: null,
              intervalType: null,
            },
          });
      }
      if (this.schedule.scheduleType === ScheduleType.CLOSINGDATE) {
        this.schedule.keepOpenForTerm = null;
        this.schedule.keepOpenForInterval = null;
        this.schedule.closingMessageEnabled = null;
        this.schedule.closingMessage = null;
        (this.schedule.repeatSubmission = {
          enabled: null,
          repeatUntil: null,
          everyTerm: null,
          everyIntervalType: null,
        }),
          (this.schedule.allowLateSubmissions = {
            enabled: null,
            forNext: {
              term: null,
              intervalType: null,
            },
          });
      }
      if (this.schedule.scheduleType === ScheduleType.PERIOD) {
        this.schedule.closeSubmissionDateTime = null;
        this.schedule.closingMessageEnabled = null;
        this.schedule.closingMessage = null;
        this.schedule.allowLateSubmissions = {
          enabled: null,
          forNext: {
            term: null,
            intervalType: null,
          },
        };
      }
    },
    enableSubmitterDraftChanged() {
      if (!this.enableSubmitterDraft) {
        this.allowSubmitterToUploadFile = false;
      }
    },
    allowSubmitterToUploadFileChanged() {
      if (this.allowSubmitterToUploadFile && !this.enableSubmitterDraft) {
        this.enableSubmitterDraft = true;
      }
    },
  },
};
</script>
