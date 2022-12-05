const falsey = require('falsey');
const moment = require('moment');
const setupMount = (type, app, routes, dataErrors) => {
  const p = `/${type}`;
  app.use(p, routes);
  app.use(dataErrors);
  return p;
};

const typeUtils = {
  isInt: x => {
    if (isNaN(x)) {
      return false;
    }
    const num = parseFloat(x);
    // use modulus to determine if it is an int
    return num % 1 === 0;
  },
  isString: x => {
    return Object.prototype.toString.call(x) === '[object String]';
  },
  isBoolean: x => {
    return Object.prototype.toString.call(x) === '[object Boolean]';
  },
  isNil: x => {
    return x == null;
  }
};

const queryUtils = {
  defaultActiveOnly: params => {
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
  }
};


/**
 * @function isFormExpired
 * Returns true for a form's schedule object if this form schedule available for that period
 * @param {Object} form Schedule data
 * @returns {boolean} TRUE if form not expired and Available to submission
 *
 */
const isFormExpired = (formSchedule = {}) => {
  var result = {
    allowLateSubmissions:false,
    expire:false,
    message:''
  };

  if(formSchedule && formSchedule.enabled)
  {
    //Check if Form open date is in past or Is form already started for submission
    if(formSchedule.openSubmissionDateTime){
      var startDate = moment(formSchedule.openSubmissionDateTime).format('YYYY-MM-DD HH:MM:SS');
      var isFormStartedAlready = moment().diff(startDate, 'seconds'); //If a positive number it means form get started
      if(isFormStartedAlready >= 0){
        //Form have valid past open date for scheduling so lets check for the next conditions
        if(isFormStartedAlready && formSchedule.enabled){
          if(formSchedule.closingMessage){
            result = {...result,message:formSchedule.closingMessage};
          }
          var closeDate =  getCalculatedCloseSubmissionDate(
            startDate,
            formSchedule.keepOpenForTerm,
            formSchedule.keepOpenForInterval,
            formSchedule.allowLateSubmissions.enabled ? formSchedule.allowLateSubmissions.forNext.term : 0,
            formSchedule.allowLateSubmissions.forNext.intervalType,
            formSchedule.repeatSubmission.everyTerm,
            formSchedule.repeatSubmission.everyIntervalType,
            formSchedule.repeatSubmission.repeatUntil
          ); //moment(formSchedule.closeSubmissionDateTime).format('YYYY-MM-DD HH:MM:SS');
          var isBetweenStartAndCloseDate = moment().isBetween(startDate, closeDate);

          if(isBetweenStartAndCloseDate){
            /** Check if form is Repeat enabled - start */
            /** Check if form is Repeat enabled and alow late submition - start */
            if(formSchedule.repeatSubmission.enabled){
              var availableDates = getAvailableDates(
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
                var repeatIsBetweenStartAndCloseDate = moment().isBetween(availableDates[i].startDate, availableDates[i].closeDate);

                if(repeatIsBetweenStartAndCloseDate) {
                  result = {...result,expire:false}; //Form is available for given period to be submit.
                  break;
                }else if(formSchedule.allowLateSubmissions.enabled){
                  result = {...result,expire:true};
                  /** Check if form is alow late submition - start */
                  var isallowLateSubmissions = moment().isBetween(availableDates[i].startDate, availableDates[i].graceDate);
                  // isEligibleLateSubmission(
                  //   availableDates[i].closeDate, //closing date of given period of repeat submission
                  //   formSchedule.allowLateSubmissions.forNext.term,
                  //   formSchedule.allowLateSubmissions.forNext.intervalType
                  // );
                  if(isallowLateSubmissions){ //If late submission is allowed for the given repeat submission period then stop checking for other dates
                    result = {
                      ...result,
                      expire:true,
                      allowLateSubmissions:isallowLateSubmissions
                    };
                    break;
                  }
                  /** Check if form is alow late submition - end */
                }else{
                  result = {...result, expire:true, allowLateSubmissions:false};
                }
              }
            }
            /** Check if form is Repeat enabled and alow late submition - end */
            /** Check if form is Repeat enabled - end */
          }else{
            //if close date not valid or not-in future OR close date not in between start and Today then block formSubmission but check the late submission if allowed

            if(formSchedule.allowLateSubmissions.enabled){
              /** Check if form is alow late submition - start */
              result = {...result, expire:true, allowLateSubmissions:isEligibleLateSubmission(closeDate,formSchedule.allowLateSubmissions.forNext.term,formSchedule.allowLateSubmissions.forNext.intervalType)};
              /** Check if form is alow late submition - end */
            }else{
              result = {...result, expire:true, allowLateSubmissions:false};
            }
          }
        }
      }else{
        //Form schedule open date is in the future so form will not be available for submission
        result = {...result, expire:true, allowLateSubmissions:false, message:'This form is not yet available for submission.'};
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
const isEligibleLateSubmission = (date,term,interval) => {
  var gracePeriodDate = moment(date,'YYYY-MM-DD HH:mm:ss').add(term,interval).format('YYYY-MM-DD HH:mm:ss');
  var isBetweenClosrAndGraceDate = moment().isBetween(date, gracePeriodDate);
  return isBetweenClosrAndGraceDate;
};


/**
 * @function getAvailableDates
 * Get All possible dates in given period with Term and Interval
 *
 * @param {Integer} keepAliveFor An integer for number of days
 * @param {String} keepAliveForInterval A string of days,Weeks,months
 * @param {Object[]} substartDate An object of Moment JS date
 * @param {Integer} term An integer of number of Days/Weeks OR Years
 * @param {String} interval A string of days,Weeks,months
 * @param {Integer} allowLateTerm An integer of number of Days/Weeks OR Years
 * @param {String} allowLateInterval A string of days,Weeks,months
 * @param {Object[]} repeatUntil An object of Moment JS date
 * @param {String} scheduleType A string one of Manual, ClosingDate OR Period
 * @param {Object[]} closeDate An object of Moment JS date
 * @returns {Object[]} An object array of Available dates in given period
 */
const  getAvailableDates = (
  keepAliveFor=0,
  keepAliveForInterval='days',
  submstartDate,
  term=null,
  interval=null,
  allowLateTerm=null,
  allowLateInterval=null,
  repeatUntil,
  scheduleType,
  closeDate=null
) => {

  let substartDate = moment(submstartDate);
  repeatUntil = moment(repeatUntil);
  var calculatedsubcloseDate = getCalculatedCloseSubmissionDate(substartDate,keepAliveFor,keepAliveForInterval,allowLateTerm,allowLateInterval,term,interval,repeatUntil,scheduleType,closeDate);
  var availableDates = [];
  if(calculatedsubcloseDate && term && interval) {
    while (substartDate.isBefore(calculatedsubcloseDate)) {
      var newDate = substartDate.clone();
      if(substartDate.isBefore(repeatUntil)){
        availableDates.push(Object({
          startDate:substartDate.format('YYYY-MM-DD HH:MM:SS'),
          closeDate:newDate.add(keepAliveFor,keepAliveForInterval).format('YYYY-MM-DD HH:MM:SS'),
          graceDate:newDate.add(allowLateTerm,allowLateInterval).format('YYYY-MM-DD HH:MM:SS')
        }));
      }
      substartDate.add(term,interval);
    }
  }

  if((term == null && interval == null) && (keepAliveFor && keepAliveForInterval)){
    var newDates = substartDate.clone();
    availableDates.push(Object({
      startDate:substartDate.format('YYYY-MM-DD HH:MM:SS'),
      closeDate:newDates.add(keepAliveFor,keepAliveForInterval).format('YYYY-MM-DD HH:MM:SS'),
      graceDate: allowLateTerm && allowLateInterval ? newDates.add(allowLateTerm,allowLateInterval).format('YYYY-MM-DD HH:MM:SS') : null
    }));
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
const getCalculatedCloseSubmissionDate = (openedDate=moment(),keepOpenForTerm=0,keepOpenForInterval='days',allowLateTerm=0,allowLateInterval='days',repeatSubmissionTerm=0,repeatSubmissionInterval='days',repeatSubmissionUntil=moment()) => {
  const openDate = openedDate.clone();
  var calculatedCloseDate = moment(openDate);
  repeatSubmissionUntil = moment(repeatSubmissionUntil);
  if(!allowLateTerm && !allowLateInterval && !repeatSubmissionTerm && !repeatSubmissionInterval){
    calculatedCloseDate = openDate.add(keepOpenForTerm,keepOpenForInterval).format('YYYY-MM-DD HH:MM:SS');
  }else{
    if(repeatSubmissionTerm && repeatSubmissionInterval && repeatSubmissionUntil){
      calculatedCloseDate = repeatSubmissionUntil;
    }
    if(allowLateTerm && allowLateInterval){
      calculatedCloseDate = calculatedCloseDate.add(keepOpenForTerm,keepOpenForInterval).add(allowLateTerm,allowLateInterval).format('YYYY-MM-DD HH:MM:SS');
    }
  }

  return calculatedCloseDate;
};




const periodType = {
  Daily        : { name : 'Daily', value : 1, regex : 'days'} ,
  Weekly       : { name : 'Weekly' , value : 7, regex : 'days'},
  BiWeekly     : { name : 'Bi-weekly' , value : 14 , regex : 'days'} ,
  Monthly      : { name : 'Monthly' , value : 1 , regex : 'months' } ,
  Quaterly     : { name : 'Quaterly'   , value : 3 , regex : 'months'} ,
  SemiAnnually : { name : 'Semi-Annually'   , value : 6 , regex : 'months'},
  Annually     : { name : 'Annually'   , value : 1 , regex : 'years'}
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
  periodType
};
