const moment = require('moment-timezone');
const { ScheduleType } = require('./constants');

/**
 * Constants for date formats and timezone
 */
const DEFAULT_TIMEZONE = 'America/Vancouver';
const DATE_FORMAT = 'YYYY-MM-DD';
const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm';

/**
 * Core date calculation functions
 * These don't know about schedule objects, just work with raw dates
 */

/**
 * Get current date with optional reference date
 * @param {String|Date} referenceDate Optional reference date (defaults to now)
 * @param {String} timezone The timezone to use
 * @returns {Object} Moment object for the current date
 */
function getCurrentDate(referenceDate = null, timezone = DEFAULT_TIMEZONE) {
  return referenceDate ? moment.tz(referenceDate, timezone) : moment().tz(timezone);
}

/**
 * Check if a date is in the future
 * @param {String|Date} date The date to check
 * @param {String} timezone The timezone to evaluate in
 * @param {String|Date} referenceDate Optional reference date (defaults to now)
 * @param {Boolean} ignoreTime Whether to ignore time component (defaults to true)
 * @returns {Boolean} True if the date is in the future
 */
function isDateInFuture(date, timezone = DEFAULT_TIMEZONE, referenceDate = null, ignoreTime = true) {
  if (!date) return false;

  // Parse dates with timezone
  let targetDate = getCurrentDate(date, timezone);
  let now = getCurrentDate(referenceDate, timezone);

  // Optionally ignore time component
  if (ignoreTime) {
    targetDate = targetDate.startOf('day');
    now = now.startOf('day');
  }

  return now.isBefore(targetDate);
}

/**
 * Check if a date is between two other dates (inclusive)
 * @param {String|Date} date The date to check
 * @param {String|Date} startDate The start date of the range
 * @param {String|Date} endDate The end date of the range
 * @param {String} timezone The timezone to evaluate in
 * @param {Boolean} ignoreTime Whether to ignore time component (defaults to true)
 * @returns {Boolean} True if date is within the range (inclusive)
 */
function isDateInRange(date, startDate, endDate, timezone = DEFAULT_TIMEZONE, ignoreTime = true) {
  if (!date || !startDate) return false;

  // Parse dates with timezone
  let targetDate = getCurrentDate(date, timezone);
  let start = getCurrentDate(startDate, timezone);

  // Optionally ignore time component
  if (ignoreTime) {
    targetDate = targetDate.startOf('day');
    start = start.startOf('day');
  }

  // If no endDate, check if date is on or after startDate
  if (!endDate) {
    return targetDate.isSameOrAfter(start);
  }

  // Check if date is between start and end
  let end = getCurrentDate(endDate, timezone);
  if (ignoreTime) {
    end = end.startOf('day');
  }

  return targetDate.isSameOrAfter(start) && targetDate.isSameOrBefore(end);
}

/**
 * Calculate a date by adding an interval to a base date
 * @param {String|Date} baseDate The starting date
 * @param {Number} value The amount to add
 * @param {String} unit The unit ('days', 'weeks', 'months', etc.)
 * @param {String} timezone The timezone to use
 * @param {String} format Output format (null returns moment object)
 * @param {Boolean} ignoreTime Whether to ignore time component (defaults to true)
 * @returns {String|Object} The calculated date as string or moment object
 */
function calculateDatePlus(baseDate, value, unit, timezone = DEFAULT_TIMEZONE, format = DATE_FORMAT, ignoreTime = true) {
  if (!baseDate || value === undefined || unit === undefined) return null;

  const date = getCurrentDate(baseDate, timezone);
  if (ignoreTime) {
    date.startOf('day');
  }
  const result = date.clone().add(value, unit);

  return format ? result.format(format) : result;
}

/**
 * Calculate the middle date between two dates
 * @param {String|Date} startDate The start date
 * @param {String|Date} endDate The end date
 * @param {String} timezone The timezone to use
 * @param {String} format Output format (null returns moment object)
 * @param {Boolean} ignoreTime Whether to ignore time component (defaults to true)
 * @returns {String|Object|null} The middle date or null if range is too short
 */
function calculateMiddleDate(startDate, endDate, timezone = DEFAULT_TIMEZONE, format = null, ignoreTime = true) {
  if (!startDate || !endDate) return null;

  let start = getCurrentDate(startDate, timezone);
  let end = getCurrentDate(endDate, timezone);

  if (ignoreTime) {
    start = start.startOf('day');
    end = end.startOf('day');
  }

  const daysBetween = end.diff(start, 'days');

  // For periods less than 6 days, don't calculate a middle date
  if (daysBetween < 6) return null;

  const interval = Math.floor(daysBetween / 2);
  const middleDate = start.clone().add(interval, 'days');

  return format ? middleDate.format(format) : middleDate;
}

/**
 * Check if a date is valid
 * @param {String|Date} date The date to validate
 * @returns {Boolean} True if the date is valid
 */
function isDateValid(date) {
  return date && !isNaN(Date.parse(date));
}

/**
 * Check if two dates are the same day
 * @param {String|Date} date1 First date
 * @param {String|Date} date2 Second date
 * @param {String} timezone The timezone to use
 * @param {Boolean} compareTime Whether to compare exact time (false = day only)
 * @returns {Boolean} True if dates are the same (day or exact time based on compareTime)
 */
function isSameDay(date1, date2, timezone = DEFAULT_TIMEZONE, compareTime = false) {
  if (!date1 || !date2) return false;

  const d1 = getCurrentDate(date1, timezone);
  const d2 = getCurrentDate(date2, timezone);

  if (compareTime) {
    return d1.isSame(d2);
  } else {
    return d1.startOf('day').isSame(d2.startOf('day'));
  }
}

/**
 * Calculate days between two dates
 * @param {String|Date} startDate Start date
 * @param {String|Date} endDate End date
 * @param {String} timezone The timezone to use
 * @param {Boolean} ignoreTime Whether to ignore time component (defaults to true)
 * @returns {Number} Number of days between the dates
 */
function daysBetween(startDate, endDate, timezone = DEFAULT_TIMEZONE, ignoreTime = true) {
  if (!startDate || !endDate) return 0;

  let start = getCurrentDate(startDate, timezone);
  let end = getCurrentDate(endDate, timezone);

  if (ignoreTime) {
    start = start.startOf('day');
    end = end.startOf('day');
  }

  return end.diff(start, 'days');
}

/**
 * Schedule-specific functions
 * These work with schedule objects by extracting parameters and
 * passing them to the core date functions
 */

/**
 * Check if form is before opening time
 * @param {Object} schedule The schedule configuration
 * @param {Object} currentMoment Current time as moment object
 * @returns {Boolean} True if form is not yet open
 */
function isBeforeOpeningTime(schedule, currentMoment) {
  const openDateTime = `${schedule.openSubmissionDateTime} ${schedule.openSubmissionTime}`;
  const openingMoment = moment.tz(openDateTime, DATE_TIME_FORMAT, schedule.timezone);
  return currentMoment.isBefore(openingMoment.clone().utc());
}

/**
 * Check if the current time is after closing time
 * @param {Object} schedule The schedule configuration
 * @param {Object} currentMoment Current time as moment object
 * @returns {Boolean} True if current time is after closing time
 */
function isAfterClosingTime(schedule, currentMoment) {
  if (!schedule.closeSubmissionDateTime) {
    return false;
  }
  const closeDateTime = `${schedule.closeSubmissionDateTime} ${schedule.closeSubmissionTime}`;
  const closingMoment = moment.tz(closeDateTime, DATE_TIME_FORMAT, schedule.timezone);
  return currentMoment.isAfter(closingMoment.clone().utc());
}

/**
 * Check if current time is within grace period
 * @param {Object} schedule The schedule configuration
 * @param {Object} currentMoment Current time as moment object
 * @returns {Boolean} True if within grace period
 */
function isWithinGracePeriod(schedule, currentMoment) {
  if (!schedule.allowLateSubmissions || !schedule.allowLateSubmissions.enabled) {
    return false;
  }

  const lateConfig = schedule.allowLateSubmissions.forNext;
  if (!lateConfig || !lateConfig.term || !lateConfig.intervalType) {
    return false;
  }

  const closeDateTime = `${schedule.closeSubmissionDateTime} ${schedule.closeSubmissionTime}`;
  const closingMoment = moment.tz(closeDateTime, DATE_TIME_FORMAT, schedule.timezone);
  const gracePeriodMoment = closingMoment.clone().add(lateConfig.term, lateConfig.intervalType);
  return currentMoment.isBefore(gracePeriodMoment.utc());
}

/**
 * @function checkIsFormExpired
 * Checks if a form is expired based on its schedule settings
 * @param {Object} formSchedule - The form's schedule configuration
 * @returns {Object} {allowLateSubmissions: Boolean, expire: Boolean, message: String}
 */
const checkIsFormExpired = (formSchedule = {}) => {
  // Default result
  const result = {
    allowLateSubmissions: false,
    expire: false,
    message: '',
  };

  // Early exit if scheduling is not enabled or no opening date is set
  if (!formSchedule || !formSchedule.enabled || !formSchedule.openSubmissionDateTime) {
    return result;
  }

  // Apply defaults for missing fields
  const schedule = {
    ...formSchedule,
    openSubmissionTime: formSchedule.openSubmissionTime || '00:00',
    closeSubmissionTime: formSchedule.closeSubmissionTime || (formSchedule.closeSubmissionDateTime ? '23:59' : null),
    timezone: formSchedule.timezone || DEFAULT_TIMEZONE,
  };

  // Handle legacy PERIOD type
  if (schedule.scheduleType === 'period') {
    schedule.scheduleType = ScheduleType.CLOSINGDATE;
    schedule.closeSubmissionDateTime = schedule.closeSubmissionDateTime || calculateCloseDateFromPeriod(schedule);
  }

  const currentMoment = moment.utc();

  // Check if form is not yet open
  if (isBeforeOpeningTime(schedule, currentMoment)) {
    return {
      ...result,
      expire: true,
      message: 'This form is not yet available for submission.',
    };
  }

  // Process based on schedule type
  if (schedule.scheduleType === ScheduleType.MANUAL) {
    return result;
  }

  if (schedule.scheduleType !== ScheduleType.CLOSINGDATE) {
    return { ...result, expire: true };
  }

  // Handle CLOSINGDATE schedule type
  let updatedResult = { ...result };

  // Add closing message if enabled
  if (schedule.closingMessageEnabled && schedule.closingMessage) {
    updatedResult.message = schedule.closingMessage;
  }

  if (!schedule.closeSubmissionDateTime) {
    return updatedResult;
  }

  // Check if past closing time
  if (isAfterClosingTime(schedule, currentMoment)) {
    updatedResult.expire = true;

    // Check for late submissions
    if (isWithinGracePeriod(schedule, currentMoment)) {
      updatedResult.allowLateSubmissions = true;
    }
  }

  return updatedResult;
};
/**
 * Helper function to calculate a closing date from PERIOD form settings
 * Used for backward compatibility with legacy forms
 * @param {Object} formSchedule - The form schedule with PERIOD settings
 * @returns {String} Calculated close date
 */
const calculateCloseDateFromPeriod = (formSchedule) => {
  if (!formSchedule || !formSchedule.openSubmissionDateTime) {
    return null;
  }

  const openDate = moment(formSchedule.openSubmissionDateTime);

  // If we have keepOpenForTerm and keepOpenForInterval, use those to calculate
  if (formSchedule.keepOpenForTerm && formSchedule.keepOpenForInterval) {
    return openDate.clone().add(formSchedule.keepOpenForTerm, formSchedule.keepOpenForInterval).format(DATE_FORMAT);
  }

  // Otherwise default to 7 days from open date
  return openDate.clone().add(7, 'days').format(DATE_FORMAT);
};

/**
 * Extract date parameters from a schedule object
 * @param {Object} schedule The schedule object
 * @returns {Object} Extracted date parameters
 */
function extractScheduleDates(schedule) {
  if (!schedule || !schedule.enabled || !schedule.openSubmissionDateTime) {
    return { openDate: null, closeDate: null, graceDate: null, timezone: DEFAULT_TIMEZONE };
  }

  const timezone = schedule.timezone || DEFAULT_TIMEZONE;
  const closeDate = schedule.scheduleType === ScheduleType.CLOSINGDATE ? schedule.closeSubmissionDateTime : null;

  // Calculate grace period date if late submissions are allowed
  const graceDate = getGracePeriodEndDate(schedule);

  return {
    openDate: schedule.openSubmissionDateTime,
    closeDate: closeDate,
    graceDate,
    timezone,
  };
}

/**
 * Get the grace period end date for a schedule
 * @param {Object} schedule The schedule object
 * @returns {String|null} The grace period end date or null if not enabled
 */
function getGracePeriodEndDate(schedule) {
  if (!schedule || !schedule.allowLateSubmissions || !schedule.allowLateSubmissions.enabled) {
    return null;
  }

  const { term, intervalType } = schedule.allowLateSubmissions.forNext || {};
  if (!term || !intervalType || !schedule.closeSubmissionDateTime) {
    return null;
  }

  const timezone = schedule.timezone || DEFAULT_TIMEZONE;
  return calculateDatePlus(schedule.closeSubmissionDateTime, term, intervalType, timezone);
}

/**
 * Get all submission period dates for a form
 * @param {Object} schedule The form schedule configuration
 * @returns {Array} Array of period objects with startDate, closeDate, and graceDate
 */
function getSubmissionPeriodDates(schedule) {
  if (!schedule || !schedule.enabled || !schedule.openSubmissionDateTime) {
    return [];
  }

  const { openDate, closeDate, graceDate, timezone } = extractScheduleDates(schedule);

  if (!openDate) return [];

  return [
    {
      startDate: openDate,
      closeDate: closeDate,
      graceDate: graceDate,
      timezone: timezone,
    },
  ];
}

/**
 * Extract date information from input
 * @param {Object|Array} datesOrSchedule The form schedule or array of period dates
 * @returns {Object} Extracted dates information
 */
function extractDateInfo(datesOrSchedule) {
  let dates;
  let allowLateSubmissions = false;
  let timezone = DEFAULT_TIMEZONE;

  if (datesOrSchedule && datesOrSchedule.scheduleType !== undefined) {
    const schedule = datesOrSchedule;
    dates = getSubmissionPeriodDates(schedule);
    allowLateSubmissions = schedule.allowLateSubmissions && schedule.allowLateSubmissions.enabled;
    timezone = schedule.timezone || DEFAULT_TIMEZONE;
  } else {
    dates = datesOrSchedule;
    // Try to extract timezone if available
    if (dates && dates.length > 0 && dates[0].timezone) {
      timezone = dates[0].timezone;
    }
  }

  return { dates, allowLateSubmissions, timezone };
}

/**
 * Create a period result object
 * @param {Number} state The period state
 * @param {Number} index The period index
 * @param {Object} datesObj The dates object
 * @param {Number} late The late status
 * @returns {Object} Formatted period result
 */
function createPeriodResult(state, index, datesObj, late) {
  return {
    state,
    index,
    dates: datesObj,
    old_dates: null,
    late,
  };
}

/**
 * Get current period information for a form based on today's date
 * @param {Object|Array} datesOrSchedule The form schedule or array of period dates
 * @param {Date|String} referenceDate Optional reference date (defaults to now)
 * @param {Boolean} respectTimeComponent Whether to respect time components in dates (defaults to false)
 * @returns {Object|null} Current period information or null if not available
 */
function getCurrentPeriod(datesOrSchedule, referenceDate = null, respectTimeComponent = false) {
  // Extract dates info
  const { dates, allowLateSubmissions, timezone } = extractDateInfo(datesOrSchedule);

  // No dates, return null
  if (!dates || dates.length === 0) return null;

  // Get period dates
  const dateProps =
    dates[0].scheduleType !== undefined
      ? extractScheduleDates(dates[0])
      : {
          openDate: dates[0].startDate,
          closeDate: dates[0].closeDate,
          graceDate: dates[0].graceDate,
          timezone: dates[0].timezone || DEFAULT_TIMEZONE,
        };

  const { openDate, closeDate, graceDate } = dateProps;

  // Manual schedule type (no closing date)
  if (!closeDate) {
    return createPeriodResult(1, 0, dates[0], 0);
  }

  // Today's date and time settings
  const today = referenceDate || new Date();
  const ignoreTime = !respectTimeComponent;
  const endDate = allowLateSubmissions && graceDate ? graceDate : closeDate;

  // Check if today is within period
  if (isDateInRange(today, openDate, endDate, timezone, ignoreTime)) {
    const isLate = allowLateSubmissions && closeDate && !isDateInRange(today, openDate, closeDate, timezone, ignoreTime);
    return createPeriodResult(1, 0, dates[0], isLate ? 1 : 0);
  }

  // Not in period, determine if before or after
  const isBeforePeriod = isDateInFuture(openDate, timezone, today, ignoreTime);
  return createPeriodResult(isBeforePeriod ? -1 : 0, -1, dates[0], -1);
}

// Export all functions grouped by feature area
module.exports = {
  // Constants
  DEFAULT_TIMEZONE,
  DATE_FORMAT,
  DATE_TIME_FORMAT,

  // Core date utilities (used everywhere)
  getCurrentDate,
  isDateInFuture,
  isDateInRange,
  calculateDatePlus,
  calculateMiddleDate,
  isDateValid,
  isSameDay,
  daysBetween,

  // Form submission related
  checkIsFormExpired,

  // Form structure and validation
  extractScheduleDates,
  getGracePeriodEndDate,

  // Reminder service related
  getCurrentPeriod,
  getSubmissionPeriodDates,
};
