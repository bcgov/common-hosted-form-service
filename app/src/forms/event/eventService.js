const log = require('../../components/log')(module.filename);
const { SubscriptionEvent } = require('../common/constants');
const { FormVersion, Form, FormSubscription } = require('../common/models');
const axios = require('axios');
const { queryUtils } = require('../common/utils');
const formMetadataService = require('../form/formMetadata/service');

const service = {
  /**
   * @function formSubmissionEventReceived
   * Completing submission of a form
   * @param {string} formId
   * @param {string} formVersionId
   * @param {string} submissionId
   * @param {string} data
   * @returns The callout to the submission event endpoint
   */
  formSubmissionEventReceived: async (formId, formVersionId, submissionId, data) => {
    try {
      const { subscribe } = await service.readForm(formId, {});
      if (subscribe && subscribe.enabled && data.submission.data.submit) {
        const formVersion = await service.readVersion(formVersionId);
        const subscribeConfig = await service.readFormSubscriptionDetails(formId);
        const config = Object.assign({}, subscribe, subscribeConfig);
        service.postSubscriptionEvent(config, formVersion, submissionId, SubscriptionEvent.FORM_SUBMITTED);
      }
    } catch (e) {
      log.error(e.message, {
        function: 'formSubmissionEventReceived',
        formId: formId,
        formVersionId: formVersionId,
        submissionId: submissionId,
        data: data,
      });
      throw e;
    }
  },

  /**
   * @function postSubscriptionEvent
   * Post the subscription event
   * @param {string} subscribe settings
   * @param {string} formVersion form version json object
   * @param {string} submissionId submission id
   * @param {string} subscriptionEvent string value of the event
   * @returns The FormVersion
   */
  postSubscriptionEvent: async (subscribe, formVersion, submissionId, subscriptionEvent) => {
    try {
      // Check if there are endpoints subscribed for form submission event
      if (subscribe && subscribe.endpointUrl && !subscribe.eventStreamNotifications) {
        const axiosOptions = { timeout: 10000 };
        const axiosInstance = axios.create(axiosOptions);
        const jsonData = { formId: formVersion.formId, formVersion: formVersion.id, subscriptionEvent: subscriptionEvent };
        if (submissionId != null) {
          jsonData['submissionId'] = submissionId;
        }

        await formMetadataService.addAttribute(formVersion.formId, jsonData);

        axiosInstance.interceptors.request.use(
          (cfg) => {
            cfg.headers = { [subscribe.key]: `${subscribe.endpointToken}` };
            return Promise.resolve(cfg);
          },
          (error) => {
            return Promise.reject(error);
          }
        );
        axiosInstance.post(subscribe.endpointUrl, jsonData);
      }
    } catch (err) {
      log.error(err.message, err, {
        function: 'postSubscriptionEvent',
      });
    }
  },

  /**
   * @function publishFormEvent
   * Publish Event for form
   * @param {string} formId the form id
   * @param {string} formVersionId form version id
   * @param {boolean} publish bool true or false - Published or Unpublished
   */
  publishFormEvent: async (formId, formVersionId, publish) => {
    const { subscribe } = await service.readForm(formId);

    if (subscribe && subscribe.enabled) {
      const subscribeConfig = await service.readFormSubscriptionDetails(formId);
      const config = Object.assign({}, subscribe, subscribeConfig);
      const formVersion = new FormVersion();
      formVersion.id = formVersionId;
      formVersion.formId = formId;

      if (publish) {
        service.postSubscriptionEvent(config, formVersion, null, SubscriptionEvent.FORM_PUBLISHED);
      } else {
        service.postSubscriptionEvent(config, formVersion, null, SubscriptionEvent.FORM_UNPUBLISHED);
      }
    }
  },

  /**
   * @function readFormSubscriptionDetails
   * @param {string} formId
   * Get the current subscription settings for a form
   * @returns The subscription settings for a form
   */
  readFormSubscriptionDetails: (formId) => {
    return FormSubscription.query().modify('filterFormId', formId).first();
  },

  /**
   * @function readVersion
   * Get the current FormVersion
   * @param {string} formVersionId
   * @returns The FormVersion
   */
  readVersion: (formVersionId) => {
    return FormVersion.query().findById(formVersionId).throwIfNotFound();
  },
  /**
   * @function readForm
   * Read Form
   * @param {string} formId form id
   * @param {object} params form query params
   * @returns The Form object
   */
  readForm: (formId, params = {}) => {
    params = queryUtils.defaultActiveOnly(params);
    return Form.query()
      .findById(formId)
      .modify('filterActive', params.active)
      .allowGraph('[identityProviders,versions]')
      .withGraphFetched('identityProviders(orderDefault)')
      .withGraphFetched('versions(selectWithoutSchema, orderVersionDescending)')
      .throwIfNotFound();
  },
};

module.exports = service;
