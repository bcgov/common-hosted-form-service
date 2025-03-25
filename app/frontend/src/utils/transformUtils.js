import formioUtils from 'formiojs/utils';
import moment from 'moment';
import { IdentityMode } from '~/utils/constants';

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
    identityProviders = identityProviders.concat(
      idps.map((i) => ({ code: i }))
    );
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
  const simpleContentComponents = formioUtils.searchComponents(
    formSchemaComponents,
    {
      type: 'simplecontent',
    }
  );
  const advancedContent = formioUtils.searchComponents(formSchemaComponents, {
    type: 'content',
  });
  const combinedLinks = [...simpleContentComponents, ...advancedContent];

  combinedLinks.forEach((component) => {
    if (component.html && component.html.includes('<a ')) {
      component.html = component.html.replace(
        /<a(?![^>]+target=)/g,
        '<a target="_blank" rel="noopener"'
      );
    }
  });
}

/**
 * @function getSubmissionPeriodDates
 * Gets the submission period dates based on the form's schedule
 *
 * @param {String|Object} openDate The form's opening date (string or moment object)
 * @param {String|Object} closeDate The form's closing date (string or moment object)
 * @param {Object} allowLateSubmissions The late submissions configuration
 * @returns {Array} An array with the calculated date period
 */
export function getSubmissionPeriodDates(
  openDate,
  closeDate,
  allowLateSubmissions = null
) {
  let openSubmissionDate = moment.isMoment(openDate)
    ? openDate.clone()
    : moment(new Date(openDate));

  let calculatedCloseDate = moment.isMoment(closeDate)
    ? closeDate.clone()
    : moment(new Date(closeDate));

  let graceDate = null;

  // If late submissions are enabled, calculate the grace date
  if (
    allowLateSubmissions &&
    allowLateSubmissions.enabled &&
    allowLateSubmissions.forNext &&
    allowLateSubmissions.forNext.term &&
    allowLateSubmissions.forNext.intervalType
  ) {
    graceDate = calculatedCloseDate
      .clone()
      .add(
        allowLateSubmissions.forNext.term,
        allowLateSubmissions.forNext.intervalType
      )
      .format('YYYY-MM-DD HH:MM:SS');
  }

  return [
    {
      startDate: openSubmissionDate.format('YYYY-MM-DD HH:MM:SS'),
      closeDate: calculatedCloseDate.format('YYYY-MM-DD HH:MM:SS'),
      graceDate: graceDate,
    },
  ];
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
  if (now.isSameOrAfter(formDate, 'day')) {
    return true;
  }
  return false;
}

// disposition retrieval from https://stackoverflow.com/a/40940790
export function getDisposition(disposition) {
  if (disposition && disposition.indexOf('attachment') !== -1) {
    let filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    let matches = filenameRegex.exec(disposition);
    if (matches != null && matches[1]) {
      disposition = matches[1].replace(/['"]/g, '');
    }
  }
  return disposition;
}

export function filterObject(_itemTitle, queryText, item) {
  return Object.values(item)
    .filter((v) => v)
    .some((v) => {
      if (typeof v === 'string')
        return v.toLowerCase().includes(queryText.toLowerCase());
      else {
        return Object.values(v).some(
          (nestedValue) =>
            typeof nestedValue === 'string' &&
            nestedValue.toLowerCase().includes(queryText.toLowerCase())
        );
      }
    });
}

export function splitFileName(filename = undefined) {
  let name = undefined;
  let extension = undefined;

  if (filename) {
    const filenameArray = filename.split('.');
    name = filenameArray.slice(0, -1).join('.');
    extension = filenameArray.slice(-1).join('.');
  }

  return { name, extension };
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.replace(/^.*,/, ''));
    reader.onerror = (error) => reject(error);
  });
}
