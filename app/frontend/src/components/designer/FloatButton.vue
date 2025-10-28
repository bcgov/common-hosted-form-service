<script setup>
import { computed, ref, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useFormStore } from '~/store/form';
import { useDisplay } from 'vuetify';

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
  formVersion: {
    type: String,
    default: null,
  },
});

const { form } = storeToRefs(formStore);

const emit = defineEmits(['redo', 'save', 'undo', 'export', 'import-file']);

const isAtTopOfPage = ref(true);

const { mdAndDown } = useDisplay();

// // We need to handle scroll through an event listener because computed values do not update on a scroll event
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

function onFileChange(event) {
  emit('import-file', event);
}

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
  onClickScroll,
  onEventScroll,
  SAVE_TEXT,
  SCROLL_ICON,
  SCROLL_TEXT,
});
</script>

<template>
  <v-toolbar class="sticky-toolbar pt-2 mb-1" density="comfortable" flat>
    <div class="d-flex w-50 w-md-40">
      <!-- Scroll Button -->
      <div class="icon-button">
        <v-btn
          class="mt-1"
          density="compact"
          icon
          stacked
          @click="onClickScroll"
        >
          <v-icon :icon="SCROLL_ICON"></v-icon>
          {{ SCROLL_TEXT }}
        </v-btn>
      </div>
      <!-- page title -->
      <div v-if="!isAtTopOfPage" :lang="locale" class="title-container">
        <h4 v-if="form.name" :title="form.name" class="page-title">
          {{ form.name }}
        </h4>
      </div>
    </div>

    <v-spacer />
    <!-- Right Justify Buttons -->
    <div class="d-flex flex-wrap flex-shrink-0">
      <div v-if="!mdAndDown">
        <div class="d-flex align-center icon-button">
          <!-- Download Buttons -->
          <div class="d-flex flex-column align-center icon-button">
            <v-btn
              density="compact"
              stacked
              :lang="locale"
              @click="$emit('export', form.name, formSchema, form.snake)"
            >
              <v-icon class="mt-4" icon="mdi:mdi-download" />
              {{ $t('trans.formDesigner.downloadJson') }}
            </v-btn>
          </div>
          <!-- Upload Button -->
          <div class="d-flex flex-column align-center icon-button">
            <v-btn
              density="compact"
              icon
              stacked
              :lang="locale"
              @click="$refs.uploader.click()"
            >
              <v-icon class="mt-4" icon="mdi:mdi-upload" />
              <input
                ref="uploader"
                class="d-none"
                type="file"
                accept=".json"
                @change="onFileChange"
              />
              {{ $t('trans.formDesigner.uploadJson') }}
            </v-btn>
          </div>

          <v-divider vertical inset :thickness="2" />
          <!-- Save Button -->
          <div
            class="d-flex flex-column align-center icon-button"
            data-cy="saveButton"
          >
            <v-btn
              :disabled="!properties.canSave && properties.isFormSaved"
              density="compact"
              icon
              stacked
              @click="emit('save')"
            >
              <v-icon v-if="!properties.isSaving" icon="mdi:mdi-content-save" />
              <v-progress-circular v-else indeterminate size="20" />
              {{ SAVE_TEXT }}
            </v-btn>
          </div>
          <!-- Preview Button -->
          <div
            class="d-flex flex-column align-center icon-button"
            :class="{ 'disabled-router': !canPreview }"
            data-cy="previewRouterLink"
            @click="handlePreviewClick"
          >
            <v-btn :disabled="!canPreview" density="compact" icon stacked>
              <v-icon icon="mdi:mdi-eye" />
              {{ $t('trans.floatButton.preview') }}
            </v-btn>
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
              class="d-flex flex-column align-center icon-button"
              :class="{ 'disabled-router': !isManageEnabled }"
              data-cy="settingsRouterLink"
            >
              <v-btn
                :disabled="!isManageEnabled"
                density="compact"
                icon
                stacked
                @click="navigate"
              >
                <v-icon icon="mdi:mdi-file-cog" />
                {{ $t('trans.floatButton.manage') }}
              </v-btn>
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
              class="d-flex flex-column align-center icon-button"
              :class="{ 'disabled-router': !isPublishEnabled }"
              data-cy="publishRouterLink"
            >
              <v-btn
                :disabled="!isPublishEnabled"
                density="compact"
                stacked
                icon
                @click="navigate"
              >
                <v-icon icon="mdi:mdi-file-upload" />
                {{ $t('trans.floatButton.publish') }}
              </v-btn>
            </div>
          </router-link>

          <v-divider vertical inset :thickness="2" />
          <!-- Undo Button -->
          <div
            class="d-flex flex-column align-center icon-button"
            data-cy="undoButton"
          >
            <v-btn
              class="d-flex flex-column align-center py-2"
              :disabled="!properties.undoEnabled"
              density="compact"
              icon
              stacked
              @click="$emit('undo')"
            >
              <v-icon icon="mdi:mdi-undo" size="20" />
              {{ $t('trans.floatButton.undo') }}
            </v-btn>
          </div>

          <!-- Redo Button -->
          <div
            class="d-flex flex-column align-center icon-button"
            data-cy="redoButton"
          >
            <v-btn
              :disabled="!properties.redoEnabled"
              density="compact"
              icon
              stacked
              @click="$emit('redo')"
            >
              <v-icon icon="mdi:mdi-redo" />
              {{ $t('trans.floatButton.redo') }}
            </v-btn>
          </div>
        </div>
      </div>
      <div v-else class="d-flex align-center icon-button">
        <!-- Undo Button -->
        <div
          class="d-flex flex-column align-center icon-button"
          data-cy="undoButton"
        >
          <v-btn
            class="d-flex flex-column align-center py-2"
            :disabled="!properties.undoEnabled"
            density="compact"
            icon
            stacked
            @click="$emit('undo')"
          >
            <v-icon icon="mdi:mdi-undo" size="20" />
            {{ $t('trans.floatButton.undo') }}
          </v-btn>
        </div>

        <!-- Redo Button -->
        <div
          class="d-flex flex-column align-center icon-button"
          data-cy="redoButton"
        >
          <v-btn
            :disabled="!properties.redoEnabled"
            density="compact"
            icon
            stacked
            @click="$emit('redo')"
          >
            <v-icon icon="mdi:mdi-redo" />
            {{ $t('trans.floatButton.redo') }}
          </v-btn>
        </div>
        <v-divider vertical inset :thickness="2" />

        <!-- Save Button -->
        <div class="d-flex flex-column align-center icon-button">
          <v-btn
            :disabled="!properties.canSave && properties.isFormSaved"
            density="compact"
            data-cy="saveButton"
            icon
            stacked
            @click="emit('save')"
          >
            <v-icon v-if="!properties.isSaving" icon="mdi:mdi-content-save" />
            <v-progress-circular v-else indeterminate size="20" />
            {{ SAVE_TEXT }}
          </v-btn>
        </div>
        <!-- Menu Dropdown for Small screens -->

        <div class="toolbar-dropdown">
          <v-menu location="bottom end">
            <template #activator="{ props }">
              <v-btn icon stacked v-bind="props" data-cy="menuButton">
                <v-icon icon="mdi:mdi-dots-vertical" />
                Menu
              </v-btn>
            </template>

            <v-list>
              <!-- Preview Button -->
              <v-list-item>
                <div
                  class="d-flex flex-column"
                  :class="{ 'disabled-router': !canPreview }"
                  data-cy="previewRouterLink"
                  @click="handlePreviewClick"
                >
                  <v-btn :disabled="!canPreview" density="compact" prepend-icon>
                    <v-icon class="mr-1" icon="mdi:mdi-eye" />
                    {{ $t('trans.floatButton.preview') }}
                  </v-btn>
                </div>
              </v-list-item>
              <!-- Manage Button (Router-link) -->
              <v-list-item>
                <router-link
                  v-slot="{ navigate }"
                  :to="{
                    name: 'FormManage',
                    query: {
                      f: properties.formId,
                      fd: false,
                      d: properties.draftId,
                    },
                  }"
                  custom
                >
                  <div
                    class="d-flex flex-column"
                    :class="{ 'disabled-router': !isManageEnabled }"
                    data-cy="settingsRouterLink"
                  >
                    <v-btn
                      :disabled="!isManageEnabled"
                      density="compact"
                      prepend-icon
                      @click="navigate"
                    >
                      <v-icon class="mr-1" icon="mdi:mdi-file-cog" />
                      {{ $t('trans.floatButton.manage') }}
                    </v-btn>
                  </div>
                </router-link>
              </v-list-item>
              <!-- Publish Button (Router-link) -->
              <v-list-item>
                <router-link
                  v-slot="{ navigate }"
                  :to="{
                    name: 'PublishForm',
                    query: {
                      f: properties.formId,
                      fd: true,
                      d: properties.draftId,
                    },
                  }"
                  custom
                >
                  <div
                    class="d-flex flex-column"
                    :class="{ 'disabled-router': !isPublishEnabled }"
                    data-cy="publishRouterLink"
                  >
                    <v-btn
                      :disabled="!isPublishEnabled"
                      density="compact"
                      prepend-icon
                      @click="navigate"
                    >
                      <v-icon class="mr-1" icon="mdi:mdi-file-upload" />
                      {{ $t('trans.floatButton.publish') }}
                    </v-btn>
                  </div>
                </router-link>
              </v-list-item>
              <v-divider :thickness="2" />
              <!-- Upload Button -->
              <v-list-item>
                <div class="d-flex flex-column">
                  <v-btn
                    density="compact"
                    icon-prepend
                    :lang="locale"
                    @click="$refs.uploader.click()"
                  >
                    <v-icon class="mr-1" icon="mdi:mdi-upload" />
                    <input
                      ref="uploader"
                      class="d-none"
                      type="file"
                      accept=".json"
                      @change="onFileChange"
                    />
                    {{ $t('trans.formDesigner.uploadJson') }}
                  </v-btn>
                </div>
              </v-list-item>
              <!-- Download Buttons -->
              <v-list-item>
                <div class="d-flex flex-column">
                  <v-btn
                    density="compact"
                    icon-prepend
                    :lang="locale"
                    @click="$emit('export', form.name, formSchema, form.snake)"
                  >
                    <v-icon class="mr-1" icon="mdi:mdi-download" />
                    {{ $t('trans.formDesigner.downloadJson') }}
                  </v-btn>
                </div>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </div>
  </v-toolbar>
</template>

<style lang="scss">
.icon-button {
  .v-btn {
    width: 80px;
    height: 80px;
  }
  .v-icon {
    font-size: 24px;
    color: #1e5189;
    margin-bottom: 1rem;
  }
  span {
    font-size: 0.8rem;
    font-weight: 500;
    text-align: center;
    text-transform: none;
    color: #1e5189;
  }
}

.v-divider {
  height: 80px;
}

.title-container {
  display: flex;
  min-width: 0;
  align-items: center;
  overflow: hidden;
}

.page-title {
  flex: 1 1 auto;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.version-label {
  flex-shrink: 0;
  margin-left: 8px;
}

.sticky-toolbar {
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #faf9f8;
  .v-toolbar__content {
    min-height: 100px !important;
  }

  .disabled-router {
    opacity: 0.5;
    pointer-events: none;
  }

  .v-btn {
    margin-top: 2px !important;
    margin-bottom: 12px !important;
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
