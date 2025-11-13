/* eslint-env jest */

const { generateCurrentUserFromActor, isApiUser, isRealUser, isPublicUser } = require('../../../../../../src/runtime-auth/security/auth/utils/currentUser');

describe('auth/utils/currentUser', () => {
  it('should generate currentUser from actor with metadata', () => {
    const actor = {
      type: 'user',
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      fullName: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      idpCode: 'idir',
      idpUserId: 'idir-user-123',
      keycloakId: 'keycloak-123',
      metadata: {
        clientRoles: ['admin', 'user'],
        usernameIdp: 'testuser@idir',
      },
    };

    const result = generateCurrentUserFromActor(actor);

    expect(result).toEqual({
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      fullName: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      idpCode: 'idir',
      idpUserId: 'idir-user-123',
      keycloakId: 'keycloak-123',
      public: false,
      usernameIdp: 'testuser@idir',
      clientRoles: ['admin', 'user'],
    });
  });

  it('should set public flag correctly for public actors', () => {
    const actor = {
      type: 'public',
      id: 'public-user',
      username: 'public',
      metadata: {},
    };

    const result = generateCurrentUserFromActor(actor);
    expect(result.public).toBe(true);
  });

  it('should set public flag correctly for non-public actors', () => {
    const actor = {
      type: 'apiKey',
      id: 'api-user',
      username: 'api',
      metadata: {},
    };

    const result = generateCurrentUserFromActor(actor);
    expect(result.public).toBe(false);
  });

  it('should handle actor without metadata (fallback)', () => {
    const actor = {
      type: 'user',
      id: 'user-123',
      username: 'testuser',
      fullName: 'Test User',
    };

    const result = generateCurrentUserFromActor(actor);

    expect(result).toEqual({
      id: 'user-123',
      username: 'testuser',
      fullName: 'Test User',
      public: false,
    });
  });

  it('should handle actor with minimal data (fallback)', () => {
    const actor = {
      type: 'public',
    };

    const result = generateCurrentUserFromActor(actor);

    expect(result).toEqual({
      id: 'unknown',
      username: 'unknown',
      fullName: 'unknown',
      public: true,
    });
  });

  it('should use usernameIdp from metadata when available', () => {
    const actor = {
      type: 'user',
      id: 'user-123',
      username: 'testuser',
      metadata: {
        usernameIdp: 'testuser@idir',
      },
    };

    const result = generateCurrentUserFromActor(actor);
    expect(result.usernameIdp).toBe('testuser@idir');
  });

  it('should fallback to actor.username when usernameIdp not in metadata', () => {
    const actor = {
      type: 'user',
      id: 'user-123',
      username: 'testuser',
      metadata: {},
    };

    const result = generateCurrentUserFromActor(actor);
    expect(result.usernameIdp).toBe('testuser');
  });

  it('should return true for apiKey actors when using isApiUser', () => {
    expect(isApiUser({ type: 'apiKey' })).toBe(true);
  });

  it('should return true for gateway actors when using isApiUser', () => {
    expect(isApiUser({ type: 'gateway' })).toBe(true);
  });

  it('should return false for user actors when using isApiUser', () => {
    expect(isApiUser({ type: 'user' })).toBe(false);
  });

  it('should return false for public actors when using isApiUser', () => {
    expect(isApiUser({ type: 'public' })).toBe(false);
  });

  it('should return false for unknown actor types when using isApiUser', () => {
    expect(isApiUser({ type: 'unknown' })).toBe(false);
  });

  it('should return true for user actors when using isRealUser', () => {
    expect(isRealUser({ type: 'user' })).toBe(true);
  });

  it('should return false for apiKey actors when using isRealUser', () => {
    expect(isRealUser({ type: 'apiKey' })).toBe(false);
  });

  it('should return false for gateway actors when using isRealUser', () => {
    expect(isRealUser({ type: 'gateway' })).toBe(false);
  });

  it('should return false for public actors when using isRealUser', () => {
    expect(isRealUser({ type: 'public' })).toBe(false);
  });

  it('should return true for public actors when using isPublicUser', () => {
    expect(isPublicUser({ type: 'public' })).toBe(true);
  });

  it('should return false for user actors when using isPublicUser', () => {
    expect(isPublicUser({ type: 'user' })).toBe(false);
  });

  it('should return false for apiKey actors when using isPublicUser', () => {
    expect(isPublicUser({ type: 'apiKey' })).toBe(false);
  });

  it('should return false for gateway actors when using isPublicUser', () => {
    expect(isPublicUser({ type: 'gateway' })).toBe(false);
  });
});
