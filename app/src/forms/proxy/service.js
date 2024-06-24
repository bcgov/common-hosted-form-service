const { encryptionService } = require('../../components/encryptionService');
const jwtService = require('../../components/jwtService');

const { ExternalAPI } = require('../../forms/common/models');

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
  generateProxyHeaders: async (payload, currentUser, token) => {
    if (!payload || !currentUser || !currentUser.idp) {
      throw new Error('Cannot generate proxy headers with missing or incomplete parameters');
    }

    const headerData = {
      formId: payload['formId'],
      versionId: payload['versionId'],
      submissionId: payload['submissionId'],
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
        throw new Error(`Could not decrypt proxy headers: ${error.message}`);
      }
    } else {
      throw new Error('Proxy headers not found');
    }
  },
  getExternalAPI: async (headers, proxyHeaderInfo) => {
    const externalApiName = headerValue(headers, 'X-CHEFS-EXTERNAL-API-NAME');
    const externalAPI = await ExternalAPI.query().modify('findByFormIdAndName', proxyHeaderInfo['formId'], externalApiName).first().throwIfNotFound();
    return externalAPI;
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
    if (externalAPI.sendApiKey) {
      result[externalAPI.apiKeyHeader] = externalAPI.apiKey;
    }
    if (externalAPI.sendUserToken) {
      if (!proxyHeaderInfo || !proxyHeaderInfo.token) {
        // just assume that if there is no idpUserId than it isn't a userInfo object
        throw new Error('Cannot create user token headers for External API without populated proxy header info token.');
      }
      const val = externalAPI.userTokenBearer ? `Bearer ${proxyHeaderInfo['token']}` : proxyHeaderInfo['token'];
      result[externalAPI.userTokenHeader] = val;
    }
    if (externalAPI.sendUserInfo) {
      if (!proxyHeaderInfo || !proxyHeaderInfo.idp) {
        // just assume that if there is no idp than it isn't a userInfo object
        throw new Error('Cannot create user headers for External API without populated proxy header info object.');
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
