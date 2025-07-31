<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useFormStore } from '~/store/form';

const formStore = useFormStore();

const { locale, t } = useI18n({ useScope: 'global' });

const router = useRouter();

const properties = defineProps({
  formSchema: {
    type: Object,
    required: true,
  },
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

const { form } = storeToRefs(formStore);

const emit = defineEmits(['redo', 'save', 'undo', 'export', 'import']);

const isAtTopOfPage = ref(true);

// // We need to handle scroll through an event listener because computed values do not update on a scroll event
// window.addEventListener('scroll', onEventScroll);

// onUnmounted(() => {
//   window.removeEventListener('scroll', onEventScroll);
// });

// This is the icon for the button that lets you scroll to the bottom or top of the page
const SCROLL_ICON = computed(() => {
  if (!isAtTopOfPage.value) {
    return 'mdi:mdi-arrow-up';
  }
  return 'mdi:mdi-arrow-down';
});

// This is the text for the button that lets you scroll to the bottom or top of the page
// const SCROLL_TEXT = computed(() => {
//   if (!isAtTopOfPage.value) {
//     return t('trans.floatButton.top');
//   }
//   return t('trans.floatButton.bottom');
// });

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

// function onEventScroll() {
//   isAtTopOfPage.value = window.scrollY === 0 ? true : false;
// }

function onClickSave() {
  emit('save');
}

// function onClickScroll() {
//   window.scrollTo({
//     left: 0,
//     top: isAtTopOfPage.value ? document.body.scrollHeight : 0,
//     behavior: 'smooth',
//   });
// }

const canPreview = computed(() => {
  return !!(properties.formId && properties.draftId);
});

function handlePreviewClick() {
  if (canPreview.value) {
    goToPreview();
  }
}

function goToPreview() {
  let route = router.resolve({
    name: 'FormPreview',
    query: { f: properties.formId, d: properties.draftId },
  });
  window.open(route.href);
}

defineExpose({
  isAtTopOfPage,
  onClickSave,
  //onClickScroll,
  // onEventScroll,
  SAVE_TEXT,
  SCROLL_ICON,
  //SCROLL_TEXT,
});
</script>

<template>
  <v-toolbar
    class="sticky-toolbar pt-2"
    color="white"
    density="comfortable"
    flat
  >
    <!-- Scroll Button -->
    <!-- <div class="d-flex flex-column align-center  ">
      <span :lang="locale">{{ SCROLL_TEXT }}</span>
      <v-btn density="compact" icon @click="onClickScroll">
        <v-icon :icon="SCROLL_ICON"></v-icon>
      </v-btn>
    </div> -->

    <v-spacer></v-spacer>

    <div class="d-flex flex-column align-center">
      <v-btn
        density="compact"
        icon
        :lang="locale"
        @click="$emit('export', form.name, formSchema, form.snake)"
      >
        <v-icon icon="mdi:mdi-cloud-download" />
      </v-btn>
      <span>{{ $t('trans.formDesigner.downloadJson') }}</span>
    </div>

    <div class="d-flex flex-column align-center">
      <v-btn
        density="compact"
        icon
        :lang="locale"
        @click="$refs.uploader.click()"
      >
        <v-icon icon="mdi:mdi-file-upload" />
        <input
          ref="uploader"
          class="d-none"
          type="file"
          accept=".json"
          @change="$emit('import')"
        />
      </v-btn>
      <span> {{ $t('trans.formDesigner.uploadJson') }} </span>
    </div>

    <v-divider vertical inset :thickness="2" />

    <!-- Save Button -->
    <div class="d-flex flex-column align-center" data-cy="saveButton">
      <v-btn
        :disabled="!properties.canSave && properties.isFormSaved"
        density="compact"
        icon
        @click="onClickSave"
      >
        <v-icon v-if="!properties.isSaving" icon="mdi:mdi-content-save" />
        <v-progress-circular v-else indeterminate size="20" />
      </v-btn>
      <span :lang="locale">{{ SAVE_TEXT }}</span>
    </div>

    <!-- Preview Button -->
    <div
      class="d-flex flex-column align-center"
      :class="{ 'disabled-router': !canPreview }"
      data-cy="previewRouterLink"
      @click="handlePreviewClick"
    >
      <v-btn :disabled="!canPreview" density="compact" icon>
        <v-icon icon="mdi:mdi-eye" />
      </v-btn>
      <span :lang="locale">{{ $t('trans.floatButton.preview') }}</span>
    </div>

    <!-- Manage Button (Router-link) -->
    <router-link
      v-slot="{ navigate }"
      :to="{
        name: 'FormManage',
        query: { f: properties.formId, fd: false, d: properties.draftId },
      }"
      custom
    >
      <div
        class="d-flex flex-column align-center"
        :class="{ 'disabled-router': !isManageEnabled }"
        data-cy="settingsRouterLink"
      >
        <v-btn
          :disabled="!isManageEnabled"
          density="compact"
          icon
          class="inverted-colour"
          @click="navigate"
        >
          <v-icon icon="mdi:mdi-cog" />
        </v-btn>
        <span :lang="locale">{{ $t('trans.floatButton.manage') }}</span>
      </div>
    </router-link>

    <!-- Publish Button (Router-link) -->
    <router-link
      v-slot="{ navigate }"
      :to="{
        name: 'PublishForm',
        query: { f: properties.formId, fd: true, d: properties.draftId },
      }"
      custom
    >
      <div
        class="d-flex flex-column align-center"
        :class="{ 'disabled-router': !isPublishEnabled }"
        data-cy="publishRouterLink"
        role="link"
      >
        <v-btn
          :disabled="!isPublishEnabled"
          density="compact"
          icon
          class="inverted-colour"
          @click="navigate"
        >
          <v-icon icon="mdi:mdi-file-upload" />
        </v-btn>
        <span :lang="locale">{{ $t('trans.floatButton.publish') }}</span>
      </div>
    </router-link>

    <v-divider vertical inset :thickness="2" />

    <!-- Undo Button -->
    <div class="d-flex flex-column align-center" data-cy="undoButton">
      <v-btn
        :disabled="!properties.undoEnabled"
        density="compact"
        icon
        @click="$emit('undo')"
      >
        <v-icon icon="mdi:mdi-undo" />
      </v-btn>
      <span :lang="locale">{{ $t('trans.floatButton.undo') }}</span>
    </div>

    <!-- Redo Button -->
    <div class="d-flex flex-column align-center" data-cy="redoButton">
      <v-btn
        :disabled="!properties.redoEnabled"
        density="compact"
        icon
        @click="$emit('redo')"
      >
        <v-icon icon="mdi:mdi-redo" />
      </v-btn>
      <span :lang="locale">{{ $t('trans.floatButton.redo') }}</span>
    </div>
  </v-toolbar>
</template>

<style lang="scss">
.sticky-toolbar {
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: white;

  .disabled-router {
    opacity: 0.5;
    pointer-events: none;
  }

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
