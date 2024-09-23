const Problem = require('api-problem');
const { MockModel } = require('../../common/dbHelper');
const idpService = require('../../../src/components/idpService');
const idpData = require('../../fixtures/form/identity_providers.json');

// let's just load data once..
idpService.providers = idpData;
idpService.activeProviders = idpData.filter((x) => x.active);
// change these as appropriate if adding test case idps...
const IDP_COUNT = 6;
const IDP_ACTIVE_COUNT = 5;

jest.mock('../../../src/forms/common/models/tables/user', () => MockModel);

function idirToken() {
  return {
    exp: 1709942517,
    iat: 1709942217,
    auth_time: 1709942210,
    jti: '3b1a0e84-4612-4804-99ca-5d3383c27ab1',
    iss: 'https://dev.loginproxy.gov.bc.ca/auth/realms/standard',
    aud: 'chefs-frontend-localhost-5300',
    sub: '674861aa34e546f8bda6a7004dc9c6c9@idir',
    typ: 'Bearer',
    azp: 'chefs-frontend-localhost-5300',
    nonce: 'ffb100a7-1afc-488a-8755-7ff436a11ad2',
    session_state: '48d6429c-5d41-481e-81f7-9aaa9d70ddd1',
    scope: 'openid idir bceidbusiness email profile bceidbasic',
    sid: '48d6429c-5d41-481e-81f7-9aaa9d70ddd1',
    idir_user_guid: '674861AA34E546F8BDA6A7004DC9C6C9',
    client_roles: ['admin'],
    identity_provider: 'idir',
    idir_username: 'PASWAYZE',
    email_verified: false,
    name: 'Swayze, Patrick CITZ:EX',
    preferred_username: '674861aa34e546f8bda6a7004dc9c6c9@idir',
    display_name: 'Swayze, Patrick CITZ:EX',
    given_name: 'Patrick',
    family_name: 'Swayze',
    email: 'patrick.swayze@gov.bc.ca',
  };
}

function digitalCredentialToken() {
  return {
    exp: 1709853624,
    iat: 1709853324,
    auth_time: 1709853313,
    jti: '7d85f2db-d4a5-4ce8-bcf0-4ecc1ab009d2',
    iss: 'https://dev.sandbox.loginproxy.gov.bc.ca/auth/realms/standard',
    aud: 'chefs-frontend-localhost-12200',
    sub: '5bc63f3b8d93f6fa259f2ca8fa5e79a4175567c63871b5bad13e3e846ded4b19@digitalcredential',
    typ: 'Bearer',
    azp: 'chefs-frontend-localhost-12200',
    nonce: '47652a72-83cf-46b2-8872-2ddbe6e32bd3',
    session_state: '2682bdcd-2778-4709-a9d0-bf6f7d0f153d',
    scope: 'openid email idir profile digitalcredential bceidbusiness bceidbasic',
    sid: '2682bdcd-2778-4709-a9d0-bf6f7d0f153d',
    identity_provider: 'digitalcredential',
    email_verified: false,
    pres_req_conf_id: 'verified-email',
    vc_presented_attributes: '{"email": "patrick.swayze@gmail.com", "name": {"first": "patrick", "last": "swayze"}}',
    preferred_username: '5bc63f3b8d93f6fa259f2ca8fa5e79a4175567c63871b5bad13e3e846ded4b19@digitalcredential',
    vc_user_guid: '674861AA34E546F8BDA6A7004DC9C6C9',
    vc_user_guid_converted: '674861AA-34E5-46F8-BDA6-A7004DC9C6C9',
  };
}

beforeEach(() => {
  MockModel.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('idpService', () => {
  const assertService = (srv) => {
    expect(srv).toBeTruthy();
    expect(srv.providers).toHaveLength(IDP_COUNT);
    expect(srv.activeProviders).toHaveLength(IDP_ACTIVE_COUNT);
  };

  it('should return a service', () => {
    assertService(idpService);
  });

  it('should return active idps', async () => {
    const idps = await idpService.getIdentityProviders(true);
    expect(idps).toHaveLength(IDP_ACTIVE_COUNT);
  });

  it('should return all idps', async () => {
    const idps = await idpService.getIdentityProviders(false);
    expect(idps).toHaveLength(IDP_COUNT);
  });

  it('should return bceid-business by idp', async () => {
    const idp = await idpService.findByIdp('bceidbusiness');
    expect(idp).toBeTruthy();
    expect(idp.code).toBe('bceid-business');
    expect(idp.idp).toBe('bceidbusiness');
  });

  it('should return bceid-business by code', async () => {
    const idp = await idpService.findByCode('bceid-business');
    expect(idp).toBeTruthy();
    expect(idp.code).toBe('bceid-business');
    expect(idp.idp).toBe('bceidbusiness');
  });

  it('should return digital-credential by idp', async () => {
    const idp = await idpService.findByIdp('digitalcredential');
    expect(idp).toBeTruthy();
    expect(idp.code).toBe('digital-credential');
    expect(idp.idp).toBe('digitalcredential');
  });

  it('should return digital-credential by code', async () => {
    const idp = await idpService.findByCode('digital-credential');
    expect(idp).toBeTruthy();
    expect(idp.code).toBe('digital-credential');
    expect(idp.idp).toBe('digitalcredential');
  });

  it('should return nothing by bad idp', async () => {
    const idp = await idpService.findByIdp('doesnotexist');
    expect(idp).toBeFalsy();
  });

  it('should return nothing by bad code', async () => {
    const idp = await idpService.findByCode('doesnotexist');
    expect(idp).toBeFalsy();
  });

  it('should return a user search', async () => {
    const s = await idpService.userSearch({ idpCode: 'idir', email: 'em@il.com' });
    expect(s).toBeFalsy();
    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.modify).toBeCalledTimes(9);
    expect(MockModel.modify).toBeCalledWith('filterIdpCode', 'idir');
    expect(MockModel.modify).toBeCalledWith('filterEmail', 'em@il.com', false, false);
  });

  it('should return a customized user search', async () => {
    const s = await idpService.userSearch({ idpCode: 'bceid-business', email: 'em@il.com' });
    expect(s).toBeFalsy();
    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.modify).toBeCalledWith('filterIdpCode', 'bceid-business', false, true);
    expect(MockModel.modify).toBeCalledWith('filterEmail', 'em@il.com', true, false);
    expect(MockModel.modify).toBeCalledTimes(9);
  });

  it('should throw error when customized user search fails validation', async () => {
    let e = undefined;
    try {
      // needs one of email or username
      await idpService.userSearch({ idpCode: 'bceid-business' });
    } catch (error) {
      e = error;
    }
    expect(e).toBeTruthy();
    expect(e).toBeInstanceOf(Error);
    expect(e.message).toBe('Could not retrieve BCeID users. Invalid options provided.');
  });

  it('should parse null token into public userInfo', async () => {
    const token = null;
    const userInfo = await idpService.parseToken(token);
    expect(userInfo).toBeTruthy();
    expect(userInfo.idp).toBe('public');
    expect(userInfo.public).toBeTruthy();
  });

  it('should return userInfo with known provider', async () => {
    const token = idirToken();
    let r = undefined;
    let e = undefined;
    try {
      r = await idpService.parseToken(token);
    } catch (error) {
      e = error;
    }

    expect(e).toBeFalsy();
    expect(r).toBeTruthy();
    expect(r.keycloakId).toBeTruthy();
    expect(r.idpUserId).toBe(token.idir_user_guid);
  });

  it('should throw Problem parsing token without a provider', async () => {
    const token = {};
    let r = undefined;
    let e = undefined;
    try {
      r = await idpService.parseToken(token);
    } catch (error) {
      e = error;
    }

    expect(e).toBeInstanceOf(Problem);
    expect(r).toBe(undefined);
  });

  it('should throw Problem parsing token with an unknown provider', async () => {
    const token = { identity_provider: 'doesnotexist' };
    let r = undefined;
    let e = undefined;
    try {
      r = await idpService.parseToken(token);
    } catch (error) {
      e = error;
    }

    expect(e).toBeInstanceOf(Problem);
    expect(r).toBe(undefined);
  });

  it('should return userInfo with good digitalcredential token', async () => {
    const token = digitalCredentialToken();
    let r = undefined;
    let e = undefined;
    try {
      r = await idpService.parseToken(token);
    } catch (error) {
      e = error;
    }

    expect(e).toBeFalsy();
    expect(r).toBeTruthy();
    expect(r.keycloakId).toBeTruthy();
    expect(r.keycloakId).toBe(token.preferred_username); // not a GUID!
    // test the stringToGUID parsing (valid answer in token...)
    expect(r.idpUserId).toEqual(token.vc_user_guid_converted);
    // test JSON parsing
    expect(r.email).toBe('patrick.swayze@gmail.com');
    expect(r.firstName).toBe('patrick');
    expect(r.lastName).toBe('swayze');
  });
});
