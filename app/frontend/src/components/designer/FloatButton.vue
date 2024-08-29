<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { useFormStore } from '~/store/form';

const { t, locale } = useI18n({ useScope: 'global' });

const router = useRouter();

const properties = defineProps({
  formId: {
    type: String,
    default: null,
  },
  draftId: {
    type: String,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  undoEnabled: {
    type: Boolean,
    default: false,
  },
  redoEnabled: {
    type: Boolean,
    default: false,
  },
  saved: {
    type: Boolean,
    default: false,
  },
  isFormSaved: Boolean,
  canSave: Boolean,
  savedStatus: {
    type: String,
    default: null,
  },
  placement: {
    type: String,
    default: 'bottom-right',
  },
  fabItemsGap: {
    type: String,
    default: '13px',
  },
  size: {
    type: String,
    default: 'medium',
  },
  fabZIndex: {
    type: Number,
    default: 1000,
  },
  positionOffset: {
    type: Object,
    validator: function (value) {
      // The value must match one of these strings
      return ['top', 'bottom', 'right', 'left'].includes(...Object.keys(value));
    },
    default: () => {
      return { bottom: true, right: true };
    },
  },
  newVersion: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['undo', 'redo', 'save']);

const fabItemsDirection = ref('column-reverse');
const isFABActionsOpen = ref(true);
const fabItemsPosition = ref({});
const fabItemsSize = ref(36);
const fabItemsIconsSize = ref(31);

// base fab item variable start
const baseFABItemName = ref(t('trans.floatButton.collapse'));
const baseIconName = ref('mdi:mdi-close');
const baseIconColor = ref('#ffffff');

// fab items icons variables start
const fabItemsColor = ref('#1A5A96');
const fabItemsInverColor = ref('#ffffff');
const disabledInvertedFabItemsColor = ref('#707070C1');
const disabledFabItemsColor = ref('#707070C1');

const savedMsg = ref(t('trans.floatButton.save'));
const scrollIconName = ref('mdi:mdi-arrow-down');
const scrollName = ref(t('trans.floatButton.bottom'));

const formStore = useFormStore();

const { isRTL } = storeToRefs(formStore);

const computedStyles = computed(() => {
  let baseStyles = {
    display: 'flex',
    width: '92px',
    flexDirection: fabItemsDirection.value,
    gap: properties.fabItemsGap,
    zIndex: properties.fabZIndex,
    position: 'fixed',
    right: '0',
    bottom: '20px',
  };

  let conditionalStyles = {};
  let fabItemsPosition = { ...fabItemsPosition.value };

  switch (locale) {
    case 'uk':
      baseStyles.width = '111px';
      fabItemsPosition.right = '-.3vw';
      break;
  }

  return [baseStyles, fabItemsPosition, conditionalStyles];
});

const isPublishEnabled = computed(() =>
  properties.newVersion ? false : properties.formId && properties.draftId
);

const isManageEnabled = computed(() => properties.formId);

watch(
  () => properties.size,
  () => {
    setSizes();
  }
);

watch(
  () => properties.savedStatus,
  (value) => {
    switch (value) {
      case 'Saved':
        savedMsg.value = t('trans.floatButton.saved');
        break;
      case 'Save':
        savedMsg.value = t('trans.floatButton.save');
        break;
      case 'Saving':
        savedMsg.value = t('trans.floatButton.saving');
        break;
      case 'Not Saved':
        savedMsg.value = t('trans.floatButton.notSaved');
        break;
    }
  }
);

window.addEventListener('scroll', handleScroll);

onMounted(() => {
  window.scrollTo(0, 0);
  setPosition();
  setSizes();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

function toParent(name) {
  emit(name);
}

function onOpenFABActionItems() {
  if (isFABActionsOpen.value) {
    baseIconName.value = 'mdi:mdi-menu';
    isFABActionsOpen.value = false;
    baseFABItemName.value = t('trans.floatButton.actions');
  } else {
    baseIconName.value = 'mdi:mdi-close';
    isFABActionsOpen.value = true;
    baseFABItemName.value = t('trans.floatButton.collapse');
  }
}

function gotoPreview() {
  let route = router.resolve({
    name: 'FormPreview',
    query: { f: properties.formId, d: properties.draftId },
  });
  window.open(route.href);
}

function setSizes() {
  switch (properties.size) {
    case 'x-large':
      fabItemsSize.value = 52;
      fabItemsIconsSize.value = 47;
      break;
    case 'large':
      fabItemsSize.value = 44;
      fabItemsIconsSize.value = 39;
      break;
    case 'medium':
      fabItemsSize.value = 36;
      fabItemsIconsSize.value = 31;
      break;
    case 'small':
      fabItemsSize.value = 28;
      fabItemsIconsSize.value = 18;
      break;
    default:
      fabItemsSize.value = 36;
      fabItemsIconsSize.value = 31;
  }
}

//checks if FAB is placed at the top right or top left of the screen
function topLeftRight() {
  if (
    properties.placement === 'top-right' ||
    properties.placement === 'top-left'
  ) {
    fabItemsDirection.value = 'column';
  }
}

//checks if FAB is placed at the bottom right or bottom left of the screen
function bottomLeftRight() {
  if (
    properties.placement === 'bottom-right' ||
    properties.placement === 'bottom-left'
  ) {
    fabItemsDirection.value = 'column-reverse';
  }
}

// set where on the screen FAB will be displayed
function setPosition() {
  fabItemsPosition.value = {};

  bottomLeftRight();
  topLeftRight();

  if (
    properties.positionOffset &&
    Object.keys(properties.positionOffset).length > 0
  ) {
    Object.assign(fabItemsPosition.value, properties.positionOffset);
    return;
  }
  switch (properties.placement) {
    case 'bottom-right':
      fabItemsPosition.value.right = '-.5vw';
      fabItemsPosition.value.bottom = '7vh';
      break;
    case 'bottom-left':
      fabItemsPosition.value.left = '5vw';
      fabItemsPosition.value.bottom = '4vh';
      break;
    case 'top-left':
      fabItemsPosition.value.left = '5vw';
      fabItemsPosition.value.top = '4vh';
      break;
    case 'top-right':
      fabItemsPosition.value.right = '1vw';
      fabItemsPosition.value.top = '8vh';
      break;
    default:
      fabItemsPosition.value.right = '5vw';
      fabItemsPosition.value.bottom = '4vh';
  }
}

// callback function for window scroll event
function handleScroll() {
  if (window.scrollY === 0) {
    scrollIconName.value = 'mdi:mdi-arrow-down';
    scrollName.value = t('trans.floatButton.bottom');
  } else if (
    window.pageYOffset + window.innerHeight >=
    document.documentElement.scrollHeight - 50
  ) {
    scrollIconName.value = 'mdi:mdi-arrow-up';
    scrollName.value = t('trans.floatButton.top');
  }
}

// function for click scroll event
function onHandleScroll() {
  if (window.scrollY === 0) {
    bottomScroll();
  } else if (
    scrollName.value === t('trans.floatButton.bottom') &&
    window.scrollY > 0
  ) {
    bottomScroll();
  } else if (
    scrollName.value === t('trans.floatButton.top') &&
    window.scrollY > 0
  ) {
    topScroll();
  } else {
    topScroll();
  }
}

function topScroll() {
  window.scrollTo(0, 0);
  scrollIconName.value = 'mdi:mdi-arrow-down';
  scrollName.value = t('trans.floatButton.bottom');
}

function bottomScroll() {
  window.scrollTo({
    left: 0,
    top: document.body.scrollHeight,
    behavior: 'smooth',
  });
  scrollIconName.value = 'mdi:mdi-arrow-up';
  scrollName.value = t('trans.floatButton.top');
}
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }" :style="computedStyles">
    <div class="fabAction" :lang="locale" @click="onOpenFABActionItems">
      <div class="text" :lang="locale" v-text="baseFABItemName" />
      <v-btn
        class="fabItemsInverColor"
        :size="fabItemsSize"
        :title="baseFABItemName"
      >
        <v-icon
          :color="baseIconColor"
          :size="fabItemsIconsSize"
          :icon="baseIconName"
        >
        </v-icon>
      </v-btn>
    </div>
    <div
      v-if="isFABActionsOpen"
      :style="[
        { display: 'flex', flexDirection: fabItemsDirection, gap: fabItemsGap },
      ]"
    >
      <router-link
        v-slot="{ navigate }"
        :to="{
          name: 'PublishForm',
          query: { f: formId, fd: true, d: draftId },
        }"
        custom
      >
        <div
          ref="publishRouterLink"
          role="link"
          data-cy="publishRouterLink"
          :class="{ fabAction: true, 'disabled-router': !isPublishEnabled }"
        >
          <div
            class="text"
            :lang="locale"
            v-text="$t('trans.floatButton.publish')"
          />
          <v-btn
            :class="{
              fabItemsInverColor: isPublishEnabled,
              disabledInvertedFabItemsColor: !isPublishEnabled,
            }"
            :size="fabItemsSize"
            :title="$t('trans.floatButton.publish')"
            @click="navigate"
          >
            <v-icon
              :color="
                isPublishEnabled
                  ? fabItemsInverColor
                  : disabledInvertedFabItemsColor
              "
              :size="fabItemsIconsSize"
              icon="mdi:mdi-file-upload"
            >
            </v-icon>
          </v-btn>
        </div>
      </router-link>
      <router-link
        v-slot="{ navigate }"
        :to="{
          name: 'FormManage',
          query: { f: formId, fd: false, d: draftId },
        }"
        custom
      >
        <div
          ref="settingsRouterLink"
          role="link"
          data-cy="settingsRouterLink"
          :class="{ fabAction: true, 'disabled-router': !isManageEnabled }"
        >
          <div
            class="text"
            :lang="locale"
            v-text="$t('trans.floatButton.manage')"
          />
          <v-btn
            :class="{
              fabItemsInverColor: isManageEnabled,
              disabledInvertedFabItemsColor: !isManageEnabled,
            }"
            :size="fabItemsSize"
            :title="$t('trans.floatButton.manage')"
            @click="navigate"
          >
            <v-icon
              :color="
                isManageEnabled
                  ? fabItemsInverColor
                  : disabledInvertedFabItemsColor
              "
              :size="fabItemsIconsSize"
              icon="mdi:mdi-cog"
            >
            </v-icon>
          </v-btn>
        </div>
      </router-link>

      <div
        ref="redoButton"
        class="fabAction"
        data-cy="redoButton"
        :class="{ 'disabled-router': !redoEnabled }"
      >
        <div
          class="text"
          :lang="locale"
          v-text="$t('trans.floatButton.redo')"
        />
        <v-btn
          class="fabItems"
          :size="fabItemsSize"
          :title="$t('trans.floatButton.redo')"
          @click="toParent('redo')"
        >
          <v-icon
            :color="redoEnabled ? fabItemsColor : disabledFabItemsColor"
            :size="fabItemsIconsSize"
            icon="mdi:mdi-redo"
          >
          </v-icon>
        </v-btn>
      </div>
      <div
        ref="undoButton"
        class="fabAction"
        data-cy="undoButton"
        :class="{ 'disabled-router': !undoEnabled }"
      >
        <div
          class="text"
          :lang="locale"
          v-text="$t('trans.floatButton.undo')"
        />
        <v-btn
          class="fabItems"
          :size="fabItemsSize"
          :title="$t('trans.floatButton.undo')"
          @click="toParent('undo')"
        >
          <v-icon
            :color="undoEnabled ? fabItemsColor : disabledFabItemsColor"
            :size="fabItemsIconsSize"
            icon="mdi:mdi-undo"
          >
          </v-icon>
        </v-btn>
      </div>
      <div
        ref="previewRouterLink"
        class="fabAction"
        :class="{ 'disabled-router': !formId || !draftId }"
        @click="gotoPreview"
      >
        <div
          class="text"
          :lang="locale"
          v-text="$t('trans.floatButton.preview')"
        />
        <v-btn
          class="fabItems"
          :size="fabItemsSize"
          :title="$t('trans.floatButton.preview')"
        >
          <v-icon
            :color="formId ? fabItemsColor : disabledFabItemsColor"
            :size="fabItemsIconsSize"
            icon="mdi:mdi-eye"
          >
          </v-icon>
        </v-btn>
      </div>
      <div
        ref="saveButton"
        class="fabAction"
        data-cy="saveButton"
        :class="{ 'disabled-router': isFormSaved && !canSave }"
      >
        <div class="text" :lang="locale">{{ savedMsg }}</div>
        <v-btn
          class="fabItems"
          :size="fabItemsSize"
          :title="savedMsg"
          @click="canSave ? toParent('save') : null"
        >
          <v-icon
            v-if="!saving"
            :color="
              !isFormSaved && canSave ? fabItemsColor : disabledFabItemsColor
            "
            :size="fabItemsIconsSize"
            dark
            icon="mdi:mdi-content-save"
          >
          </v-icon>

          <v-progress-circular
            v-if="saving"
            indeterminate
            color="#1A5A96"
            size="25"
          ></v-progress-circular>
        </v-btn>
      </div>
      <div class="fabAction">
        <div :lang="locale">{{ scrollName }}</div>

        <v-btn
          class="fabItems"
          :size="fabItemsSize"
          :title="scrollName"
          @click="onHandleScroll"
        >
          <v-icon
            :color="fabItemsColor"
            :size="fabItemsIconsSize"
            :icon="scrollIconName"
          >
          </v-icon>
        </v-btn>
      </div>
    </div>
    <div v-if="!isFABActionsOpen" class="fabAction">
      <div :lang="locale">{{ scrollName }}</div>
      <v-btn
        class="fabItems"
        :size="fabItemsSize"
        :title="scrollName"
        @click="onHandleScroll"
      >
        <v-icon
          :color="fabItemsColor"
          :size="fabItemsIconsSize"
          :icon="scrollIconName"
        >
        </v-icon>
      </v-btn>
    </div>
  </div>
</template>

<style>
/* disable router-link */
.disabled-router {
  pointer-events: none;
}

.fabAction {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  align-content: center;
  overflow: hidden;
  width: auto;
  height: auto;
  pointer-events: cursor;
  color: #313132;
  font-size: 12px;
  font-style: normal;
  font-weight: normal;
  font-family: BCSans !important;
  cursor: pointer;
  border-radius: 100%;
}

.fabItemsInverColor {
  background: #1a5a96 0% 0% no-repeat padding-box;
  border-radius: 100%;
  box-shadow: 0px 3px 6px #00000029;
  transition: background 1s;
}

.fabItemsInverColor:hover {
  background: #003366 0% 0% no-repeat padding-box;
  border: none;
}

.disabledInvertedFabItemsColor {
  border-radius: 100%;
  box-shadow: 0px 3px 6px #00000029;
  transition: background 1s;
}

.fabItems {
  background: #ffffff 0% 0% no-repeat padding-box;
  border: 1px solid #70707063;
  transition: border 1s;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-radius: 100%;
  box-shadow: 0px 3px 6px #00000029;
}

.fabItems:hover {
  border: 1px solid #003366;
}
.text {
  text-align: center;
}
</style>
