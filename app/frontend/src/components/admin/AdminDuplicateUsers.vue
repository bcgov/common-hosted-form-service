<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAdminStore } from '~/store/admin';

const { t, locale } = useI18n({ useScope: 'global' });
const adminStore = useAdminStore();
const { duplicateUserList } = storeToRefs(adminStore);
const loading = ref(false);
const updatingUserId = ref(null);
const selectedUser = ref(null);
const currentPage = ref(1);
const groupsPerPage = ref(5);
const openGroups = ref([]);
const groupsPerPageOptions = [5, 10, 25];

const headers = computed(() => [
  { title: t('trans.adminDuplicateUsers.user'), key: 'fullName' },
  { title: t('trans.adminDuplicateUsers.identityProvider'), key: 'idpCode' },
  { title: t('trans.adminDuplicateUsers.lastActivity'), key: 'lastActivityAt' },
  { title: t('trans.adminDuplicateUsers.status'), key: 'stale' },
  {
    title: t('trans.adminDuplicateUsers.actions'),
    key: 'actions',
    sortable: false,
  },
]);

const duplicateGroups = computed(() => {
  const groups = new Map();
  for (const user of duplicateUserList.value) {
    const key = `${user.canonicalIdp}:${user.matchType}:${user.matchKey}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        canonicalIdp: user.canonicalIdp,
        matchType: user.matchType,
        matchKey: user.matchKey,
        groupSize: user.groupSize,
        activeInGroup: user.activeInGroup,
        users: [],
      });
    }
    groups.get(key).users.push(user);
  }
  return Array.from(groups.values());
});

const pageCount = computed(() =>
  Math.max(1, Math.ceil(duplicateGroups.value.length / groupsPerPage.value))
);

const paginatedGroups = computed(() => {
  const start = (currentPage.value - 1) * groupsPerPage.value;
  return duplicateGroups.value.slice(start, start + groupsPerPage.value);
});

watch(pageCount, (count) => {
  if (currentPage.value > count) currentPage.value = count;
});

function updateGroupsPerPage(value) {
  groupsPerPage.value = value;
  currentPage.value = 1;
  openGroups.value = [];
}

async function refresh() {
  loading.value = true;
  try {
    await adminStore.getDuplicateUsers();
  } finally {
    loading.value = false;
  }
}

async function confirmMarkStale() {
  const user = selectedUser.value;
  if (!user) return;
  updatingUserId.value = user.userId;
  try {
    await adminStore.updateUser(user.userId, { stale: true });
    selectedUser.value = null;
    await refresh();
  } finally {
    updatingUserId.value = null;
  }
}

onMounted(refresh);
</script>

<template>
  <section data-test="duplicate-user-review">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4">
      <div>
        <h2 :lang="locale">{{ $t('trans.adminDuplicateUsers.title') }}</h2>
        <p class="mb-0" :lang="locale">
          {{ $t('trans.adminDuplicateUsers.description') }}
        </p>
      </div>
      <v-btn
        class="mt-2"
        color="primary"
        prepend-icon="mdi-refresh"
        variant="outlined"
        :loading="loading"
        :disabled="loading || Boolean(updatingUserId)"
        @click="refresh"
      >
        {{ $t('trans.adminDuplicateUsers.refresh') }}
      </v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-alert
      v-else-if="duplicateGroups.length === 0"
      type="success"
      variant="tonal"
      :text="$t('trans.adminDuplicateUsers.empty')"
    />

    <template v-else>
      <v-expansion-panels v-model="openGroups" multiple>
        <v-expansion-panel
          v-for="group in paginatedGroups"
          :key="group.key"
          :value="group.key"
        >
          <v-expansion-panel-title>
            <div>
              <div class="font-weight-medium">{{ group.matchKey }}</div>
              <small>
                {{
                  $t('trans.adminDuplicateUsers.matchedBy', {
                    type: group.matchType,
                  })
                }}
                · {{ group.canonicalIdp }} ·
                {{
                  $t('trans.adminDuplicateUsers.records', {
                    count: group.groupSize,
                    active: group.activeInGroup,
                  })
                }}
              </small>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-data-table
              :headers="headers"
              :items="group.users"
              item-value="userId"
              hide-default-footer
              :items-per-page="-1"
            >
              <template #item.fullName="{ item }">
                <div>{{ item.fullName || item.username }}</div>
                <small>{{ item.username }} · {{ item.email }}</small>
              </template>
              <template #item.lastActivityAt="{ item }">
                {{ $filters.formatDate(item.lastActivityAt) }}
              </template>
              <template #item.stale="{ item }">
                <v-chip
                  :color="item.stale ? 'warning' : 'success'"
                  size="small"
                >
                  {{
                    item.stale
                      ? $t('trans.adminDuplicateUsers.stale')
                      : $t('trans.adminDuplicateUsers.active')
                  }}
                </v-chip>
              </template>
              <template #item.actions="{ item }">
                <v-btn
                  data-test="mark-stale-button"
                  color="warning"
                  size="small"
                  variant="outlined"
                  :disabled="item.stale || Boolean(updatingUserId)"
                  :loading="updatingUserId === item.userId"
                  @click="selectedUser = item"
                >
                  {{ $t('trans.adminDuplicateUsers.markStale') }}
                </v-btn>
              </template>
            </v-data-table>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <div class="d-flex flex-wrap align-center justify-space-between mt-4">
        <v-select
          class="groups-per-page"
          density="compact"
          hide-details
          variant="outlined"
          :label="$t('trans.adminDuplicateUsers.groupsPerPage')"
          :items="groupsPerPageOptions"
          :model-value="groupsPerPage"
          @update:model-value="updateGroupsPerPage"
        />
        <v-pagination
          v-if="pageCount > 1"
          v-model="currentPage"
          :length="pageCount"
          :total-visible="7"
          @update:model-value="openGroups = []"
        />
      </div>
    </template>

    <v-dialog :model-value="Boolean(selectedUser)" max-width="600">
      <v-card v-if="selectedUser">
        <v-card-title>{{
          $t('trans.adminDuplicateUsers.confirmTitle')
        }}</v-card-title>
        <v-card-text>
          {{
            $t('trans.adminDuplicateUsers.confirmMessage', {
              name: selectedUser.fullName || selectedUser.username,
              username: selectedUser.username,
            })
          }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            :disabled="Boolean(updatingUserId)"
            @click="selectedUser = null"
          >
            {{ $t('trans.adminDuplicateUsers.cancel') }}
          </v-btn>
          <v-btn
            data-test="confirm-stale-button"
            color="warning"
            :loading="Boolean(updatingUserId)"
            @click="confirmMarkStale"
          >
            {{ $t('trans.adminDuplicateUsers.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<style scoped>
.groups-per-page {
  max-width: 12rem;
}
</style>
