/* eslint-env jest */

const { HTTP_STATUS } = require('../../../../src/runtime-auth/security/httpStatus');

describe('httpStatus', () => {
  it('should export all required HTTP status constants with correct values', () => {
    expect(HTTP_STATUS.OK).toBe(200);
    expect(HTTP_STATUS.CREATED).toBe(201);
    expect(HTTP_STATUS.NO_CONTENT).toBe(204);
    expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
    expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
    expect(HTTP_STATUS.FORBIDDEN).toBe(403);
    expect(HTTP_STATUS.NOT_FOUND).toBe(404);
    expect(HTTP_STATUS.CONFLICT).toBe(409);
    expect(HTTP_STATUS.UNPROCESSABLE_ENTITY).toBe(422);
    expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    expect(HTTP_STATUS.BAD_GATEWAY).toBe(502);
    expect(HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503);
  });

  it('should have numeric values for all constants', () => {
    for (const status of Object.values(HTTP_STATUS)) {
      expect(typeof status).toBe('number');
    }
  });
});
