const { MockModel } = require('../../common/dbHelper');
const { encryptionService, ENCRYPTION_ALGORITHMS, ENCRYPTION_KEYS } = require('../../../src/components/encryptionService');

// change these as appropriate after adding new default keys/algos...
const KEY_COUNT = 1;
const ALGO_COUNT = 1;

beforeEach(() => {
  MockModel.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('encryptionService', () => {
  const assertService = (srv) => {
    expect(srv).toBeTruthy();
    expect(Object.entries(srv.keys)).toHaveLength(KEY_COUNT);
    expect(Object.entries(srv.algorithms)).toHaveLength(ALGO_COUNT);
  };

  it('should return a service', () => {
    assertService(encryptionService);
  });

  it('should encrypt/decrypt proxy data (object)', () => {
    const data = { username: 'unittest', email: 'email@mail.com' };
    const enc = encryptionService.encryptProxy(data);
    expect(enc).toBeTruthy();
    const dec = encryptionService.decryptProxy(enc);
    expect(dec).toBeTruthy();
    expect(data).toMatchObject(JSON.parse(dec));
  });

  it('should encrypt/decrypt proxy data (string)', () => {
    const data = 'this is my string value';
    const enc = encryptionService.encryptProxy(data);
    expect(enc).toBeTruthy();
    const dec = encryptionService.decryptProxy(enc);
    expect(dec).toBeTruthy();
    expect(data).toEqual(dec);
  });

  it('should not decrypt a proxy encryption with external key', () => {
    const externalKey = 'e9eb43121581f1877e2b8135c8d9079b91c04aab6c717799196630a685b2c6c0';
    const data = 'this is my string value';
    const enc = encryptionService.encryptProxy(data);
    expect(enc).toBeTruthy();
    expect(() => {
      encryptionService.decryptExternal(ENCRYPTION_ALGORITHMS.AES_256_GCM, externalKey, enc);
    }).toThrowError();
  });

  it('should throw error with unknown algorithm name', () => {
    const data = 'this is my string value';
    expect(() => {
      encryptionService.encrypt('unknown-algorithm-name', ENCRYPTION_KEYS.PROXY, data);
    }).toThrowError();
  });

  it('should throw error with unknown key name', () => {
    const data = 'this is my string value';
    expect(() => {
      encryptionService.encrypt(ENCRYPTION_ALGORITHMS.AES_256_GCM, 'unknown-key-name', data);
    }).toThrowError();
  });

  it('should encrypt/decrypt data (object) using external key', () => {
    const externalKey = 'e9eb43121581f1877e2b8135c8d9079b91c04aab6c717799196630a685b2c6c0';
    const data = { username: 'unittest', email: 'email@mail.com' };
    const enc = encryptionService.encryptExternal(ENCRYPTION_ALGORITHMS.AES_256_GCM, externalKey, data);
    expect(enc).toBeTruthy();
    const dec = encryptionService.decryptExternal(ENCRYPTION_ALGORITHMS.AES_256_GCM, externalKey, enc);
    expect(dec).toBeTruthy();
    expect(data).toMatchObject(JSON.parse(dec));
  });

  it('should encrypt/decrypt data (string) using external key', () => {
    const externalKey = 'b93476a2446a0bad7cdbe8443aee8c2b08c0a482bfadce23ebed97435b25401f';
    const data = 'this is my string value';
    const enc = encryptionService.encryptExternal(ENCRYPTION_ALGORITHMS.AES_256_GCM, externalKey, data);
    expect(enc).toBeTruthy();
    const dec = encryptionService.decryptExternal(ENCRYPTION_ALGORITHMS.AES_256_GCM, externalKey, enc);
    expect(dec).toBeTruthy();
    expect(data).toEqual(dec);
  });

  it('should throw error no payload', () => {
    const data = undefined;
    expect(() => {
      encryptionService.encrypt(ENCRYPTION_ALGORITHMS.AES_256_GCM, ENCRYPTION_KEYS.PROXY, data);
    }).toThrowError();
  });
});
