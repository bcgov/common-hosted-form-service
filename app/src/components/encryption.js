const crypto = require('crypto');

const ENCRYPTION_TYPES = {
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

    // encrypt the given text
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);

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

module.exports = {
  createEncryption: (type) => {
    switch (type) {
      case ENCRYPTION_TYPES.AES_256_GCM:
        return new Aes256Gcm();
      default:
        throw new Error('Invalid encryption type');
    }
  },
  ENCRYPTION_TYPES: Object.freeze(ENCRYPTION_TYPES),
};
