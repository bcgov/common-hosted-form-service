<template>
  <div>
    <FormViewer :formId="f" :displayTitle="true"/>
  </div>
</template>

<script>
import { determineFormNeedsAuth } from '@/utils/permissionUtils';
import FormViewer from '@/components/designer/FormViewer.vue';

export default {
  name: 'FormSubmit',
  components: {
    FormViewer,
  },
  props: {
    f: String,
  },
  beforeRouteEnter(to, from, next) {
    determineFormNeedsAuth(to.query.f, undefined, next);
  },
};
</script>
