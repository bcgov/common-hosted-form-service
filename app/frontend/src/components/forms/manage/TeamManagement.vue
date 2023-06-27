<template>
  <div>
    <v-container fluid class="d-flex">
      <h1 class="mr-auto">{{ $t('trans.teamManagement.teamManagement') }}</h1>
      <div style="z-index: 1">
        <span>
          <AddTeamMember
            :disabled="!canManageTeam"
            @adding-users="addingUsers"
            @new-users="addNewUsers"
          />
        </span>
        <span v-if="!isAddingUsers">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn
                @click="showColumnsDialog = true"
                class="mx-1"
                color="primary"
                icon
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>view_column</v-icon>
              </v-btn>
            </template>
            <span>{{ $t('trans.teamManagement.selectColumns') }}</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <router-link :to="{ name: 'FormManage', query: { f: formId } }">
                <v-btn
                  class="mx-1"
                  color="primary"
                  :disabled="!formId"
                  icon
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon>settings</v-icon>
                </v-btn>
              </router-link>
            </template>
            <span>{{ $t('trans.teamManagement.manageForm') }}</span>
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
        />
      </v-col>
    </v-row>

    <v-data-table
      class="team-table"
      show-select
      v-model="selectedUsers"
      :single-select="false"
      :headers="HEADERS"
      :items="tableData"
      item-key="id"
      :loading="loading || updating"
      :loading-text="$t('trans.teamManagement.loadingText')"
      :no-data-text="$t('trans.teamManagement.noDataText')"
      :search="search"
      dense
    >
      <!-- custom header markup - add tooltip to heading that are roles -->
      <template v-for="h in HEADERS" v-slot:[`header.${h.value}`]="{ HEADERS }">
        <v-tooltip v-if="roleOrder.includes(h.value)" :key="h.value" bottom>
          <template v-slot:activator="{ on }">
            <span v-on="on">{{ h.text }}</span>
          </template>
          <span>{{ h.description }}</span>
        </v-tooltip>
        <span v-else :key="h.value">{{ h.text }}</span>
      </template>
      <template v-slot:[`header.actions`]>
        <v-btn
          @click="onRemoveClick(selectedUsers)"
          color="red"
          :disabled="updating || selectedUsers.length < 1"
          icon
        >
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-icon color="red" dark v-bind="attrs" v-on="on"
                >remove_circle</v-icon
              >
            </template>
            <span>{{ $t('trans.teamManagement.removeSelectedUsers') }}</span>
          </v-tooltip>
        </v-btn>
      </template>
      <template
        v-for="role in roleList"
        v-slot:[`item.${role.code}`]="{ item }"
      >
        <v-checkbox
          v-if="!disableRole(role.code, item, userType)"
          v-model="item[role.code]"
          v-ripple
          :disabled="updating"
          :key="role.code"
          @click="onCheckboxToggle(item.userId)"
        ></v-checkbox>
      </template>
      <template v-slot:[`item.actions`]="{ item }">
        <v-btn
          @click="onRemoveClick(item)"
          color="red"
          icon
          :disabled="updating"
        >
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-icon color="red" dark v-bind="attrs" v-on="on"
                >remove_circle</v-icon
              >
            </template>
            <span>{{ $t('trans.teamManagement.removeThisUser') }}</span>
          </v-tooltip>
        </v-btn>
      </template>
    </v-data-table>

    <BaseDialog
      v-model="showDeleteDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDialog = false"
      @continue-dialog="removeUser"
    >
      <template #title>{{
        $t('trans.teamManagement.confirmRemoval')
      }}</template>
      <template #text>
        {{ DeleteMessage }}
      </template>
      <template #button-text-continue>
        <span>{{ $t('trans.teamManagement.remove') }}</span>
      </template>
    </BaseDialog>

    <v-dialog v-model="showColumnsDialog" width="700">
      <BaseFilter
        :inputFilterPlaceholder="
          $t('trans.teamManagement.searchTeamManagementFields')
        "
        inputItemKey="value"
        :inputSaveButtonText="$t('trans.teamManagement.save')"
        :inputData="
          DEFAULT_HEADERS.filter(
            (h) => !filterIgnore.some((fd) => fd.value === h.value)
          )
        "
        :preselectedData="PRESELECTED_DATA"
        @saving-filter-data="updateFilter"
        @cancel-filter-data="showColumnsDialog = false"
      >
        <template #filter-title>{{
          $t('trans.teamManagement.teamMebersTitle')
        }}</template>
      </BaseFilter>
    </v-dialog>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { mapFields } from 'vuex-map-fields';
import { rbacService, roleService } from '@/services';
import {
  IdentityMode,
  FormPermissions,
  FormRoleCodes,
  IdentityProviders,
} from '@/utils/constants';

import AddTeamMember from '@/components/forms/manage/AddTeamMember.vue';

export default {
  name: 'TeamManagement',
  components: {
    AddTeamMember,
  },
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  computed: {
    ...mapFields('form', ['form.userType']),
    ...mapGetters('form', ['permissions']),
    ...mapGetters('auth', ['user']),
    canManageTeam() {
      return this.permissions.includes(FormPermissions.TEAM_UPDATE);
    },
    roleOrder: () => Object.values(FormRoleCodes),
    DeleteMessage() {
      return this.itemsToDelete.length > 1
        ? this.$t('trans.teamManagement.delSelectedMembersWarning"')
        : this.$t('trans.teamManagement.delSelectedMemberWarning');
    },
    DEFAULT_HEADERS() {
      const headers = [
        { text: this.$t('trans.teamManagement.fullName'), value: 'fullName' },
        { text: this.$t('trans.teamManagement.username'), value: 'username' },
        {
          text: this.$t('trans.teamManagement.identityProvider'),
          value: 'identityProvider',
        },
      ];
      return headers
        .concat(
          this.roleList
            .filter(
              (role) =>
                this.userType === IdentityMode.TEAM ||
                role.code !== FormRoleCodes.FORM_SUBMITTER
            )
            .map((role) => ({
              filterable: false,
              text: role.display,
              value: role.code,
              description: role.description,
            }))
            .sort((a, b) =>
              this.roleOrder.indexOf(a.value) > this.roleOrder.indexOf(b.value)
                ? 1
                : -1
            )
        )
        .concat({ text: '', value: 'actions', width: '1rem', sortable: false });
    },
    HEADERS() {
      let headers = this.DEFAULT_HEADERS;
      if (this.filterData.length > 0)
        headers = headers.filter(
          (h) =>
            this.filterData.some((fd) => fd.value === h.value) ||
            this.filterIgnore.some((ign) => ign.value === h.value)
        );
      return headers;
    },
    PRESELECTED_DATA() {
      return this.DEFAULT_HEADERS.filter(
        (h) => !this.filterIgnore.some((fd) => fd.value === h.value)
      );
    },
  },
  data() {
    return {
      formUsers: [],
      filterData: [],
      filterIgnore: [
        {
          value: 'actions',
        },
      ],
      isAddingUsers: false,
      loading: true,
      roleList: [],
      selectedUsers: [],
      itemsToDelete: [],
      search: '',
      showDeleteDialog: false,
      showColumnsDialog: false,
      tableData: [],
      updating: false,
    };
  },
  methods: {
    ...mapActions('form', ['fetchForm', 'getFormPermissionsForUser']),
    ...mapActions('notifications', ['addNotification']),
    addingUsers(adding) {
      this.isAddingUsers = adding;
    },
    addNewUsers(users, roles) {
      if (Array.isArray(users) && users.length) {
        users.forEach((user) => {
          // if user isnt already in the table
          if (!this.tableData.some((obj) => obj.userId === user.id)) {
            // create new object for table row
            this.tableData.push({
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
            });

            if (Array.isArray(roles) && roles.length)
              this.setUserForms(user.id);
          } else {
            this.addNotification({
              message:
                `${user.username}@${user.idpCode}` +
                this.$t('trans.teamManagement.idpMessage'),
            });
          }
        });
      }
    },
    canRemoveOwner(userId) {
      if (
        this.tableData.reduce((acc, user) => (user.owner ? acc + 1 : acc), 0) <
        2
      ) {
        this.addNotification({
          message: this.$t('trans.teamManagement.formOwnerErrMsg'),
          consoleError: this.$t('trans.teamManagement.formOwnerConsoleErrMsg', {
            userId: userId,
          }),
        });
        return false;
      }
      return true;
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

      this.selectedItemToDelete = new Array(this.tableData.length).fill(false);
    },
    // Is this the submitter column, and does this form have login type other than TEAM
    disableSubmitter: (header, userType) =>
      header === FormRoleCodes.FORM_SUBMITTER && userType !== IdentityMode.TEAM,
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
    generateFormRoleUsers(user) {
      return Object.keys(user)
        .filter((role) => this.roleOrder.includes(role) && user[role])
        .map((role) => ({
          formId: user.formId,
          role: role,
          userId: user.userId,
        }));
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
          message: error.message,

          consoleError:
            this.$t('trans.teamManagement.getUserErrMsg') + `${error}`,
        });
        this.formUsers = [];
      } finally {
        this.createTableData(); // Force refresh table based on latest API response
      }
    },
    async getRolesList() {
      try {
        const response = await roleService.list();
        this.roleList = response.data;
      } catch (error) {
        this.addNotification({
          message: error.message,

          consoleError:
            this.$t('trans.teamManagement.getRolesErrMsg') + `${error}`,
        });
        this.roleList = [];
      }
    },
    onCheckboxToggle(userId) {
      this.setUserForms(userId);
      this.selectedUsers = [];
      this.itemsToDelete = [];
    },
    onRemoveClick(item = null) {
      if (this.tableData.length === 1) {
        this.userError();
        return;
      }
      if (item) {
        this.itemsToDelete = Array.isArray(item) ? item : [item];
      }
      this.showDeleteDialog = true;
    },
    ownerError() {
      this.addNotification({
        message: this.$t('trans.teamManagement.formOwnerErrMsg'),
        consoleError: this.$t('trans.teamManagement.formOwnerConsoleErrMsg'),
      });
    },
    userError() {
      this.addNotification({
        message: '',
        consoleError: this.$t('trans.teamManagement.formOwnerRemovalWarning'),
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
          message:
            error &&
            error.response &&
            error.response.data &&
            error.response.data.detail
              ? error.response.data.detail
              : this.$t('trans.teamManagement.removeUsersErrMsg'),
          consoleError: this.$t(
            'trans.teamManagement.removeUserConsoleErrMsg',
            { formId: this.formId, error: error }
          ),
        });
      } finally {
        this.itemsToDelete = [];
        this.updating = false;
      }
    },
    /**
     * @function setFormUsers
     * Sets all users' roles for the form at once
     * @deprecated Use setUserForms instead
     */
    async setFormUsers() {
      this.updating = true;
      try {
        const userRoles = this.tableData
          .map((user) => this.generateFormRoleUsers(user))
          .flat();
        await rbacService.setFormUsers(userRoles, {
          formId: this.formId,
        });
        await this.getFormPermissionsForUser(this.formId);
        await this.getFormUsers();
      } catch (error) {
        this.addNotification({
          message: this.$t('trans.teamManagement.updUserRolesErrMsg'),
          consoleError: this.$t(
            'trans.teamManagement.updUserRolesConsoleErrMsg',
            { formId: this.formId, error: error }
          ),
        });
      }
      this.updating = false;
    },
    /**
     * @function setUserForms
     * Sets `userId`'s roles for the form
     * @param {String} userId The userId to be updated
     */
    async setUserForms(userId) {
      try {
        this.updating = true;
        const user = this.tableData.filter((u) => u.userId === userId)[0];
        const userRoles = this.generateFormRoleUsers(user);
        await rbacService.setUserForms(userRoles, {
          formId: this.formId,
          userId: userId,
        });
      } catch (error) {
        this.addNotification({
          message:
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
    showDeleteButton(item) {
      return (
        this.updating ||
        this.selectedUsers.some(
          (user) =>
            user.username === item.username &&
            user.identityProvider === item.identityProvider
        )
      );
    },
    async updateFilter(data) {
      this.filterData = data;
      this.showColumnsDialog = false;
    },
  },
  async mounted() {
    // TODO: Make sure vuex fetchForm has been called at least once before this
    await Promise.all([
      this.fetchForm(this.formId),
      this.getFormPermissionsForUser(this.formId),
      this.getRolesList(),
    ]);
    await this.getFormUsers(), (this.loading = false);
  },
};
</script>

<style scoped>
.role-col {
  width: 12%;
}
.team-table {
  clear: both;
}
@media (max-width: 1263px) {
  .team-table >>> th {
    vertical-align: top;
  }
}
.team-table >>> thead tr th {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
/* remove extra padding on data-table rows for mobile view */
.team-table >>> thead.v-data-table-header-mobile th,
.team-table tr.v-data-table__mobile-table-row td {
  padding: 0;
}
</style>
