const config = require('config');
const crypto = require('crypto');

const SERVICE = 'EncryptionService';

const ENCRYPTION_KEYS = {
  PROXY: 'proxy',
  DATABASE: 'db',
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
    // random initialization vector
    const iv = crypto.randomBytes(16);

    // random salt
    const salt = crypto.randomBytes(64);

    // derive encryption key: 32 byte key length
    // in assumption the masterkey is a cryptographic and NOT a password there is no need for
    // a large number of iterations. It may can replaced by HKDF
    // the value of 2145 is randomly chosen!
    const key = crypto.pbkdf2Sync(masterkey, salt, 2145, 32, 'sha512');

    // AES 256 GCM Mode
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    // encrypt the given text/json
    const strPayload = typeof payload === 'string' || payload instanceof String ? payload : JSON.stringify(payload);
    const encrypted = Buffer.concat([cipher.update(strPayload, 'utf8'), cipher.final()]);

    // extract the auth tag
    const tag = cipher.getAuthTag();

    // generate output
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
  }
  decrypt(encdata, masterkey) {
    // base64 decoding
    const bData = Buffer.from(encdata, 'base64');

    // convert data to buffers
    const salt = bData.subarray(0, 64);
    const iv = bData.subarray(64, 80);
    const tag = bData.subarray(80, 96);
    const payload = bData.subarray(96);

    // derive key using; 32 byte key length
    const key = crypto.pbkdf2Sync(masterkey, salt, 2145, 32, 'sha512');

    // AES 256 GCM Mode
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    // encrypt the given text
    const decrypted = decipher.update(payload, 'binary', 'utf8') + decipher.final('utf8');

    return decrypted;
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

  encryptDb(payload) {
    return this.encrypt(ENCRYPTION_ALGORITHMS.AES_256_GCM, ENCRYPTION_KEYS.DATABASE, payload);
  }

  decryptDb(payload) {
    return this.decrypt(ENCRYPTION_ALGORITHMS.AES_256_GCM, ENCRYPTION_KEYS.DATABASE, payload);
  }
}

const proxy = config.get('server.encryption.proxy');
const db = config.get('server.encryption.db');

const keys = { proxy: proxy, db: db };
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
