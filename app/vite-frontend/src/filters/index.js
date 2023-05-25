import moment from 'moment';

//
// Date format Filters {{ expression | filter }}
//

/**
 * @function formatDate
 * Converts a date to an 'MMMM D YYYY' formatted string
 * @param {Date} value A date object
 * @returns {String} A string representation of `value`
 */
export function formatDate(value) {
  if (value) {
    return moment(String(value)).format('MMMM D YYYY');
  }
}

/**
 * @function formatDateLong
 * Converts a date to a 'YYYY-MM-DD hh:mm:ss a' formatted string
 * @param {Date} value A date object
 * @returns {String} A string representation of `value`
 */
export function formatDateLong(value) {
  if (value) {
    return moment(String(value)).format('YYYY-MM-DD hh:mm:ss a');
  }
}
