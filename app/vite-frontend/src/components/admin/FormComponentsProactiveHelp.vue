<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

import GeneralLayout from '~/components/forms/infolinks/GeneralLayout.vue';
import { useAdminStore } from '~/store/admin';

const adminStore = useAdminStore();

const layout = ref({
  'Basic Layout': [
    'Text/Images',
    'Columns - 2',
    'Columns - 3',
    'Columns - 4',
    'Tabs',
    'Panel',
  ],
  'Basic Fields': [
    'Text Field',
    'Multi-line Text',
    'Select List',
    'Checkbox',
    'Checkbox Group',
    'Radio Group',
    'Number',
    'Phone Number',
    'Email',
    'Date / Time',
    'Day',
  ],
  'Advanced Layout': [
    'HTML Element',
    'Content',
    'Columns',
    'Field Set',
    'Panel',
    'Table',
    'Tabs',
    'Well',
  ],
  'Advanced Fields': [
    'Text Field',
    'Email',
    'Text Area',
    'Url',
    'Number',
    'Phone Number',
    'Tags',
    'Address',
    'Password',
    'Date / Time',
    'Checkbox',
    'Day',
    'Time',
    'Select Boxes',
    'Select',
    'Currency',
    'Radio',
    'Survey',
    'Signature',
  ],
  'Advanced Data': [
    'Hidden',
    'Container',
    'Data Map',
    'Data Grid',
    'Edit Grid',
    'Tree',
  ],
  'BC Government': ['File Upload', 'Business Name Search', 'BC Address'],
});
const isPanelOpened = ref(new Map());
const groupComponentsList = ref([]);

const { fcProactiveHelp, fcProactiveHelpGroupList } = storeToRefs(adminStore);

const groupList = computed(() => extractGroups());

function onExpansionPanelClick(groupName) {
  if (
    isPanelOpened.value.get(groupName) === undefined ||
    !isPanelOpened.value.get(groupName)
  ) {
    isPanelOpened.value.set(groupName, true);
    groupComponentsList.value = extractGroupComponents(groupName);
  } else {
    isPanelOpened.value.set(groupName, false);
  }

  for (let key of isPanelOpened.value.keys()) {
    if (key !== groupName) {
      isPanelOpened.value.set(key, false);
    }
  }
}

//extract form builder layout groups.
function extractGroups() {
  let allgroups = [];
  for (let [title] of Object.entries(layout.value)) {
    if (title) {
      allgroups.push(title);
    }
  }
  return allgroups;
}

//extract all components in the select group in form builder
function extractGroupComponents(groupName) {
  let groupComponents = [];
  for (let [title, components] of Object.entries(layout.value)) {
    if (title && title === groupName && components) {
      for (let componentName of components) {
        groupComponents.push({ componentName: componentName });
      }
    }
  }
  return groupComponents;
}

watch(fcProactiveHelp, () => {
  adminStore.listFCProactiveHelp();
});

onMounted(() => {
  adminStore.listFCProactiveHelp();
});
</script>

<template>
  <div class="mt-5">
    <v-expansion-panels
      class="nrmc-expand-collapse"
      data-cy="info_link_expansion_panels"
    >
      <v-expansion-panel
        v-for="(groupName, index) in groupList"
        :key="index"
        @click="onExpansionPanelClick(groupName)"
      >
        <v-expansion-panel-title>
          <div class="header">
            <strong>{{ groupName }}</strong>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <GeneralLayout
            :group-name="groupName"
            :layout-list="groupComponentsList"
            :components-list="
              fcProactiveHelpGroupList && fcProactiveHelpGroupList[groupName]
                ? fcProactiveHelpGroupList[groupName]
                : []
            "
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
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
