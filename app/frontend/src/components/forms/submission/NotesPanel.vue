<script>
import { mapState, mapActions } from 'pinia';

import { i18n } from '~/internationalization';
import { formService, rbacService } from '~/services';

import { useFormStore } from '~/store/form';
import { useNotificationStore } from '~/store/notification';

export default {
  props: {
    submissionId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
      newNote: '',
      notes: [],
      showNoteField: false,
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL', 'lang']),
  },
  mounted() {
    this.getNotes();
  },
  methods: {
    ...mapActions(useNotificationStore, ['addNotification']),
    async addNote() {
      try {
        const user = await rbacService.getCurrentUser();
        const body = {
          note: this.newNote,
          userId: user.data.id,
        };
        const response = await formService.addNote(this.submissionId, body);
        if (!response.data) {
          throw new Error(i18n.t('trans.notesPanel.noResponseErr'));
        }
        this.showNoteField = false;
        this.newNote = '';
        this.getNotes();
      } catch (error) {
        this.addNotification({
          text: i18n.t('trans.notesPanel.errorMesg'),
          consoleError: i18n.t('trans.notesPanel.consoleErrMsg') + `${error}`,
        });
      }
    },

    async getNotes() {
      this.loading = true;
      try {
        const response = await formService.getSubmissionNotes(
          this.submissionId
        );
        this.notes = response.data;
      } catch (error) {
        this.addNotification({
          text: i18n.t('trans.notesPanel.errorMesg'),
          consoleError:
            i18n.t('trans.notesPanel.fetchConsoleErrMsg') +
            `${this.submissionId}: ${error}`,
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<template>
  <v-skeleton-loader
    :loading="loading"
    type="list-item-two-line"
    class="bgtrans"
  >
    <div class="mt-6 d-flex flex-md-row justify-space-between">
      <div cols="12" sm="6">
        <h2 class="note-heading" :lang="lang">
          {{ $t('trans.notesPanel.notes') }}
        </h2>
      </div>
      <div :class="{ 'text-left': isRTL }">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              class="mx-1"
              color="primary"
              icon
              size="x-small"
              v-bind="props"
              @click="showNoteField = true"
            >
              <v-icon icon="mdi:mdi-plus"></v-icon>
            </v-btn>
          </template>
          <span :lang="lang">{{ $t('trans.notesPanel.addNewNote') }}</span>
        </v-tooltip>
      </div>
    </div>

    <v-form v-if="showNoteField">
      <div class="mb-2" :class="{ 'dir-rtl': isRTL }" :lang="lang">
        {{ $t('trans.notesPanel.note') }}
      </div>
      <v-textarea
        v-model="newNote"
        :class="{ 'dir-rtl': isRTL }"
        :rules="[(v) => v.length <= 4000 || $t('trans.notesPanel.maxChars')]"
        counter
        auto-grow
        density="compact"
        variant="outlined"
        solid
        :lang="lang"
      />
      <v-row>
        <v-col cols="12" sm="6" xl="4">
          <v-btn
            block
            color="primary"
            variant="outlined"
            @click="showNoteField = false"
          >
            <span :lang="lang">{{ $t('trans.notesPanel.cancel') }}</span>
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
            <span :lang="lang">{{ $t('trans.notesPanel.addNote') }}</span>
          </v-btn>
        </v-col>
      </v-row>
    </v-form>

    <ul class="mt-5" :class="{ 'dir-rtl': isRTL, 'mr-2': isRTL }">
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

<style lang="scss" scoped>
.note-heading {
  color: #003366;
}
</style>
