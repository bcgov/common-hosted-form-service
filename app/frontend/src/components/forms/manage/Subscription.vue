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
            :label="$t('trans.subscribeEvent.endpointUrl')"
            :lang="lang"
            :placeholder="$t('trans.subscribeEvent.urlPlaceholder')"
            dense
            flat
            solid
            outlined
            :rules="endpointUrlRules"
            v-model="subscriptionData.endpointUrl"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="8" sm="12" lg="8" xl="8">
          <v-text-field
            :label="$t('trans.subscribeEvent.key')"
            :lang="lang"
            dense
            flat
            solid
            outlined
            v-model="subscriptionData.key"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="8" sm="12" xl="8" lg="8">
          <v-text-field
            :label="$t('trans.subscribeEvent.endpointToken')"
            :lang="lang"
            dense
            flat
            solid
            outlined
            v-model="subscriptionData.endpointToken"
            :rules="endpointTokenRules"
            :type="
              showSecret
                ? $t('trans.subscribeEvent.text')
                : $t('trans.subscribeEvent.password')
            "
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="3">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                color="primary"
                icon
                small
                v-bind="attrs"
                v-on="on"
                @click="showHideKey"
              >
                <v-icon v-if="showSecret">visibility_off</v-icon>
                <v-icon v-else>visibility</v-icon>
              </v-btn>
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

<script>
import { mapActions, mapGetters } from 'vuex';
import { mapFields } from 'vuex-map-fields';

export default {
  name: 'Subscription',
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
    ...mapGetters('form', ['apiKey', 'form', 'lang', 'permissions', 'version']),
    ...mapFields('form', ['subscriptionData']),
  },
  methods: {
    ...mapActions('form', ['updateSubscription', 'readFormSubscriptionData']),
    ...mapActions('notifications', ['addNotification']),
    async updateSettings() {
      try {
        if (this.$refs.subscriptionForm.validate()) {
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
          message: this.$t('trans.subscribeEvent.saveSettingsErrMsg'),
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
