<template>
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
</template>

<script>
export default {
  name: 'TeamManagement',
};
</script>
