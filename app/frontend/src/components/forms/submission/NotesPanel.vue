<template>
  <v-skeleton-loader :loading="loading" type="list-item-two-line">
    <v-row no-gutters>
      <v-col cols="12" sm="6">
        <h2 class="note-heading">Notes</h2>
      </v-col>
      <v-col cols="12" sm="6" class="text-sm-right">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              class="mx-1"
              color="primary"
              icon
              v-bind="props"
              @click="showNoteField = true"
            >
              <v-icon>add_circle</v-icon>
            </v-btn>
          </template>
          <span>Add New Note</span>
        </v-tooltip>
      </v-col>
    </v-row>

    <v-form v-if="showNoteField">
      <label>Note</label>
      <v-textarea
        v-model="newNote"
        :rules="[(v) => v.length <= 4000 || 'Max 4000 characters']"
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
            <span>Cancel</span>
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
            <span>ADD NOTE</span>
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

<script>
import { mapActions } from 'vuex';

import { formService, rbacService } from '@src/services';

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
  mounted() {
    this.getNotes();
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
          throw new Error('No response data from API while submitting form');
        }
        this.showNoteField = false;
        this.newNote = '';
        this.getNotes();
      } catch (error) {
        this.addNotification({
          message: 'An error occured while trying to add the note.',
          consoleError: `Error adding note: ${error}`,
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
          message:
            'An error occured while trying to fetch notes for this submission.',
          consoleError: `Error getting notes for ${this.submissionId}: ${error}`,
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.note-heading {
  color: #003366;
}
</style>
