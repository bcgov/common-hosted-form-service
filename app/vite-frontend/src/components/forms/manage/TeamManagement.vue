<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseDialog from '~/components/base/BaseDialog.vue';
import BaseFilter from '~/components/base/BaseFilter.vue';
import AddTeamMember from '~/components/forms/manage/AddTeamMember.vue';
import { rbacService, roleService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import {
  FormPermissions,
  FormRoleCodes,
  IdentityMode,
  IdentityProviders,
} from '~/utils/constants';

const { t } = useI18n({ useScope: 'global' });

const properties = defineProps({
  formId: {
    type: String,
    required: true,
  },
});

const formStore = useFormStore();
const notificationStore = useNotificationStore();

const { permissions } = storeToRefs(formStore);

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
const selectedUsers = ref([]);
const showColumnsDialog = ref(false);
const showDeleteDialog = ref(false);
const tableData = ref([]);
const totalItems = ref(0);
const updating = ref(false);

const canManageTeam = computed(() => {
  return permissions.value.includes(FormPermissions.TEAM_UPDATE);
});
const roleOrder = computed(() => Object.values(FormRoleCodes));
const DeleteMessage = computed(() =>
  itemsToDelete.value.length > 1
    ? t('trans.teamManagement.delSelectedMembersWarning"')
    : t('trans.teamManagement.delSelectedMemberWarning')
);
const DEFAULT_HEADERS = computed(() => {
  const headers = [
    { title: t('trans.teamManagement.fullName'), key: 'fullName' },
    { title: t('trans.teamManagement.username'), key: 'username' },
    {
      title: t('trans.teamManagement.identityProvider'),
      key: 'identityProvider',
    },
  ];
  return headers
    .concat(
      roleList.value
        .filter(
          (role) =>
            formStore.userType === IdentityMode.TEAM ||
            role.code !== FormRoleCodes.FORM_SUBMITTER
        )
        .map((role) => ({
          filterable: false,
          title: role.display,
          key: role.code,
          description: role.description,
        }))
        .sort((a, b) =>
          roleOrder.value.indexOf(a.value) > roleOrder.value.indexOf(b.value)
            ? 1
            : -1
        )
    )
    .concat({ title: '', key: 'actions', width: '1rem', sortable: false });
});
const HEADERS = computed(() => {
  let headers = DEFAULT_HEADERS.value;
  if (filterData.value.length > 0)
    headers = headers.filter(
      (h) =>
        filterData.value.some((fd) => fd.key === h.key) ||
        filterIgnore.value.some((ign) => ign.key === h.key)
    );
  return headers;
});
const PRESELECTED_DATA = computed(() => {
  return DEFAULT_HEADERS.value.filter(
    (h) => !filterIgnore.value.some((fd) => fd.value === h.value)
  );
});

onMounted(() => {
  loadItems();
});

async function loadItems() {
  loading.value = true;

  Promise.all([
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
      consoleError: `Error getting list of roles: ${error}`,
    });
    roleList.value = [];
  }
}

async function getFormUsers() {
  try {
    if (!canManageTeam.value) {
      throw new Error('Insufficient permissions to manage team');
    }
    const formUsersResponse = await rbacService.getFormUsers({
      formId: properties.formId,
      roles: '*',
    });
    formUsers.value = formUsersResponse?.data?.map((user) => {
      user.idp = user.user_idpCode;
      return user;
    });
  } catch (error) {
    notificationStore.addNotification({
      text: error.message,
      consoleError: `Error getting form users: ${error}`,
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
  totalItems.value = tableData.value.length;
}

function disableRole(header, user, userType) {
  if (header === FormRoleCodes.FORM_SUBMITTER && userType !== IdentityMode.TEAM)
    return true;
  if (
    user.identityProvider === IdentityProviders.BCEIDBUSINESS &&
    (header === FormRoleCodes.OWNER || header === FormRoleCodes.FORM_DESIGNER)
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
}

async function toggleRole(user) {
  const u = {
    formId: user.raw.formId,
    ...user.columns,
    userId: user.raw.id,
  };
  await setUserForms(user.raw.id, u);
  selectedUsers.value = [];
}

/**
 * @function setUserForms
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
          : 'An error occurred while attempting to update roles for a user',
      consoleError: `Error setting user roles for form ${properties.formId}: ${error}`,
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
            t('trans.teamManagement.idpMessage'),
        });
      }
    });
  }
}

function onRemoveClick(item = null) {
  if (tableData.value.length === 1) {
    userError();
    return;
  }
  if (item) {
    itemsToDelete.value = Array.isArray(item) ? item : [item];
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
    itemsToDelete.value = [];
    updating.value = false;
  }
}
</script>

<template>
  <v-container-fluid>
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
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-btn
                class="mx-1"
                color="primary"
                icon
                size="small"
                v-bind="props"
                @click="showColumnsDialog = true"
              >
                <v-icon icon="mdi:mdi-view-column"></v-icon>
              </v-btn>
            </template>
            <span>{{ $t('trans.teamManagement.selectColumns') }}</span>
          </v-tooltip>
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <router-link :to="{ name: 'FormManage', query: { f: formId } }">
                <v-btn
                  class="mx-1"
                  color="primary"
                  :disabled="!formId"
                  icon
                  size="small"
                  v-bind="props"
                >
                  <v-icon icon="mdi:mdi-cog"></v-icon>
                </v-btn>
              </router-link>
            </template>
            <span>{{ $t('trans.teamManagement.manageForm') }}</span>
          </v-tooltip>
        </span>
      </div>
    </v-container>

    <v-data-table
      v-model="selectedUsers"
      :headers="HEADERS"
      :items="tableData"
      item-value="id"
      show-select
      :single-select="false"
      :loading="loading || updating"
      :loading-text="$t('trans.teamManagement.loadingText')"
      :no-data-text="$t('trans.teamManagement.noDataText')"
      dense
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
          <span>{{ $t('trans.teamManagement.removeSelectedUsers') }}</span>
        </v-tooltip>
      </template>
      <template #item.form_designer="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('form_designer', item, userType)"
          key="form_designer"
          v-model="item.columns.form_designer"
          v-ripple
          :disabled="updating"
          @update:modelValue="toggleRole(item)"
        ></v-checkbox-btn>
      </template>
      <template #item.owner="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('owner', item, userType)"
          key="owner"
          v-model="item.columns.owner"
          v-ripple
          :disabled="updating"
          @update:modelValue="toggleRole(item)"
        ></v-checkbox-btn>
      </template>
      <template #item.submission_reviewer="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('submission_reviewer', item, userType)"
          key="submission_reviewer"
          v-model="item.columns.submission_reviewer"
          v-ripple
          :disabled="updating"
          @update:modelValue="toggleRole(item)"
        ></v-checkbox-btn>
      </template>
      <template #item.form_submitter="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('form_submitter', item, userType)"
          key="form_submitter"
          v-model="item.columns.form_submitter"
          v-ripple
          :disabled="updating"
          @update:modelValue="toggleRole(item)"
        ></v-checkbox-btn>
      </template>
      <template #item.team_manager="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('team_manager', item, userType)"
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
          <span>{{ $t('trans.teamManagement.removeThisUser') }}</span>
        </v-tooltip>
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
        :input-filter-placeholder="
          $t('trans.teamManagement.searchTeamManagementFields')
        "
        input-item-key="value"
        :input-save-button-text="$t('trans.teamManagement.save')"
        :input-data="
          DEFAULT_HEADERS.filter(
            (h) => !filterIgnore.some((fd) => fd.value === h.value)
          )
        "
        :preselected-data="PRESELECTED_DATA"
        @saving-filter-data="updateFilter"
        @cancel-filter-data="showColumnsDialog = false"
      >
        <template #filter-title>{{
          $t('trans.teamManagement.teamMebersTitle')
        }}</template>
      </BaseFilter>
    </v-dialog>
  </v-container-fluid>
</template>
