<template>
  <div class="forms-table" :class="{ 'dir-rtl': isRTL }">
    <div
      class="mt-6 d-flex flex-md-row justify-space-between flex-sm-row flex-xs-column-reverse"
    >
      <!-- page title -->
      <div>
        <h1 :lang="lang">{{ $t('trans.formsTable.myForms') }}</h1>
      </div>
      <!-- buttons -->
      <div v-if="user.idp === ID_PROVIDERS.IDIR">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <router-link :to="{ name: 'FormCreate' }">
              <v-btn class="mx-1" color="primary" icon v-bind="attrs" v-on="on">
                <v-icon>add_circle</v-icon>
              </v-btn>
            </router-link>
          </template>
          <span :lang="lang">{{ $t('trans.formsTable.createNewForm') }} </span>
        </v-tooltip>
      </div>
    </div>

    <v-row no-gutters>
      <v-spacer />
      <v-col cols="12">
        <!-- search input -->
        <div class="submissions-search">
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            :label="$t('trans.formsTable.search')"
            single-line
            hide-details
            class="pb-5"
            :class="{ label: isRTL }"
            :lang="lang"
          />
        </div>
      </v-col>
    </v-row>

    <!-- table header -->
    <v-data-table
      class="submissions-table"
      :headers="headers"
      item-key="title"
      :items="filteredFormList"
      :search="search"
      :loading="loading"
      :loading-text="$t('trans.formsTable.loadingText')"
      :lang="lang"
    >
      <template #[`item.name`]="{ item }">
        <router-link
          v-if="item.published"
          :to="{
            name: 'FormSubmit',
            query: { f: item.id },
          }"
          target="_blank"
        >
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <span v-bind="attrs" v-on="on">{{ item.name }}</span>
            </template>
            <span v-if="item.published" :lang="lang">
              {{ $t('trans.formsTable.viewForm') }}
              <v-icon>open_in_new</v-icon>
            </span>
          </v-tooltip>
        </router-link>
        <span v-else>{{ item.name }}</span>
        <!-- link to description in dialog -->
        <v-icon
          v-if="item.description.trim()"
          @click="onDescriptionClick(item.id, item.description)"
          small
          class="description-icon ml-2 mr-4"
          color="primary"
          :aria-label="$t('trans.formsTable.description')"
        >
          description
        </v-icon>
      </template>
      <template #[`item.actions`]="{ item }">
        <router-link
          v-if="checkFormManage(item)"
          :to="{ name: 'FormManage', query: { f: item.id } }"
        >
          <v-btn color="primary" text small>
            <v-icon :class="isRTL ? 'ml-1' : 'mr-1'">settings</v-icon>
            <span class="d-none d-sm-flex" :lang="lang">{{
              $t('trans.formsTable.manage')
            }}</span>
          </v-btn>
        </router-link>
        <router-link
          data-cy="formSubmissionsLink"
          v-if="checkSubmissionView(item)"
          :to="{ name: 'FormSubmissions', query: { f: item.id } }"
        >
          <v-btn color="primary" text small>
            <v-icon :class="isRTL ? 'ml-1' : 'mr-1'">list_alt</v-icon>
            <span class="d-none d-sm-flex" :lang="lang">{{
              $t('trans.formsTable.submissions')
            }}</span>
          </v-btn>
        </router-link>
      </template>
    </v-data-table>

    <BaseDialog
      v-model="showDescriptionDialog"
      showCloseButton
      @close-dialog="showDescriptionDialog = false"
    >
      <template #title>
        <span class="pl-5" :lang="lang">{{
          $t('trans.formsTable.Description')
        }}</span>
      </template>
      <template #text>
        <slot name="formDescription">{{ formDescription }}</slot>
      </template>
    </BaseDialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { IdentityProviders } from '@/utils/constants';
import {
  checkFormManage,
  checkFormSubmit,
  checkSubmissionView,
} from '@/utils/permissionUtils';

export default {
  name: 'FormsTable',
  data() {
    return {
      // Assigning width: '1%' to dynamically assign width to the Table's Columns as described by this post on Stack Overflow:
      // https://stackoverflow.com/a/51569928
      loading: true,
      showDescriptionDialog: false,
      formId: null,
      formDescription: null,
      search: '',
    };
  },
  computed: {
    ...mapGetters('form', ['formList', 'isRTL', 'lang']),
    ...mapGetters('auth', ['user']),
    headers() {
      return [
        {
          text: this.$t('trans.formsTable.formTitle'),
          align: 'start',
          value: 'name',
          width: '1%',
        },
        {
          text: this.$t('trans.formsTable.action'),
          align: 'end',
          value: 'actions',
          filterable: false,
          sortable: false,
          width: '1%',
        },
      ];
    },
    filteredFormList() {
      // At this point, we're only showing forms you can manage or view submissions of here
      // This may get reconceptualized in the future to different pages or something
      return this.formList.filter(
        (f) => checkFormManage(f) || checkSubmissionView(f)
      );
    },
    ID_PROVIDERS: () => IdentityProviders,
  },
  methods: {
    ...mapActions('form', ['getFormsForCurrentUser']),
    checkFormManage: checkFormManage,
    checkFormSubmit: checkFormSubmit,
    checkSubmissionView: checkSubmissionView,
    // show a description if is set in db
    onDescriptionClick(formId, formDescription) {
      this.formId = formId;
      this.formDescription = formDescription;
      this.showDescriptionDialog = true;
    },
  },
  async mounted() {
    await this.getFormsForCurrentUser();
    this.loading = false;
  },
};
</script>

<style scoped>
.submissions-search {
  width: 100%;
}
@media (min-width: 600px) {
  .submissions-search {
    max-width: 20em;
    float: right;
  }
}
@media (max-width: 599px) {
  .submissions-search {
    padding-left: 16px;
    padding-right: 16px;
  }
}

.submissions-table {
  clear: both;
}
@media (max-width: 1263px) {
  .submissions-table >>> th {
    vertical-align: top;
  }
}
/* Want to use scss but the world hates me */
.submissions-table >>> tbody tr:nth-of-type(odd) {
  background-color: #f5f5f5;
}
.submissions-table >>> thead tr th {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
.submissions-table a {
  color: #003366;
}
.description-icon:focus::after {
  opacity: 0;
}
</style>
