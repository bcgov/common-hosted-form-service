<template>
  <v-data-table
    class="submissions-table"
    :headers="headers"
    :items="versionList"
  >
    <!-- Version  -->
    <template #[`item.version`]="{ item }">
      <span> Version {{ item.version }} </span>
    </template>

    <!-- Status  -->
    <template #[`item.status`]="{ item }">
      <label>{{ item.published ? 'Published' : 'Unpublished' }}</label>
    </template>

    <!-- Created date  -->
    <template #[`item.createdAt`]="{ item }">
      {{ item.createdAt | formatDateLong }}
    </template>

    <!-- Updated at  -->
    <template #[`item.updatedAt`]="{ item }">
      {{ item.updatedAt | formatDateLong }}
    </template>

    <!-- Actions -->
    <template #[`item.action`]="{ item }">
      <!-- export -->
      <span>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              color="primary"
              class="mx-1"
              icon
              @click="onExportClick(item.id, item.isDraft)"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>get_app</v-icon>
            </v-btn>
          </template>
          <span>Export Design</span>
        </v-tooltip>
      </span>
    </template>
  </v-data-table>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { adminService } from '@/services';

export default {
  name: 'ManageVersions',
  data() {
    return {
      headers: [
        { text: 'Versions', align: 'start', value: 'version' },
        { text: 'Status', align: 'start', value: 'status' },
        { text: 'Created', align: 'start', value: 'createdAt' },
        { text: 'Last Updated', align: 'start', value: 'updatedAt' },
        {
          text: 'Actions',
          align: 'end',
          value: 'action',
          filterable: false,
          sortable: false,
        },
      ],
      formSchema: {
        display: 'form',
        type: 'form',
        components: [],
      },
      publishOpts: {
        publishing: true,
        version: '',
        id: '',
      },
    };
  },
  computed: {
    ...mapGetters('admin', ['form']),
    versionList() {
      return this.form ? this.form.versions : [];
    },
  },
  methods: {
    ...mapActions('notifications', ['addNotification']),
    ...mapActions('admin', ['restoreForm']),

    // ----------------------------------------------------------------------/ Publish/unpublish actions
    async onExportClick(id, isDraft) {
      await this.getFormSchema(id, isDraft);
      let snek = this.form.snake;
      if (!this.form.snake) {
        snek = this.form.name
          .replace(/\s+/g, '_')
          .replace(/[^-_0-9a-z]/gi, '')
          .toLowerCase();
      }

      const a = document.createElement('a');
      a.href = `data:application/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(this.formSchema)
      )}`;
      a.download = `${snek}_schema.json`;
      a.style.display = 'none';
      a.classList.add('hiddenDownloadTextElement');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },

    async getFormSchema(id) {
      try {
        const res = await adminService.readVersion(this.form.id, id);
        this.formSchema = { ...this.formSchema, ...res.data.schema };
      } catch (error) {
        this.addNotification({
          message: 'An error occurred while loading the form design.',
        });
      }
    },
  },
};
</script>

<style scoped>
/* Todo, this is duplicated in a few tables, extract to style */
.submissions-table {
  clear: both;
}
@media (max-width: 1263px) {
  .submissions-table >>> th {
    vertical-align: top;
  }
}
/* Want to use scss but the world hates me */
.submissions-table >>> tbody tr:nth-of-type(odd) {
  background-color: #f5f5f5;
}
.submissions-table >>> thead tr th {
  font-weight: normal;
  color: #003366 !important;
  font-size: 1.1em;
}
</style>
