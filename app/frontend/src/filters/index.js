import Vue from 'vue';
import moment from 'moment';

// Date format filters {{ expression | filter }}
Vue.filter('formatDate', function (value) {
  if (value) {
    return moment(String(value)).format('MMMM D YYYY');
  }
});
Vue.filter('formatDateLong', function (value) {
  if (value) {
    return moment(String(value)).format('MMMM D YYYY, h:mm:ss a');
  }
});

