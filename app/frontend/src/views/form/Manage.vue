<template>
  <div>
    <v-breadcrumbs :items="breadcrumbs" />
    <h1 class="my-6 text-center">{{ form.name }}</h1>
    <p><strong>Description: </strong>{{ form.description }}</p>
    <p>
      <strong>Created: </strong>{{ form.createdAt | formatDate }} ({{
        form.createdBy
      }})
    </p>
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
    <p>
      <strong>Share this form:</strong>
      <ShareForm :formId="f" :versionId="currentVersion.id" />
    </p>
    <!-- TODO: Change this from temporary button to actually embedded in Manage page -->
    <router-link :to="{ name: 'FormSettings', query: { f: f } }">
      <v-btn color="blue" text small>
        <v-icon class="mr-1">edit</v-icon>
        <span>Edit Settings</span>
      </v-btn>
    </router-link>
    <v-row>
      <v-col cols="6">
        <!-- TODO: Change this card to potentially use TeamManagement component -->
        <v-card outlined>
          <v-list-item three-line>
            <v-list-item-content>
              <div class="overline mb-4">
                TEAM MANGEMENT
                <router-link :to="{ name: 'FormTeams', query: { f: f } }">
                  <v-btn color="blue" text small>
                    <v-icon class="mr-1">edit</v-icon>
                    <span>Edit</span>
                  </v-btn>
                </router-link>
              </div>
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
              <span v-if="currentVersion.updatedBy">
                ({{ currentVersion.updatedBy }})
              </span>
            </p>
            <router-link
              :to="{
                name: 'FormDesigner',
                query: { f: f, v: currentVersion.id },
              }"
            >
              <v-btn color="blue" text small>
                <v-icon class="mr-1">edit</v-icon>
                <span>Edit Current Form</span>
              </v-btn>
            </router-link>
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
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import ShareForm from '@/components/forms/ShareForm.vue';

export default {
  name: 'FormManage',
  components: { ShareForm },
  props: {
    f: {
      type: String,
      required: true,
    },
  },
  computed: {
    ...mapGetters('form', ['form']),
    breadcrumbs() {
      const path = [
        {
          text: 'Form',
        },
      ];
      if (this.$route.meta.breadcrumbTitle) {
        path.push({
          text: this.$route.meta.breadcrumbTitle,
        });
      }
      return path;
    },
    currentVersion() {
      return this.form.versions ? this.form.versions[0] : {};
    },
  },
  methods: {
    ...mapActions('form', ['fetchForm']),
  },
  mounted() {
    this.fetchForm(this.f);
  },
};
</script>
