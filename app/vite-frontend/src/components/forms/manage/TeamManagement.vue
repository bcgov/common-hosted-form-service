<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';

import { rbacService, roleService } from '~/services';
import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';
import {
  FormPermissions,
  FormRoleCodes,
  IdentityMode,
  IdentityProviders,
} from '~/utils/constants';

const properties = defineProps({
  formId: {
    type: String,
    required: true,
  },
});

const formStore = useFormStore();
const notificationStore = useNotificationStore();

const filterData = ref([]);
const filterIgnore = ref([
  {
    key: 'actions',
  },
]);
const formUsers = ref([]);
const loading = ref(true);
const roleList = ref([]);
const selectedUsers = ref([]);
const tableData = ref([]);
const updating = ref(false);

const { permissions } = storeToRefs(formStore);

const canManageTeam = computed(() => {
  return permissions.value.includes(FormPermissions.TEAM_UPDATE);
});
const roleOrder = computed(() => Object.values(FormRoleCodes));
const DEFAULT_HEADERS = computed(() => {
  const headers = [
    { title: 'Full Name', key: 'fullName' },
    { title: 'Username', key: 'username' },
    { title: 'Identity Provider', key: 'identityProvider' },
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
const ITEMS = computed(() => {
  return tableData.value;
});

onMounted(async () => {
  // TODO: Make sure vuex fetchForm has been called at least once before this
  await Promise.all([
    await formStore.fetchForm(properties.formId),
    await formStore.getFormPermissionsForUser(properties.formId),
    await getRolesList(),
    await getFormUsers(),
  ]);

  loading.value = false;
});

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

async function toggleRole(userId) {
  await setUserForms(userId);
  selectedUsers.value = [];
}

/**
 * @function setUserForms
 * Sets `userId`'s roles for the form
 * @param {String} userId The userId to be updated
 */
async function setUserForms(userId) {
  try {
    console.log('setting user forms');
    updating.value = true;
    const user = tableData.value.filter((u) => u.userId === userId)[0];
    const userRoles = generateFormRoleUsers(user);
    console.log('generated roles', userRoles);
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
    console.log('resetting table..');
    /* await formStore.getFormPermissionsForUser(properties.formId);
    await getFormUsers();
    updating.value = false; */
  }
}

function generateFormRoleUsers(user) {
  console.log('generate form role users being called?');
  console.log('user passed', user);
  console.log(Object.entries(user));
  console.log(Object.keys(user));
  console.log(Object.values(user));
  return Object.keys(user)
    .filter((role) => roleOrder.value.includes(role) && user[role])
    .map((role) => ({
      formId: user.formId,
      role: role,
      userId: user.userId,
    }));
}
</script>

<template>
  <v-container-fluid>
    <v-container fluid class="d-flex">
      <h1 class="mr-auto">Team Management</h1>
      <div style="z-index: 1"></div>
    </v-container>

    <v-data-table
      v-model="selectedUsers"
      :headers="HEADERS"
      :items="ITEMS"
      item-value="id"
      show-select
      :single-select="false"
      :loading="loading || updating"
      loading-text="Loading... Please wait"
      no-data-text="Failed to load team role data"
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
              size="x-small"
              color="red"
              @click="onRemoveClick(selectedUsers)"
            >
              <v-icon color="white" icon="mdi:mdi-minus-thick"></v-icon>
            </v-btn>
          </template>
          <span>Remove selected users</span>
        </v-tooltip>
      </template>
      <template #item.form_designer="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('form_designer', item, userType)"
          key="form_designer"
          v-model="item.raw.form_designer"
          v-ripple
          :disabled="updating"
          @click="toggleRole(item.raw.userId)"
        ></v-checkbox-btn>
      </template>
      <template #item.owner="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('owner', item, userType)"
          key="owner"
          v-model="item.raw.owner"
          v-ripple
          :disabled="updating"
          @click="toggleRole(item.raw.userId)"
        ></v-checkbox-btn>
      </template>
      <template #item.submission_reviewer="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('submission_reviewer', item, userType)"
          key="submission_reviewer"
          v-model="item.raw.submission_reviewer"
          v-ripple
          :disabled="updating"
          @click="toggleRole(item.raw.userId)"
        ></v-checkbox-btn>
      </template>
      <template #item.form_submitter="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('form_submitter', item, userType)"
          key="form_submitter"
          v-model="item.raw.form_submitter"
          v-ripple
          :disabled="updating"
          @click="toggleRole(item.raw.userId)"
        ></v-checkbox-btn>
      </template>
      <template #item.team_manager="{ item }">
        <v-checkbox-btn
          v-if="!disableRole('team_manager', item, userType)"
          key="team_manager"
          v-model="item.raw.team_manager"
          v-ripple
          :disabled="updating"
          @click="toggleRole(item.raw.userId)"
        ></v-checkbox-btn>
      </template>
      <template #item.actions="{ item }">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              icon
              v-bind="props"
              :disabled="updating"
              size="x-small"
              color="red"
              @click="onRemoveClick(item)"
            >
              <v-icon color="white" icon="mdi:mdi-minus-thick"></v-icon>
            </v-btn>
          </template>
          <span>Remove this user</span>
        </v-tooltip>
      </template>
    </v-data-table>
  </v-container-fluid>
</template>
