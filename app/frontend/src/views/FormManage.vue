<template>
  <v-container>
    <h2>{{ form.name }}</h2>
    <br />
    <p>
      <strong>Description:</strong>
      {{ form.description }}
      <br />
      <strong>Labels:</strong>
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
      </v-btn>
      <br />
    </p>
    <v-row>
      <v-col cols="6">
        <v-card outlined>
          <v-list-item three-line>
            <v-list-item-content>
              <div class="overline mb-4">
                TEAM MANGEMENT
                <v-btn color="blue" text small>
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
              <strong>Current Version:</strong> 1
            </p>
            <p>
              <strong>Last Updated:</strong> July 31, 2020 (Lucas O'Neil)
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
        <br>
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

export default {
  name: 'FormManage',
  components: {},
  props: ['formId'],
  data() {
    return {
      form: {},
    };
  },
  methods: {
    async getFormDefinition() {
      try {
        // Get the form definition from the api
        const response = await await formService.getForm(this.formId);
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
