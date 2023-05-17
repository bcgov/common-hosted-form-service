<template>
  <div>
    <v-container fluid class="d-flex">
      <h1 class="mr-auto">Team Management</h1>
      <div style="z-index: 1">
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
                v-bind="props"
                @click="showColumnsDialog = true"
              >
                <v-icon>view_column</v-icon>
              </v-btn>
            </template>
            <span>Select Columns</span>
          </v-tooltip>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <router-link :to="{ name: 'FormManage', query: { f: formId } }">
                <v-btn
                  class="mx-1"
                  color="primary"
                  :disabled="!formId"
                  icon
                  v-bind="props"
                >
                  <v-icon>settings</v-icon>
                </v-btn>
              </router-link>
            </template>
            <span>Manage Form</span>
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
          label="Search"
          single-line
        />
      </v-col>
    </v-row>

    <v-data-table
      v-model="selectedUsers"
      class="team-table"
      show-select
      :single-select="false"
      :headers="HEADERS"
      :items="tableData"
      item-value="id"
      :loading="loading || updating"
      loading-text="Loading... Please wait"
      no-data-text="Failed to load team role data"
      :search="search"
      dense
    >
      <!-- custom header markup - add tooltip to heading that are roles -->
      <template v-slot:column.form_designer="{ column }">
        <v-tooltip v-if="roleOrder.includes(column.key)" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>{{ column.description }}</span>
        </v-tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template v-slot:column.owner="{ column }">
        <v-tooltip v-if="roleOrder.includes(column.key)" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>{{ column.description }}</span>
        </v-tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template v-slot:column.submission_reviewer="{ column }">
        <v-tooltip v-if="roleOrder.includes(column.key)" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>{{ column.description }}</span>
        </v-tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template v-slot:column.form_submitter="{ column }">
        <v-tooltip v-if="roleOrder.includes(column.key)" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>{{ column.description }}</span>
        </v-tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template v-slot:column.team_manager="{ column }">
        <v-tooltip v-if="roleOrder.includes(column.key)" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>{{ column.description }}</span>
        </v-tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template v-slot:column.actions>
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn
              icon
              v-bind="props"
              :disabled="updating || selectedUsers.length < 1"
              @click="onRemoveClick(selectedUsers)"
              size="x-small"
              color="red"
            >
              <v-icon color="white" icon="mdi:mdi-minus-thick"></v-icon>
            </v-btn>
          </template>
          <span>Remove selected users</span>
        </v-tooltip>
      </template>
      <template v-slot:item.form_designer="{ item }">
        <v-checkbox
          v-if="!disableRole('form_designer', item, userType)"
          key="form_designer"
          v-model="item.raw.form_designer"
          v-ripple
          :disabled="updating"
          @click="onCheckboxToggle(item.raw.userId)"
        ></v-checkbox>
      </template>
      <template v-slot:item.owner="{ item }">
        <v-checkbox
          v-if="!disableRole('owner', item, userType)"
          key="owner"
          v-model="item.raw.owner"
          v-ripple
          :disabled="updating"
          @click="onCheckboxToggle(item.raw.userId)"
        ></v-checkbox>
      </template>
      <template v-slot:item.submission_reviewer="{ item }">
        <v-checkbox
          v-if="!disableRole('submission_reviewer', item, userType)"
          key="submission_reviewer"
          v-model="item.raw.submission_reviewer"
          v-ripple
          :disabled="updating"
          @click="onCheckboxToggle(item.raw.userId)"
        ></v-checkbox>
      </template>
      <template v-slot:item.form_submitter="{ item }">
        <v-checkbox
          v-if="!disableRole('form_submitter', item, userType)"
          key="form_submitter"
          v-model="item.raw.form_submitter"
          v-ripple
          :disabled="updating"
          @click="onCheckboxToggle(item.raw.userId)"
        ></v-checkbox>
      </template>
      <template v-slot:item.team_manager="{ item }">
        <v-checkbox
          v-if="!disableRole('team_manager', item, userType)"
          key="team_manager"
          v-model="item.raw.team_manager"
          v-ripple
          :disabled="updating"
          @click="onCheckboxToggle(item.raw.userId)"
        ></v-checkbox>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn
              icon
              v-bind="props"
              :disabled="updating"
              @click="onRemoveClick(item)"
              size="x-small"
              color="red"
            >
              <v-icon color="white" icon="mdi:mdi-minus-thick"></v-icon>
            </v-btn>
          </template>
          <span>Remove this user</span>
        </v-tooltip>
      </template>
    </v-data-table>

    <BaseDialog
      v-model="showDeleteDialog"
      type="CONTINUE"
      @close-dialog="showDeleteDialog = false"
      @continue-dialog="removeUser"
    >
      <template #title>Confirm Removal</template>
      <template #text>
        {{ DeleteMessage }}
      </template>
      <template #button-text-continue>
        <span>Remove</span>
      </template>
    </BaseDialog>

    <v-dialog v-model="showColumnsDialog" width="700">
      <BaseFilter
        input-filter-placeholder="Search team management fields"
        input-item-key="value"
        input-save-button-text="Save"
        :input-data="
          DEFAULT_HEADERS.filter(
            (h) => !filterIgnore.some((fd) => fd.value === h.value)
          )
        "
        :preselected-data="PRESELECTED_DATA"
        @saving-filter-data="updateFilter"
        @cancel-filter-data="showColumnsDialog = false"
      >
        <template #filter-title
          >Search and select columns to show under your dashboard</template
        >
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
} from '@src/utils/constants';

import AddTeamMember from '@src/components/forms/manage/AddTeamMember.vue';

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
  data() {
    return {
      formUsers: [],
      filterData: [],
      filterIgnore: [
        {
          key: 'actions',
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
        ? 'Are you sure you want to remove the selected members?'
        : 'Are you sure you want to remove the selected member?';
    },
    DEFAULT_HEADERS() {
      const headers = [
        { title: 'Full Name', key: 'fullName' },
        { title: 'Username', key: 'username' },
        { title: 'Identity Provider', key: 'identityProvider' },
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
  async mounted() {
    // TODO: Make sure vuex fetchForm has been called at least once before this
    await Promise.all([
      this.fetchForm(this.formId),
      this.getFormPermissionsForUser(this.formId),
      this.getRolesList(),
    ]);
    await this.getFormUsers(), (this.loading = false);
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
              message: `${user.username}@${user.idpCode} is already in the team.`,
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
          message: 'There must always be at least one form owner',
          consoleError: `Cannot remove ${userId} as they are the only remaining owner of this form.`,
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
          throw new Error('Insufficient permissions to manage team');
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
          consoleError: `Error getting form users: ${error}`,
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
          consoleError: `Error getting list of roles: ${error}`,
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
        this.itemsToDelete = Array.isArray(item)
          ? item.map((i) => {
              return { id: i };
            })
          : [item.raw];
      }
      this.showDeleteDialog = true;
    },
    ownerError() {
      this.addNotification({
        message: 'There must always be at least one form owner',
        consoleError:
          'Cannot remove as they are the only remaining owner of this form.',
      });
    },
    userError() {
      this.addNotification({
        message: '',
        consoleError:
          'Cannot remove as they are the only remaining owner of this form.',
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
              : 'An error occurred while attempting to delete the selected users',
          consoleError: `Error deleting users from form ${this.formId}: ${error}`,
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
          message:
            'An error occurred while attempting to update all user roles',
          consoleError: `Error setting all user roles for form ${this.formId}: ${error}`,
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
              : 'An error occurred while attempting to update roles for a user',
          consoleError: `Error setting user roles for form ${this.formId}: ${error}`,
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
  .team-table :deep(th) {
    vertical-align: top;
  }
}
.team-table :deep(thead) tr th {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
/* remove extra padding on data-table rows for mobile view */
.team-table :deep(thead.v-data-table-header-mobile) th,
.team-table tr.v-data-table__mobile-table-row td {
  padding: 0;
}
</style>
