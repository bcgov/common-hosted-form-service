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
      timerDate: null,
      now: null,
      timerInterval: null,
      second: 0,
      minute: 0,
    };
  },
  computed: {
    ...mapGetters('form', ['isRTL', 'lang']),
    seconds() {
      return this.second;
    },
    minutes() {
      return this.minute;
    },
  },
  methods: {
    async timerStopped() {
      this.reset();
      this.$emit('timer-stopped');
    },
    async reset() {
      await clearInterval(this.timerInterval);
      this.timerInterval = null;
      this.timerDate = null;
      this.now = null;
      this.minute = 0;
      this.second = 0;
    },
  },
  watch: {
    action: {
      immediate: true,
      handler() {
        this.timerDate = moment().add(15, 'minutes');
        if (this.action === 'start') {
          clearInterval(this.timerInterval);
          this.timerInterval = window.setInterval(() => {
            this.now = moment();
            this.second = Math.trunc(
              this.timerDate.diff(this.now, 'seconds') % 60
            );
            this.minute = this.timerDate.diff(this.now, 'minutes');
            if (this.minute <= 0 && this.second <= 28) {
              this.timerStopped();
            }
          }, 1000);
        } else if (this.action === 'stop') {
          this.reset();
        }
      },
    },
  },
  beforeUnmount() {
    this.reset();
  },
};
</script>
<style lang="scss" scoped>
.v-text-field > .v-input__control > .v-input__slot:before {
  border-style: none !important;
}
</style>
