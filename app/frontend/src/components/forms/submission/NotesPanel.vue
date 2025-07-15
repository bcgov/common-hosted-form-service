<script setup>
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { formService, rbacService } from '~/services';

import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

const { t, locale } = useI18n({ useScope: 'global' });

const properties = defineProps({
  submissionId: {
    type: String,
    required: true,
  },
});

const loading = ref(true);
const newNote = ref('');
const notes = ref([]);
const notesPerPage = ref(3);
const page = ref(1);
const showNoteField = ref(false);
const showNotesContent = ref(false);

const notificationStore = useNotificationStore();

const { isRTL } = storeToRefs(useFormStore());

onMounted(async () => {
  await getNotes();
});

async function addNote() {
  try {
    const user = await rbacService.getCurrentUser();
    const body = {
      note: newNote.value,
      userId: user.data.id,
    };
    const response = await formService.addNote(properties.submissionId, body);
    if (!response.data) {
      throw new Error(t('trans.notesPanel.noResponseErr'));
    }
    showNoteField.value = false;
    newNote.value = '';
    getNotes();
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.notesPanel.errorMesg'),
      consoleError: t('trans.notesPanel.consoleErrMsg') + `${error}`,
    });
  }
}

async function getNotes() {
  try {
    loading.value = true;
    const response = await formService.getSubmissionNotes(
      properties.submissionId
    );
    notes.value = response.data;
  } catch (error) {
    notificationStore.addNotification({
      text: t('trans.notesPanel.errorMesg'),
      consoleError:
        t('trans.notesPanel.fetchConsoleErrMsg') +
        `${properties.submissionId}: ${error}`,
    });
  } finally {
    loading.value = false;
  }
}

defineExpose({ addNote, getNotes, loading, newNote, notes, showNoteField });
</script>

<template>
  <v-skeleton-loader
    :loading="loading"
    type="list-item-two-line"
    class="bgtrans"
  >
    <div
      class="d-flex flex-md-row justify-space-between"
      data-test="showNotesPanel"
      @click="showNotesContent = !showNotesContent"
    >
      <div cols="12" sm="6">
        <h2 class="note-heading" :lang="locale">
          {{ $t('trans.notesPanel.notes') }}
          <v-icon>{{
            showNotesContent
              ? 'mdi:mdi-chevron-down'
              : isRTL
              ? 'mdi:mdi-chevron-left'
              : 'mdi:mdi-chevron-right'
          }}</v-icon>
        </h2>
      </div>

      <div :class="[{ 'text-left': isRTL }, 'd-flex', 'align-items-center']">
        <!-- Text for number of notes -->
        <span class="notes-text" :lang="locale">
          <strong>{{ $t('trans.notesPanel.totalNotes') }}</strong>
          {{ notes.length }}
        </span>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              class="notes-button"
              color="primary"
              icon
              size="x-small"
              v-bind="props"
              :title="$t('trans.notesPanel.addNewNote')"
              data-test="canAddNewNote"
              @click.stop="showNoteField = true"
              @click="showNotesContent = true"
            >
              <v-icon icon="mdi:mdi-plus"></v-icon>
            </v-btn>
          </template>
          <span :lang="locale">{{ $t('trans.notesPanel.addNewNote') }}</span>
        </v-tooltip>
      </div>
    </div>
    <div v-if="showNotesContent" class="mt-4">
      <v-form v-if="showNoteField">
        <v-textarea
          v-model="newNote"
          :class="{ 'dir-rtl': isRTL }"
          :rules="[(v) => v.length <= 4000 || $t('trans.notesPanel.maxChars')]"
          counter
          auto-grow
          density="compact"
          variant="outlined"
          data-test="canAddNotes"
          solid
          :lang="locale"
        />
        <v-row>
          <v-col>
            <v-btn
              class="wide-button"
              color="primary"
              variant="outlined"
              :title="$t('trans.notesPanel.cancel')"
              data-test="canCancelNote"
              @click="showNoteField = false"
            >
              <span :lang="locale">{{ $t('trans.notesPanel.cancel') }}</span>
            </v-btn>
            <v-btn
              class="wide-button"
              color="primary"
              data-test="btn-add-note"
              :disabled="!newNote"
              :title="$t('trans.notesPanel.addNote')"
              @click="addNote"
            >
              <span :lang="locale">{{ $t('trans.notesPanel.addNote') }}</span>
            </v-btn>
          </v-col>
        </v-row>
      </v-form>

      <v-data-iterator
        :items="notes"
        :items-per-page="notesPerPage"
        :page="page"
        return-object
      >
        <template #default="props">
          <ul class="mt-5" :class="{ 'dir-rtl': isRTL, 'mr-2': isRTL }">
            <li v-for="note in props.items" :key="note.raw.id">
              <strong>
                {{ $filters.formatDateLong(note.raw.createdAt) }} -
                {{ note.raw.createdBy }}
              </strong>
              <br />
              {{ note.raw.note }}
            </li>
          </ul>
        </template>
        <template #footer="{ pageCount }">
          <v-pagination v-model="page" :length="pageCount"></v-pagination>
        </template>
      </v-data-iterator>
    </div>
  </v-skeleton-loader>
</template>

<style lang="scss" scoped>
.note-heading {
  color: #003366;
  margin-bottom: 0;
  .v-icon {
    transition: transform 0.3s ease;
  }
}

.notes-text {
  margin-right: 15px;
  margin-left: 15px;
}

.notes-button {
  margin-right: 1px;
  margin-left: 1px;
}

.wide-button {
  width: 200px;
  margin-right: 10px;
  margin-bottom: 10px;
}

.wide-button:last-child {
  margin-right: 0;
}
</style>
