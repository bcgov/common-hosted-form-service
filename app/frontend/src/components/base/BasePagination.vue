<template>
  <div class="v-data-footer pt-3">
    <div class="v-data-footer__select">
      <div class="mr-3">Rows per page:</div>
      <div>{{ itemsPerPage }}</div>
      <div class="v-data-footer__pagination">
        {{ startOfItem }} - {{ endOfItem }} of {{ totalItems }}
      </div>
      <v-pagination
        :total-visible="0"
        :length="length"
        v-model="page"
        @next="nextPage"
        @previous="previousPage"
      ></v-pagination>
    </div>
  </div>
</template>
<script>
export default {
  name: 'BasePagination',
  data() {
    return {
      page: 1,
    };
  },
  props: {
    length: { type: Number },
    totalItems: { type: Number },
    endOfItem: { type: Number },
    startOfItem: { type: Number },
    itemsPerPage: { type: Number },
  },

  methods: {
    nextPage() {
      this.$emit('next-page', this.page);
    },
    previousPage() {
      this.$emit('previous-page', this.page);
    },
  },
};
</script>
