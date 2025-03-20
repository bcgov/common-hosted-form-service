import { check, fail } from "k6";
import http from "k6/http";

const httpCreateForm = async (baseUrl, form, schema, requestConfig) => {
  const payload = { ...form, schema: schema };
  return http.post(
    baseUrl + "/api/v1/forms",
    JSON.stringify(payload),
    requestConfig
  );
};

const httpPublishForm = async (baseUrl, formId, draftId, requestConfig) => {
  return http.post(
    baseUrl + `/api/v1/forms/${formId}/drafts/${draftId}/publish`,
    {},
    requestConfig
  );
};

const httpGetMyForms = async (baseUrl, requestConfig) => {
  return http.get(baseUrl + `/api/v1/rbac/current/forms`, requestConfig);
};

const httpCreateSubmission = async (
  baseUrl,
  formId,
  versionId,
  data,
  requestConfig
) => {
  return http.post(
    baseUrl + `/api/v1/forms/${formId}/versions/${versionId}/submissions`,
    JSON.stringify(data),
    requestConfig
  );
};

export const createForm = async (baseUrl, form, schema, requestConfig) => {
  let formId;
  check(await httpCreateForm(baseUrl, form, schema, requestConfig), {
    "Create Form response status 201": (r) => {
      if (r.status === 201) {
        const json = r.json();
        formId = json.id;
        return true;
      }
      return false;
    },
  });
  return formId;
};

export const createAndPublishForm = async (
  baseUrl,
  form,
  schema,
  requestConfig
) => {
  let formId;
  let draftId;
  let response = await httpCreateForm(baseUrl, form, schema, requestConfig);
  check(response, {
    "Create Form is status 201": (r) => {
      if (r.status === 201) {
        const json = r.json();
        formId = json.id;
        draftId = json.draft.id;
        return true;
      }
      return false;
    },
  });
  // fail fast, don't bother with publish
  if (response.status !== 201) {
    fail(`Create Form was not status 201. Status was ${response.status}`);
  }

  response = await httpPublishForm(baseUrl, formId, draftId, requestConfig);
  check(response, {
    "Publish Form is status 200": (r) => r.status === 200,
    "Publish Form is first version": (r) => r.json().version === 1,
    "Publish Form is published": (r) => r.json().published,
  });
  return formId;
};

export const fetchAndSubmitForm = async (
  baseUrl,
  form,
  submission,
  requestConfig
) => {
  let id;
  let versionId;
  let response = await httpGetMyForms(baseUrl, requestConfig);
  check(response, {
    "Get My Forms is status 200": (r) => r.status === 200,
  });
  // fail fast, don't bother with submit
  if (response.status !== 200) {
    fail(`Get My Forms was not status 200. Status was ${response.status}`);
  }

  const myForms = response.json();
  const myForm = myForms.find((f) => f.published && f.formName === form.name);
  if (!myForm) {
    fail(`Get My Forms returned no published forms for ${form.name}`);
  }
  id = myForm.formId;
  versionId = myForm.formVersionId;

  response = await httpCreateSubmission(
    baseUrl,
    id,
    versionId,
    submission,
    requestConfig
  );
  check(response, {
    "Submit Form is status 201": (r) => r.status === 201,
  });
  return id;
};
