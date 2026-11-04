const config = require('config');
const { findFileIds, getBaseUrl, queryUtils, typeUtils } = require('../../../../src/forms/common/utils');

describe('findFileIds', () => {
  const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const file = (fileId) => [{ storage: 'chefs', data: { id: fileId }, originalName: `${fileId}.pdf` }];
  const nested = (depth, leaf) => {
    let value = leaf;
    for (let i = 0; i < depth; i++) value = { inner: value };
    return value;
  };

  it('finds files at any depth, in the order they appear', () => {
    const data = {
      first: file(id(1)),
      grid: [{ upload: file(id(2)) }, { container: { upload: file(id(3)) } }],
      last: file(id(4)),
    };
    expect(findFileIds(data)).toEqual([id(1), id(2), id(3), id(4)]);
  });

  it('looks inside a data object that has no id', () => {
    expect(findFileIds({ nestedForm: { data: { upload: file(id(1)) } } })).toEqual([id(1)]);
  });

  it('does not look inside a data object whose id is a file id', () => {
    expect(findFileIds({ upload: [{ data: { id: id(1), copy: file(id(2)) } }] })).toEqual([id(1)]);
  });

  it('accepts a file id in upper case', () => {
    expect(findFileIds({ upload: file(id(1).toUpperCase()) })).toEqual([id(1).toUpperCase()]);
  });

  it.each([
    ['a string that is not a UUID', 'abc'],
    ['a UUID that is not version 4', '00000000-0000-1000-8000-000000000001'],
    ['a number', 42],
    ['an array of UUIDs', ['00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002']],
    ['an object', { id: '00000000-0000-4000-8000-000000000001' }],
  ])('does not count %s as a file id, and looks inside that data object', (_name, value) => {
    expect(findFileIds({ container: { data: { id: value, upload: file(id(9)) } } })).toEqual([id(9)]);
  });

  it.each([[undefined], [null], ['text'], [42], [{}], [[]]])('returns no files for %p', (data) => {
    expect(findFileIds(data)).toEqual([]);
  });

  it('handles data nested far deeper than a call stack allows', () => {
    expect(findFileIds(nested(100000, { upload: file(id(1)) }))).toEqual([id(1)]);
  });
});

jest.mock('config');

describe('getBaseUrl', () => {
  const basePath = '/app';
  const basePathPr = '/pr-1234';
  const localhostPort = '1234';
  const serverDev = 'chefs-dev.apps.silver.devops.gov.bc.ca';
  const serverProd = 'submit.digital.gov.bc.ca';

  it('should return a default for local development', () => {
    config.get.mockReturnValue(basePath);

    const baseUrl = getBaseUrl();

    expect(baseUrl).toEqual(`http://localhost:5173${basePath}`);
  });

  it('should return a default with port for local development', () => {
    config.get = jest.fn((k) => (k === 'frontend.basePath' ? basePath : localhostPort));
    config.has.mockReturnValue(true);

    const baseUrl = getBaseUrl();

    expect(baseUrl).toEqual(`http://localhost:${localhostPort}${basePath}`);
  });

  it('should handle non-prod SERVER_URL variable', () => {
    process.env.SERVER_HOST = serverDev;
    config.get.mockReturnValue(basePath);

    const baseUrl = getBaseUrl();

    expect(baseUrl).toEqual(`https://${serverDev}${basePath}`);
  });

  it('should handle non-prod SERVER_URL variable for PRs', () => {
    process.env.SERVER_HOST = serverDev;
    config.get.mockReturnValue(basePathPr);

    const baseUrl = getBaseUrl();

    expect(baseUrl).toEqual(`https://${serverDev}${basePathPr}`);
  });

  it('should handle prod SERVER_URL variable', () => {
    process.env.SERVER_HOST = serverProd;
    config.get.mockReturnValue(basePath);

    const baseUrl = getBaseUrl();

    expect(baseUrl).toEqual(`https://${serverProd}${basePath}`);
  });
});

describe('Test Query Utils functions', () => {
  it('defaultActiveOnly should return params object', () => {
    const params = queryUtils.defaultActiveOnly(null);
    expect(params).toBeDefined();
    expect(params).toEqual({ active: true });
  });

  it('defaultActiveOnly should return active = true', () => {
    let params = queryUtils.defaultActiveOnly(null);
    expect(params).toBeDefined();
    expect(params).toEqual({ active: true });

    params = queryUtils.defaultActiveOnly({});
    expect(params).toBeDefined();
    expect(params).toEqual({ active: true });

    params = queryUtils.defaultActiveOnly({ other: 'value' });
    expect(params).toBeDefined();
    expect(params).toEqual({ active: true, other: 'value' });

    params = queryUtils.defaultActiveOnly({ active: 'not a false value', other: 'value' });
    expect(params).toBeDefined();
    expect(params).toEqual({ active: true, other: 'value' });

    params = queryUtils.defaultActiveOnly({ active: true, other: 'value' });
    expect(params).toBeDefined();
    expect(params).toEqual({ active: true, other: 'value' });
  });

  it('defaultActiveOnly should return active = false', () => {
    let params = queryUtils.defaultActiveOnly({ active: false });
    expect(params).toBeDefined();
    expect(params).toEqual({ active: false });

    params = queryUtils.defaultActiveOnly({ active: 'false' });
    expect(params).toBeDefined();
    expect(params).toEqual({ active: false });

    params = queryUtils.defaultActiveOnly({ active: 0 });
    expect(params).toBeDefined();
    expect(params).toEqual({ active: false });
  });
});

describe('Test Type Utils functions', () => {
  it('isInt should return true for int and int like strings', () => {
    let result = typeUtils.isInt(1);
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isInt('1');
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isInt(-1);
    expect(result).toBeDefined();
    expect(result).toBeTruthy();
  });

  it('isInt should return false for not ints', () => {
    let result = typeUtils.isInt(1.1);
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isInt({ key: 1 });
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isInt('Not Int');
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isInt(() => {
      return 1;
    });
    expect(result).toBeDefined();
    expect(result).toBeFalsy();
  });

  it('isString should return true for strings', () => {
    let result = typeUtils.isString('a string');
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isString(`another string ${result}`);
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isString(new String('value of string'));
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isString(new Object('value of object'));
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isString('1');
    expect(result).toBeDefined();
    expect(result).toBeTruthy();
  });

  it('isString should return false for not strings', () => {
    let result = typeUtils.isString(1.1);
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isString({ key: 'string' });
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isString(() => {
      return 'string';
    });
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isString(new Boolean(true));
    expect(result).toBeDefined();
    expect(result).toBeFalsy();
  });

  it('isBoolean should return true for booleans', () => {
    let result = typeUtils.isBoolean(new Boolean(true));
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isBoolean(new Boolean(false));
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isBoolean(true);
    expect(result).toBeDefined();
    expect(result).toBeTruthy();

    result = typeUtils.isBoolean(false);
    expect(result).toBeDefined();
    expect(result).toBeTruthy();
  });

  it('isBoolean should return false for not boolean', () => {
    let result = typeUtils.isBoolean(1.1);
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isBoolean({ key: 'string' });
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isBoolean(() => {
      return 'string';
    });
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isBoolean('true');
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isBoolean(1);
    expect(result).toBeDefined();
    expect(result).toBeFalsy();

    result = typeUtils.isBoolean(0);
    expect(result).toBeDefined();
    expect(result).toBeFalsy();
  });
});
