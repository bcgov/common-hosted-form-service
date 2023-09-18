const falsey = require('falsey');
const moment = require('moment');
const clone = require('lodash/clone');
const _ = require('lodash');
const setupMount = (type, app, routes, dataErrors) => {
  const p = `/${type}`;
  app.use(p, routes);
  app.use(dataErrors);
  return p;
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
              let availableDates = getAvailableDates(
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

  if (formSchedule && formSchedule.enabled) {
    //Check if Form open date is in past or Is form already started for submission
    if (formSchedule.openSubmissionDateTime) {
      let startDate = moment(formSchedule.openSubmissionDateTime).format('YYYY-MM-DD HH:MM:SS');
      let closingDate = null;
      if (formSchedule.scheduleType === 'closingDate' && formSchedule.closeSubmissionDateTime) {
        closingDate = moment(formSchedule.closeSubmissionDateTime).format('YYYY-MM-DD HH:MM:SS');
      }
      let isFormStartedAlready = moment().diff(startDate, 'seconds'); //If a positive number it means form get started
      if (isFormStartedAlready >= 0) {
        //Form have valid past open date for scheduling so lets check for the next conditions
        if (isFormStartedAlready && formSchedule.enabled && formSchedule.scheduleType !== 'manual') {
          if (formSchedule.closingMessageEnabled) {
            if (formSchedule.closingMessage) {
              result = { ...result, message: formSchedule.closingMessage };
            } else {
              result = { ...result, message: 'Something went wrong.' };
            }
          } else {
            result = { ...result, message: 'The form submission period has expired.' };
          }

          let closeDate =
            formSchedule.scheduleType === 'period'
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
              : closingDate; //moment(formSchedule.closeSubmissionDateTime).format('YYYY-MM-DD HH:MM:SS');
          let isBetweenStartAndCloseDate = moment().isBetween(startDate, closeDate);

          if (isBetweenStartAndCloseDate) {
            /** Check if form is Repeat enabled - start */
            /** Check if form is Repeat enabled and alow late submition - start */
            if (formSchedule.repeatSubmission.enabled) {
              let availableDates = getAvailableDates(
                formSchedule.keepOpenForTerm,
                formSchedule.keepOpenForInterval,
                startDate,
                formSchedule.repeatSubmission.everyTerm,
                formSchedule.repeatSubmission.everyIntervalType,
                formSchedule.allowLateSubmissions.enabled ? formSchedule.allowLateSubmissions.forNext.term : 0,
                formSchedule.allowLateSubmissions.forNext.intervalType,
                formSchedule.repeatSubmission.repeatUntil,
                formSchedule.scheduleType,
                formSchedule.closeSubmissionDateTime
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
 * @function getAvailableDates
 * Get All possible dates in given period with Term and Interval
 *
 * @param {Integer} keepAliveFor An integer for number of days
 * @param {String} keepAliveForInterval A string of days,Weeks,months
 * @param {Object[]} subStartDate An object of Moment JS date
 * @param {Integer} term An integer of number of Days/Weeks OR Years
 * @param {String} interval A string of days,Weeks,months
 * @param {Integer} allowLateTerm An integer of number of Days/Weeks OR Years
 * @param {String} allowLateInterval A string of days,Weeks,months
 * @param {Object[]} repeatUntil An object of Moment JS date
 * @param {String} scheduleType A string one of Manual, ClosingDate OR Period
 * @param {Object[]} closeDate An object of Moment JS date
 * @returns {Object[]} An object array of Available dates in given period
 */
const getAvailableDates = (
  keepAliveFor = 0,
  keepAliveForInterval = 'days',
  subStartDate,
  term = null,
  interval = null,
  allowLateTerm = null,
  allowLateInterval = null,
  repeatUntil,
  scheduleType,
  closeDate = null
) => {
  let substartDate = moment(subStartDate);
  repeatUntil = moment(repeatUntil);
  let calculatedsubcloseDate = getCalculatedCloseSubmissionDate(
    substartDate,
    keepAliveFor,
    keepAliveForInterval,
    allowLateTerm,
    allowLateInterval,
    term,
    interval,
    repeatUntil,
    scheduleType,
    closeDate
  );
  let availableDates = [];
  if (calculatedsubcloseDate && term && interval) {
    while (substartDate.isBefore(calculatedsubcloseDate)) {
      let newDate = substartDate.clone();
      if (substartDate.isBefore(repeatUntil)) {
        availableDates.push(
          Object({
            startDate: substartDate.format('YYYY-MM-DD HH:MM:SS'),
            closeDate: newDate.add(keepAliveFor, keepAliveForInterval).format('YYYY-MM-DD HH:MM:SS'),
            graceDate: newDate.add(allowLateTerm, allowLateInterval).format('YYYY-MM-DD HH:MM:SS'),
          })
        );
      }
      substartDate.add(term, interval);
    }
  }

  if (term == null && interval == null && keepAliveFor && keepAliveForInterval) {
    let newDates = substartDate.clone();
    availableDates.push(
      Object({
        startDate: substartDate.format('YYYY-MM-DD HH:MM:SS'),
        closeDate: newDates.add(keepAliveFor, keepAliveForInterval).format('YYYY-MM-DD HH:MM:SS'),
        graceDate: allowLateTerm && allowLateInterval ? newDates.add(allowLateTerm, allowLateInterval).format('YYYY-MM-DD HH:MM:SS') : null,
      })
    );
  }
  return availableDates;
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
    calculatedCloseDate = openDate.add(keepOpenForTerm, keepOpenForInterval).format('YYYY-MM-DD HH:MM:SS');
  } else {
    if (repeatSubmissionTerm && repeatSubmissionInterval && repeatSubmissionUntil) {
      calculatedCloseDate = repeatSubmissionUntil;
    }
    if (allowLateTerm && allowLateInterval) {
      calculatedCloseDate = calculatedCloseDate.add(keepOpenForTerm, keepOpenForInterval).add(allowLateTerm, allowLateInterval).format('YYYY-MM-DD HH:MM:SS');
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
      if (schType === 'closingDate') {
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
      } else if (schType === 'period') {
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
        if (schType !== 'manual') {
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
  setupMount,
  queryUtils,
  typeUtils,
  isFormExpired,
  getCalculatedCloseSubmissionDate,
  getAvailableDates,
  isEligibleLateSubmission,
  periodType,
  checkIsFormExpired,
  flattenComponents,
  unwindPath,
  submissionHeaders,
  encodeURI,
  validateScheduleObject,
};
