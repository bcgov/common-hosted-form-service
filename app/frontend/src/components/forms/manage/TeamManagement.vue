<script>
import { mapActions, mapState } from 'pinia';

import BaseDialog from '~/components/base/BaseDialog.vue';
import BaseFilter from '~/components/base/BaseFilter.vue';
import AddTeamMember from '~/components/forms/manage/AddTeamMember.vue';
import { i18n } from '~/internationalization';
import { rbacService, roleService } from '~/services';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import {
  FormPermissions,
  FormRoleCodes,
  IdentityMode,
  IdentityProviders,
} from '~/utils/constants';

export default {
  components: {
    BaseDialog,
    BaseFilter,
    AddTeamMember,
  },
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      filterData: [],
      filterIgnore: [
        {
          key: 'actions',
        },
      ],
      formUsers: [],
      isAddingUsers: false,
      itemsToDelete: [],
      loading: true,
      roleList: [],
      search: '',
      selectedUsers: [],
      showColumnsDialog: false,
      showDeleteDialog: false,
      tableData: [],
      updating: false,
    };
  },
  computed: {
    ...mapState(useAuthStore, ['user']),
    ...mapState(useFormStore, ['form', 'permissions', 'isRTL', 'lang']),
    canManageTeam() {
      return this.permissions.includes(FormPermissions.TEAM_UPDATE);
    },
    roleOrder() {
      return Object.values(FormRoleCodes);
    },
    DeleteMessage() {
      return this.itemsToDelete.length > 1
        ? i18n.t('trans.teamManagement.delSelectedMembersWarning"')
        : i18n.t('trans.teamManagement.delSelectedMemberWarning');
    },
    DEFAULT_HEADERS() {
      const headers = [
        { title: i18n.t('trans.teamManagement.fullName'), key: 'fullName' },
        { title: i18n.t('trans.teamManagement.username'), key: 'username' },
        {
          title: i18n.t('trans.teamManagement.identityProvider'),
          key: 'identityProvider',
        },
      ];
      return headers
        .concat(
          this.roleList
            .filter(
              (role) =>
                this.form.userType === IdentityMode.TEAM ||
                role.code !== FormRoleCodes.FORM_SUBMITTER
            )
            .map((role) => ({
              filterable: false,
              title: role.display,
              key: role.code,
              description: role.description,
            }))
            .sort((a, b) =>
              this.roleOrder.indexOf(a.value) > this.roleOrder.indexOf(b.value)
                ? 1
                : -1
            )
        )
        .concat({ title: '', key: 'actions', width: '1rem', sortable: false });
    },
    FILTER_HEADERS() {
      return this.DEFAULT_HEADERS.filter(
        (h) => !this.filterIgnore.some((fd) => fd.key === h.key)
      );
    },
    HEADERS() {
      let headers = this.DEFAULT_HEADERS;
      if (this.filterData.length > 0) {
        headers = headers.filter(
          (h) =>
            this.filterData.some((fd) => fd.key === h.key) ||
            this.filterIgnore.some((ign) => ign.key === h.key)
        );
      }
      return headers;
    },
    PRESELECTED_DATA() {
      return this.filterData.length === 0
        ? this.FILTER_HEADERS
        : this.filterData;
    },
  },
  mounted() {
    this.loadItems();
  },
  methods: {
    ...mapActions(useFormStore, ['fetchForm', 'getFormPermissionsForUser']),
    ...mapActions(useNotificationStore, ['addNotification']),
    async loadItems() {
      this.loading = true;

      await Promise.all([
        await this.fetchForm(this.formId),
        await this.getFormPermissionsForUser(this.formId),
        await this.getRolesList(),
        await this.getFormUsers(),
      ]);

      this.loading = false;
    },

    async getRolesList() {
      try {
        const response = await roleService.list();
        this.roleList = response.data;
      } catch (error) {
        this.addNotification({
          text: error.message,
          consoleError:
            this.$t('trans.teamManagement.getRolesErrMsg') + `${error}`,
        });
        this.roleList = [];
      }
    },

    async getFormUsers() {
      try {
        if (!this.canManageTeam) {
          throw new Error(
            this.$t('trans.teamManagement.insufficientPermissnMsg')
          );
        }
        const formUsersResponse = await rbacService.getFormUsers({
          formId: this.formId,
          roles: '*',
        });
        this.formUsers = formUsersResponse?.data?.map((user) => {
          user.idp = user.user_idpCode;
          return user;
        });
      } catch (error) {
        this.addNotification({
          text: error.message,
          consoleError:
            this.$t('trans.teamManagement.getUserErrMsg') + `${error}`,
        });
        this.formUsers = [];
      } finally {
        this.createTableData(); // Force refresh table based on latest API response
      }
    },

    createTableData() {
      this.tableData = this.formUsers.map((user) => {
        const row = {
          id: user.userId,
          formId: this.formId,
          fullName: user.fullName,
          userId: user.userId,
          username: user.username,
          identityProvider: user.idp,
        };
        this.roleList
          .map((role) => role.code)
          .forEach((role) => (row[role] = user.roles.includes(role)));
        return row;
      });
    },

    disableRole(header, user, userType) {
      if (
        header === FormRoleCodes.FORM_SUBMITTER &&
        userType !== IdentityMode.TEAM
      )
        return true;
      if (
        user.identityProvider === IdentityProviders.BCEIDBUSINESS &&
        (header === FormRoleCodes.OWNER ||
          header === FormRoleCodes.FORM_DESIGNER)
      )
        return true;
      if (
        user.identityProvider === IdentityProviders.BCEIDBASIC &&
        (header === FormRoleCodes.OWNER ||
          header === FormRoleCodes.FORM_DESIGNER ||
          header === FormRoleCodes.TEAM_MANAGER ||
          header === FormRoleCodes.SUBMISSION_REVIEWER)
      )
        return true;
      return false;
    },

    async toggleRole(user) {
      await this.setUserForms(user.raw.id, {
        formId: user.raw.formId,
        ...user.columns,
        userId: user.raw.id,
      });
      this.selectedUsers = [];
    },

    /**
     * @ setUserForms
     * Sets `userId`'s roles for the form
     * @param {String} userId The userId to be updated
     */
    async setUserForms(userId, user) {
      try {
        this.updating = true;
        const userRoles = this.generateFormRoleUsers(user);
        await rbacService.setUserForms(userRoles, {
          formId: this.formId,
          userId: userId,
        });
      } catch (error) {
        this.addNotification({
          text:
            error &&
            error.response &&
            error.response.data &&
            error.response.data.detail
              ? error.response.data.detail
              : this.$t('trans.teamManagement.setUserFormsErrMsg'),
          consoleError: this.$t(
            'trans.teamManagement.setUserFormsConsoleErrMsg',
            {
              formId: this.formId,
              error: error,
            }
          ),
        });
      } finally {
        await this.getFormPermissionsForUser(this.formId);
        await this.getFormUsers();
        this.updating = false;
      }
    },

    generateFormRoleUsers(user) {
      return Object.keys(user)
        .filter((role) => this.roleOrder.includes(role) && user[role])
        .map((role) => ({
          formId: user.formId,
          role: role,
          userId: user.userId,
        }));
    },

    addingUsers(adding) {
      this.isAddingUsers = adding;
    },

    addNewUsers(users, roles) {
      if (Array.isArray(users) && users.length) {
        users.forEach((user) => {
          // if user isnt already in the table
          if (!this.tableData.some((obj) => obj.userId === user.id)) {
            const u = {
              formId: this.formId,
              userId: user.id,
              form_submitter:
                Array.isArray(roles) && roles.length
                  ? roles.includes(FormRoleCodes.FORM_SUBMITTER)
                  : false,
              form_designer:
                Array.isArray(roles) && roles.length
                  ? roles.includes(FormRoleCodes.FORM_DESIGNER)
                  : false,
              submission_reviewer:
                Array.isArray(roles) && roles.length
                  ? roles.includes(FormRoleCodes.SUBMISSION_REVIEWER)
                  : false,
              team_manager:
                Array.isArray(roles) && roles.length
                  ? roles.includes(FormRoleCodes.TEAM_MANAGER)
                  : false,
              owner:
                Array.isArray(roles) && roles.length
                  ? roles.includes(FormRoleCodes.OWNER)
                  : false,
              fullName: user.fullName,
              username: user.username,
            };

            // create new object for table row
            this.tableData.push(u);

            if (Array.isArray(roles) && roles.length)
              this.setUserForms(user.id, u);
          } else {
            this.addNotification({
              text:
                `${user.username}@${user.idpCode}` +
                i18n.t('trans.teamManagement.idpMessage'),
            });
          }
        });
      }
    },
    onShowColumnDialog() {
      this.FILTER_HEADERS.sort(
        (a, b) =>
          this.PRESELECTED_DATA.findIndex((x) => x.text === b.text) -
          this.PRESELECTED_DATA.findIndex((x) => x.text === a.text)
      );
      this.showColumnsDialog = true;
    },

    onRemoveClick(item = null) {
      if (this.tableData.length === 1) {
        this.userError();
        return;
      }
      if (item) {
        this.itemsToDelete = Array.isArray(item)
          ? this.tableData.filter((td) => item.includes(td.id))
          : [item];
      }
      this.showDeleteDialog = true;
    },

    userError() {
      this.addNotification({
        text: i18n.t('trans.teamManagement.formOwnerRemovalWarning'),
        consoleError: i18n.t('trans.teamManagement.formOwnerRemovalWarning'),
      });
    },

    async removeUser() {
      this.showDeleteDialog = false;
      try {
        this.updating = true;
        let ids = this.itemsToDelete.map((item) => item.id);
        await rbacService.removeMultiUsers(ids, {
          formId: this.formId,
        });
        await this.getFormPermissionsForUser(this.formId);
        await this.getFormUsers();
      } catch (error) {
        this.addNotification({
          text:
            error &&
            error.response &&
            error.response.data &&
            error.response.data.detail
              ? error.response.data.detail
              : i18n.t('trans.teamManagement.removeUsersErrMsg'),
          consoleError: i18n.t('trans.teamManagement.removeUserConsoleErrMsg', {
            formId: this.formId,
            error: error,
          }),
        });
      } finally {
        this.selectedUsers = [];
        this.itemsToDelete = [];
        this.updating = false;
      }
    },

    updateFilter(data) {
      this.filterData = data ? data : [];
      this.showColumnsDialog = false;
    },
  },
};
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <v-container
      class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
    >
      <div>
        <h1 class="mr-auto" :lang="lang">
          {{ $t('trans.teamManagement.teamManagement') }}
        </h1>
      </div>
      <div style="z-index: 50">
        <span>
          <AddTeamMember
            :disabled="!canManageTeam"
            @adding-users="addingUsers"
            @new-users="addNewUsers"
          />
        </span>
        <span v-if="!isAddingUsers">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                class="mx-1"
                color="primary"
                icon
                size="x-small"
                v-bind="props"
                @click="onShowColumnDialog"
              >
                <v-icon icon="mdi:mdi-view-column"></v-icon>
              </v-btn>
            </template>
            <span :lang="lang">{{
              $t('trans.teamManagement.selectColumns')
            }}</span>
          </v-tooltip>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <router-link :to="{ name: 'FormManage', query: { f: formId } }">
                <v-btn
                  class="mx-1"
                  color="primary"
                  :disabled="!formId"
                  icon
                  size="x-small"
                  v-bind="props"
                >
                  <v-icon icon="mdi:mdi-cog"></v-icon>
                </v-btn>
              </router-link>
            </template>
            <span :lang="lang">{{
              $t('trans.teamManagement.manageForm')
            }}</span>
          </v-tooltip>
        </span>
      </div>
    </v-container>

    <v-row no-gutters>
      <v-spacer />
      <v-col cols="12" sm="4">
        <!-- search input -->
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          class="pb-5"
          :disabled="!canManageTeam"
          hide-details
          :label="$t('trans.teamManagement.search')"
          single-line
          :class="{ label: isRTL }"
          :lang="lang"
        />
      </v-col>
    </v-row>

    <v-data-table
      v-model="selectedUsers"
      hover
      :headers="HEADERS"
      :items="tableData"
      class="team-table"
      item-value="id"
      show-select
      :single-select="false"
      :loading="loading || updating"
      :loading-text="$t('trans.teamManagement.loadingText')"
      :no-data-text="
        search.length > 0
          ? $t('trans.teamManagement.noMatchingRecordText')
          : $t('trans.teamManagement.noDataText')
      "
      :search="search"
      dense
      :lang="lang"
    >
      <!-- custom header markup - add tooltip to heading that are roles -->
      <template #column.form_designer="{ column }">
        <v-tooltip v-if="roleOrder.includes(column.key)" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>{{ column.description }}</span>
        </v-tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template #column.owner="{ column }">
        <v-tooltip v-if="roleOrder.includes(column.key)" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>{{ column.description }}</span>
        </v-tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template #column.submission_reviewer="{ column }">
        <v-tooltip v-if="roleOrder.includes(column.key)" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>{{ column.description }}</span>
        </v-tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template #column.form_submitter="{ column }">
        <v-tooltip v-if="roleOrder.includes(column.key)" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>{{ column.description }}</span>
        </v-tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template #column.team_manager="{ column }">
        <v-tooltip v-if="roleOrder.includes(column.key)" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>{{ column.description }}</span>
        </v-tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template #column.actions>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              icon
              v-bind="props"
              :disabled="updating || selectedUsers.length < 1"
              size="24"
              color="red"
              @click="onRemoveClick(selectedUsers)"
            >
              <v-icon
                size="16"
                color="white"
                icon="mdi:mdi-minus-thick"
              ></v-icon>
            </v-btn>
          </template>
          <span :lang="lang">{{
            $t('trans.teamManagement.removeSelectedUsers')
          }}</span>
        </v-tooltip>
      </template>
      <template #item.form_designer="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('form_designer', item, form.userType)"
          key="form_designer"
          v-model="item.columns.form_designer"
          v-ripple
          :disabled="updating"
          @update:modelValue="toggleRole(item)"
        ></v-checkbox-btn>
      </template>
      <template #item.owner="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('owner', item, form.userType)"
          key="owner"
          v-model="item.columns.owner"
          v-ripple
          :disabled="updating"
          @update:modelValue="toggleRole(item)"
        ></v-checkbox-btn>
      </template>
      <template #item.submission_reviewer="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('submission_reviewer', item, form.userType)"
          key="submission_reviewer"
          v-model="item.columns.submission_reviewer"
          v-ripple
          :disabled="updating"
          @update:modelValue="toggleRole(item)"
        ></v-checkbox-btn>
      </template>
      <template #item.form_submitter="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('form_submitter', item, form.userType)"
          key="form_submitter"
          v-model="item.columns.form_submitter"
          v-ripple
          :disabled="updating"
          @update:modelValue="toggleRole(item)"
        ></v-checkbox-btn>
      </template>
      <template #item.team_manager="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('team_manager', item, form.userType)"
          key="team_manager"
          v-model="item.columns.team_manager"
          v-ripple
          :disabled="updating"
          @update:modelValue="toggleRole(item)"
        ></v-checkbox-btn>
      </template>
      <template #item.actions="{ item }">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              icon
              v-bind="props"
              :disabled="updating"
              size="24"
              color="red"
              @click="onRemoveClick(item.raw)"
            >
              <v-icon
                size="16"
                color="white"
                icon="mdi:mdi-minus-thick"
              ></v-icon>
            </v-btn>
          </template>
          <span :lang="lang">{{
            $t('trans.teamManagement.removeThisUser')
          }}</span>
        </v-tooltip>
      </template>
    </v-data-table>

    <BaseDialog
      v-model="showDeleteDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDialog = false"
      @continue-dialog="removeUser"
    >
      <template #title
        ><span :lang="lang">
          {{ $t('trans.teamManagement.confirmRemoval') }}</span
        ></template
      >
      <template #text>
        {{ DeleteMessage }}
      </template>
      <template #button-text-continue>
        <span :lang="lang">{{ $t('trans.teamManagement.remove') }}</span>
      </template>
    </BaseDialog>

    <v-dialog v-model="showColumnsDialog" width="700">
      <BaseFilter
        :input-filter-placeholder="
          $t('trans.teamManagement.searchTeamManagementFields')
        "
        input-item-key="key"
        :input-save-button-text="$t('trans.teamManagement.save')"
        :input-data="FILTER_HEADERS"
        :reset-data="FILTER_HEADERS"
        :preselected-data="PRESELECTED_DATA"
        @saving-filter-data="updateFilter"
        @cancel-filter-data="showColumnsDialog = false"
      >
        <template #filter-title
          ><span :lang="lang">
            {{ $t('trans.teamManagement.teamMebersTitle') }}</span
          ></template
        >
      </BaseFilter>
    </v-dialog>
  </div>
</template>
<style scoped>
.role-col {
  width: 12%;
}
.team-table {
  clear: both;
}

@media (max-width: 1263px) {
  .team-table :deep(th) {
    vertical-align: top;
  }
}
.team-table :deep(thead tr th) {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
/* remove extra padding on data-table rows for mobile view */
.team-table :deep(thead.v-data-table-header-mobile th),
.team-table tr.v-data-table__mobile-table-row td {
  padding: 0;
}
</style>
