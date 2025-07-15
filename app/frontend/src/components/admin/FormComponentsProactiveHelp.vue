<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

import GeneralLayout from '~/components/infolinks/GeneralLayout.vue';
import { useAdminStore } from '~/store/admin';
import { FormComponentProactiveHelpValues } from '~/utils/constants';

const loading = ref(false);

const adminStore = useAdminStore();

const { fcProactiveHelp, fcProactiveHelpGroupList } = storeToRefs(adminStore);
const formComponentGroupNames = computed(() =>
  Object.keys(FormComponentProactiveHelpValues).filter((name) => name !== '')
);

watch(fcProactiveHelp, async () => {
  await refreshData();
});

onMounted(async () => {
  await refreshData();
});

async function refreshData() {
  loading.value = true;
  await adminStore.listFCProactiveHelp();
  loading.value = false;
}

//extract all components in the select group in form builder
function extractGroupComponents(groupName) {
  let groupComponents = [];
  for (let [title, components] of Object.entries(
    FormComponentProactiveHelpValues
  )) {
    if (title && title === groupName && components) {
      for (let componentName of components) {
        groupComponents.push({ componentName: componentName });
      }
    }
  }
  return groupComponents;
}
</script>

<template>
  <div class="mt-5">
    <v-skeleton-loader :loading="loading">
      <v-expansion-panels
        class="nrmc-expand-collapse"
        data-cy="info_link_expansion_panels"
      >
        <v-expansion-panel
          v-for="(groupName, index) in formComponentGroupNames"
          :key="index"
        >
          <v-expansion-panel-title>
            <div class="header">
              <strong>{{ groupName }}</strong>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <GeneralLayout
              :group-name="groupName"
              :form-component-names="extractGroupComponents(groupName)"
              :form-component-data="
                fcProactiveHelpGroupList && fcProactiveHelpGroupList[groupName]
                  ? fcProactiveHelpGroupList[groupName]
                  : []
              "
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-skeleton-loader>
  </div>
</template>

<style lang="scss" scoped>
// Customized expand/collapse section
.nrmc-expand-collapse {
  min-height: 50px;
  .v-expansion-panel--active > .v-expansion-panel-title {
    min-height: 50px;
    background: #f1f8ff;
  }

  .v-expansion-panel-title {
    padding: 10px;
    background: #bfbdbd14;
    border: 1px solid #7070703f;

    .header {
      font-weight: normal;
      font-style: normal;
      font-family: BCSans !important;
      font-size: 18px;
      color: #313132;
    }

    &:hover {
      background: #f1f8ff;
    }
  }

  .v-expansion-panel:not(.v-expansion-panel--active) {
    margin-bottom: 5px;
  }

  .v-expansion-panel-title:hover {
    background: '#F1F8FF';
  }

  .v-expansion-panel-text__wrap {
    padding-top: 8px;
    padding-bottom: 0px !important;
  }
}
</style>
