import { fail } from "k6";
import http from "k6/http";
import exec from "k6/execution";
import { SharedArray } from "k6/data";
import { STAGES } from "./common/params.js";
import {
  createForm,
  createAndPublishForm,
  fetchAndSubmitForm,
} from "./tests/backend/forms.js";

import {
  INITIAL_TOKEN,
  INITIAL_REFRESH_TOKEN,
  generateRequestConfig,
} from "./common/auth.js";

const defaultOptions = {
  executor: "ramping-vus",
  stages: STAGES[`${__ENV.STAGE}`],
  tags: { test_type: "default" },
};

const defaultScenarios = {
  createForm: defaultOptions,
  createAndPublishForm: { ...defaultOptions, tags: { test_type: "publish" } },
  fetchAndSubmitForm: {
    ...defaultOptions,
    tags: { test_type: "submit" },
    startTime: "1s",
  },
};

export const options = {
  scenarios: {}, // set later according to env vars.
  thresholds: {
    // ms that 99% of requests must be completed within
    "http_req_duration{test_type:default}": [
      { threshold: "p(99)<2000", abortOnFail: true, delayAbortEval: "5s" },
    ],
    "http_req_duration{test_type:publish}": [
      { threshold: "p(99)<5000", abortOnFail: true, delayAbortEval: "5s" },
    ],
    "http_req_duration{test_type:submit}": [
      { threshold: "p(99)<5000", abortOnFail: true, delayAbortEval: "5s" },
    ],
    // abort on when failures above 5%
    http_req_failed: [{ threshold: "rate<0.05", abortOnFail: true }],
  },
  // rps:__ENV.RPS, // Do not increase to over 50 without informing Platform Services
};

const SCENARIOS = __ENV.SCENARIOS.split(",");
if (SCENARIOS.includes("createForm")) {
  options.scenarios["createForm"] = defaultScenarios["createForm"];
}
if (SCENARIOS.includes("createAndPublishForm")) {
  options.scenarios["createAndPublishForm"] =
    defaultScenarios["createAndPublishForm"];
}
if (SCENARIOS.includes("fetchAndSubmitForm")) {
  options.scenarios["fetchAndSubmitForm"] =
    defaultScenarios["fetchAndSubmitForm"];
}

/**
 * In order to keep the token active, refresh it often enough to avoid any false 401, but not so often that it will
 * interfere with the testing. The RPS * refresh time is a rough approximation so tokenRefreshSeconds slightly
 * conservatively, not the exact token expiry period.
 * The token and config vars are set outside of the function to take advantage of some scope to allow the refresh to
 * happen conditionally rather than on every iteration.
 */

const TOKEN_REFRESH_TIME = 60;
let token = INITIAL_TOKEN;
let refreshToken = INITIAL_REFRESH_TOKEN;
let requestConfig = generateRequestConfig(token);

// Open the JSON file for the form data and make it available
// See https://k6.io/docs/javascript-api/k6-data/sharedarray/
const data = new SharedArray("fixtures", function () {
  const result = [];
  try {
    result.push(JSON.parse(open(`./fixtures/forms/${__ENV.FORM_NAME}.json`)));
    result.push(JSON.parse(open(`./fixtures/schemas/${__ENV.FORM_NAME}.json`)));
    result.push(
      JSON.parse(open(`./fixtures/submissions/${__ENV.FORM_NAME}.json`))
    );
  } catch {
    fail(
      `Could not load form/schema/submission data. Check configuration FORM_NAME = ${__ENV.FORM_NAME}.`
    );
  }
  return result;
});

export default function () {
  const BASE_URL = __ENV.BASE_URL;
  // Refresh the token if necessary based on iteration number, refresh time and rate of requests
  if (__ITER === 0 || __ITER % (__ENV.RPS * TOKEN_REFRESH_TIME) === 0) {
    const refreshRes = http.post(__ENV.OIDC_TOKEN_URL, {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: __ENV.OIDC_CLIENT_ID,
    });

    token = JSON.parse(refreshRes.body).access_token;
    refreshToken = JSON.parse(refreshRes.body).refresh_token;
    requestConfig = generateRequestConfig(token);
  }

  if (exec.scenario.name === "createForm") {
    createForm(BASE_URL, data[0], data[1], requestConfig);
  }

  if (exec.scenario.name === "createAndPublishForm") {
    createAndPublishForm(BASE_URL, data[0], data[1], requestConfig);
  }

  if (exec.scenario.name === "fetchAndSubmitForm") {
    fetchAndSubmitForm(BASE_URL, data[0], data[2], requestConfig);
  }
}
