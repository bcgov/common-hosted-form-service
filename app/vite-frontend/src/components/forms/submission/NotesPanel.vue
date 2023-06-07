<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { formService, rbacService } from '~/services';
import { useNotificationStore } from '~/store/notification';

const { t } = useI18n({ useScope: 'global' });

const properties = defineProps({
  submissionId: {
    type: String,
    required: true,
  },
});

const notificationStore = useNotificationStore();

const loading = ref(true);
const newNote = ref('');
const notes = ref([]);
const showNoteField = ref(false);

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
  loading.value = true;
  try {
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

onMounted(() => {
  getNotes();
});
</script>

<template>
  <v-skeleton-loader :loading="loading" type="list-item-two-line">
    <v-row no-gutters>
      <v-col cols="12" sm="6">
        <h2 class="note-heading">{{ $t('trans.notesPanel.notes') }}</h2>
      </v-col>
      <v-col cols="12" sm="6" class="text-sm-right">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              class="mx-1"
              color="primary"
              icon
              size="small"
              v-bind="props"
              @click="showNoteField = true"
            >
              <v-icon icon="mdi:mdi-plus"></v-icon>
            </v-btn>
          </template>
          <span>{{ $t('trans.notesPanel.addNewNote') }}</span>
        </v-tooltip>
      </v-col>
    </v-row>

    <v-form v-if="showNoteField">
      <label>{{ $t('trans.notesPanel.note') }}</label>
      <v-textarea
        v-model="newNote"
        :rules="[(v) => v.length <= 4000 || $t('trans.notesPanel.maxChars')]"
        counter
        auto-grow
        density="compact"
        variant="outlined"
        solid
      />
      <v-row>
        <v-col cols="12" sm="6" xl="4">
          <v-btn
            block
            color="primary"
            variant="outlined"
            @click="showNoteField = false"
          >
            <span>{{ $t('trans.notesPanel.cancel') }}</span>
          </v-btn>
        </v-col>
        <v-col cols="12" sm="6" xl="4" order="first" order-sm="last">
          <v-btn
            block
            color="primary"
            data-test="btn-add-note"
            :disabled="!newNote"
            @click="addNote"
          >
            <span>{{ $t('trans.notesPanel.addNote') }}</span>
          </v-btn>
        </v-col>
      </v-row>
    </v-form>

    <ul class="mt-5">
      <li v-for="note in notes" :key="note.noteId" class="mb-2">
        <strong>
          {{ $filters.formatDateLong(note.createdAt) }} -
          {{ note.createdBy }}
        </strong>
        <br />
        {{ note.note }}
      </li>
    </ul>
  </v-skeleton-loader>
</template>
