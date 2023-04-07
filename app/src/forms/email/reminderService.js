const { getAvailableDates } = require('../common/utils');
const emailService = require('./emailService');
const moment = require('moment');
const { EmailTypes, ScheduleType } = require('../common/constants');
const config = require('config');
const log = require('../../components/log')(module.filename);
const { SubmissionData, UserFormAccess, Form } = require('../common/models');
const { Roles } = require('../common/constants');

const service = {
  _init: async () => {
    const forms = await service._getForms();

    const q = await service._getReminders(forms);

    const referer = service._getReferer();
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
  getCurrentPeriod(dates, toDay, late) {
    // if send and empty date
    if (dates == null || dates == undefined) return null;

    // list periods is null
    if (dates.length == 0) return null;

    // if period has no closed date
    if (dates.length == 1 && dates[0].endDate == null) {
      return Object({
        state: 1,
        index: 0,
        dates: dates[0],
        old_dates: null,
        late: 0,
      });
    }

    // check for the current period
    for (let i = 0; i < dates.length; i++) {
      let startDate = moment(dates[i].startDate).format('YYYY-MM-DD');
      let graceDate = late ? moment(dates[i].graceDate).format('YYYY-MM-DD') : moment(dates[i].closeDate).format('YYYY-MM-DD');
      if (toDay.isBetween(startDate, graceDate)) {
        return Object({
          state: 1,
          index: i,
          dates: dates[i],
          old_dates: i == 0 ? null : dates[i - 1],
          late: toDay.isBetween(dates[i].closeDate, dates[i].graceDate) ? 1 : 0,
        });
      }
    }

    let first = dates[0];
    return Object({
      state: toDay.isBefore(first.startDate) ? -1 : 0,
      index: -1,
      dates: false,
      old_dates: false,
      late: -1,
    });
  },
  _listDates: (schedule) => {
    if (schedule.scheduleType == ScheduleType.PERIOD) {
      return getAvailableDates(
        schedule.keepOpenForTerm,
        schedule.keepOpenForInterval,
        schedule.openSubmissionDateTime,
        schedule.repeatSubmission.everyTerm,
        schedule.repeatSubmission.everyIntervalType,
        schedule.allowLateSubmissions.forNext.term,
        schedule.allowLateSubmissions.forNext.intervalType,
        schedule.repeatSubmission.repeatUntil,
        schedule.scheduleType,
        schedule.closeSubmissionDateTime
      );
    }
    if (schedule.scheduleType == ScheduleType.MANUAL) {
      return [
        Object({
          startDate: schedule.openSubmissionDateTime,
          closeDate: null,
          graceDate: null,
        }),
      ];
    }

    if (schedule.scheduleType == ScheduleType.CLOSINGDATE) {
      return [
        Object({
          startDate: schedule.openSubmissionDateTime,
          closeDate: schedule.closeSubmissionDateTime,
          graceDate: service._getGraceDate(schedule),
        }),
      ];
    }
  },
  _getGraceDate: (schedule) => {
    let substartDate = moment(schedule.openSubmissionDateTime);
    let newDate = substartDate.clone();
    return schedule.allowLateSubmissions.enabled
      ? newDate.add(schedule.allowLateSubmissions.forNext.term, schedule.allowLateSubmissions.forNext.intervalType).format('YYYY-MM-DD HH:MM:SS')
      : null;
  },
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
    let toDay = moment();
    for (let i = 0; i < forms.length; i++) {
      let obj = {};

      obj.availableDate = service._listDates(forms[i].schedule);

      if (obj.availableDate.length == 0) {
        reminder.push({ error: true, message: `Form ${forms[i].name} has no available date.` });
        continue;
      }

      obj.report = service.getCurrentPeriod(obj.availableDate, toDay, forms[i].schedule.allowLateSubmissions.enabled);

      obj.form = forms[i];

      obj.state = service._getMailType(obj.report, forms[i].schedule.allowLateSubmissions.enabled);

      if (obj.state == undefined) {
        reminder.push({ error: true, message: `Form ${forms[i].name} has no valid date` });
        continue;
      }

      reminder.push({
        error: false,
        statement: obj,
        periodType: forms[i].schedule.scheduleType,
      });
    }

    return reminder;
  },
  _getMailType: (report, late) => {
    let state = undefined;

    const now = moment().format('YYYY-MM-DD');
    const start_date = moment(report.dates.startDate).format('YYYY-MM-DD');
    const end_date = late ? moment(report.dates.graceDate).format('YYYY-MM-DD') : moment(report.dates.closeDate).format('YYYY-MM-DD');
    const days_diff = moment(end_date).diff(start_date, 'days');

    if (moment(now).isSame(start_date)) {
      return EmailTypes.REMINDER_FORM_OPEN;
    }

    if (report.dates.closeDate == null || days_diff <= 3) return state;

    if (service.checkIfInMiddleOfThePeriod(now, start_date, days_diff)) {
      return EmailTypes.REMINDER_FORM_NOT_FILL;
    }

    const yend_date = moment(end_date).subtract(1, 'day');

    if (moment(now).isSame(yend_date)) {
      return EmailTypes.REMINDER_FORM_WILL_CLOSE;
    }

    return state;
  },
  checkIfInMiddleOfThePeriod: (now, start_date, days_diff) => {
    if (days_diff < 6) return false;
    let interval = Math.floor(days_diff / 2);
    // eslint-disable-next-line no-console
    let mail_date = moment(start_date).add(interval, 'days').format('YYYY-MM-DD');
    return moment(now).isSame(mail_date);
  },
  _runQueries: async (obj) => {
    obj.fillers = [];
    await UserFormAccess.query()
      .select('formVersionId', 'formName', 'userId', 'firstName', 'lastName', 'email')
      .where('formId', obj.form.id)
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
  _getReferer: () => {
    // We create this function because in the header we cant get the real referer but
    // this function allow us to generate the referer dynamicly
    try {
      const protocol = 'https://';
      const basePath = config.get('frontend.basePath');
      const host = process.env.SERVER_HOST;
      return `${protocol}${host}${basePath}`;
    } catch (error) {
      log.error(error.message, {
        function: '_getReferer',
      });
      throw error;
    }
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
