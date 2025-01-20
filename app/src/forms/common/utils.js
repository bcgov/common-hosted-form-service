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
 * @function isFormExpired
 * Returns true for a form's schedule object if this form schedule available for that period
 * @param {Object} form Schedule data
 * @returns {boolean} TRUE if form not expired and Available to submission
 *
 */
const isFormExpired = (formSchedule = {}) => {
  let result = {
    allowLateSubmissions: false,
    expire: false,
    message: 'Form Submission is not available.',
  };

  if (formSchedule && formSchedule.enabled) {
    //Check if Form open date is in past or Is form already started for submission
    if (formSchedule.openSubmissionDateTime) {
      let startDate = moment(formSchedule.openSubmissionDateTime).format('YYYY-MM-DD HH:MM:SS');
      let isFormStartedAlready = moment().diff(startDate, 'seconds'); //If a positive number it means form get started
      if (isFormStartedAlready >= 0) {
        //Form have valid past open date for scheduling so lets check for the next conditions
        if (isFormStartedAlready && formSchedule.enabled) {
          if (formSchedule.closingMessage) {
            result = { ...result, message: formSchedule.closingMessage };
          }
          let closeDate = getCalculatedCloseSubmissionDate(
            startDate,
            formSchedule.keepOpenForTerm,
            formSchedule.keepOpenForInterval,
            formSchedule.allowLateSubmissions.enabled ? formSchedule.allowLateSubmissions.forNext.term : 0,
            formSchedule.allowLateSubmissions.forNext.intervalType,
            formSchedule.repeatSubmission.everyTerm,
            formSchedule.repeatSubmission.everyIntervalType,
            formSchedule.repeatSubmission.repeatUntil
          ); //moment(formSchedule.closeSubmissionDateTime).format('YYYY-MM-DD HH:MM:SS');
          let isBetweenStartAndCloseDate = moment().isBetween(startDate, closeDate);

          if (isBetweenStartAndCloseDate) {
            /** Check if form is Repeat enabled - start */
            /** Check if form is Repeat enabled and alow late submition - start */
            if (formSchedule.repeatSubmission.enabled) {
              let availableDates = getSubmissionPeriodDates(
                formSchedule.keepOpenForTerm,
                formSchedule.keepOpenForInterval,
                startDate,
                formSchedule.repeatSubmission.everyTerm,
                formSchedule.repeatSubmission.everyIntervalType,
                formSchedule.allowLateSubmissions.enabled ? formSchedule.allowLateSubmissions.forNext.term : 0,
                formSchedule.allowLateSubmissions.forNext.intervalType,
                formSchedule.repeatSubmission.repeatUntil
              );
              for (let i = 0; i < availableDates.length; i++) {
                //Check if today is the day when a submitter can submit the form for given period of repeat submission
                let repeatIsBetweenStartAndCloseDate = moment().isBetween(availableDates[i].startDate, availableDates[i].closeDate);

                if (repeatIsBetweenStartAndCloseDate) {
                  result = { ...result, expire: false }; //Form is available for given period to be submit.
                  break;
                } else if (formSchedule.allowLateSubmissions.enabled) {
                  result = { ...result, expire: true };
                  /** Check if form is alow late submition - start */
                  let isallowLateSubmissions = moment().isBetween(availableDates[i].startDate, availableDates[i].graceDate);

                  if (isallowLateSubmissions) {
                    //If late submission is allowed for the given repeat submission period then stop checking for other dates
                    result = {
                      ...result,
                      expire: true,
                      allowLateSubmissions: isallowLateSubmissions,
                    };
                    break;
                  }
                  /** Check if form is alow late submition - end */
                } else {
                  result = { ...result, expire: true, allowLateSubmissions: false };
                }
              }
            }
            /** Check if form is Repeat enabled and alow late submition - end */
            /** Check if form is Repeat enabled - end */
          } else {
            //if close date not valid or not-in future OR close date not in between start and Today then block formSubmission but check the late submission if allowed

            if (formSchedule.allowLateSubmissions.enabled) {
              /** Check if form is alow late submition - start */
              result = {
                ...result,
                expire: true,
                allowLateSubmissions: isEligibleLateSubmission(closeDate, formSchedule.allowLateSubmissions.forNext.term, formSchedule.allowLateSubmissions.forNext.intervalType),
              };
              /** Check if form is alow late submition - end */
            } else {
              result = { ...result, expire: true, allowLateSubmissions: false };
            }
          }
        }
      } else {
        //Form schedule open date is in the future so form will not be available for submission
        result = { ...result, expire: true, allowLateSubmissions: false, message: 'This form is not yet available for submission.' };
      }
    }
  }
  return result;
};

/**
 * @function checkIsFormExpired
 * @param {Object} form Schedule data
 * @returns {Object} {allowLateSubmissions:Boolean,expire:Boolean,message:String}
 *
 */
const checkIsFormExpired = (formSchedule = {}) => {
  let result = {
    allowLateSubmissions: false,
    expire: false,
    message: '',
  };

  if (formSchedule && formSchedule.enabled && formSchedule.openSubmissionDateTime) {
    // The start date is the date that the form should be scheduled to be open to allow submissions
    let startDate = moment(formSchedule.openSubmissionDateTime).startOf('day');
    // The closing date is the date that the form should be scheduled to be closed
    let closingDate = null;
    if (formSchedule.scheduleType === ScheduleType.CLOSINGDATE && formSchedule.closeSubmissionDateTime) {
      closingDate = moment(formSchedule.closeSubmissionDateTime).endOf('day');
    }

    const currentMoment = moment();

    let isFormStartedAlready = currentMoment.diff(startDate, 'seconds'); //If a positive number it means form get started

    if (isFormStartedAlready >= 0) {
      // The manual submission period does not have a custom closing message
      if (formSchedule.scheduleType !== ScheduleType.MANUAL) {
        if (formSchedule.closingMessageEnabled && formSchedule.closingMessage) {
          result = { ...result, message: formSchedule.closingMessage };
        }

        let closeDate =
          formSchedule.scheduleType === ScheduleType.PERIOD
            ? getCalculatedCloseSubmissionDate(
                startDate,
                formSchedule.keepOpenForTerm,
                formSchedule.keepOpenForInterval,
                formSchedule.allowLateSubmissions.enabled ? formSchedule.allowLateSubmissions.forNext.term : 0,
                formSchedule.allowLateSubmissions.forNext.intervalType,
                formSchedule.repeatSubmission.everyTerm,
                formSchedule.repeatSubmission.everyIntervalType,
                formSchedule.repeatSubmission.repeatUntil,
                formSchedule.scheduleType,
                formSchedule.closeSubmissionDateTime
              )
            : closingDate;
        let isBetweenStartAndCloseDate = currentMoment.isBetween(startDate, closeDate);
        if (isBetweenStartAndCloseDate) {
          if (formSchedule.repeatSubmission.enabled) {
            // These are the available submission periods that a user can submit
            let availableDates = getSubmissionPeriodDates(
              formSchedule.keepOpenForTerm,
              formSchedule.keepOpenForInterval,
              startDate,
              formSchedule.repeatSubmission.everyTerm,
              formSchedule.repeatSubmission.everyIntervalType,
              formSchedule.allowLateSubmissions.enabled ? formSchedule.allowLateSubmissions.forNext.term : 0,
              formSchedule.allowLateSubmissions.forNext.intervalType,
              formSchedule.repeatSubmission.repeatUntil
            );
            for (let i = 0; i < availableDates.length; i++) {
              // Check if today is the day when a submitter can submit the form for given period of repeat submission
              let repeatIsBetweenStartAndCloseDate = moment().isBetween(availableDates[i].startDate, availableDates[i].closeDate);

              if (repeatIsBetweenStartAndCloseDate) {
                result = { ...result, expire: false }; //Form is available for given period to be submit.
                break;
              } else if (formSchedule.allowLateSubmissions.enabled) {
                result = { ...result, expire: true };
                let isallowLateSubmissions = moment().isBetween(availableDates[i].startDate, availableDates[i].graceDate);
                if (isallowLateSubmissions) {
                  //If late submission is allowed for the given repeat submission period then stop checking for other dates
                  result = {
                    ...result,
                    expire: true,
                    allowLateSubmissions: isallowLateSubmissions,
                  };
                  break;
                }
              } else {
                result = { ...result, expire: true, allowLateSubmissions: false };
              }
            }
          }
        } else {
          // Block form submission but check if the designer allowed for late submissions
          if (formSchedule.allowLateSubmissions.enabled) {
            result = {
              ...result,
              expire: true,
              allowLateSubmissions: isEligibleLateSubmission(closeDate, formSchedule.allowLateSubmissions.forNext.term, formSchedule.allowLateSubmissions.forNext.intervalType),
            };
          } else {
            result = { ...result, expire: true, allowLateSubmissions: formSchedule.allowLateSubmissions.enabled };
          }
        }
      }
    } else {
      // The open submission date time is a future date time, so the form is not yet available for submission
      result = { ...result, expire: true, allowLateSubmissions: formSchedule.allowLateSubmissions.enabled, message: 'This form is not yet available for submission.' };
    }
  }

  return result;
};

/**
 * @function isEligibleLateSubmission
 * Get All possible dates in given period with Term and Interval
 *
 * @param {Object[]} date An object of Moment JS date
 * @param {Integer} term An integer of number of Days/Weeks OR Years
 * @param {String} interval A string of days,Weeks,months
 * @returns {Boolean} Return true if form is available for late submission
 */
const isEligibleLateSubmission = (date, term, interval) => {
  let gracePeriodDate = moment(date, 'YYYY-MM-DD HH:mm:ss').add(term, interval).format('YYYY-MM-DD HH:mm:ss');
  let isBetweenCloseAndGraceDate = moment().isBetween(date, gracePeriodDate);
  return isBetweenCloseAndGraceDate;
};

/**
 * @function getSubmissionPeriodDates
 * Gets all possible dates for a submission period
 *
 * @param {Integer} keepOpenForTerm A submission period's number of period intervals
 * @param {String} keepOpenForInterval A submission period's intervals which can be days, weeks, months, or years
 * @param {Object} openSubmissionDateTime A moment object of the day the form will be open for submissions
 * @param {Integer} repeatSubmissionTerm A submission period's number of repeat intervals
 * @param {String} repeatSubmissionInterval A submission period's repeat intervals which can be days, weeks, months, or years
 * @param {Integer} allowLateTerm A late submission's number of period intervals
 * @param {String} allowLateInterval A late submission's intervals which can be days, weeks, months, or years
 * @param {Object} repeatSubmissionUntil A moment of the day that a submission period will stop repeat intervals
 * @returns {Object} An object array of available dates in given period
 */
const getSubmissionPeriodDates = (
  keepOpenForTerm = 0,
  keepOpenForInterval = 'days',
  openSubmissionDateTime,
  repeatSubmissionTerm = null,
  repeatSubmissionInterval = null,
  allowLateTerm = null,
  allowLateInterval = null,
  repeatSubmissionUntil
) => {
  let submissionPeriodDates = [];
  let openSubmissionDate = moment.isMoment(openSubmissionDateTime) ? openSubmissionDateTime.clone() : moment(openSubmissionDateTime);
  let calculatedCloseDate = openSubmissionDate.clone();
  repeatSubmissionUntil = moment.isMoment(repeatSubmissionUntil) ? repeatSubmissionUntil.clone() : moment(repeatSubmissionUntil);
  let graceDate = null;

  calculatedCloseDate.add(keepOpenForTerm, keepOpenForInterval);
  if (allowLateTerm && allowLateInterval) graceDate = calculatedCloseDate.clone().add(allowLateTerm, allowLateInterval);

  // Always push through the first submission period
  submissionPeriodDates.push({
    startDate: openSubmissionDate.clone(),
    closeDate: calculatedCloseDate,
    graceDate: graceDate,
  });

  // If repeat periods are enabled
  if (repeatSubmissionTerm && repeatSubmissionInterval && repeatSubmissionUntil) {
    // Reset the calculated closing date to the open date
    calculatedCloseDate = openSubmissionDate.clone();
    // This checks that we're not repeating it again if the close date is before
    // the repeat end date.
    while (calculatedCloseDate.clone().add(repeatSubmissionTerm, repeatSubmissionInterval).isBefore(repeatSubmissionUntil)) {
      // Add the repeat period to the open submission date to determine the open submission date
      openSubmissionDate.add(repeatSubmissionTerm, repeatSubmissionInterval);
      // Calculated closing date is now the openSubmission date with the keep open period
      calculatedCloseDate = openSubmissionDate.clone().add(keepOpenForTerm, keepOpenForInterval);
      // If late submissions are enabled, set the grace period equal to the closing date
      // with the addition of the late period
      if (allowLateTerm && allowLateInterval) graceDate = calculatedCloseDate.clone().add(allowLateTerm, allowLateInterval);

      // Add the calculated dates to the submission period array
      submissionPeriodDates.push({
        startDate: openSubmissionDate.clone(),
        closeDate: calculatedCloseDate,
        graceDate: graceDate,
      });

      // Set the calculated closing date equal to the open date again for the repeat submission check
      calculatedCloseDate = openSubmissionDate.clone();
    }
  }

  return submissionPeriodDates;
};

/**
 * @function getCalculatedCloseSubmissionDate
 * Get calculated Close date for a Form schedule setting with the given scenario
 *
 * @param {Object[]} openDate An object of Moment JS date
 * keepOpenForTerm
 * keepOpenForInterval
 * @param {Integer} term An integer of number of Days/Weeks OR Years
 * @param {String} interval A string of days,Weeks,months
 * @param {Integer} allowLateTerm An integer of number of Days/Weeks OR Years
 * @param {String} allowLateInterval A string of days,Weeks,months
 * @param {Integer} repeatSubmissionTerm An integer of number of Days/Weeks OR Years
 * @param {String} repeatSubmissionInterval A string of days,Weeks,months
 * @param {Object[]} repeatUntil An object of Moment JS date
 * @param {Object[]} closeDate and object of moment JS date
 * @returns {Object[]} An object of Moment JS date
 */
const getCalculatedCloseSubmissionDate = (
  openedDate = moment(),
  keepOpenForTerm = 0,
  keepOpenForInterval = 'days',
  allowLateTerm = 0,
  allowLateInterval = 'days',
  repeatSubmissionTerm = 0,
  repeatSubmissionInterval = 'days',
  repeatSubmissionUntil = moment()
) => {
  const openDate = moment(openedDate).clone();
  let calculatedCloseDate = moment(openDate);
  repeatSubmissionUntil = moment(repeatSubmissionUntil);

  if (!allowLateTerm && !repeatSubmissionTerm) {
    calculatedCloseDate = openDate.add(keepOpenForTerm, keepOpenForInterval);
  } else {
    if (repeatSubmissionTerm && repeatSubmissionInterval && repeatSubmissionUntil) {
      calculatedCloseDate = repeatSubmissionUntil;
    }
    if (allowLateTerm && allowLateInterval) {
      calculatedCloseDate = calculatedCloseDate.add(keepOpenForTerm, keepOpenForInterval).add(allowLateTerm, allowLateInterval);
    }
  }

  return calculatedCloseDate;
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

const validateScheduleObject = (schedule = {}) => {
  let result = {
    message: '',
    status: 'success',
  };

  if (schedule.enabled) {
    let schType = schedule.scheduleType;
    let openSubmissionDateTime = schedule.openSubmissionDateTime;
    if (isDateValid(openSubmissionDateTime)) {
      if (schType === ScheduleType.CLOSINGDATE) {
        if (!isDateValid(schedule.closeSubmissionDateTime)) {
          result = {
            message: 'Invalid closed submission date.',
            status: 'error',
          };
          return result;
        }

        if (!isLateSubmissionObjValid(schedule)) {
          result = {
            message: 'Invalid late submission data.',
            status: 'error',
          };
          return result;
        }

        if (!isClosingMessageValid(schedule)) {
          result = {
            message: 'Invalid Closing message.',
            status: 'error',
          };
          return result;
        }
      } else if (schType === ScheduleType.PERIOD) {
        if (!isLateSubmissionObjValid(schedule)) {
          result = {
            message: 'Invalid late submission data.',
            status: 'error',
          };
          return result;
        }

        if (!isClosingMessageValid(schedule)) {
          result = {
            message: 'Invalid Closing message.',
            status: 'error',
          };
          return result;
        }

        //Check keep open for
        if (!isKeepOpenForValid(schedule)) {
          result = {
            message: 'Invalid keep open submission data.',
            status: 'error',
          };
          return result;
        }

        //Check repeat
        if (!isRepeatDataValid(schedule)) {
          result = {
            message: 'Invalid repeat submission data.',
            status: 'error',
          };
          return result;
        }
      } else {
        if (schType !== ScheduleType.MANUAL) {
          result = {
            message: 'Invalid schedule type.',
            status: 'error',
          };
          return result;
        }
      }
    } else {
      result = {
        message: 'Invalid open submission date.',
        status: 'error',
      };
      return result;
    }
  } else {
    result = {
      message: '',
      status: 'success',
    };
    return result;
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
