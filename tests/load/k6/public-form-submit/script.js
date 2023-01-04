import http from 'k6/http';
import { fail, check } from 'k6';
import { SharedArray } from 'k6/data';

// -------------------------------------------------------------------------------------------------
// 1. Init
// -------------------------------------------------------------------------------------------------
// https://k6.io/docs/using-k6/environment-variables
const chefsUrl = `${__ENV.URL}`
const formId = `${__ENV.FORM_ID}`
// 'small' 'medium' or 'large'
const formType = `${__ENV.FORM_TYPE}`

// Options for the test run. These can be overidden for a run. See https://k6.io/docs/using-k6/options
export let options = {
  // Token only lasts 5 mins
  maxDuration: '4m55s',
  thresholds: {
    // the rate of successful checks should be higher than 99%
    // TODO: figure out what this should be (100%)
    checks: ['rate>0.99'],
  },
  userAgent: 'CommonServicesTeamLoadTestK6/1.0',

  // K6 vars, overload in the command
  iterations: 1,
  vus: 1
  // For now comment out the 2 lines above and uncomment below for rate testing
  // TODO: parameterize this into 2 scenarios that can be invoked
  // scenarios: {
  //   contacts: {
  //     executor: 'constant-arrival-rate',
  //     rate: 2250, // this is per-minute, see "timeUnit" below
  //     duration: '4m',
  //     preAllocatedVUs: 50,
  //     timeUnit: '1m',
  //     maxVUs: 300,
  //   },
  // },
};

// Open the JSON file for the form data and make it available
// See https://k6.io/docs/javascript-api/k6-data/sharedarray/
const formData = new SharedArray('form data file', function () {
  let formDataJson = undefined;
  if (formType === 'small' || formType === 'medium' || formType === 'large') {
    formDataJson = JSON.parse(open(`./fixtures/${formType}_form_data.json`));
  } else {
    fail('No valid environment supplied. Supply "small", "medium", or "large".');
  }
  return formDataJson; // f must be an array
});

// -------------------------------------------------------------------------------------------------
// 2. Setup
// -------------------------------------------------------------------------------------------------
export function setup() {
  // Not much needed in setup in this script. Using the new k6 SharedArray construct above to load the file
  console.log(`CHEFS url: ${chefsUrl}`);
  console.log(`Form Id: ${formId}`);
  console.log(`Form Type: ${formType}`);

  // Check a formId guid was supplied or nothing will work
  const pattern = new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', 'i');
  if (!formId.match(pattern)) {
    fail('No valid Form ID supplied. Specify a "FORM_ID" environment variable with the ID of the Form to POST to.');
  }
}

// -------------------------------------------------------------------------------------------------
// 3. VU Code
// -------------------------------------------------------------------------------------------------
export default function (data) {
  // Flow of tests here will be a typical public user submission
  // Get form, submit form, get submission

  console.log(`VU: ${__VU}  -  ITER: ${__ITER}`);
  console.debug('Running Tests');
  console.debug(`Data from setup: ${JSON.stringify(data)}`);
  if (!formData) {
    fail('ERROR: No sample form data available from init step.');
  }

  // No auth, public form submission
  const options = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Call get to fetch the form from the form API
  const urlToGetForm = `${chefsUrl}/app/api/v1/forms/${formId}/version`;
  const getFormResponse = http.get(urlToGetForm);
  if (!check(getFormResponse, {
    'is status 200': (r) => r.status === 200
  })) {
    console.warn(JSON.stringify(getFormResponse, 0, 2));
  }
  const versionId = getFormResponse.json().versions[0].id;
  console.debug(`VersionId for form: ${versionId}`);

  // Post the configured form
  const urlToPostTo = `${chefsUrl}/app/api/v1/forms/${formId}/versions/${versionId}/submissions`;
  // This is [0] because the file import SharedArray thing (see above) needs to be an array
  const payload = formData[0];
  const postResponse = http.post(urlToPostTo, JSON.stringify(payload), options);
  console.debug(JSON.stringify(postResponse, 0, 2));
  if (!check(postResponse, {
    'form submission response is 201': (r) => r.status === 201
  })) {
    console.warn(JSON.stringify(postResponse, 0, 2));
  }
  const submissionId = postResponse.json().id;
  console.debug(`VersionId for form: ${versionId}`);

  // Call get to fetch the submission you just posted
  const urlToGetSubmission = `${chefsUrl}/app/api/v1/submissions/${submissionId}`;;
  const getSubResponse = http.get(urlToGetSubmission);
  if (!check(getSubResponse, {
    'is status 200': (r) => r.status === 200
  })) {
    console.warn(JSON.stringify(getSubResponse, 0, 2));
  }
}


// -------------------------------------------------------------------------------------------------
// 4. Teardown
// -------------------------------------------------------------------------------------------------
// N/A