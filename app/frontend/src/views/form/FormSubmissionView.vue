<template>
  <v-container>
    <h1 class="my-6 text-center">Submissions</h1>
    f {{ formId }}
    <br />
    v {{ versionId }}
    <br />
    s {{ submissionId }}
    <br />
    <Form :form="schema" :submission="submission"/>
  </v-container>
</template>

<script>
import { Form } from 'vue-formio';

export default {
  name: 'FormSubmissionView',
  props: ['formId', 'versionId', 'submissionId'],
  components: {
    Form,
  },
  data() {
    return {
      submission: {
        data: {
          fieldA: '12345',
          fieldB: '12345',
          fieldC: '12345',
        },
      },
      schema: {
        components: [
          {
            fieldA: {
              type: 'String',
              label: 'A',
            },
          },
          {
            fieldB: {
              type: 'Number',
              label: 'B',
            },
          },
          {
            fieldC: {
              type: 'Email',
              label: 'C',
            },
          },
        ],
      },
    };
  },
};
</script>
