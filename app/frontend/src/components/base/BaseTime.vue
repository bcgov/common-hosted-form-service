<template>
  <div class="d-flex flex-row">
    <div class="d-flex flex-row">
      <div>{{ minutes }}</div>
      <div class="ml-1" :lang="lang" :class="{ 'dir-rtl': isRTL }">
        {{ $t('trans.baseTime.minutes') }}
      </div>
    </div>
    <div class="d-flex flex-row ml-2">
      <div>{{ seconds }}</div>
      <div class="ml-1" :lang="lang" :class="{ 'dir-rtl': isRTL }">
        {{ $t('trans.baseTime.seconds') }}
      </div>
    </div>
  </div>
</template>
<script>
import moment from 'moment';
import { mapGetters } from 'vuex';

export default {
  name: 'BaseTime',
  props: {
    action: { type: String, default: '' },
  },
  data() {
    return {
      timerDate: moment().add(15, 'minutes'),
      now: moment(),
      timerInterval: null,
    };
  },
  computed: {
    ...mapGetters('form', ['isRTL', 'lang']),
    seconds() {
      let sec = Math.trunc(this.timerDate.diff(this.now, 'seconds') % 60);
      if (this.minutes === 0 && sec === 28) {
        this.$emit('timer-stopped');
      }
      return sec;
    },
    minutes() {
      return this.timerDate.diff(this.now, 'minutes');
    },
  },
  watch: {
    action: {
      immediate: true,
      handler() {
        if (this.action === 'start') {
          clearInterval(this.timerInterval);
          this.timerInterval = window.setInterval(() => {
            this.now = moment();
          }, 1000);
        } else if (this.action === 'stop') {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
      },
    },
  },
  beforeUnmount() {
    clearInterval(this.timerInterval);
  },
};
</script>
<style lang="scss" scoped>
.v-text-field > .v-input__control > .v-input__slot:before {
  border-style: none !important;
}
</style>
