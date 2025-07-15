const config = require('config');
const Cryptr = require('cryptr');

const SERVICE = 'EncryptionService';

const ENCRYPTION_KEYS = {
  PROXY: 'proxy',
};

const ENCRYPTION_ALGORITHMS = {
  AES_256_GCM: 'aes-256-gcm',
};

class Encryption {
  // eslint-disable-next-line no-unused-vars
  encrypt(payload, masterkey) {
    throw new Error('encrypt must be overridden.');
  }
  // eslint-disable-next-line no-unused-vars
  decrypt(encdata, masterkey) {
    throw new Error('decrypt must be overridden.');
  }
}

class Aes256Gcm extends Encryption {
  //
  // For a masterkey:
  // we want a sha256 hash: 256 bits/32 bytes/64 characters
  // to generate:
  // crypto.createHash('sha256').update("sometext").digest('hex');
  //
  encrypt(payload, masterkey) {
    const cryptr = new Cryptr(masterkey);
    // encrypt the given text/json
    const strPayload = typeof payload === 'string' || payload instanceof String ? payload : JSON.stringify(payload); // random initialization vector
    return cryptr.encrypt(strPayload);
  }
  decrypt(encdata, masterkey) {
    const cryptr = new Cryptr(masterkey);
    return cryptr.decrypt(encdata);
  }
}

class EncryptionService {
  constructor({ keys, algorithms }) {
    if (!keys || !algorithms) {
      throw new Error(`${SERVICE} is not configured. Check configuration.`);
    }

    this.keys = keys;
    this.algorithms = algorithms;
  }

  _callAlgorithm(operation, algorithmName, masterkey, data) {
    const algo = this.algorithms[algorithmName];
    if (algo) {
      try {
        if (operation == 'encryption') {
          return algo.encrypt(data, masterkey);
        } else {
          return algo.decrypt(data, masterkey);
        }
      } catch (error) {
        throw new Error(`${SERVICE} could not perform ${operation} using algorithm '${algorithmName}'. ${error.message}`);
      }
    } else {
      throw new Error(`${SERVICE} does not support ${algorithmName} algorithm.`);
    }
  }

  _callAlgorithmWithKeyName(operation, algorithmName, keyName, data) {
    const masterkey = this.keys[keyName];
    if (masterkey) {
      return this._callAlgorithm(operation, algorithmName, masterkey, data);
    } else {
      throw new Error(`${SERVICE} does not have encryption key: '${keyName}'.`);
    }
  }

  encryptExternal(algorithmName, key, payload) {
    return this._callAlgorithm('encryption', algorithmName, key, payload);
  }

  decryptExternal(algorithmName, key, encdata) {
    return this._callAlgorithm('decryption', algorithmName, key, encdata);
  }

  encrypt(algorithmName, keyName, payload) {
    return this._callAlgorithmWithKeyName('encryption', algorithmName, keyName, payload);
  }

  decrypt(algorithmName, keyName, encdata) {
    return this._callAlgorithmWithKeyName('decryption', algorithmName, keyName, encdata);
  }

  encryptProxy(payload) {
    return this.encrypt(ENCRYPTION_ALGORITHMS.AES_256_GCM, ENCRYPTION_KEYS.PROXY, payload);
  }

  decryptProxy(payload) {
    return this.decrypt(ENCRYPTION_ALGORITHMS.AES_256_GCM, ENCRYPTION_KEYS.PROXY, payload);
  }
}

const proxy = config.get('server.encryption.proxy');

const keys = { proxy: proxy };
const algorithms = { 'aes-256-gcm': new Aes256Gcm() };

let encryptionService = new EncryptionService({
  keys: keys,
  algorithms: algorithms,
});

module.exports = {
  encryptionService: encryptionService,
  ENCRYPTION_ALGORITHMS: Object.freeze(ENCRYPTION_ALGORITHMS),
  ENCRYPTION_KEYS: Object.freeze(ENCRYPTION_KEYS),
};
