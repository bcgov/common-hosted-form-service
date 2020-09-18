<template>
  <v-container>
    <h2>{{ form.name }}</h2>
    <br />
    <p>
      <strong>Description:</strong>
      {{ form.description }}
      <br />
      <strong>Created:</strong>
      {{ form.createdAt | formatDate }} ({{ form.createdBy }})
      <!-- <strong>Labels:</strong>
      <v-chip
        class="ma-1"
        v-for="label in form.labels"
        :key="label"
        close
        @click:close="chip1 = false"
      >{{ label }}</v-chip>
      <v-btn color="blue" text small>
        <v-icon class="mr-1">add</v-icon>
        <span>Add</span>
      </v-btn>-->
    </p>
    <p>
      <strong>Share this form:</strong>
      <ShareForm :formId="formId" :versionId="currentVersion.id" />
    </p>
    <v-row>
      <v-col cols="6">
        <!-- TODO: Change this card to potentially use TeamManagement component -->
        <v-card outlined>
          <v-list-item three-line>
            <v-list-item-content>
              <div class="overline mb-4">
                TEAM MANGEMENT
                <v-btn color="blue" text small @click="editTeams">
                  <v-icon class="mr-1">edit</v-icon>
                  <span>Edit</span>
                </v-btn>
              </div>
              <v-list-item-title class="headline mb-2">Form Admins</v-list-item-title>
              <ul>
                <li>Lucas O'Neil (owner)</li>
                <li>Jeremy Ho</li>
                <li>Matthew Hall</li>
              </ul>
              <v-list-item-title class="headline mb-2 mt-5">Allowed Submitters</v-list-item-title>
              <ul>
                <li>TBD</li>
              </ul>
            </v-list-item-content>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="6">
        <v-card outlined>
          <v-card-text>
            <div class="overline mb-4">Form Design</div>
            <p>
              <strong>Current Version:</strong>
              {{ currentVersion.version }}
              <br />
              <strong>Last Updated:</strong>
              {{ currentVersion.updatedAt | formatDateLong }}
              <span
                v-if="currentVersion.updatedBy"
              >({{ currentVersion.updatedBy }})</span>
            </p>
            <v-btn color="blue" text small>
              <v-icon class="mr-1">edit</v-icon>
              <span>Edit Current Form</span>
            </v-btn>
            <br />
            <br />
            <v-btn color="blue" text small>
              <v-icon class="mr-1">add</v-icon>
              <span>Add New Version</span>
            </v-btn>
          </v-card-text>
        </v-card>
        <br />
        <v-card outlined>
          <v-card-text>
            <div class="overline mb-4">Status Workflow</div>
            <h2>TBD</h2>
            <v-btn color="blue" text small>
              <v-icon class="mr-1">edit</v-icon>
              <span>Modify</span>
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import formService from '@/services/formService';
import ShareForm from '@/components/forms/ShareForm.vue';

export default {
  name: 'FormManage',
  components: { ShareForm },
  props: {
    formId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      form: {},
    };
  },
  computed: {
    currentVersion() {
      return this.form.versions ? this.form.versions[0] : {};
    },
  },
  methods: {
    editTeams() {
      this.$router.push({
        name: 'FormTeamManagement',
        params: {
          formId: this.formId,
        },
      });
    },
    async getFormDefinition() {
      try {
        // Get the form definition from the api
        const response = await formService.readForm(this.formId);
        this.form = response.data;
      } catch (error) {
        console.error(`Error getting form: ${error}`); // eslint-disable-line no-console
      }
    },
  },
  mounted() {
    this.getFormDefinition();
  },
};
</script>
