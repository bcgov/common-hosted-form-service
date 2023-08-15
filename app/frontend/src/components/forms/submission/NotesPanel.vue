<template>
  <v-skeleton-loader :loading="loading" type="list-item-two-line">
    <div
      class="d-flex flex-md-row justify-space-between flex-sm-column-reverse flex-xs-column-reverse"
    >
      <div>
        <h2 class="note-heading" :lang="lang">
          {{ $t('trans.notesPanel.notes') }}
        </h2>
      </div>
      <div :class="{ 'text-left': isRTL }">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              class="mx-1"
              @click="showNoteField = true"
              color="primary"
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>add_circle</v-icon>
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
        :class="{ 'dir-rtl': isRTL }"
        v-model="newNote"
        :rules="[
          (v) => v.length <= 4000 || this.$t('trans.notesPanel.maxChars'),
        ]"
        counter
        auto-grow
        dense
        flat
        outlined
        solid
        :lang="lang"
      />
      <v-row>
        <v-col cols="12" sm="6" xl="4">
          <v-btn block color="primary" @click="showNoteField = false" outlined>
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
      <li class="mb-2" v-for="note in notes" :key="note.noteId">
        <strong>
          {{ note.createdAt | formatDateLong }} -
          {{ note.createdBy }}
        </strong>
        <br />
        {{ note.note }}
      </li>
    </ul>
  </v-skeleton-loader>
</template>

<script>
import { mapActions } from 'vuex';
import { mapGetters } from 'vuex';
import { formService, rbacService } from '@/services';

export default {
  name: 'NotesPanel',
  props: {
    submissionId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      historyDialog: false,
      loading: true,
      newNote: '',
      notes: [],
      showNoteField: false,
    };
  },
  computed: {
    ...mapGetters('form', ['isRTL', 'lang']),
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
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
          message: this.$t('trans.notesPanel.errorMesg'),
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
          message: this.$t('trans.notesPanel.errorMesg'),
          consoleError:
            this.$t('trans.notesPanel.fetchConsoleErrMsg') +
            `${this.submissionId}: ${error}`,
        });
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    this.getNotes();
  },
};
</script>

<style lang="scss" scoped>
.note-heading {
  color: #003366;
}
</style>
