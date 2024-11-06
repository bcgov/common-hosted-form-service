const { encryptionService } = require('../../components/encryptionService');
const jwtService = require('../../components/jwtService');
const ProxyServiceError = require('./error');
const { ExternalAPI, SubmissionMetadata } = require('../../forms/common/models');
const formMetadataService = require('../../forms/form/formMetadata/service');

const headerValue = (headers, key) => {
  if (headers && key) {
    try {
      return headers[key.toUpperCase()] || headers[key.toLowerCase()];
    } catch (error) {
      return null;
    }
  } else {
    throw new Error('Headers or Header Name not provided.');
  }
};

const trimLeadingSlashes = (str) => str.replace(/^\/+|\$/g, '');
const trimTrailingSlashes = (str) => str.replace(/\/+$/g, '');

const service = {
  _getIds: async (payload) => {
    let formId = payload['formId'];
    let versionId = payload['versionId'];
    let submissionId = payload['submissionId'];
    // when we are provided with a submission id (ex. submitting a draft submission)
    // we need to fetch the related form and version id (if not provided)
    if (submissionId) {
      const meta = await SubmissionMetadata.query().where('submissionId', submissionId).first();
      if (meta) {
        formId = meta.formId;
        versionId = meta.formVersionId;
        submissionId = meta.submissionId;
      }
    }
    return {
      formId: formId,
      versionId: versionId,
      submissionId: submissionId,
    };
  },

  generateProxyHeaders: async (payload, currentUser, token) => {
    if (!payload || !currentUser || !currentUser.idp) {
      throw new ProxyServiceError('Cannot generate proxy headers with missing or incomplete parameters');
    }

    const { formId, versionId, submissionId } = await service._getIds(payload);

    const headerData = {
      formId: formId,
      versionId: versionId,
      submissionId: submissionId,
      userId: currentUser.idpUserId,
      username: currentUser.username,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      fullName: currentUser.fullName,
      email: currentUser.email,
      idp: currentUser.idp,
      token: token,
    };
    const encryptedHeaderData = encryptionService.encryptProxy(headerData);
    return {
      'X-CHEFS-PROXY-DATA': encryptedHeaderData,
    };
  },
  readProxyHeaders: async (headers) => {
    const encryptedHeaderData = headerValue(headers, 'X-CHEFS-PROXY-DATA');
    if (encryptedHeaderData) {
      //error check that we can decrypt it and it contains expected data...
      try {
        const decryptedHeaderData = encryptionService.decryptProxy(encryptedHeaderData);
        const data = JSON.parse(decryptedHeaderData);
        return data;
      } catch (error) {
        throw new ProxyServiceError(`Could not decrypt proxy headers: ${error.message}`);
      }
    } else {
      throw new ProxyServiceError('X-CHEFS-PROXY-DATA headers not found or empty.');
    }
  },
  getExternalAPI: async (headers, proxyHeaderInfo) => {
    const externalApiName = headerValue(headers, 'X-CHEFS-EXTERNAL-API-NAME');
    if (externalApiName) {
      const externalAPI = await ExternalAPI.query().modify('findByFormIdAndName', proxyHeaderInfo['formId'], externalApiName).first().throwIfNotFound();
      return externalAPI;
    } else {
      throw new ProxyServiceError('X-CHEFS-EXTERNAL-API-NAME header not found or empty.');
    }
  },
  createExternalAPIUrl: (headers, endpointUrl) => {
    //check incoming request headers for path to add to the endpoint url
    const path = headerValue(headers, 'X-CHEFS-EXTERNAL-API-PATH');
    if (path) {
      return `${trimTrailingSlashes(endpointUrl)}/${trimLeadingSlashes(path)}`;
    }
    return endpointUrl;
  },
  createExternalAPIHeaders: async (externalAPI, proxyHeaderInfo) => {
    const result = {};
    // form metadata, add if specified and there are attributes in the metadata.
    await formMetadataService.addHeader(proxyHeaderInfo['formId'], result);

    if (externalAPI.sendApiKey) {
      result[externalAPI.apiKeyHeader] = externalAPI.apiKey;
    }
    if (externalAPI.sendUserToken) {
      if (!proxyHeaderInfo || !proxyHeaderInfo.token) {
        // just assume that if there is no idpUserId than it isn't a userInfo object
        throw new ProxyServiceError('Cannot create user token headers for External API without populated proxy header info token.');
      }
      const val = externalAPI.userTokenBearer ? `Bearer ${proxyHeaderInfo['token']}` : proxyHeaderInfo['token'];
      result[externalAPI.userTokenHeader] = val;
    }
    if (externalAPI.sendUserInfo) {
      if (!proxyHeaderInfo || !proxyHeaderInfo.idp) {
        // just assume that if there is no idp than it isn't a userInfo object
        throw new ProxyServiceError('Cannot create user headers for External API without populated proxy header info object.');
      }

      // user information (no token)
      let prefix = 'X-CHEFS-USER';
      let fields = ['userId', 'username', 'firstName', 'lastName', 'fullName', 'email', 'idp'];
      fields.forEach((field) => {
        if (proxyHeaderInfo[field]) {
          result[`${prefix}-${field}`.toUpperCase()] = proxyHeaderInfo[field];
        }
      });
      // form information...
      prefix = 'X-CHEFS-FORM';
      fields = ['formId', 'versionId', 'submissionId'];
      fields.forEach((field) => {
        if (proxyHeaderInfo[field]) {
          result[`${prefix}-${field}`.toUpperCase()] = proxyHeaderInfo[field];
        }
      });
      // grab raw token values...
      const payload = await jwtService.getUnverifiedPayload(proxyHeaderInfo['token']);
      if (payload) {
        prefix = 'X-CHEFS-TOKEN';
        fields = ['sub', 'iat', 'exp'];
        fields.forEach((field) => {
          if (payload[field]) {
            result[`${prefix}-${field}`.toUpperCase()] = payload[field];
          }
        });
      }
    }
    return result;
  },
};

module.exports = service;
