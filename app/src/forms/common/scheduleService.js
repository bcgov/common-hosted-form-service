const moment = require('moment-timezone');
const { ScheduleType, EmailTypes } = require('./constants');

/**
 * Core date calculation functions
 * These don't know about schedule objects, just work with raw dates
 */

/**
 * Check if a date is in the future
 * @param {String|Date} date The date to check
 * @param {String} timezone The timezone to evaluate in
 * @param {String|Date} referenceDate Optional reference date (defaults to now)
 * @param {Boolean} ignoreTime Whether to ignore time component (defaults to true)
 * @returns {Boolean} True if the date is in the future
 */
function isDateInFuture(date, timezone = 'America/Vancouver', referenceDate = null, ignoreTime = true) {
  if (!date) return false;

  // Parse dates with timezone
  let targetDate = moment.tz(date, timezone);
  let now = referenceDate ? moment.tz(referenceDate, timezone) : moment().tz(timezone);

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
function isDateInRange(date, startDate, endDate, timezone = 'America/Vancouver', ignoreTime = true) {
  if (!date || !startDate) return false;
  if (!endDate) return true; // No end date means infinite range

  // Parse dates with timezone
  let targetDate = moment.tz(date, timezone);
  let start = moment.tz(startDate, timezone);
  let end = moment.tz(endDate, timezone);

  // Optionally ignore time component
  if (ignoreTime) {
    targetDate = targetDate.startOf('day');
    start = start.startOf('day');
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
function calculateDatePlus(baseDate, value, unit, timezone = 'America/Vancouver', format = 'YYYY-MM-DD', ignoreTime = true) {
  if (!baseDate || value === undefined || unit === undefined) return null;

  const date = moment.tz(baseDate, timezone);
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
function calculateMiddleDate(startDate, endDate, timezone = 'America/Vancouver', format = null, ignoreTime = true) {
  if (!startDate || !endDate) return null;

  let start = moment.tz(startDate, timezone);
  let end = moment.tz(endDate, timezone);

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
function isSameDay(date1, date2, timezone = 'America/Vancouver', compareTime = false) {
  if (!date1 || !date2) return false;

  const d1 = moment.tz(date1, timezone);
  const d2 = moment.tz(date2, timezone);

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
function daysBetween(startDate, endDate, timezone = 'America/Vancouver', ignoreTime = true) {
  if (!startDate || !endDate) return 0;

  let start = moment.tz(startDate, timezone);
  let end = moment.tz(endDate, timezone);

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
 * @function checkIsFormExpired
 * Checks if a form is expired based on its schedule settings
 * @param {Object} formSchedule - The form's schedule configuration
 * @returns {Object} {allowLateSubmissions: Boolean, expire: Boolean, message: String}
 */
const checkIsFormExpired = (formSchedule = {}) => {
  // Default result
  let result = {
    allowLateSubmissions: false,
    expire: false,
    message: '',
  };

  // Early exit if scheduling is not enabled or no opening date is set
  if (!formSchedule || !formSchedule.enabled || !formSchedule.openSubmissionDateTime) {
    return result;
  }

  const currentMoment = moment.utc();

  // Apply defaults for missing fields
  const defaults = {
    openSubmissionTime: formSchedule.openSubmissionTime || '00:00',
    closeSubmissionTime: formSchedule.closeSubmissionTime || (formSchedule.closeSubmissionDateTime ? '23:59' : null),
    timezone: formSchedule.timezone || 'America/Vancouver',
  };
  const schedule = { ...formSchedule, ...defaults };

  // Opening Time
  const openDateTime = `${schedule.openSubmissionDateTime} ${schedule.openSubmissionTime}`;
  const openingMoment = moment.tz(openDateTime, 'YYYY-MM-DD HH:mm', schedule.timezone).utc();
  if (currentMoment.isBefore(openingMoment)) {
    return { ...result, expire: true, message: 'This form is not yet available for submission.' };
  }

  // Handle legacy PERIOD type
  if (schedule.scheduleType === 'period') {
    schedule.scheduleType = ScheduleType.CLOSINGDATE;
    schedule.closeSubmissionDateTime = schedule.closeSubmissionDateTime || calculateCloseDateFromPeriod(schedule);
  }

  // Closing Time
  switch (schedule.scheduleType) {
    case ScheduleType.MANUAL:
      return result;
    case ScheduleType.CLOSINGDATE: {
      // Wrap the case logic in a block to scope const declarations
      if (schedule.closingMessageEnabled && schedule.closingMessage) {
        result.message = schedule.closingMessage;
      }
      if (!schedule.closeSubmissionDateTime) {
        return result;
      }
      const closeDateTime = `${schedule.closeSubmissionDateTime} ${schedule.closeSubmissionTime}`;
      const closingMoment = moment.tz(closeDateTime, 'YYYY-MM-DD HH:mm', schedule.timezone).utc();
      if (currentMoment.isAfter(closingMoment)) {
        if (schedule.allowLateSubmissions && schedule.allowLateSubmissions.enabled) {
          const lateConfig = schedule.allowLateSubmissions.forNext;
          if (lateConfig && lateConfig.term && lateConfig.intervalType) {
            const gracePeriodMoment = closingMoment.clone().add(lateConfig.term, lateConfig.intervalType);
            const isWithinGracePeriod = currentMoment.isBefore(gracePeriodMoment);
            return { ...result, expire: true, allowLateSubmissions: isWithinGracePeriod };
          }
        }
        return { ...result, expire: true };
      }
      return result;
    }
    default:
      return { ...result, expire: true };
  }
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
    return openDate.clone().add(formSchedule.keepOpenForTerm, formSchedule.keepOpenForInterval).format('YYYY-MM-DD');
  }

  // Otherwise default to 7 days from open date
  return openDate.clone().add(7, 'days').format('YYYY-MM-DD');
};

/**
 * @function isEligibleLateSubmission
 * Check if the current date is between the close date and grace period end date
 *
 * @param {Object|String} date A Moment JS date or date string
 * @param {Integer|String} term Number of days/weeks/months for late submissions
 * @param {String} interval The interval type ('days', 'weeks', 'months', etc.)
 * @returns {Boolean} True if form is available for late submission
 */
const isEligibleLateSubmission = (date, term, interval) => {
  if (!date || !term || !interval) {
    return false;
  }

  const closeDate = moment(date);
  const gracePeriodDate = closeDate.clone().add(term, interval);
  const currentMoment = moment();

  return currentMoment.isAfter(closeDate) && currentMoment.isBefore(gracePeriodDate);
};

/**
 * Extract date parameters from a schedule object
 * @param {Object} schedule The schedule object
 * @returns {Object} Extracted date parameters
 */
function extractScheduleDates(schedule) {
  if (!schedule || !schedule.enabled || !schedule.openSubmissionDateTime) {
    return { openDate: null, closeDate: null, graceDate: null, timezone: 'America/Vancouver' };
  }

  const timezone = schedule.timezone || 'America/Vancouver';
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

  const timezone = schedule.timezone || 'America/Vancouver';
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

  const { openDate, closeDate, graceDate } = extractScheduleDates(schedule);

  if (!openDate) return [];

  return [
    {
      startDate: openDate,
      closeDate: closeDate,
      graceDate: graceDate,
    },
  ];
}

/**
 * Get current period information for a form based on today's date
 * @param {Object|Array} datesOrSchedule The form schedule or array of period dates
 * @param {Date|String} referenceDate Optional reference date (defaults to now)
 * @param {Boolean} respectTimeComponent Whether to respect time components in dates (defaults to false)
 * @returns {Object|null} Current period information or null if not available
 */
function getCurrentPeriod(datesOrSchedule, referenceDate = null, respectTimeComponent = false) {
  // Extract dates from schedule if needed
  let dates;
  let allowLateSubmissions = false;
  let timezone = 'America/Vancouver';

  if (datesOrSchedule && datesOrSchedule.scheduleType !== undefined) {
    const schedule = datesOrSchedule;
    dates = getSubmissionPeriodDates(schedule);
    allowLateSubmissions = schedule.allowLateSubmissions && schedule.allowLateSubmissions.enabled;
    timezone = schedule.timezone || 'America/Vancouver';
  } else {
    dates = datesOrSchedule;
    // Try to extract timezone if available
    if (dates && dates.length > 0 && dates[0].timezone) {
      timezone = dates[0].timezone;
    }
  }

  // No dates, return null
  if (!dates || dates.length === 0) return null;

  const { openDate, closeDate, graceDate } =
    dates[0].scheduleType !== undefined
      ? extractScheduleDates(dates[0])
      : {
          openDate: dates[0].startDate,
          closeDate: dates[0].closeDate,
          graceDate: dates[0].graceDate,
        };

  // Manual schedule type (no closing date)
  if (!closeDate) {
    return {
      state: 1,
      index: 0,
      dates: dates[0],
      old_dates: null,
      late: 0,
    };
  }

  // Today's date
  const today = referenceDate || new Date();
  const ignoreTime = !respectTimeComponent;

  // End date is grace date if late submissions allowed, otherwise close date
  const endDate = allowLateSubmissions && graceDate ? graceDate : closeDate;

  // Check if today is within period
  if (isDateInRange(today, openDate, endDate, timezone, ignoreTime)) {
    // Check if in late submission period
    const isLate = allowLateSubmissions && closeDate && !isDateInRange(today, openDate, closeDate, timezone, ignoreTime);

    return {
      state: 1,
      index: 0,
      dates: dates[0],
      old_dates: null,
      late: isLate ? 1 : 0,
    };
  }

  // Not in period, determine if before or after
  const isBeforePeriod = isDateInFuture(openDate, timezone, today, ignoreTime);

  return {
    state: isBeforePeriod ? -1 : 0,
    index: -1,
    dates: dates[0], // Return the period as a reference
    old_dates: null,
    late: -1,
  };
}

/**
 * Determines what type of reminder email should be sent based on current date and schedule
 * @param {Object} scheduleOrReport The form schedule or period report
 * @param {Date|String} referenceDate Optional reference date (defaults to now)
 * @param {Boolean} respectTimeComponent Whether to respect time components in dates (defaults to false)
 * @returns {String|undefined} Email type constant or undefined if no reminder should be sent
 */
function getEmailReminderType(scheduleOrReport, referenceDate = null, respectTimeComponent = false) {
  // Get the current period if a schedule was provided
  const report = scheduleOrReport.scheduleType !== undefined ? getCurrentPeriod(scheduleOrReport, referenceDate, respectTimeComponent) : scheduleOrReport;

  if (!report || !report.dates) return undefined;

  const now = referenceDate || new Date();
  const timezone = report.dates.timezone || 'America/Vancouver';
  const compareTime = respectTimeComponent;

  // Form opens today - exact date match required
  if (isSameDay(now, report.dates.startDate, timezone, compareTime)) {
    return EmailTypes.REMINDER_FORM_OPEN;
  }

  // No close date or period is too short for mid-reminders
  if (!report.dates.closeDate) return undefined;

  const daysBetweenDates = daysBetween(report.dates.startDate, report.dates.closeDate, timezone, !respectTimeComponent);

  if (daysBetweenDates <= 3) return undefined;

  // Form closes tomorrow - exact date match required
  const dayBeforeClose = calculateDatePlus(report.dates.closeDate, -1, 'days', timezone, null, !respectTimeComponent);
  if (isSameDay(now, dayBeforeClose, timezone, compareTime)) {
    return EmailTypes.REMINDER_FORM_WILL_CLOSE;
  }

  // Middle of the period reminder - exact date match required
  const middleDate = calculateMiddleDate(report.dates.startDate, report.dates.closeDate, timezone, null, !respectTimeComponent);
  if (middleDate && isSameDay(now, middleDate, timezone, compareTime)) {
    return EmailTypes.REMINDER_FORM_NOT_FILL;
  }

  return undefined;
}

/**
 * Validate a form schedule object
 * @param {Object} schedule The schedule object to validate
 * @returns {Object} Validation result {message, status}
 */
function validateScheduleObject(schedule = {}) {
  // If scheduling is not enabled, return success
  if (!schedule.enabled) {
    return { message: '', status: 'success' };
  }

  // Validate opening date
  if (!isDateValid(schedule.openSubmissionDateTime)) {
    return {
      message: 'Invalid open submission date.',
      status: 'error',
    };
  }

  // Validate based on schedule type
  if (schedule.scheduleType === ScheduleType.CLOSINGDATE) {
    // Validate closing date
    if (!isDateValid(schedule.closeSubmissionDateTime)) {
      return {
        message: 'Invalid closed submission date.',
        status: 'error',
      };
    }

    // Validate late submissions
    if (!isLateSubmissionConfigValid(schedule)) {
      return {
        message: 'Invalid late submission data.',
        status: 'error',
      };
    }

    // Validate closing message
    if (!isClosingMessageValid(schedule)) {
      return {
        message: 'Invalid closing message.',
        status: 'error',
      };
    }
  } else if (schedule.scheduleType !== ScheduleType.MANUAL) {
    // Invalid schedule type
    return {
      message: 'Invalid schedule type.',
      status: 'error',
    };
  }

  return { message: '', status: 'success' };
}

/**
 * Validate late submission configuration
 * @param {Object} schedule Form schedule object
 * @returns {Boolean} True if late submission config is valid
 */
function isLateSubmissionConfigValid(schedule) {
  const lateSubmissionsEnabled = schedule && schedule.allowLateSubmissions && schedule.allowLateSubmissions.enabled;

  if (lateSubmissionsEnabled) {
    const hasValidTerm = schedule.allowLateSubmissions.forNext && schedule.allowLateSubmissions.forNext.term;

    const hasValidInterval = schedule.allowLateSubmissions.forNext && schedule.allowLateSubmissions.forNext.intervalType;

    if (!hasValidTerm || !hasValidInterval) {
      return false;
    }
  }

  return true;
}

/**
 * Validate closing message configuration
 * @param {Object} schedule Form schedule object
 * @returns {Boolean} True if closing message is valid
 */
function isClosingMessageValid(schedule) {
  if (schedule.closingMessageEnabled) {
    return !!schedule.closingMessage;
  }
  return true;
}

// Export all functions grouped by feature area
module.exports = {
  // Core date utilities (used everywhere)
  isDateInFuture,
  isDateInRange,
  calculateDatePlus,
  calculateMiddleDate,
  isDateValid,
  isSameDay,
  daysBetween,

  // Form submission related
  checkIsFormExpired,
  isEligibleLateSubmission,

  // Form structure and validation
  extractScheduleDates,
  getGracePeriodEndDate,
  validateScheduleObject,

  // Reminder service related
  getCurrentPeriod,
  getSubmissionPeriodDates,
  getEmailReminderType,

  // Helper validation functions (internal use)
  isLateSubmissionConfigValid,
  isClosingMessageValid,
};
