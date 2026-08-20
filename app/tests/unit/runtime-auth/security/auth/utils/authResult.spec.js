/* eslint-env jest */

const { createApiKeyAuthResult } = require('../../../../../../src/runtime-auth/security/auth/utils/authResult');

describe('auth/utils/authResult', () => {
  const mockUser = {
    id: 'api-user-id',
    username: 'api-user',
    email: 'api@example.com',
    fullName: 'API User',
    firstName: 'API',
    lastName: 'User',
    idpCode: 'api',
    idpUserId: 'api-user',
    keycloakId: 'runtime-auth-api-user',
  };

  const mockApiKeyRecord = {
    secret: 'test-secret',
    filesApiAccess: true,
  };

  it('should create auth result for apiKey strategy', () => {
    const result = createApiKeyAuthResult({
      authType: 'apiKey',
      strategyName: 'apiKeyBasic',
      actorType: 'apiKey',
      user: mockUser,
      formId: 'form1',
      apiKeyRecord: mockApiKeyRecord,
      claims: { formId: 'form1' },
    });

    expect(result).toEqual({
      authType: 'apiKey',
      strategyName: 'apiKeyBasic',
      actor: {
        type: 'apiKey',
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        fullName: mockUser.fullName,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        idpCode: mockUser.idpCode,
        idpUserId: mockUser.idpUserId,
        keycloakId: mockUser.keycloakId,
        formId: 'form1',
        metadata: {
          filesApiAccess: true,
          apiKeyMetadata: {
            filesApiAccess: true,
          },
          ...mockUser,
        },
      },
      claims: { formId: 'form1' },
    });
  });

  it('should create auth result for gateway strategy', () => {
    const payload = { formId: 'form2', apiKey: 'gateway-secret', customClaim: 'value' };

    const result = createApiKeyAuthResult({
      authType: 'gateway',
      strategyName: 'gatewayBearer',
      actorType: 'gateway',
      user: mockUser,
      formId: 'form2',
      apiKeyRecord: mockApiKeyRecord,
      claims: payload,
    });

    expect(result).toEqual({
      authType: 'gateway',
      strategyName: 'gatewayBearer',
      actor: {
        type: 'gateway',
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        fullName: mockUser.fullName,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        idpCode: mockUser.idpCode,
        idpUserId: mockUser.idpUserId,
        keycloakId: mockUser.keycloakId,
        formId: 'form2',
        metadata: {
          filesApiAccess: true,
          apiKeyMetadata: {
            filesApiAccess: true,
          },
          ...mockUser,
        },
      },
      claims: payload,
    });
  });

  it('should handle null apiKeyRecord gracefully', () => {
    const result = createApiKeyAuthResult({
      authType: 'apiKey',
      strategyName: 'apiKeyBasic',
      actorType: 'apiKey',
      user: mockUser,
      formId: 'form3',
      apiKeyRecord: null,
      claims: { formId: 'form3' },
    });

    expect(result.actor.metadata.filesApiAccess).toBeUndefined();
    expect(result.actor.metadata.apiKeyMetadata.filesApiAccess).toBeUndefined();
    expect(result.actor.formId).toBe('form3');
    expect(result.actor.id).toBe(mockUser.id);
  });

  it('should handle undefined apiKeyRecord gracefully', () => {
    const result = createApiKeyAuthResult({
      authType: 'apiKey',
      strategyName: 'apiKeyBasic',
      actorType: 'apiKey',
      user: mockUser,
      formId: 'form4',
      apiKeyRecord: undefined,
      claims: { formId: 'form4' },
    });

    expect(result.actor.metadata.filesApiAccess).toBeUndefined();
    expect(result.actor.metadata.apiKeyMetadata.filesApiAccess).toBeUndefined();
  });

  it('should handle apiKeyRecord with filesApiAccess false', () => {
    const apiKeyRecordFalse = {
      secret: 'test-secret',
      filesApiAccess: false,
    };

    const result = createApiKeyAuthResult({
      authType: 'apiKey',
      strategyName: 'apiKeyBasic',
      actorType: 'apiKey',
      user: mockUser,
      formId: 'form5',
      apiKeyRecord: apiKeyRecordFalse,
      claims: { formId: 'form5' },
    });

    expect(result.actor.metadata.filesApiAccess).toBe(false);
    expect(result.actor.metadata.apiKeyMetadata.filesApiAccess).toBe(false);
  });

  it('should include all user fields in metadata', () => {
    const result = createApiKeyAuthResult({
      authType: 'apiKey',
      strategyName: 'apiKeyBasic',
      actorType: 'apiKey',
      user: mockUser,
      formId: 'form6',
      apiKeyRecord: mockApiKeyRecord,
      claims: { formId: 'form6' },
    });

    expect(result.actor.metadata.id).toBe(mockUser.id);
    expect(result.actor.metadata.username).toBe(mockUser.username);
    expect(result.actor.metadata.email).toBe(mockUser.email);
    expect(result.actor.metadata.fullName).toBe(mockUser.fullName);
    expect(result.actor.metadata.firstName).toBe(mockUser.firstName);
    expect(result.actor.metadata.lastName).toBe(mockUser.lastName);
    expect(result.actor.metadata.idpCode).toBe(mockUser.idpCode);
    expect(result.actor.metadata.idpUserId).toBe(mockUser.idpUserId);
    expect(result.actor.metadata.keycloakId).toBe(mockUser.keycloakId);
  });

  it('should preserve additional user fields in metadata', () => {
    const userWithExtraFields = {
      ...mockUser,
      customField: 'custom-value',
      anotherField: 123,
    };

    const result = createApiKeyAuthResult({
      authType: 'apiKey',
      strategyName: 'apiKeyBasic',
      actorType: 'apiKey',
      user: userWithExtraFields,
      formId: 'form7',
      apiKeyRecord: mockApiKeyRecord,
      claims: { formId: 'form7' },
    });

    expect(result.actor.metadata.customField).toBe('custom-value');
    expect(result.actor.metadata.anotherField).toBe(123);
  });

  it('should include filesApiAccess in both metadata and apiKeyMetadata', () => {
    const result = createApiKeyAuthResult({
      authType: 'apiKey',
      strategyName: 'apiKeyBasic',
      actorType: 'apiKey',
      user: mockUser,
      formId: 'form8',
      apiKeyRecord: mockApiKeyRecord,
      claims: { formId: 'form8' },
    });

    expect(result.actor.metadata.filesApiAccess).toBe(true);
    expect(result.actor.metadata.apiKeyMetadata).toEqual({
      filesApiAccess: true,
    });
    expect(result.actor.metadata.filesApiAccess).toBe(result.actor.metadata.apiKeyMetadata.filesApiAccess);
  });

  it('should set correct formId in actor', () => {
    const result = createApiKeyAuthResult({
      authType: 'apiKey',
      strategyName: 'apiKeyBasic',
      actorType: 'apiKey',
      user: mockUser,
      formId: 'test-form-123',
      apiKeyRecord: mockApiKeyRecord,
      claims: { formId: 'test-form-123' },
    });

    expect(result.actor.formId).toBe('test-form-123');
  });

  it('should include custom claims object', () => {
    const customClaims = {
      formId: 'form9',
      scope: 'read:write',
      custom: 'value',
    };

    const result = createApiKeyAuthResult({
      authType: 'gateway',
      strategyName: 'gatewayBearer',
      actorType: 'gateway',
      user: mockUser,
      formId: 'form9',
      apiKeyRecord: mockApiKeyRecord,
      claims: customClaims,
    });

    expect(result.claims).toEqual(customClaims);
  });
});
