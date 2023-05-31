<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';

import getRouter from '~/router';

const props = defineProps({
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
});

const emits = defineEmits(['undo', 'redo', 'save']);

const router = getRouter();

const fabItemsDirection = ref('column-reverse');
const isFABActionsOpen = ref(true);
const fabItemsPosition = ref({});
const fabItemsSize = ref(36);
const fabItemsIconsSize = ref(31);

//base fab item variable start
const baseFABItemName = ref('Collapse');
const baseIconName = ref('mdi:mdi-close');
const baseIconColor = ref('#ffffff'); //end

// fab items icons variables start
const fabItemsColor = ref('#1A5A96');
const fabItemsInvertedColor = ref('#ffffff');
const disabledInvertedFabItemsColor = ref('#ffffff');
const disabledFabItemsColor = ref('#707070C1'); // end

const scrollIconName = ref('mdi:mdi-arrow-down');
const scrollName = ref('Bottom');

watch(props.size, () => {
  setSizes();
});

onMounted(() => {
  window.scrollTo(0, 0);
  setPosition();
  setSizes();
});

onUnmounted(() => {
  window.addEventListener('scroll', handleScroll);
});

function toParent(name) {
  emits(name);
}

function onOpenFABActionItems() {
  if (isFABActionsOpen.value) {
    baseIconName.value = 'mdi:mdi-menu';
    isFABActionsOpen.value = false;
    baseFABItemName.value = 'Actions';
  } else {
    baseIconName.value = 'mdi:mdi-close';
    isFABActionsOpen.value = true;
    baseFABItemName.value = 'Collapse';
  }
}

function gotoPreview() {
  let route = router.push({
    name: 'FormPreview',
    query: { f: props.formId, d: props.draftId },
  });
  window.open(route.href);
}
function setSizes() {
  switch (props.size) {
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
  if (props.placement === 'top-right' || props.placement === 'top-left') {
    fabItemsDirection.value = 'column';
  }
}

//checks if FAB is placed at the bottom right or bottom left of the screen
function bottomLeftRight() {
  if (props.placement === 'bottom-right' || props.placement === 'bottom-left') {
    fabItemsDirection.value = 'column-reverse';
  }
}

// set where on the screen FAB will be displayed
function setPosition() {
  fabItemsPosition.value = {};

  bottomLeftRight();
  topLeftRight();

  if (
    props.positionOffset.value &&
    Object.keys(props.positionOffset.value).length > 0
  ) {
    Object.assign(fabItemsPosition.value, props.positionOffset.value);
    return;
  }
  switch (props.placement) {
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
    scrollName.value = 'Bottom';
  } else if (
    window.pageYOffset + window.innerHeight >=
    document.documentElement.scrollHeight - 50
  ) {
    scrollIconName.value = 'mdi:mdi-arrow-up';
    scrollName.value = 'Top';
  }
}

// function for click scroll event
function onHandleScroll() {
  if (window.scrollY === 0) {
    bottomScroll();
  } else if (scrollName.value === 'Bottom' && window.scrollY > 0) {
    bottomScroll();
  } else if (scrollName.value === 'Top' && window.scrollY > 0) {
    topScroll();
  } else {
    topScroll();
  }
}
function topScroll() {
  window.scrollTo(0, 0);
  scrollIconName.value = 'mdi:mdi-arrow-down';
  scrollName.value = 'Bottom';
}
function bottomScroll() {
  window.scrollTo({
    left: 0,
    top: document.body.scrollHeight,
    behavior: 'smooth',
  });
  scrollIconName.value = 'mdi:mdi-arrow-up';
  scrollName.value = 'Top';
}

window.addEventListener('scroll', handleScroll);
</script>

<template>
  <div
    :style="[
      {
        display: 'flex',
        width: '92px',
        flexDirection: fabItemsDirection,
        gap: fabItemsGap,
        zIndex: fabZIndex,
        position: 'fixed',
      },
      fabItemsPosition,
    ]"
  >
    <div class="fabAction" @click="onOpenFABActionItems">
      {{ baseFABItemName }}
      <v-avatar class="fabItemsInverColor" :size="fabItemsSize">
        <v-icon
          :color="baseIconColor"
          :size="fabItemsIconsSize"
          :icon="baseIconName"
        >
        </v-icon>
      </v-avatar>
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
          name: 'FormManage',
          query: { f: formId, fd: 'formDesigner', d: draftId },
        }"
        custom
      >
        <div
          ref="publishRouterLink"
          role="link"
          data-cy="publishRouterLink"
          :class="{ fabAction: true, 'disabled-router': !formId }"
        >
          <div v-text="'Publish'" />
          <v-avatar
            class="fabItemsInverColor"
            :size="fabItemsSize"
            @click="navigate"
          >
            <v-icon
              :color="
                saved ? fabItemsInvertedColor : disabledInvertedFabItemsColor
              "
              :size="fabItemsIconsSize"
              icon="mdi:mdi-file-upload"
            >
            </v-icon>
          </v-avatar>
        </div>
      </router-link>
      <router-link
        v-slot="{ navigate }"
        :to="{ name: 'FormManage', query: { f: formId } }"
        custom
      >
        <div
          ref="settingsRouterLink"
          role="link"
          data-cy="settingsRouterLink"
          :class="{ fabAction: true, 'disabled-router': !formId }"
        >
          <div v-text="'Manage'" />
          <v-avatar
            class="fabItemsInverColor"
            :size="fabItemsSize"
            @click="navigate"
          >
            <v-icon
              :color="
                saved ? fabItemsInvertedColor : disabledInvertedFabItemsColor
              "
              :size="fabItemsIconsSize"
              icon="mdi:mdi-cog"
            >
            </v-icon>
          </v-avatar>
        </div>
      </router-link>

      <div
        ref="redoButton"
        class="fabAction"
        data-cy="redoButton"
        :class="{ 'disabled-router': !redoEnabled }"
      >
        <div v-text="'Redo'" />
        <v-avatar
          class="fabItems"
          :size="fabItemsSize"
          @click="toParent('redo')"
        >
          <v-icon
            :color="redoEnabled ? fabItemsColor : disabledFabItemsColor"
            :size="fabItemsIconsSize"
            icon="mdi:mdi-redo"
          >
          </v-icon>
        </v-avatar>
      </div>
      <div
        ref="undoButton"
        class="fabAction"
        data-cy="undoButton"
        :class="{ 'disabled-router': !undoEnabled }"
      >
        <div v-text="'Undo'" />
        <v-avatar
          class="fabItems"
          :size="fabItemsSize"
          @click="toParent('undo')"
        >
          <v-icon
            :color="undoEnabled ? fabItemsColor : disabledFabItemsColor"
            :size="fabItemsIconsSize"
            icon="mdi:mdi-undo"
          >
          </v-icon>
        </v-avatar>
      </div>
      <div
        ref="previewRouterLink"
        class="fabAction"
        :class="{ 'disabled-router': !formId || !draftId }"
        @click="gotoPreview"
      >
        <div v-text="'Preview'" />
        <v-avatar class="fabItems" :size="fabItemsSize">
          <v-icon
            :color="formId ? fabItemsColor : disabledFabItemsColor"
            :size="fabItemsIconsSize"
            icon="mdi:mdi-eye"
          >
          </v-icon>
        </v-avatar>
      </div>
      <div
        ref="saveButton"
        class="fabAction"
        data-cy="saveButton"
        :class="{ 'disabled-router': isFormSaved }"
      >
        <div>{{ savedStatus }}</div>
        <v-avatar
          class="fabItems"
          :size="fabItemsSize"
          @click="toParent('save')"
        >
          <v-icon
            v-if="!saving"
            :color="!isFormSaved ? fabItemsColor : disabledFabItemsColor"
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
        </v-avatar>
      </div>
      <div class="fabAction">
        <div>{{ scrollName }}</div>

        <v-avatar class="fabItems" :size="fabItemsSize" @click="onHandleScroll">
          <v-icon
            :color="fabItemsColor"
            :size="fabItemsIconsSize"
            :icon="scrollIconName"
          >
          </v-icon>
        </v-avatar>
      </div>
    </div>
    <div v-if="!isFABActionsOpen" class="fabAction">
      <div>{{ scrollName }}</div>
      <v-avatar class="fabItems" :size="fabItemsSize" @click="onHandleScroll">
        <v-icon
          :color="fabItemsColor"
          :size="fabItemsIconsSize"
          :icon="scrollIconName"
        >
        </v-icon>
      </v-avatar>
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
</style>
