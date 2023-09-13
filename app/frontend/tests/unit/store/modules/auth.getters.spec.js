import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from 'vue';

import { useAuthStore } from '~/store/auth';

const zeroUuid = '00000000-0000-0000-0000-000000000000';
const zeroGuid = '00000000000000000000000000000000';

describe('auth getters', () => {
  let roles;
  const app = createApp({});
  const pinia = createPinia();
  app.use(pinia);
  setActivePinia(pinia);
  const store = useAuthStore();

  beforeEach(() => {
    store.$reset();
    store.authenticated = true;
    store.ready = true;
    store.keycloak = {
      createLoginUrl: () => 'loginUrl',
      createLogoutUrl: () => 'logoutUrl',
      fullName: 'fName',
      subject: zeroUuid,
      token: 'token',
      tokenParsed: {
        given_name: 'John',
        family_name: 'Doe',
        name: 'John Doe',
        email: 'e@mail.com',
        identity_provider: 'idir',
        idp_userid: zeroGuid,
        preferred_username: 'johndoe',
        realm_access: {},
        resource_access: {
          chefs: {
            roles: roles,
          },
        },
      },
      userName: 'uName',
    };
  });

  it('authenticated should return a boolean', () => {
    expect(store.authenticated).toBeTruthy();
  });

  it('createLoginUrl should return a string', () => {
    expect(store.createLoginUrl).toBeTruthy();
    expect(typeof store.createLoginUrl).toBe('function');
    expect(store.createLoginUrl()).toMatch('loginUrl');
  });

  it('createLogoutUrl should return a string', () => {
    expect(store.createLogoutUrl).toBeTruthy();
    expect(typeof store.createLogoutUrl).toBe('function');
    expect(store.createLogoutUrl()).toMatch('logoutUrl');
  });

  it('email should return a string', () => {
    expect(store.email).toBeTruthy();
    expect(store.email).toMatch('e@mail.com');
  });

  it('email should return an empty string', () => {
    store.keycloak.tokenParsed = undefined;
    expect(store.email).toBeFalsy();
    expect(store.email).toEqual('');
  });

  it('fullName should return a string', () => {
    expect(store.fullName).toBeTruthy();
    expect(store.fullName).toMatch('John Doe');
  });

  it('hasResourceRoles should return false if unauthenticated', () => {
    store.authenticated = false;

    expect(store.authenticated).toBeFalsy();
    expect(store.hasResourceRoles('app', roles)).toBeFalsy();
  });

  it('hasResourceRoles should return true when checking no roles', () => {
    store.authenticated = true;
    roles = [];

    expect(store.authenticated).toBeTruthy();
    expect(store.hasResourceRoles('app', roles)).toBeTruthy();
  });

  it('hasResourceRoles should return true when role exists', () => {
    store.authenticated = true;
    roles = [];

    expect(store.authenticated).toBeTruthy();
    expect(store.hasResourceRoles('app', roles)).toBeTruthy();
  });

  it('hasResourceRoles should return false when resource does not exist', () => {
    store.authenticated = true;
    store.keycloak.tokenParsed = {
      realm_access: {},
      resource_access: {},
    };
    roles = ['non-existent-role'];

    expect(store.authenticated).toBeTruthy();
    expect(store.hasResourceRoles('app', roles)).toBeFalsy();
  });

  it('identityProvider should return a string', () => {
    expect(store.identityProvider).toBeTruthy();
    expect(typeof store.identityProvider).toBe('string');
  });

  it('isAdmin should return false if no admin role', () => {
    store.authenticated = true;
    roles = [];
    store.keycloak.tokenParsed = {
      resource_access: {
        chefs: {
          roles: roles,
        },
      },
    };

    expect(store.authenticated).toBeTruthy();
    expect(store.isAdmin).toBeFalsy();
  });

  it('isAdmin should return true if admin role', () => {
    store.authenticated = true;
    roles = ['admin'];
    store.keycloak.tokenParsed = {
      resource_access: {
        chefs: {
          roles: roles,
        },
      },
    };

    expect(store.authenticated).toBeTruthy();
    expect(store.isAdmin).toBeTruthy();
  });

  it('isUser should return false if no user role', () => {
    store.authenticated = true;
    roles = [];

    expect(store.authenticated).toBeTruthy();
    expect(store.isUser).toBeFalsy();
  });

  it('isUser should return true if user role', () => {
    store.authenticated = true;
    roles = ['user'];
    store.keycloak.tokenParsed = {
      resource_access: {
        chefs: {
          roles: roles,
        },
      },
    };

    expect(store.authenticated).toBeTruthy();
    expect(store.isUser).toBeTruthy();
  });

  it('ready should return a boolean', () => {
    expect(store.ready).toBeTruthy();
  });

  it('identityProviderIdentity should return a string', () => {
    expect(store.identityProviderIdentity).toBeTruthy();
    expect(store.identityProviderIdentity).toMatch(zeroGuid);
  });

  it('keycloakSubject should return a string', () => {
    expect(store.keycloakSubject).toBeTruthy();
    expect(store.keycloakSubject).toMatch(zeroUuid);
  });

  it('moduleLoaded should return a boolean', () => {
    expect(store.moduleLoaded).toBeTruthy();
  });

  it('realmAccess should return an object', () => {
    expect(store.realmAccess).toBeTruthy();
    expect(typeof store.realmAccess).toBe('object');
  });

  it('realmAccess should return a string', () => {
    const uri = 'http://foo.bar';
    store.redirectUri = uri;

    expect(store.redirectUri).toBeTruthy();
    expect(typeof store.redirectUri).toBe('string');
    expect(store.redirectUri).toEqual(uri);
  });

  it('resourceAccess should return an object', () => {
    expect(store.resourceAccess).toBeTruthy();
    expect(typeof store.resourceAccess).toBe('object');
  });

  it('token should return a string', () => {
    expect(store.token).toBeTruthy();
    expect(store.token).toMatch('token');
  });

  it('tokenParsed should return an object', () => {
    expect(store.tokenParsed).toBeTruthy();
    expect(typeof store.tokenParsed).toBe('object');
  });

  it('userName should return a string', () => {
    expect(store.userName).toBeTruthy();
    expect(store.userName).toMatch('johndoe');
  });

  it('creates an auth user when authenticated', () => {
    expect(store.user).toBeTruthy();
    expect(store.user).toEqual({
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      email: 'e@mail.com',
      idp: 'idir',
      public: false,
    });
  });

  it('creates a public user when not authenticated', () => {
    store.authenticated = false;
    store.keycloak.tokenParsed = undefined;

    expect(store.user).toBeTruthy();
    expect(store.user).toEqual({
      username: '',
      firstName: '',
      lastName: '',
      fullName: '',
      email: '',
      idp: 'public',
      public: true,
    });
  });
});
