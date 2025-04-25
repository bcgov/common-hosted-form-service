const { getBaseUrl } = require('../common/utils');
const emailService = require('./emailService');
const moment = require('moment-timezone');
const { EmailTypes, ScheduleType } = require('../common/constants');
const { SubmissionData, UserFormAccess, Form } = require('../common/models');
const { Roles } = require('../common/constants');
const {
  getCurrentPeriod,
  getSubmissionPeriodDates,
  getGracePeriodEndDate,
  isSameDay,
  daysBetween,
  calculateDatePlus,
  calculateMiddleDate,
  DEFAULT_TIMEZONE,
  getCurrentDate,
} = require('../common/scheduleService');

/**
 * Determines what type of reminder email should be sent based on current date and schedule
 * @param {Object} scheduleOrReport The form schedule or period report
 * @param {Date|String} referenceDate Optional reference date (defaults to now)
 * @param {Boolean} respectTimeComponent Whether to respect time components in dates (defaults to false)
 * @returns {String|undefined} Email type constant or undefined if no reminder should be sent
 */
function getEmailReminderType(scheduleOrReport, referenceDate = null, respectTimeComponent = false) {
  // Get the current period if a schedule was provided
  if (!scheduleOrReport || (scheduleOrReport.scheduleType !== undefined && (!scheduleOrReport.enabled || !scheduleOrReport.openSubmissionDateTime))) {
    return undefined;
  }
  const report = scheduleOrReport.scheduleType !== undefined ? getCurrentPeriod(scheduleOrReport, referenceDate, respectTimeComponent) : scheduleOrReport;
  if (!report || !report.dates) return undefined;
  const timezone = report.dates.timezone || DEFAULT_TIMEZONE;
  const now = getCurrentDate(referenceDate, timezone);
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

const service = {
  _init: async () => {
    const forms = await service._getForms();

    const q = await service._getReminders(forms);

    const referer = getBaseUrl();
    const resolve = [];
    const errors = [];
    let mail = 0;

    if (q.length !== 0) {
      for (let i = 0; i < q.length; i++) {
        if (!q[i].error) {
          const obj = await service._runQueries(q[i].statement);
          let result = await service._initStatement(obj);
          let chesResponses = service._initMailSender(result, referer);
          resolve.push({
            formId: result.form.id,
            formName: result.form.name,
            type_mail: result.state,
            number_mail: result.submitters.length,
            period_type: q[i].periodType,
            chesResponses,
          });
          // eslint-disable-next-line no-unused-vars
          mail += result.submitters.length;
        } else {
          errors.push(q[i].message);
        }
      }
      return {
        message: `${q.length} forms found, ${mail} emails sent.`,
        errors,
        resolve,
      };
    } else {
      return {
        message: '0 emails sent.',
        data: q,
      };
    }
  },
  getCurrentPeriod,
  _listDates: getSubmissionPeriodDates,
  _getGraceDate: getGracePeriodEndDate,
  _getForms: async () => {
    let fs = [];
    await Form.query()
      .modify('reminderEnabled')
      .modify('filterActive', true)
      .then((forms) => {
        fs = forms;
      });
    return fs;
  },
  _getReminders: async (forms) => {
    let reminder = [];
    let toDay = moment.tz('America/Vancouver');
    for (let i = 0; i < forms.length; i++) {
      let obj = {};

      obj.availableDate = service._listDates(forms[i].schedule);

      if (obj.availableDate.length == 0) {
        reminder.push({ error: true, message: `Form ${forms[i].name} has no available date.` });
        continue;
      }

      obj.report = service.getCurrentPeriod(obj.availableDate, toDay, forms[i].schedule.allowLateSubmissions && forms[i].schedule.allowLateSubmissions.enabled);

      obj.form = forms[i];
      obj.state = service._getMailType(obj.report, toDay, forms[i].schedule.allowLateSubmissions && forms[i].schedule.allowLateSubmissions.enabled);
      if (obj.state == undefined) {
        reminder.push({ error: true, message: `Form ${forms[i].name} has no valid date` });
        continue;
      }

      // Map any non-standard schedule type to CLOSINGDATE
      const reportPeriodType = forms[i].schedule.scheduleType !== ScheduleType.MANUAL ? ScheduleType.CLOSINGDATE : forms[i].schedule.scheduleType;

      reminder.push({
        error: false,
        statement: obj,
        periodType: reportPeriodType,
      });
    }

    return reminder;
  },
  _getMailType: getEmailReminderType,
  checkIfInMiddleOfThePeriod: (now, start_date, days_diff) => {
    if (days_diff < 6) return false;
    let interval = Math.floor(days_diff / 2);
    let mail_date = moment(start_date).add(interval, 'days').format('YYYY-MM-DD');
    return moment(now).isSame(mail_date);
  },
  _runQueries: async (obj) => {
    obj.fillers = [];
    await UserFormAccess.query()
      .select('formVersionId', 'formName', 'userId', 'firstName', 'lastName', 'email')
      .where('formId', obj.form.id)
      .whereNot('email', '')
      .whereNotNull('email')
      .modify('filterActive', true)
      .modify('filterByAccess', undefined, Roles.FORM_SUBMITTER, undefined)
      .modify('orderDefault')
      .then(function (data) {
        obj.submitters = data;
      });

    if (obj.submitters && obj.submitters.length > 0) {
      await SubmissionData.query()
        .select('confirmationId', 'createdAt', 'submissionId', 'formVersionId', 'userId', 'firstName', 'lastName', 'email')
        .where('formId', obj.form.id)
        .whereNot('email', '')
        .whereNotNull('email')
        .modify('filterDrafts', false)
        .modify('filterDeleted', false)
        .modify('filterCreatedAt', obj.report.dates.startDate, obj.report.dates.graceDate)
        .modify('orderDefault')
        .then(function (data2) {
          obj.fillers = data2 ? data2 : [];
        });
    }

    return obj;
  },
  getDifference: async (array1, array2) => {
    return array1.filter((object1) => {
      return !array2.some((object2) => {
        return object1.userId === object2.userId;
      });
    });
  },
  _initStatement: async (obj) => {
    const statement = {};
    statement.form = obj.form;
    statement.report = obj.report;
    statement.state = obj.state;
    statement.submitters = [];

    if (!obj.submitters || obj.submitters.length == 0) return statement;

    if (statement.state != EmailTypes.REMINDER_FORM_OPEN) {
      if (obj.fillers && obj.fillers.length != 0) {
        statement.submitters = await service.getDifference(obj.submitters, obj.fillers);
      } else {
        statement.submitters = obj.submitters;
      }
    } else {
      statement.submitters = obj.submitters;
    }
    return statement;
  },
  _initMailSender: async (statement, referer) => {
    const chesResponse = [];
    const users = statement.submitters.map((user) => user.email);
    const data = { form: statement.form, report: statement.report, users, state: statement.state, referer };
    chesResponse.push(emailService.initReminder(data));
    return chesResponse;
  },
};
module.exports = service;
