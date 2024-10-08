<script>
import { mapState, mapWritableState, mapActions } from 'pinia';
import { useFormStore } from '~/store/form';
import { formService } from '~/services';
import { i18n } from '~/internationalization';
import { useNotificationStore } from '~/store/notification';
import { NotificationTypes } from '~/utils/constants';
import BaseDialog from '~/components/base/BaseDialog.vue';
import { ref } from 'vue';

export default {
  components: {
    BaseDialog,
  },
  data() {
    return {
      loading: false,
      headers: [
        { title: 'Name', key: 'name' },
        { title: 'URL', key: 'endpointUrl' },
        { title: 'Status', key: 'code' },
        { title: 'Actions', key: 'actions', align: 'end' },
      ],
      externalAPIAlgorithmList: [],
      externalAPIStatusCodes: [],
      items: [],
      techdocsLink:
        'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/Capabilities/Integrations/Calling-External-API/',
      editDialog: {
        title: '',
        item: {
          id: null,
          formId: null,
          name: null,
          endpointUrl: null,
          code: null,
          sendApiKey: false,
          apiKeyHeader: null,
          apiKey: null,
          sendUserToken: false,
          userTokenHeader: null,
          userTokenBearer: false,
          sendUserInfo: false,
        },
        show: false,
      },
      nameRules: ref([
        (v) => !!v || i18n.t('trans.externalAPI.formNameReq'),
        (v) =>
          (v && v.length <= 255) ||
          i18n.t('trans.externalAPI.formNameMaxChars'),
      ]),
      endpointUrlRules: [
        (v) => !!v || this.$t('trans.externalAPI.validEndpointRequired'),
        (v) =>
          (v &&
            new RegExp(
              /^(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?\/[a-zA-Z0-9]{2,}|((https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?)|(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?$/gim
            ).test(v)) ||
          this.$t('trans.externalAPI.validEndpointRequired'),
      ],
      apiKeyHeaderRules: ref([
        (v) => {
          if (this.editDialog.item.sendApiKey) {
            return !!v || this.$t('trans.externalAPI.apiKeyFieldRequired');
          }
          return true;
        },
      ]),
      userTokenHeaderRules: ref([
        (v) => {
          if (this.editDialog.item.sendUserToken) {
            return !!v || this.$t('trans.externalAPI.userTokenFieldRequired');
          }
          return true;
        },
      ]),
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang']),
    ...mapWritableState(useFormStore, ['form']),
  },
  async mounted() {
    await this.getExternalAPIStatusCodes();
    await this.fetchExternalAPIs();
  },
  methods: {
    ...mapActions(useNotificationStore, ['addNotification']),
    async fetchExternalAPIs() {
      this.loading = true;
      try {
        const result = await formService.externalAPIList(this.form.id);
        // Clear existing items before adding new ones
        this.items = [];
        this.resetEditDialog();

        // Iterate through each item in the result
        result.data.forEach((rec) => {
          this.items.push(rec);
        });
      } catch (e) {
        this.addNotification({
          text: i18n.t('trans.externalAPI.fetchListError'),
          consoleError: i18n.t('trans.externalAPI.fetchListError', {
            error: e.message,
          }),
        });
      } finally {
        this.loading = false;
      }
    },
    async getExternalAPIStatusCodes() {
      try {
        const result = await formService.externalAPIStatusCodes(this.form.id);
        this.externalAPIStatusCodes = result.data;
      } catch (e) {
        this.addNotification({
          text: i18n.t('trans.externalAPI.fetchStatusListError'),
          consoleError: i18n.t('trans.externalAPI.fetchStatusListError', {
            error: e.message,
          }),
        });
      }
    },
    resetEditDialog() {
      this.editDialog = {
        title: '',
        item: {
          id: null,
          formId: this.form.id,
          name: null,
          endpointUrl: null,
          code: null,
          sendApiKey: false,
          apiKeyHeader: null,
          apiKey: null,
          allowSendUserToken: false,
          sendUserToken: false,
          userTokenHeader: null,
          userTokenBearer: false,
          sendUserInfo: false,
        },
        show: false,
      };
    },
    async handleDelete(item) {
      try {
        await formService.externalAPIDelete(this.form.id, item.id);
        this.addNotification({
          text: i18n.t('trans.externalAPI.deleteSuccess'),
          ...NotificationTypes.SUCCESS,
        });
      } catch (e) {
        this.addNotification({
          text: i18n.t('trans.externalAPI.deleteError'),
          consoleError: i18n.t('trans.externalAPI.deleteError', {
            error: e.message,
          }),
        });
      } finally {
        this.fetchExternalAPIs();
      }
    },
    handleEdit(item) {
      this.resetEditDialog();
      this.editDialog.item = item;
      this.editDialog.title = i18n.t('trans.externalAPI.editTitle');
      this.editDialog.show = true;
    },
    handleNew() {
      this.resetEditDialog();
      this.editDialog.title = i18n.t('trans.externalAPI.createTitle');
      this.editDialog.show = true;
    },
    async saveItem() {
      const { valid } = await this.$refs.form.validate();
      if (valid) {
        const isEdit = this.editDialog.item.id;
        try {
          if (isEdit) {
            await formService.externalAPIUpdate(
              this.form.id,
              this.editDialog.item.id,
              this.editDialog.item
            );
            this.addNotification({
              text: i18n.t('trans.externalAPI.editSuccess'),
              ...NotificationTypes.SUCCESS,
            });
          } else {
            await formService.externalAPICreate(
              this.form.id,
              this.editDialog.item
            );
            this.addNotification({
              text: i18n.t('trans.externalAPI.createSuccess'),
              ...NotificationTypes.SUCCESS,
            });
          }
          // reset and close on success...
          this.resetEditDialog();
        } catch (e) {
          const msg = isEdit
            ? 'trans.externalAPI.editError'
            : 'trans.externalAPI.createError';
          this.addNotification({
            text: i18n.t(msg),
            consoleError: i18n.t(msg, {
              error: e.message,
            }),
          });
        } finally {
          await this.fetchExternalAPIs();
        }
      }
    },
  },
};
</script>

<template>
  <div
    class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
  >
    <!-- page title -->
    <div>
      {{ $t('trans.externalAPI.info') }}
    </div>
    <div>
      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-btn
            color="primary"
            class="mx-1"
            icon
            v-bind="props"
            variant="text"
            :title="$t('trans.externalAPI.create')"
            @click="handleNew()"
          >
            <v-icon icon="mdi:mdi-plus-circle"></v-icon>
          </v-btn>
        </template>
        <span :lang="lang">{{ $t('trans.externalAPI.create') }}</span>
      </v-tooltip>

      <v-tooltip location="bottom">
        <template #activator="{ props }">
          <v-icon
            color="primary"
            class="mx-1"
            :class="{ 'mx-1': isRTL }"
            v-bind="props"
            icon="mdi:mdi-help-circle-outline"
          ></v-icon>
        </template>
        <span>
          <a
            :href="techdocsLink"
            class="preview_info_link_field_white"
            target="_blank"
            :hreflang="lang"
          >
            {{ $t('trans.formSettings.learnMore') }}
            <v-icon icon="mdi:mdi-arrow-top-right-bold-box-outline"></v-icon>
          </a>
        </span>
      </v-tooltip>
    </div>
  </div>
  <div>
    <span style="display: inline-block" class="mt-2"> </span>
    <v-data-table-server
      class="submissions-table mt-2"
      :headers="headers"
      :loading="loading"
      :items="items"
      :items-length="items.length"
    >
      <!-- Preview/Download File -->
      <template #item.name="{ item }">{{ item.name }}</template>
      <template #item.endpointUrl="{ item }">{{ item.endpointUrl }}</template>
      <template #item.code="{ item }">{{
        externalAPIStatusCodes.find((x) => x.code === item.code)['display']
      }}</template>
      <!-- Actions -->
      <template #item.actions="{ item }">
        <span>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                color="primary"
                class="mx-1"
                icon
                v-bind="props"
                variant="text"
                :title="$t('trans.externalAPI.edit')"
                @click="handleEdit(item)"
              >
                <v-icon icon="mdi:mdi-pencil"></v-icon>
              </v-btn>
            </template>
            <span :lang="lang">{{ $t('trans.externalAPI.edit') }}</span>
          </v-tooltip>
        </span>
        <span>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <span v-bind="props">
                <v-btn
                  color="red"
                  class="mx-1"
                  icon
                  variant="text"
                  :title="$t('trans.externalAPI.delete')"
                  @click="handleDelete(item)"
                >
                  <v-icon icon="mdi:mdi-delete"></v-icon>
                </v-btn>
              </span>
            </template>
            <span :lang="lang">{{ $t('trans.externalAPI.delete') }}</span>
          </v-tooltip>
        </span>
      </template>
      <!-- Empty footer, remove if allowing multiple templates -->
      <template #bottom></template>
    </v-data-table-server>
  </div>

  <BaseDialog
    v-model="editDialog.show"
    eager
    type="CONTINUE"
    show-close-button
    :class="{ 'dir-rtl': isRTL }"
    :title="editDialog.title"
    width="1200"
    @continue-dialog="saveItem"
    @close-dialog="editDialog.show = false"
    ><template #title>{{ editDialog.title }}</template>
    <template #text>
      <v-form ref="form" @submit="saveItem()" @submit.prevent>
        <v-row class="mt-4">
          <v-col cols="4">
            <v-text-field
              v-model="editDialog.item.name"
              autofocus
              density="compact"
              solid
              variant="outlined"
              :label="$t('trans.externalAPI.formName')"
              data-test="text-name"
              :rules="nameRules"
              :lang="lang"
            />
          </v-col>
          <v-col cols="8">
            <v-text-field
              v-model="editDialog.item.endpointUrl"
              density="compact"
              solid
              variant="outlined"
              :label="$t('trans.externalAPI.formEndpointUrl')"
              data-test="text-endpointUrl"
              :rules="endpointUrlRules"
              :lang="lang"
            />
          </v-col>
        </v-row>
        <v-row v-if="editDialog.item.id" class="mt-0">
          <v-col cols="4"></v-col>
          <v-col cols="8">
            <v-select
              v-if="editDialog.item.id"
              v-model="editDialog.item.code"
              :items="externalAPIStatusCodes"
              item-title="display"
              item-value="code"
              aria-readonly="true"
              :readonly="true"
              density="compact"
              solid
              variant="outlined"
              :label="$t('trans.externalAPI.formStatus')"
              data-test="text-code"
              :lang="lang"
          /></v-col>
        </v-row>
        <!-- API Key -->
        <hr />
        <v-row>
          <v-col cols="12" class="pb-0"
            ><v-checkbox v-model="editDialog.item.sendApiKey" class="my-0 pt-0">
              <template #label>
                <span :class="{ 'mr-2': isRTL }" :lang="lang">
                  {{ $t('trans.externalAPI.formSendApiKey') }}
                </span>
              </template>
            </v-checkbox></v-col
          >
        </v-row>
        <v-row class="mt-0">
          <v-col cols="4"
            ><v-text-field
              v-model="editDialog.item.apiKeyHeader"
              density="compact"
              solid
              variant="outlined"
              :label="$t('trans.externalAPI.formApiKeyHeader')"
              data-test="text-apiKeyHeader"
              :lang="lang"
              :rules="apiKeyHeaderRules"
          /></v-col>
          <v-col cols="8">
            <v-text-field
              v-model="editDialog.item.apiKey"
              density="compact"
              solid
              variant="outlined"
              :label="$t('trans.externalAPI.formApiKey')"
              data-test="text-apiKey"
              :lang="lang"
              :rules="apiKeyHeaderRules"
          /></v-col>
        </v-row>
        <!-- User Information -->
        <hr />
        <v-row>
          <v-col cols="4" class="pb-0"
            ><v-checkbox
              v-model="editDialog.item.sendUserInfo"
              class="my-0 pt-0"
            >
              <template #label>
                <span :class="{ 'mr-2': isRTL }" :lang="lang">
                  {{ $t('trans.externalAPI.formSendUserInfo') }}
                </span>
              </template>
            </v-checkbox></v-col
          >
        </v-row>
        <!-- User Token -->
        <hr v-if="editDialog.item.allowSendUserToken" />
        <v-row v-if="editDialog.item.allowSendUserToken">
          <v-col cols="4" class="pb-0">
            <v-checkbox
              v-model="editDialog.item.sendUserToken"
              class="my-0 pt-0"
            >
              <template #label>
                <span :class="{ 'mr-2': isRTL }" :lang="lang">
                  {{ $t('trans.externalAPI.formSendUserToken') }}
                </span>
              </template>
            </v-checkbox></v-col
          >
          <v-col cols="8" class="pb-0">
            <v-checkbox
              v-model="editDialog.item.userTokenBearer"
              class="my-0 pt-0"
            >
              <template #label>
                <span :class="{ 'mr-2': isRTL }" :lang="lang">
                  {{ $t('trans.externalAPI.formUserTokenBearer') }}
                </span>
              </template>
            </v-checkbox></v-col
          >
        </v-row>
        <v-row v-if="editDialog.item.allowSendUserToken" class="mt-0">
          <v-col cols="4"></v-col>
          <v-col cols="8">
            <v-text-field
              v-model="editDialog.item.userTokenHeader"
              density="compact"
              solid
              variant="outlined"
              :label="$t('trans.externalAPI.formUserTokenHeader')"
              data-test="text-userTokenHeader"
              :lang="lang"
              :rules="userTokenHeaderRules"
          /></v-col>
        </v-row>
      </v-form>
    </template>
    <template #button-text-continue>
      <span :lang="lang">{{ $t('trans.externalAPI.save') }}</span>
    </template>
  </BaseDialog>
</template>

<style scoped>
.action-icon:not(:last-child) {
  margin-right: 20px;
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.submissions-table {
  clear: both;
}

@media (max-width: 1263px) {
  .submissions-table :deep(th) {
    vertical-align: top;
  }
}
.submissions-table :deep(thead) tr th {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
