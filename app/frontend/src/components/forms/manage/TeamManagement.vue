<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseDialog from '~/components/base/BaseDialog.vue';
import BaseFilter from '~/components/base/BaseFilter.vue';
import AddTeamMember from '~/components/forms/manage/AddTeamMember.vue';
import { rbacService, roleService } from '~/services';
import { useFormStore } from '~/store/form';
import { useIdpStore } from '~/store/identityProviders';
import { useNotificationStore } from '~/store/notification';
import {
  FormPermissions,
  FormRoleCodes,
  IdentityMode,
} from '~/utils/constants';

const { t, locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  formId: {
    type: String,
    required: true,
  },
});

const filterData = ref([]);
const filterIgnore = ref([
  {
    key: 'actions',
  },
]);
const formUsers = ref([]);
const isAddingUsers = ref(false);
const itemsToDelete = ref([]);
const loading = ref(true);
const roleList = ref([]);
const search = ref('');
const selectedUsers = ref([]);
const showColumnsDialog = ref(false);
const showDeleteDialog = ref(false);
const tableData = ref([]);
const updating = ref(false);

const formStore = useFormStore();
const idpStore = useIdpStore();
const notificationStore = useNotificationStore();

const { form, permissions, isRTL } = storeToRefs(formStore);

const canManageTeam = computed(() =>
  permissions.value.includes(FormPermissions.TEAM_UPDATE)
);
const roleOrder = computed(() => Object.values(FormRoleCodes));
const DeleteMessage = computed(() => {
  return itemsToDelete.value.length > 1
    ? t('trans.teamManagement.delSelectedMembersWarning')
    : t('trans.teamManagement.delSelectedMemberWarning');
});
const DEFAULT_HEADERS = computed(() => {
  const headers = [
    { title: t('trans.teamManagement.fullName'), key: 'fullName' },
    { title: t('trans.teamManagement.username'), key: 'username' },
    {
      title: t('trans.teamManagement.identityProvider'),
      key: 'identityProvider.code',
    },
  ];
  return headers
    .concat(
      roleList.value
        .filter(
          (role) =>
            form.value.userType === IdentityMode.TEAM ||
            role.code !== FormRoleCodes.FORM_SUBMITTER
        )
        .map((role) => ({
          filterable: false,
          title: role.display,
          key: role.code,
          description: role.description,
        }))
        .sort((a, b) => {
          return roleOrder.value.indexOf(a.key) > roleOrder.value.indexOf(b.key)
            ? 1
            : -1;
        })
    )
    .concat({ title: '', key: 'actions', width: '1rem', sortable: false });
});

const FILTER_HEADERS = computed(() => {
  return DEFAULT_HEADERS.value.filter(
    (h) => !filterIgnore.value.some((fd) => fd.key === h.key)
  );
});

const HEADERS = computed(() => {
  let headers = DEFAULT_HEADERS.value;
  if (filterData.value.length > 0) {
    headers = headers.filter(
      (h) =>
        filterData.value.some((fd) => fd === h.key) ||
        filterIgnore.value.some((ign) => ign.key === h.key)
    );
  }
  return headers;
});

const PRESELECTED_DATA = computed(() => {
  return filterData.value.length === 0
    ? FILTER_HEADERS.value.map((fd) => fd.key)
    : filterData.value;
});

onMounted(() => {
  loadItems();
});

async function loadItems() {
  loading.value = true;

  await Promise.all([
    await formStore.fetchForm(properties.formId),
    await formStore.getFormPermissionsForUser(properties.formId),
    await getRolesList(),
    await getFormUsers(),
  ]);

  loading.value = false;
}

async function getRolesList() {
  try {
    const response = await roleService.list();
    roleList.value = response.data;
  } catch (error) {
    notificationStore.addNotification({
      text: error.message,
      consoleError: t('trans.teamManagement.getRolesErrMsg') + `${error}`,
    });
    roleList.value = [];
  }
}

async function getFormUsers() {
  try {
    if (!canManageTeam.value) {
      throw new Error(t('trans.teamManagement.insufficientPermissnMsg'));
    }
    const formUsersResponse = await rbacService.getFormUsers({
      formId: properties.formId,
      roles: '*',
    });

    formUsers.value = formUsersResponse?.data?.map((user) => {
      user.idp = idpStore.findByCode(user.user_idpCode);
      return user;
    });
  } catch (error) {
    notificationStore.addNotification({
      text: error.message,
      consoleError: t('trans.teamManagement.getUserErrMsg') + `${error}`,
    });
    formUsers.value = [];
  } finally {
    createTableData(); // Force refresh table based on latest API response
  }
}

function createTableData() {
  tableData.value = formUsers.value.map((user) => {
    const row = {
      id: user.userId,
      formId: properties.formId,
      fullName: user.fullName,
      userId: user.userId,
      username: user.username,
      identityProvider: user.idp,
    };
    roleList.value
      .map((role) => role.code)
      .forEach((role) => (row[role] = user.roles.includes(role)));
    return row;
  });
}

function disableRole(header, user, userType) {
  if (header === FormRoleCodes.FORM_SUBMITTER && userType !== IdentityMode.TEAM)
    return true;
  // if the header isn't in the IDPs roles, then disable
  const idpRoles = idpStore.listRoles(user.identityProvider?.code);
  return idpRoles && !idpRoles.includes(header);
}

async function toggleRole(user) {
  await setUserForms(user.id, {
    formId: user.formId,
    ...user,
    userId: user.id,
  });
  selectedUsers.value = [];
}

/**
 * @ setUserForms
 * Sets `userId`'s roles for the form
 * @param {String} userId The userId to be updated
 */
async function setUserForms(userId, user) {
  try {
    updating.value = true;
    const userRoles = generateFormRoleUsers(user);
    await rbacService.setUserForms(userRoles, {
      formId: properties.formId,
      userId: userId,
    });
  } catch (error) {
    notificationStore.addNotification({
      text:
        error &&
        error.response &&
        error.response.data &&
        error.response.data.detail
          ? error.response.data.detail
          : t('trans.teamManagement.setUserFormsErrMsg'),
      consoleError: t('trans.teamManagement.setUserFormsConsoleErrMsg', {
        formId: properties.formId,
        error: error,
      }),
    });
  } finally {
    await formStore.getFormPermissionsForUser(properties.formId);
    await getFormUsers();
    updating.value = false;
  }
}

function generateFormRoleUsers(user) {
  return Object.keys(user)
    .filter((role) => roleOrder.value.includes(role) && user[role])
    .map((role) => ({
      formId: user.formId,
      role: role,
      userId: user.userId,
    }));
}

function addingUsers(adding) {
  isAddingUsers.value = adding;
}

function addNewUsers(users, roles) {
  if (Array.isArray(users) && users.length) {
    users.forEach((user) => {
      // if user isnt already in the table
      if (!tableData.value.some((obj) => obj.userId === user.id)) {
        const u = {
          formId: properties.formId,
          userId: user.id,
          form_submitter:
            Array.isArray(roles) && roles.length
              ? roles.includes(FormRoleCodes.FORM_SUBMITTER)
              : false,
          form_designer:
            Array.isArray(roles) && roles.length
              ? roles.includes(FormRoleCodes.FORM_DESIGNER)
              : false,
          submission_approver:
            Array.isArray(roles) && roles.length
              ? roles.includes(FormRoleCodes.SUBMISSION_APPROVER)
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
        tableData.value.push(u);

        if (Array.isArray(roles) && roles.length) setUserForms(user.id, u);
      } else {
        notificationStore.addNotification({
          text:
            `${user.username}@${user.idpCode}` +
            ' ' +
            t('trans.teamManagement.idpMessage'),
        });
      }
    });
  }
}

function onShowColumnDialog() {
  FILTER_HEADERS.value.sort(
    (a, b) =>
      PRESELECTED_DATA.value.findIndex((x) => x === b.key) -
      PRESELECTED_DATA.value.findIndex((x) => x === a.key)
  );
  showColumnsDialog.value = true;
}

function onRemoveClick(item = null) {
  if (tableData.value.length === 1) {
    userError();
    return;
  }
  if (item) {
    itemsToDelete.value = Array.isArray(item)
      ? tableData.value.filter((td) => item.includes(td.id))
      : [item];
  }
  showDeleteDialog.value = true;
}

function userError() {
  notificationStore.addNotification({
    text: t('trans.teamManagement.formOwnerRemovalWarning'),
    consoleError: t('trans.teamManagement.formOwnerRemovalWarning'),
  });
}

async function removeUser() {
  showDeleteDialog.value = false;
  try {
    updating.value = true;
    let ids = itemsToDelete.value.map((item) => item.id);
    await rbacService.removeMultiUsers(ids, {
      formId: properties.formId,
    });
    await formStore.getFormPermissionsForUser(properties.formId);
    await getFormUsers();
  } catch (error) {
    notificationStore.addNotification({
      text:
        error &&
        error.response &&
        error.response.data &&
        error.response.data.detail
          ? error.response.data.detail
          : t('trans.teamManagement.removeUsersErrMsg'),
      consoleError: t('trans.teamManagement.removeUserConsoleErrMsg', {
        formId: properties.formId,
        error: error,
      }),
    });
  } finally {
    selectedUsers.value = [];
    itemsToDelete.value = [];
    updating.value = false;
  }
}

function updateFilter(data) {
  filterData.value = data ? data : [];
  showColumnsDialog.value = false;
}

defineExpose({
  addingUsers,
  addNewUsers,
  canManageTeam,
  createTableData,
  DEFAULT_HEADERS,
  DeleteMessage,
  disableRole,
  FILTER_HEADERS,
  filterData,
  filterIgnore,
  formUsers,
  generateFormRoleUsers,
  getFormUsers,
  HEADERS,
  isAddingUsers,
  itemsToDelete,
  onRemoveClick,
  onShowColumnDialog,
  PRESELECTED_DATA,
  removeUser,
  selectedUsers,
  setUserForms,
  showColumnsDialog,
  toggleRole,
  updateFilter,
});
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <v-container
      class="mt-6 d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse gapRow"
    >
      <div>
        <h1 class="mr-auto" :lang="locale">
          {{ $t('trans.teamManagement.teamManagement') }}
        </h1>
        <h3>{{ form.name }}</h3>
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
                :title="$t('trans.teamManagement.selectColumns')"
                @click="onShowColumnDialog"
              >
                <v-icon icon="mdi:mdi-view-column"></v-icon>
              </v-btn>
            </template>
            <span :lang="locale">{{
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
                  :title="$t('trans.teamManagement.manageForm')"
                >
                  <v-icon icon="mdi:mdi-cog"></v-icon>
                </v-btn>
              </router-link>
            </template>
            <span :lang="locale">{{
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
          :lang="locale"
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
      :lang="locale"
    >
      <!-- custom header markup - add tooltip to heading that are roles -->
      <template #header.form_designer="{ column }">
        <v-tooltip v-if="roleOrder.includes(column.key)" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>{{ column.description }}</span>
        </v-tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template #header.owner="{ column }">
        <v-tooltip v-if="roleOrder.includes(column.key)" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>{{ column.description }}</span>
        </v-tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template #header.submission_approver="{ column }">
        <v-tooltip v-if="roleOrder.includes(column.key)" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>{{ column.description }}</span>
        </v-tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template #header.submission_reviewer="{ column }">
        <v-tooltip v-if="roleOrder.includes(column.key)" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>{{ column.description }}</span>
        </v-tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template #header.form_submitter="{ column }">
        <v-tooltip v-if="roleOrder.includes(column.key)" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>{{ column.description }}</span>
        </v-tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template #header.team_manager="{ column }">
        <v-tooltip v-if="roleOrder.includes(column.key)" location="bottom">
          <template #activator="{ props }">
            <span v-bind="props">{{ column.title }}</span>
          </template>
          <span>{{ column.description }}</span>
        </v-tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template #header.actions>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              icon
              v-bind="props"
              :disabled="updating || selectedUsers.length < 1"
              size="24"
              color="red"
              :title="$t('trans.teamManagement.removeSelectedUsers')"
              @click="onRemoveClick(selectedUsers)"
            >
              <v-icon
                size="16"
                color="white"
                icon="mdi:mdi-minus-thick"
              ></v-icon>
            </v-btn>
          </template>
          <span :lang="locale">{{
            $t('trans.teamManagement.removeSelectedUsers')
          }}</span>
        </v-tooltip>
      </template>
      <template #item.form_designer="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('form_designer', item, form.userType)"
          key="form_designer"
          v-model="item.form_designer"
          v-ripple
          :disabled="updating"
          data-test="FormDesignerRoleCheckbox"
          @update:modelValue="toggleRole(item)"
        ></v-checkbox-btn>
      </template>
      <template #item.owner="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('owner', item, form.userType)"
          key="owner"
          v-model="item.owner"
          v-ripple
          :disabled="updating"
          data-test="OwnerRoleCheckbox"
          @update:modelValue="toggleRole(item)"
        ></v-checkbox-btn>
      </template>
      <template #item.submission_approver="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('submission_approver', item, form.userType)"
          key="submission_approver"
          v-model="item.submission_approver"
          v-ripple
          :disabled="updating"
          data-test="ApproverRoleCheckbox"
          @update:modelValue="toggleRole(item)"
        ></v-checkbox-btn>
      </template>
      <template #item.submission_reviewer="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('submission_reviewer', item, form.userType)"
          key="submission_reviewer"
          v-model="item.submission_reviewer"
          v-ripple
          :disabled="updating"
          data-test="ReviewerRoleCheckbox"
          @update:modelValue="toggleRole(item)"
        ></v-checkbox-btn>
      </template>
      <template #item.form_submitter="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('form_submitter', item, form.userType)"
          key="form_submitter"
          v-model="item.form_submitter"
          v-ripple
          :disabled="updating"
          data-test="SubmitterRoleCheckbox"
          @update:modelValue="toggleRole(item)"
        ></v-checkbox-btn>
      </template>
      <template #item.team_manager="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('team_manager', item, form.userType)"
          key="team_manager"
          v-model="item.team_manager"
          v-ripple
          :disabled="updating"
          data-test="TeamManagerRoleCheckbox"
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
              :title="$t('trans.teamManagement.removeThisUser')"
              @click="onRemoveClick(item)"
            >
              <v-icon
                size="16"
                color="white"
                icon="mdi:mdi-minus-thick"
              ></v-icon>
            </v-btn>
          </template>
          <span :lang="locale">{{
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
        ><span :lang="locale">
          {{ $t('trans.teamManagement.confirmRemoval') }}</span
        ></template
      >
      <template #text>
        {{ DeleteMessage }}
      </template>
      <template #button-text-continue>
        <span :lang="locale">{{ $t('trans.teamManagement.remove') }}</span>
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
        :reset-data="FILTER_HEADERS.map((h) => h.key)"
        :preselected-data="PRESELECTED_DATA"
        @saving-filter-data="updateFilter"
        @cancel-filter-data="showColumnsDialog = false"
      >
        <template #filter-title
          ><span :lang="locale">
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
