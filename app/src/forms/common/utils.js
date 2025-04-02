const config = require('config');
const falsey = require('falsey');
const moment = require('moment');
const clone = require('lodash/clone');
const _ = require('lodash');
const { ScheduleType } = require('./constants');

const setupMount = (type, app, routes) => {
  const p = `/${type}`;
  if (Array.isArray(routes)) {
    for (let r of routes) {
      app.use(p, r);
    }
  } else {
    app.use(p, routes);
  }

  return p;
};

/**
 * Gets the base url used when providing links to the application, such as in
 * emails that are sent out by the application. Handles both localhost and
 * deployed versions of the application, in the form:
 *  - http://localhost:5173/app (localhost development including port)
 *  - https://chefs-dev.apps.silver.devops.gov.bc.ca/pr-1234 (pr deployment)
 *  - https://chefs-dev.apps.silver.devops.gov.bc.ca/app (non-prod deployment)
 *  - https://submit.digital.gov.bc.ca/app (vanity url deployment)
 * @returns a string containing the base url
 */
const getBaseUrl = () => {
  let protocol = 'https';
  let host = process.env.SERVER_HOST;

  if (!host) {
    protocol = 'http';
    host = 'localhost';

    // This only needs to be defined to use the email links in local dev.
    if (config.has('frontend.localhostPort')) {
      host += ':' + config.get('frontend.localhostPort');
    }
  }

  const basePath = config.get('frontend.basePath');

  return `${protocol}://${host}${basePath}`;
};

const typeUtils = {
  isInt: (x) => {
    if (isNaN(x)) {
      return false;
    }
    const num = parseFloat(x);
    // use modulus to determine if it is an int
    return num % 1 === 0;
  },
  isNumeric: (x) => {
    return Object.prototype.toString.call(x) === '[object Number]';
  },
  isString: (x) => {
    return Object.prototype.toString.call(x) === '[object String]';
  },
  isBoolean: (x) => {
    return Object.prototype.toString.call(x) === '[object Boolean]';
  },
  isObject: (x) => {
    return Object.prototype.toString.call(x) === '[object Object]';
  },
  isNil: (x) => {
    return x == null;
  },
  isDate: (x) => {
    var d = new Date(x);
    return !isNaN(d.valueOf());
  },
};

const queryUtils = {
  defaultActiveOnly: (params) => {
    if (!params) {
      params = {};
    }
    let active = true;
    if (!typeUtils.isNil(params.active)) {
      // if caller hasn't explicitly set active, then force to active = true, do not return "deleted" forms.
      active = !falsey(params.active);
    }
    params.active = active;
    return params;
  },
};

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

  // Check if the form has started yet
  const startDate = moment(formSchedule.openSubmissionDateTime).startOf('day');
  const currentMoment = moment();
  const isFormStartedAlready = currentMoment.diff(startDate, 'seconds') >= 0;

  // If the form hasn't started yet
  if (!isFormStartedAlready) {
    return {
      ...result,
      expire: true,
      message: 'This form is not yet available for submission.',
    };
  }

  // Handle legacy PERIOD schedule type by treating it as CLOSINGDATE
  if (formSchedule.scheduleType === 'period') {
    // Convert PERIOD to CLOSINGDATE for processing
    formSchedule = {
      ...formSchedule,
      scheduleType: ScheduleType.CLOSINGDATE,
      // Use calculated close date if available
      closeSubmissionDateTime: formSchedule.closeSubmissionDateTime || calculateCloseDateFromPeriod(formSchedule),
    };
  }

  // Handle different schedule types using switch with block scoping
  switch (formSchedule.scheduleType) {
    case ScheduleType.MANUAL: {
      // Manual schedule never expires
      return result;
    }

    case ScheduleType.CLOSINGDATE: {
      // Set custom closing message if provided
      if (formSchedule.closingMessageEnabled && formSchedule.closingMessage) {
        result = { ...result, message: formSchedule.closingMessage };
      }

      // No closing date means it stays open
      if (!formSchedule.closeSubmissionDateTime) {
        return result;
      }

      // Check if we're within the open period
      const closingDate = moment(formSchedule.closeSubmissionDateTime).endOf('day');
      const isBeforeClosingDate = currentMoment.isSameOrBefore(closingDate);

      if (isBeforeClosingDate) {
        // Form is still open
        return result;
      }

      // Form is past closing date, check for late submissions
      if (formSchedule.allowLateSubmissions && formSchedule.allowLateSubmissions.enabled) {
        const lateSubmissionConfig = formSchedule.allowLateSubmissions.forNext;

        // Check for valid late submission configuration
        if (lateSubmissionConfig && lateSubmissionConfig.term && lateSubmissionConfig.intervalType) {
          // Calculate grace period end date
          const gracePeriodDate = moment(closingDate).add(lateSubmissionConfig.term, lateSubmissionConfig.intervalType);

          // Check if we're still within the grace period
          const isWithinGracePeriod = currentMoment.isBefore(gracePeriodDate);

          return {
            ...result,
            expire: true,
            allowLateSubmissions: isWithinGracePeriod,
          };
        }
      }

      // Form is closed and no late submissions allowed or configured
      return {
        ...result,
        expire: true,
        allowLateSubmissions: false,
      };
    }

    default: {
      // Unrecognized schedule type, treat as expired
      return {
        ...result,
        expire: true,
      };
    }
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

// Alias isFormExpired to checkIsFormExpired for backward compatibility
const isFormExpired = checkIsFormExpired;

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
 * @function getSubmissionPeriodDates
 * Gets the submission period dates based on the form's schedule
 *
 * @param {String|Object} openDate The form's opening date (string or moment object)
 * @param {String|Object} closeDate The form's closing date (string or moment object)
 * @param {Object} allowLateSubmissions The late submissions configuration
 * @returns {Array} An array with the calculated date period
 */
const getSubmissionPeriodDates = (openDate, closeDate, allowLateSubmissions = null) => {
  let openSubmissionDate = moment.isMoment(openDate) ? openDate.clone() : moment(new Date(openDate));

  let calculatedCloseDate = moment.isMoment(closeDate) ? closeDate.clone() : moment(new Date(closeDate));

  let graceDate = null;

  // If late submissions are enabled, calculate the grace date
  if (allowLateSubmissions && allowLateSubmissions.enabled && allowLateSubmissions.forNext && allowLateSubmissions.forNext.term && allowLateSubmissions.forNext.intervalType) {
    graceDate = calculatedCloseDate.clone().add(allowLateSubmissions.forNext.term, allowLateSubmissions.forNext.intervalType).format('YYYY-MM-DD HH:MM:SS');
  }

  return [
    {
      startDate: openSubmissionDate.format('YYYY-MM-DD HH:MM:SS'),
      closeDate: calculatedCloseDate.format('YYYY-MM-DD HH:MM:SS'),
      graceDate: graceDate,
    },
  ];
};

/**
 * @function getCalculatedCloseSubmissionDate
 * Get calculated close date for a form's schedule settings
 * Simplified to only handle non-repeating schedules
 *
 * @param {Object|String} openedDate Opening date
 * @param {Object|String} closeDate Closing date (for CLOSINGDATE schedule type)
 * @returns {Object} A Moment JS date
 */
const getCalculatedCloseSubmissionDate = (openedDate = moment(), closeDate = null) => {
  if (closeDate) {
    return moment(closeDate);
  }

  // Default to 30 days from open date if no close date provided
  return moment(openedDate).add(30, 'days');
};
const periodType = {
  Daily: { name: 'Daily', value: 1, regex: 'days' },
  Weekly: { name: 'Weekly', value: 7, regex: 'days' },
  BiWeekly: { name: 'Bi-weekly', value: 14, regex: 'days' },
  Monthly: { name: 'Monthly', value: 1, regex: 'months' },
  Quaterly: { name: 'Quaterly', value: 3, regex: 'months' },
  SemiAnnually: { name: 'Semi-Annually', value: 6, regex: 'months' },
  Annually: { name: 'Annually', value: 1, regex: 'years' },
};
const flattenComponents = (components, includeAll) => {
  const flattened = [];
  eachComponent(
    components,
    (component, path) => {
      flattened.push(path);
    },
    includeAll
  );
  return flattened.flatMap((path) => path);
};

const eachComponent = (components, fn, includeAll, path, parent, inRecursion) => {
  if (!components) return;
  path = path || '';
  if (inRecursion) {
    if (components.noRecurse) {
      delete components.noRecurse;
      return;
    }
    components.noRecurse = true;
  }
  components.forEach((component) => {
    if (!component) {
      return;
    }

    const hasColumns = component.columns && Array.isArray(component.columns);
    const hasRows = component.rows && Array.isArray(component.rows);
    const hasComps = component.components && Array.isArray(component.components);
    let noRecurse = false;
    const newPath = component.key ? (path ? `${path}.${component.key}` : component.key) : '';

    // Keep track of parent references.
    if (parent) {
      // Ensure we don't create infinite JSON structures.
      component.parent = clone(parent);
      delete component.parent.components;
      delete component.parent.componentMap;
      delete component.parent.columns;
      delete component.parent.rows;
    }

    // there's no need to add other layout components here because we expect that those would either have columns, rows or components
    const layoutTypes = ['htmlelement', 'content', 'simplecontent', 'button'];
    const isLayoutComponent = hasColumns || hasRows || (hasComps && !component.input) || layoutTypes.indexOf(component.type) > -1;
    if (includeAll || component.tree || !isLayoutComponent) {
      let keyPath = [];
      const componentsWithSubValues = ['simplecheckboxes', 'selectboxes', 'survey', 'tree'];
      if (component.type && componentsWithSubValues.includes(component.type)) {
        // for survey component, get field name from obj.questions.value
        if (component.type === 'survey') {
          component.questions.forEach((e) => keyPath.push(path ? `${path}.${component.key}.${e.value}` : `${component.key}.${e.value}`));
        }
        // for checkboxes and selectboxes, get field name from obj.values.value
        else if (component.values) component.values.forEach((e) => keyPath.push(path ? `${path}.${component.key}.${e.value}` : `${component.key}.${e.value}`));
        // else push the parent field
        else {
          keyPath.push(component.key);
        }

        noRecurse = fn(component, keyPath, components);
      } else {
        noRecurse = fn(component, newPath, components);
      }
    }

    const subPath = () => {
      if (
        component.key &&
        !['panel', 'table', 'well', 'columns', 'fieldset', 'tabs', 'form'].includes(component.type) &&
        (['datagrid', 'container', 'editgrid', 'address', 'dynamicWizard', 'datatable', 'tagpad'].includes(component.type) || component.tree)
      ) {
        return newPath;
      } else if (component.key && component.type === 'form') {
        return `${newPath}.data`;
      }
      return path;
    };

    if (!noRecurse) {
      if (hasColumns) {
        component.columns.forEach((column) => eachComponent(column.components, fn, includeAll, subPath(), parent ? component : null), true);
      } else if (hasRows) {
        component.rows.forEach((row) => {
          if (Array.isArray(row)) {
            row.forEach((column) => eachComponent(column.components, fn, includeAll, subPath(), parent ? component : null), true);
          }
        });
      } else if (hasComps) {
        eachComponent(component.components, fn, includeAll, subPath(), parent ? component : null, true);
      }
    }
  });
  if (components.noRecurse) {
    delete components.noRecurse;
  }
};

const unwindPath = (schema) => {
  let path = [];
  for (let obj of schema) {
    const findField = (obj, keyPath) => {
      let keys = keyPath;
      if (!_.isUndefined(obj) && !_.isNull(obj)) {
        Object.keys(obj).forEach((key) => {
          if (Array.isArray(obj[key]) && !key.includes('address')) {
            path.push(keys !== undefined ? keys + '.' + key : key);
            for (let value of obj[key]) {
              findField(value, keys !== undefined ? keys + '.' + key : key);
            }
          }
          if (obj[key] instanceof Object && !key.includes('address')) {
            findField(obj[key], keys !== undefined ? keys + '.' + key : key);
          }
        });
      }
    };
    findField(obj, undefined);
  }
  return path;
};

const submissionHeaders = (obj) => {
  let objectMap = new Set();

  const findField = (obj, keyPath) => {
    if (_.isUndefined(obj) || _.isNull(obj)) {
      objectMap.add(keyPath);
    } else {
      Object.keys(obj).forEach((key) => {
        if (_.isString(obj[key]) || _.isNumber(obj[key]) || _.isDate(obj[key])) {
          if (key !== 'submit') {
            objectMap.add(keyPath ? keyPath + '.' + key : key);
          }
        } else if (Array.isArray(obj[key])) {
          for (let value of obj[key]) {
            findField(value, keyPath ? keyPath + '.' + key : key);
          }
        } else if (_.isPlainObject(obj[key])) {
          findField(obj[key], keyPath ? keyPath + '.' + key : key);
        }
      });
    }
  };

  findField(obj, undefined);

  return objectMap;
};

const encodeURI = (unsafe) => {
  let textDelimiter = '_';
  let textDelimiterRegex = new RegExp('\\' + ',', 'g');
  return unsafe.replace(textDelimiterRegex, textDelimiter);
};

/**
 * Validates a form's schedule settings
 * Simplified to only handle MANUAL and CLOSINGDATE schedule types
 * @param {Object} schedule The schedule object to validate
 * @returns {Object} Validation result {message, status}
 */
const validateScheduleObject = (schedule = {}) => {
  let result = {
    message: '',
    status: 'success',
  };

  // If scheduling is not enabled, return success
  if (!schedule.enabled) {
    return result;
  }

  // Validate opening date
  const openSubmissionDateTime = schedule.openSubmissionDateTime;
  if (!isDateValid(openSubmissionDateTime)) {
    return {
      message: 'Invalid open submission date.',
      status: 'error',
    };
  }

  // Validate based on schedule type
  const scheduleType = schedule.scheduleType;

  if (scheduleType === ScheduleType.CLOSINGDATE) {
    // Validate closing date
    if (!isDateValid(schedule.closeSubmissionDateTime)) {
      return {
        message: 'Invalid closed submission date.',
        status: 'error',
      };
    }

    // Validate late submissions
    if (!isLateSubmissionObjValid(schedule)) {
      return {
        message: 'Invalid late submission data.',
        status: 'error',
      };
    }

    // Validate closing message
    if (!isClosingMessageValid(schedule)) {
      return {
        message: 'Invalid Closing message.',
        status: 'error',
      };
    }
  } else if (scheduleType === ScheduleType.MANUAL) {
    // Manual schedule type is always valid if open date is valid
  } else if (scheduleType === 'period') {
    // For legacy support - treat as CLOSINGDATE if possible
    // If a period form is encountered, calculate a suitable close date
    // but still validate the fields

    // Validate late submissions
    if (!isLateSubmissionObjValid(schedule)) {
      return {
        message: 'Invalid late submission data.',
        status: 'error',
      };
    }

    // Validate closing message
    if (!isClosingMessageValid(schedule)) {
      return {
        message: 'Invalid Closing message.',
        status: 'error',
      };
    }

    // Validate keep open for
    if (!isKeepOpenForValid(schedule)) {
      return {
        message: 'Invalid keep open submission data.',
        status: 'error',
      };
    }

    // Validate repeat data
    if (!isRepeatDataValid(schedule)) {
      return {
        message: 'Invalid repeat submission data.',
        status: 'error',
      };
    }
  } else {
    // Invalid schedule type
    return {
      message: 'Invalid schedule type.',
      status: 'error',
    };
  }

  return result;
};

const isKeepOpenForValid = (schedule) => {
  let keepOpenForInterval = schedule.keepOpenForInterval;
  let keepOpenForTerm = schedule.keepOpenForTerm;
  if (!keepOpenForInterval || keepOpenForInterval === null || !keepOpenForTerm || keepOpenForTerm === null) {
    return false;
  }
  return true;
};

const isRepeatDataValid = (schedule) => {
  let isRepeatSubmissionEnabled = schedule && schedule.repeatSubmission && schedule.repeatSubmission.enabled;
  if (isRepeatSubmissionEnabled) {
    if (
      !schedule.repeatSubmission.everyTerm ||
      schedule.repeatSubmission.everyTerm === null ||
      !schedule.repeatSubmission.repeatUntil ||
      schedule.repeatSubmission.repeatUntil === null ||
      !schedule.repeatSubmission.everyIntervalType ||
      schedule.repeatSubmission.everyIntervalType === null
    ) {
      return false;
    }
  }
  return true;
};

const isLateSubmissionObjValid = (schedule) => {
  let allowLateSubmissions = schedule && schedule.allowLateSubmissions && schedule.allowLateSubmissions.enabled;
  let allowLateSubmissionsForNextTerm = schedule && schedule.allowLateSubmissions && schedule.allowLateSubmissions.forNext && schedule.allowLateSubmissions.forNext.term;
  let allowLateSubmissionsForNextInterval =
    schedule && schedule.allowLateSubmissions && schedule.allowLateSubmissions.forNext && schedule.allowLateSubmissions.forNext.intervalType;

  if (allowLateSubmissions) {
    if (!allowLateSubmissionsForNextTerm || allowLateSubmissionsForNextInterval === null || !allowLateSubmissionsForNextInterval || allowLateSubmissionsForNextInterval === null) {
      return false;
    }
  }
  return true;
};

const isDateValid = (date) => {
  return Date.parse(date);
};

const isClosingMessageValid = (schedule) => {
  if (schedule.closingMessageEnabled) {
    if (!schedule.closingMessage || schedule.closingMessage === null) {
      return false;
    }
  }
  return true;
};

module.exports = {
  falsey,
  getBaseUrl,
  setupMount,
  queryUtils,
  typeUtils,
  isFormExpired,
  getCalculatedCloseSubmissionDate,
  getSubmissionPeriodDates,
  isEligibleLateSubmission,
  periodType,
  checkIsFormExpired,
  flattenComponents,
  unwindPath,
  submissionHeaders,
  encodeURI,
  validateScheduleObject,
};
