<script>
import { mapState, mapActions } from 'pinia';
import { useI18n } from 'vue-i18n';

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
  setup() {
    const { t, locale } = useI18n({ useScope: 'global' });

    return { t, locale };
  },
  data() {
    return {
      loading: true,
      newNote: '',
      notes: [],
      notesPerPage: 3,
      page: 1,
      showNoteField: false,
      showNotesContent: false,
    };
  },
  computed: {
    ...mapState(useFormStore, ['isRTL']),
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
          throw new Error(this.$t('trans.notesPanel.noResponseErr'));
        }
        this.showNoteField = false;
        this.newNote = '';
        this.getNotes();
      } catch (error) {
        this.addNotification({
          text: this.$t('trans.notesPanel.errorMesg'),
          consoleError: this.$t('trans.notesPanel.consoleErrMsg') + `${error}`,
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
          text: this.$t('trans.notesPanel.errorMesg'),
          consoleError:
            this.$t('trans.notesPanel.fetchConsoleErrMsg') +
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
    <div
      class="d-flex flex-md-row justify-space-between"
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
