import formioUtils from 'formiojs/utils';
import moment from 'moment';
import { IdentityMode } from '@/utils/constants';

//
// Transformation Functions for converting form objects
//

/**
 * @function generateIdps
 * Converts idps and userType to identity provider objects
 * @param {String[]} idps A string array of identity providers
 * @param {String} userType The type of users
 * @returns {Object[]} An object array of identity providers
 */
export function generateIdps({ idps, userType }) {
  let identityProviders = [];
  if (userType === IdentityMode.LOGIN && idps && idps.length) {
    identityProviders = identityProviders.concat(idps.map((i) => ({ code: i })));
  } else if (userType === IdentityMode.PUBLIC) {
    identityProviders.push({ code: IdentityMode.PUBLIC });
  }
  return identityProviders;
}

/**
 * @function parseIdps
 * Converts identity provider objects to idps and userType
 * @param {Object[]} identityProviders An object array of identity providers
 * @returns {Object} An object containing idps and userType
 */
export function parseIdps(identityProviders) {
  const result = {
    idps: [],
    userType: IdentityMode.TEAM,
  };
  if (identityProviders && identityProviders.length) {
    if (identityProviders[0].code === IdentityMode.PUBLIC) {
      result.userType = IdentityMode.PUBLIC;
    } else {
      result.userType = IdentityMode.LOGIN;
      result.idps = identityProviders.map((ip) => ip.code);
    }
  }
  return result;
}

/**
 * @function attachAttributesToLinks
 * Attaches attributes to <a> Link tags to open in a new tab
 * @param {Object[]} formSchemaComponents An array of Components
 */
export function attachAttributesToLinks(formSchemaComponents) {
  const simpleContentComponents = formioUtils.searchComponents(formSchemaComponents, {
    type: 'simplecontent'
  });
  const advancedContent = formioUtils.searchComponents(formSchemaComponents, {
    type: 'content'
  });
  const combinedLinks = [...simpleContentComponents, ...advancedContent];

  combinedLinks.forEach((component) => {
    if (component.html && component.html.includes('<a ')) {
      component.html = component.html.replace(/<a(?![^>]+target=)/g,'<a target="_blank" rel="noopener"');
    }
  });
}


/**
 * @function isFormExpired
 * @param {Object} form Schedule data
 * @returns {Object} {allowLateSubmissions:Boolean,expire:Boolean,message:String}
 *
 */
export function isFormExpired(formSchedule = {}) {
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
      var closingDate = null;
      if(formSchedule.scheduleType === 'closingDate' && formSchedule.closeSubmissionDateTime){
        closingDate = moment(formSchedule.closeSubmissionDateTime).format('YYYY-MM-DD HH:MM:SS');
      }
      var isFormStartedAlready = moment().diff(startDate, 'seconds'); //If a positive number it means form get started
      if(isFormStartedAlready >= 0){


        //Form have valid past open date for scheduling so lets check for the next conditions
        if(isFormStartedAlready && formSchedule.enabled && formSchedule.scheduleType !== 'manual'){
          if(formSchedule.closingMessageEnabled){
            if(formSchedule.closingMessage){
              result = {...result,message:formSchedule.closingMessage};
            }else{
              result = {...result,message:'Something went wrong.'};
            }
          }else{
            result = {...result,message:'This form is expired for the period.'};
          }

          var closeDate = formSchedule.scheduleType === 'period' ? getCalculatedCloseSubmissionDate(
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
          ) : closingDate ; //moment(formSchedule.closeSubmissionDateTime).format('YYYY-MM-DD HH:MM:SS');

          // var closeDate = getCalculatedCloseSubmissionDate(
          //   startDate,
          //   formSchedule.keepOpenForTerm,
          //   formSchedule.keepOpenForInterval,
          //   formSchedule.allowLateSubmissions.enabled ? formSchedule.allowLateSubmissions.forNext.term : 0,
          //   formSchedule.allowLateSubmissions.forNext.intervalType,
          //   formSchedule.repeatSubmission.everyTerm,
          //   formSchedule.repeatSubmission.everyIntervalType,
          //   formSchedule.repeatSubmission.repeatUntil,
          //   formSchedule.scheduleType,
          //   closingDate
          // ); //moment(formSchedule.closeSubmissionDateTime).format('YYYY-MM-DD HH:MM:SS');
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
                formSchedule.repeatSubmission.repeatUntil,
                formSchedule.scheduleType,
                formSchedule.closeSubmissionDateTime
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
}

/**
 * @function isEligibleLateSubmission
 * Get All possible dates in given period with Term and Interval
 *
 * @param {Object[]} date An object of Moment JS date
 * @param {Integer} term An integer of number of Days/Weeks OR Years
 * @param {String} interval A string of days,Weeks,months
 * @returns {Boolean} Return true if form is available for late submission
 */
export function isEligibleLateSubmission(date,term,interval){
  var gracePeriodDate = moment(date,'YYYY-MM-DD HH:mm:ss').add(term,interval).format('YYYY-MM-DD HH:mm:ss');
  var isBetweenClosrAndGraceDate = moment().isBetween(date, gracePeriodDate);
  return isBetweenClosrAndGraceDate;
}

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
export function getAvailableDates(
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
) {

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
}



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
export function getCalculatedCloseSubmissionDate(openedDate=moment(),keepOpenForTerm=0,keepOpenForInterval='days',allowLateTerm=0,allowLateInterval='days',repeatSubmissionTerm=0,repeatSubmissionInterval='days',repeatSubmissionUntil=moment()){
  const openDate = moment(openedDate).clone();
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
}


/**
 * @function calculateCloseDate
 * Get close date when provided a given period for late submission
 *
 * @param {Integer} allowLateTerm An integer of number of Days/Weeks OR Years
 * @param {String} allowLateInterval A string of days,Weeks,months
 */
export function calculateCloseDate(
  subcloseDate=moment(),
  allowLateTerm=null,
  allowLateInterval=null
) {
  let closeDate = moment(subcloseDate);
  const closeDateRet = closeDate.add(allowLateTerm,allowLateInterval).format('YYYY-MM-DD HH:MM:SS');
  return closeDateRet;
}
