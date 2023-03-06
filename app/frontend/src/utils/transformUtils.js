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
 * This function could be removed from frontend in the next commits
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

/**
 * @function isDateValidForMailNotification
 * Check if date is equal or less than today
 *
 * @param {String} parseDate A string of start date period
 */
export function isDateValidForMailNotification(parseDate) {
  const formDate = moment(parseDate, 'YYYY-MM-DD');
  const now = moment();
  if(now.isSameOrAfter(formDate, 'day')){
    return true;
  }
  return false;
}
