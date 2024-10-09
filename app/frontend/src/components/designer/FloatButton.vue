<script setup>
import { computed, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { locale, t } = useI18n({ useScope: 'global' });

const router = useRouter();

const properties = defineProps({
  formId: {
    type: String,
    default: null,
  },
  canSave: {
    type: Boolean,
    default: false,
  },
  draftId: {
    type: String,
    default: null,
  },
  isFormSaved: {
    type: Boolean,
    default: false,
  },
  isManageEnabled: {
    type: Boolean,
    default: false,
  },
  isSaving: {
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
  newVersion: {
    type: Boolean,
    default: false,
  },
  savedStatus: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['redo', 'save', 'undo']);

const isAtTopOfPage = ref(true);
const isCollapsed = ref(false);

// We need to handle scroll through an event listener because computed values do not update on a scroll event
window.addEventListener('scroll', onEventScroll);

onUnmounted(() => {
  window.removeEventListener('scroll', onEventScroll);
});

// This is the icon for the button that lets you scroll to the bottom or top of the page
const SCROLL_ICON = computed(() => {
  if (!isAtTopOfPage.value) {
    return 'mdi:mdi-arrow-up';
  }
  return 'mdi:mdi-arrow-down';
});

// This is the text for the button that lets you scroll to the bottom or top of the page
const SCROLL_TEXT = computed(() => {
  if (!isAtTopOfPage.value) {
    return t('trans.floatButton.top');
  }
  return t('trans.floatButton.bottom');
});

// This is the icon for the button that lets you collapse the actions
const COLLAPSE_ICON = computed(() => {
  if (!isCollapsed.value) {
    return 'mdi:mdi-close';
  }
  return 'mdi:mdi-menu';
});

// This is the text for the button that lets you collapse the actions
const COLLAPSE_TEXT = computed(() => {
  if (!isCollapsed.value) {
    return t('trans.floatButton.collapse');
  }
  return t('trans.floatButton.actions');
});

// This is the text for the button that lets you save
const SAVE_TEXT = computed(() => {
  if (properties.savedStatus === 'Saved') {
    return t('trans.floatButton.saved');
  } else if (properties.savedStatus === 'Saving') {
    return t('trans.floatButton.saving');
  } else if (properties.savedStatus === 'Not Saved') {
    return t('trans.floatButton.notSaved');
  }
  return t('trans.floatButton.save');
});

const isManageEnabled = computed(() => properties.formId);

const isPublishEnabled = computed(() =>
  properties.newVersion ? false : properties.formId && properties.draftId
);

function onEventScroll() {
  isAtTopOfPage.value = window.scrollY === 0 ? true : false;
}

function onClickCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

function onClickSave() {
  emit('save');
}

function onClickScroll() {
  window.scrollTo({
    left: 0,
    top: isAtTopOfPage.value ? document.body.scrollHeight : 0,
    behavior: 'smooth',
  });
}

function goToPreview() {
  let route = router.resolve({
    name: 'FormPreview',
    query: { f: properties.formId, d: properties.draftId },
  });
  window.open(route.href);
}

defineExpose({
  COLLAPSE_ICON,
  COLLAPSE_TEXT,
  isAtTopOfPage,
  isCollapsed,
  onClickCollapse,
  onClickSave,
  onClickScroll,
  onEventScroll,
  SAVE_TEXT,
  SCROLL_ICON,
  SCROLL_TEXT,
});
</script>

<template>
  <div class="d-flex flex-column float-button">
    <div class="fab d-flex flex-column">
      <span :lang="locale">{{ SCROLL_TEXT }}</span>
      <v-btn class="ma-2" density="compact" icon @click="onClickScroll">
        <v-icon :icon="SCROLL_ICON"></v-icon>
      </v-btn>
    </div>
    <div v-if="!isCollapsed">
      <div class="fab d-flex flex-column" data-cy="saveButton">
        <span :lang="locale">{{ SAVE_TEXT }}</span>
        <v-btn
          :disabled="!properties.canSave && properties.isFormSaved"
          class="ma-2"
          density="compact"
          icon
          @click="onClickSave"
        >
          <v-icon
            v-if="!properties.isSaving"
            icon="mdi:mdi-content-save"
          ></v-icon>
          <v-progress-circular v-else indeterminate></v-progress-circular>
        </v-btn>
      </div>
      <div
        class="fab d-flex flex-column"
        :class="{
          'disabled-router': !properties.formId || !properties.draftId,
        }"
        data-cy="previewRouterLink"
        @click="goToPreview"
      >
        <span :lang="locale">{{ $t('trans.floatButton.preview') }}</span>
        <v-btn
          :disabled="!(!properties.formId || !properties.draftId)"
          class="ma-2"
          density="compact"
          icon
        >
          <v-icon icon="mdi:mdi-eye"></v-icon>
        </v-btn>
      </div>
      <div class="fab d-flex flex-column" data-cy="undoButton">
        <span :lang="locale">{{ $t('trans.floatButton.undo') }}</span>
        <v-btn
          :disabled="!properties.undoEnabled"
          class="ma-2"
          density="compact"
          icon
          @click="$emit('undo')"
        >
          <v-icon icon="mdi:mdi-undo"></v-icon>
        </v-btn>
      </div>
      <div class="fab d-flex flex-column" data-cy="redoButton">
        <span :lang="locale">{{ $t('trans.floatButton.redo') }}</span>
        <v-btn
          :disabled="!properties.redoEnabled"
          class="ma-2"
          density="compact"
          icon
          @click="$emit('redo')"
        >
          <v-icon icon="mdi:mdi-redo"></v-icon>
        </v-btn>
      </div>
      <router-link
        v-slot="{ navigate }"
        :to="{
          name: 'FormManage',
          query: { f: properties.formId, fd: false, d: properties.draftId },
        }"
        custom
      >
        <div
          class="fab d-flex flex-column"
          :class="{ 'disabled-router': !isManageEnabled }"
          data-cy="settingsRouterLink"
        >
          <span :lang="locale">{{ $t('trans.floatButton.manage') }}</span>
          <v-btn
            :disabled="!isManageEnabled"
            class="ma-2 inverted-colour"
            density="compact"
            icon
            @click="navigate"
          >
            <v-icon icon="mdi:mdi-cog"></v-icon>
          </v-btn>
        </div>
      </router-link>
      <router-link
        v-slot="{ navigate }"
        :to="{
          name: 'PublishForm',
          query: { f: properties.formId, fd: true, d: properties.draftId },
        }"
        custom
      >
        <div
          class="fab d-flex flex-column"
          :class="{ 'disabled-router': !isPublishEnabled }"
          data-cy="publishRouterLink"
          role="link"
        >
          <span :lang="locale">{{ $t('trans.floatButton.publish') }}</span>
          <v-btn
            :disabled="!isPublishEnabled"
            class="ma-2 inverted-colour"
            density="compact"
            icon
            @click="navigate"
          >
            <v-icon icon="mdi:mdi-file-upload"></v-icon>
          </v-btn>
        </div>
      </router-link>
    </div>
    <div class="fab d-flex flex-column">
      <span :lang="locale">{{ COLLAPSE_TEXT }}</span>
      <v-btn
        class="ma-2 inverted-colour"
        density="compact"
        icon
        @click="onClickCollapse"
      >
        <v-icon :icon="COLLAPSE_ICON"></v-icon>
      </v-btn>
    </div>
  </div>
</template>

<style lang="scss">
.float-button {
  min-width: 80px;
  padding-right: 20px;
  padding-bottom: 40px;
}

.fab {
  justify-content: center;
  align-items: center;
  align-content: center;
  font-size: 12px;
  font-style: normal;
  font-weight: normal;
  font-family: BCSans !important;

  .v-btn {
    margin-top: 2px !important;
    margin-bottom: 12px !important;
  }

  .v-icon {
    font-size: 18px;
    color: #1a5a96;
  }

  .v-btn.v-btn--disabled {
    background-color: white;
  }

  .v-btn.v-btn--disabled .v-btn__overlay {
    background-color: rgba(0, 0, 0, 0.26);
  }

  .v-btn--disabled .v-icon {
    color: #707070c1 !important;
  }

  .inverted-colour {
    background: #1a5a96;
  }

  .inverted-colour .v-icon {
    color: white;
  }
}
</style>
