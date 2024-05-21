const config = require('config');
const { createEncryption, ENCRYPTION_TYPES } = require('../../components/encryption');

const encryptionKey = config.get('server.encryption.proxy');
const encryption = createEncryption(ENCRYPTION_TYPES.AES_256_GCM);

const service = {
  generateProxyHeaders: async (payload, currentUser, token) => {
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
    const encryptedHeaderData = encryption.encrypt(headerData, encryptionKey);
    return {
      'X-CHEFS-PROXY-DATA': encryptedHeaderData,
    };
  },
  readProxyHeaders: async (headers) => {
    const encryptedHeaderData = headers['X-CHEFS-PROXY-DATA'] || headers['x-chefs-proxy-data'];
    if (encryptedHeaderData) {
      //error check that we can decrypt it and it contains expected data...
      try {
        const decryptedHeaderData = encryption.decrypt(encryptedHeaderData, encryptionKey);
        const data = JSON.parse(decryptedHeaderData);
        return data;
      } catch (error) {
        throw Error(`Could not decrypt proxy headers: ${error.message}`);
      }
    } else {
      throw Error('Proxy headers not found');
    }
  },
};

module.exports = service;
