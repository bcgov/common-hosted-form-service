<template>
  <BaseSecure :idp="[IDP.IDIR]" :class="{ 'dir-rtl': isRTL }">
    <v-stepper
      v-model="creatorStep"
      class="elevation-0 d-flex flex-column"
      alt-labels
    >
      <v-stepper-header
        style="width: 40%"
        class="elevation-0 px-0 align-self-center"
      >
        <v-stepper-step :complete="creatorStep > 1" step="1" class="pl-1">
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.create.setUpForm') }}
          </span>
        </v-stepper-step>
        <v-divider />
        <v-stepper-step :complete="creatorStep > 2" step="2" class="pr-1">
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.create.designForm') }}
          </span>
        </v-stepper-step>
        <v-divider />
        <v-stepper-step :complete="creatorStep === 3" step="3" class="pr-1">
          <span :class="{ 'mr-2': isRTL }" :lang="lang">
            {{ $t('trans.create.publishForm') }}
          </span>
        </v-stepper-step>
      </v-stepper-header>
      <v-stepper-items>
        <v-stepper-content step="3" class="pa-1">
          <v-container>
            <div
              class="mt-6 d-flex flex-md-row justify-space-between flex-sm-row flex-xs-column-reverse"
            >
              <!-- page title -->
              <div>
                <h1 :lang="lang">Publish Form</h1>
              </div>
              <!-- buttons -->
              <div>
                <v-tooltip bottom>
                  <template #activator="{ on, attrs }">
                    <router-link :to="{ name: 'FormManage', query: { f: f } }">
                      <v-btn
                        class="mx-1"
                        color="primary"
                        :disabled="!f"
                        icon
                        v-bind="attrs"
                        v-on="on"
                      >
                        <v-icon>settings</v-icon>
                      </v-btn>
                    </router-link>
                  </template>
                  <span :lang="lang">{{
                    $t('trans.submissionsTable.manageForm')
                  }}</span>
                </v-tooltip>
              </div>
              <!-- form name -->
            </div>
            <div class="text-center mt-4">
              <ManageVersions />
            </div>
          </v-container>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </BaseSecure>
</template>

<script>
import ManageVersions from '@/components/forms/manage/ManageVersions.vue';
import { mapGetters, mapActions } from 'vuex';
import { IdentityProviders } from '@/utils/constants';
export default {
  name: 'PublishForm',
  components: {
    ManageVersions,
  },
  data() {
    return {
      creatorStep: 3,
    };
  },
  props: {
    f: String,
  },
  computed: {
    ...mapGetters('form', ['lang', 'isRTL']),
    IDP: () => IdentityProviders,
  },
  methods: {
    ...mapActions('form', [
      'fetchDrafts',
      'fetchForm',
      'getFormPermissionsForUser',
    ]),
  },

  async mounted() {
    await this.fetchForm(this.f);
    await this.getFormPermissionsForUser(this.f),
      await this.fetchDrafts(this.f);
  },
};
/*
await this.fetchDrafts(this.f);
*/
</script>
<style lang="scss" scoped>
/* unset 'overflow: hidden' from all parents of FormDesigner, so FormDesigner's 'sticky' components menu sticks. */
.v-stepper,
.v-stepper__items,
.v-stepper ::v-deep .v-stepper__wrapper {
  overflow: initial !important;
}
</style>
