<script>
import { mapActions, mapState } from 'pinia';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

export default {
  data() {
    return {
      loading: false,
      showConfirmationDialog: false,
      showDeleteDialog: false,
      showSecret: false,
      valid: false,
      subscriptionFormValid: false,
      endpointUrlRules: [
        (v) => !!v || this.$t('trans.formSettings.validEndpointRequired'),
        (v) =>
          (v &&
            new RegExp(
              /^(ht|f)tp(s?):\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}([-.\w]*[0-9a-zA-Z])*(:(0-9)*)*(\/?)([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g
            ).test(v)) ||
          this.$t('trans.formSettings.validEndpointRequired'),
      ],
      endpointTokenRules: [
        (v) => !!v || this.$t('trans.formSettings.validBearerTokenRequired'),
      ],
    };
  },
  computed: {
    ...mapState(useFormStore, [
      'apiKey',
      'form',
      'lang',
      'permissions',
      'subscriptionData',
      'version',
    ]),
  },
  methods: {
    ...mapActions(useFormStore, [
      'updateSubscription',
      'readFormSubscriptionData',
    ]),
    ...mapActions(useNotificationStore, ['addNotification']),
    async updateSettings() {
      try {
        const { valid } = await this.$refs.subscriptionForm.validate();

        if (valid) {
          let subscriptionData = {
            ...this.subscriptionData,
            formId: this.form.id,
          };
          await this.updateSubscription({
            formId: this.form.id,
            subscriptionData: subscriptionData,
          });

          this.readFormSubscriptionData(this.form.id);
        }
      } catch (error) {
        this.addNotification({
          text: this.$t('trans.subscribeEvent.saveSettingsErrMsg'),
          consoleError: this.$t(
            'trans.subscribeEvent.updateSettingsConsoleErrMsg',
            {
              formId: this.form.id,
              error: error,
            }
          ),
        });
      }
    },
    showHideKey() {
      this.showSecret = !this.showSecret;
    },
  },
};
</script>

<template>
  <v-container class="px-0">
    <template #title>
      <span :lang="lang">
        {{ $t('trans.formSettings.eventSubscription') }}
      </span>
    </template>
    <v-form
      ref="subscriptionForm"
      v-model="subscriptionFormValid"
      lazy-validation
    >
      <v-row class="mt-5">
        <v-col cols="12" md="8" sm="12" lg="8" xl="8">
          <v-text-field
            v-model="subscriptionData.endpointUrl"
            :label="$t('trans.subscribeEvent.endpointUrl')"
            :lang="lang"
            :placeholder="$t('trans.subscribeEvent.urlPlaceholder')"
            density="compact"
            flat
            solid
            variant="outlined"
            :rules="endpointUrlRules"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="8" sm="12" lg="8" xl="8">
          <v-text-field
            v-model="subscriptionData.key"
            :label="$t('trans.subscribeEvent.key')"
            :lang="lang"
            density="compact"
            flat
            solid
            variant="outlined"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="8" sm="12" xl="8" lg="8">
          <v-text-field
            v-model="subscriptionData.endpointToken"
            :label="$t('trans.subscribeEvent.endpointToken')"
            :lang="lang"
            density="compact"
            flat
            solid
            variant="outlined"
            :rules="endpointTokenRules"
            :type="
              showSecret
                ? $t('trans.subscribeEvent.text')
                : $t('trans.subscribeEvent.password')
            "
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="3">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="primary"
                :icon="showSecret ? 'mdi:mdi-eye-off' : 'mdi:mdi-eye'"
                size="x-small"
                v-bind="props"
                density="default"
                @click="showHideKey"
              />
            </template>
            <span v-if="showSecret" :lang="lang">
              {{ $t('trans.subscribeEvent.hideSecret') }}
            </span>
            <span v-else :lang="lang">{{
              $t('trans.subscribeEvent.showSecret')
            }}</span>
          </v-tooltip>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-btn class="mr-5" color="primary" @click="updateSettings">
            <span :lang="lang">{{ $t('trans.subscribeEvent.save') }}</span>
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>
