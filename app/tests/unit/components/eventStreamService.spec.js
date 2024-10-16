const { MockModel } = require('../../common/dbHelper');

const { Form, FormVersion, FormEventStreamConfig } = require('../../../src/forms/common/models');

// change these as appropriate after adding new default keys/algos...
const FORM_EVENT_TYPES_COUNT = 2;
const SUBMISSION_EVENT_TYPES_COUNT = 3;

beforeEach(() => {
  MockModel.mockReset();
  jest.resetModules();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('eventStreamService', () => {
  let service;
  beforeEach(() => {
    MockModel.mockReset();

    Form.query = jest.fn().mockReturnThis();
    Form.where = jest.fn().mockReturnThis();
    Form.modify = jest.fn().mockReturnThis();
    Form.findById = jest.fn().mockReturnThis();
    Form.allowGraph = jest.fn().mockReturnThis();
    Form.withGraphFetched = jest.fn().mockReturnThis();
    Form.first = jest.fn().mockReturnThis();
    Form.throwIfNotFound = jest.fn().mockReturnThis();

    FormVersion.query = jest.fn().mockReturnThis();
    FormVersion.where = jest.fn().mockReturnThis();
    FormVersion.modify = jest.fn().mockReturnThis();
    FormVersion.findById = jest.fn().mockReturnThis();
    FormVersion.allowGraph = jest.fn().mockReturnThis();
    FormVersion.withGraphFetched = jest.fn().mockReturnThis();
    FormVersion.first = jest.fn().mockReturnThis();
    FormVersion.throwIfNotFound = jest.fn().mockReturnThis();

    FormEventStreamConfig.query = jest.fn().mockReturnThis();
    FormEventStreamConfig.where = jest.fn().mockReturnThis();
    FormEventStreamConfig.modify = jest.fn().mockReturnThis();
    FormEventStreamConfig.findById = jest.fn().mockReturnThis();
    FormEventStreamConfig.allowGraph = jest.fn().mockReturnThis();
    FormEventStreamConfig.withGraphFetched = jest.fn().mockReturnThis();
    FormEventStreamConfig.first = jest.fn().mockReturnThis();
    FormEventStreamConfig.throwIfNotFound = jest.fn().mockReturnThis();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return a implemented service when feature flag is true', () => {
    const { featureFlags } = require('../../../src/components/featureFlags');
    featureFlags.enabled = jest.fn().mockReturnValueOnce(true);
    const { eventStreamService, FORM_EVENT_TYPES, SUBMISSION_EVENT_TYPES } = require('../../../src/components/eventStreamService');
    expect(eventStreamService).toBeTruthy();
    expect(eventStreamService.servers).toBeTruthy();
    expect(Object.entries(FORM_EVENT_TYPES)).toHaveLength(FORM_EVENT_TYPES_COUNT);
    expect(Object.entries(SUBMISSION_EVENT_TYPES)).toHaveLength(SUBMISSION_EVENT_TYPES_COUNT);
    service = eventStreamService;
  });

  it('onPublish should emit published private', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service.js = jest.fn().mockReturnThis();
    service.js.publish = jest.fn().mockResolvedValueOnce({ seq: 1 });
    // mock out model queries
    service._getForm = jest.fn().mockResolvedValueOnce({ id: '123' });
    service._getFormVersion = jest.fn().mockResolvedValueOnce({ id: '456', formId: '123', version: '1' });
    service._getEventStreamConfig = jest.fn().mockResolvedValueOnce({
      id: '789',
      formId: '123',
      enablePublicStream: false,
      enablePrivateStream: true,
      encryptionKeyId: '012',
      encryptionKey: {
        id: '012',
        formId: '123',
        name: 'test',
        algorithm: 'aes-256-gcm',
        key: 'ad5520469720325d1694c87511afda28a0432dd974cb77b5b4b9f946a5af6985',
      },
    });
    await service.onPublish('123', '456', true);
    expect(service.js.publish).toBeCalledTimes(1); // called once for private, no public stream enabled
    expect(service.js.publish).toBeCalledWith('PRIVATE.forms.schema.published.123', expect.anything()); // called once for private, no public stream enabled
  });

  it('onPublish should emit published public', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service.js = jest.fn().mockReturnThis();
    service.js.publish = jest.fn().mockResolvedValueOnce({ seq: 1 });
    // mock out model queries
    service._getForm = jest.fn().mockResolvedValueOnce({ id: '123' });
    service._getFormVersion = jest.fn().mockResolvedValueOnce({ id: '456', formId: '123', version: '1' });
    service._getEventStreamConfig = jest.fn().mockResolvedValueOnce({
      id: '789',
      formId: '123',
      enablePublicStream: true,
      enablePrivateStream: false,
    });
    await service.onPublish('123', '456', true);
    expect(service.js.publish).toBeCalledTimes(1); // called once for private, no public stream enabled
    expect(service.js.publish).toBeCalledWith('PUBLIC.forms.schema.published.123', expect.anything()); // called once for private, no public stream enabled
  });

  it('onPublish should emit unpublished private', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service.js = jest.fn().mockReturnThis();
    service.js.publish = jest.fn().mockResolvedValueOnce({ seq: 1 });
    // mock out model queries
    service._getForm = jest.fn().mockResolvedValueOnce({ id: '123' });
    service._getFormVersion = jest.fn().mockResolvedValueOnce({ id: '456', formId: '123', version: '1' });
    service._getEventStreamConfig = jest.fn().mockResolvedValueOnce({
      id: '789',
      formId: '123',
      enablePublicStream: false,
      enablePrivateStream: true,
      encryptionKeyId: '012',
      encryptionKey: {
        id: '012',
        formId: '123',
        name: 'test',
        algorithm: 'aes-256-gcm',
        key: 'ad5520469720325d1694c87511afda28a0432dd974cb77b5b4b9f946a5af6985',
      },
    });
    await service.onPublish('123', '456', false);
    expect(service.js.publish).toBeCalledTimes(1); // called once for private, no public stream enabled
    expect(service.js.publish).toBeCalledWith('PRIVATE.forms.schema.unpublished.123', expect.anything()); // called once for private, no public stream enabled
  });

  it('onPublish should emit unpublished public', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service.js = jest.fn().mockReturnThis();
    service.js.publish = jest.fn().mockResolvedValueOnce({ seq: 1 });
    // mock out model queries
    service._getForm = jest.fn().mockResolvedValueOnce({ id: '123' });
    service._getFormVersion = jest.fn().mockResolvedValueOnce({ id: '456', formId: '123', version: '1' });
    service._getEventStreamConfig = jest.fn().mockResolvedValueOnce({
      id: '789',
      formId: '123',
      enablePublicStream: true,
      enablePrivateStream: false,
    });
    await service.onPublish('123', '456', false);
    expect(service.js.publish).toBeCalledTimes(1); // called once for private, no public stream enabled
    expect(service.js.publish).toBeCalledWith('PUBLIC.forms.schema.unpublished.123', expect.anything()); // called once for private, no public stream enabled
  });

  it('onPublish should emit private and public', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service.js = jest.fn().mockReturnThis();
    service.js.publish = jest.fn().mockResolvedValueOnce({ seq: 1 });
    // mock out model queries
    service._getForm = jest.fn().mockResolvedValueOnce({ id: '123' });
    service._getFormVersion = jest.fn().mockResolvedValueOnce({ id: '456', formId: '123', version: '1' });
    service._getEventStreamConfig = jest.fn().mockResolvedValueOnce({
      id: '789',
      formId: '123',
      enablePublicStream: true,
      enablePrivateStream: true,
      encryptionKeyId: '012',
      encryptionKey: {
        id: '012',
        formId: '123',
        name: 'test',
        algorithm: 'aes-256-gcm',
        key: 'ad5520469720325d1694c87511afda28a0432dd974cb77b5b4b9f946a5af6985',
      },
    });
    await service.onPublish('123', '456', true);
    expect(service.js.publish).toBeCalledTimes(2);
  });

  it('onPublish should not throw error', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service.js = jest.fn().mockReturnThis();
    service.js.publish = jest.fn().mockResolvedValueOnce({ seq: 1 });
    // mock out model queries
    service._getForm = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    await service.onPublish('123', '456', true);
    expect(service.js.publish).toBeCalledTimes(0);
  });

  it('onSubmit should emit private', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service.js = jest.fn().mockReturnThis();
    service.js.publish = jest.fn().mockResolvedValueOnce({ seq: 1 });
    // mock out model queries
    service._getForm = jest.fn().mockResolvedValueOnce({ id: '123' });
    service._getFormVersion = jest.fn().mockResolvedValueOnce({ id: '456', formId: '123', version: '1' });
    service._getEventStreamConfig = jest.fn().mockResolvedValueOnce({
      id: '789',
      formId: '123',
      enablePublicStream: false,
      enablePrivateStream: true,
      encryptionKeyId: '012',
      encryptionKey: {
        id: '012',
        formId: '123',
        name: 'test',
        algorithm: 'aes-256-gcm',
        key: 'ad5520469720325d1694c87511afda28a0432dd974cb77b5b4b9f946a5af6985',
      },
    });
    await service.onSubmit('created', '123', { id: '345', formId: '123' });
    expect(service.js.publish).toBeCalledTimes(1); // called once for private, no public stream enabled
    expect(service.js.publish).toBeCalledWith('PRIVATE.forms.submission.created.123', expect.anything()); // called once for private, no public stream enabled
  });

  it('onSubmit should emit public', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service.js = jest.fn().mockReturnThis();
    service.js.publish = jest.fn().mockResolvedValueOnce({ seq: 1 });
    // mock out model queries
    service._getForm = jest.fn().mockResolvedValueOnce({ id: '123' });
    service._getFormVersion = jest.fn().mockResolvedValueOnce({ id: '456', formId: '123', version: '1' });
    service._getEventStreamConfig = jest.fn().mockResolvedValueOnce({
      id: '789',
      formId: '123',
      enablePublicStream: true,
      enablePrivateStream: false,
    });
    await service.onSubmit('created', '123', { id: '345', formId: '123' });
    expect(service.js.publish).toBeCalledTimes(1); // called once for private, no public stream enabled
    expect(service.js.publish).toBeCalledWith('PUBLIC.forms.submission.created.123', expect.anything()); // called once for private, no public stream enabled
  });

  it('onSubmit should emit private and public', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service.js = jest.fn().mockReturnThis();
    service.js.publish = jest.fn().mockResolvedValueOnce({ seq: 1 });
    // mock out model queries
    service._getForm = jest.fn().mockResolvedValueOnce({ id: '123' });
    service._getFormVersion = jest.fn().mockResolvedValueOnce({ id: '456', formId: '123', version: '1' });
    service._getEventStreamConfig = jest.fn().mockResolvedValueOnce({
      id: '789',
      formId: '123',
      enablePublicStream: true,
      enablePrivateStream: true,
      encryptionKeyId: '012',
      encryptionKey: {
        id: '012',
        formId: '123',
        name: 'test',
        algorithm: 'aes-256-gcm',
        key: 'ad5520469720325d1694c87511afda28a0432dd974cb77b5b4b9f946a5af6985',
      },
    });
    await service.onSubmit('created', '123', { id: '345', formId: '123' });
    expect(service.js.publish).toBeCalledTimes(2);
  });

  it('onSubmit should not throw error', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service.js = jest.fn().mockReturnThis();
    service.js.publish = jest.fn().mockResolvedValueOnce({ seq: 1 });
    // mock out model queries
    service._getForm = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    await service.onSubmit('created', '123', { id: '345', formId: '123' });
    expect(service.js.publish).toBeCalledTimes(0);
  });
});

describe('DummyEventStreamService', () => {
  beforeEach(() => {
    MockModel.mockReset();
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return a dummy service when feature flag is false', () => {
    const { featureFlags } = require('../../../src/components/featureFlags');
    featureFlags.enabled = jest.fn().mockReturnValueOnce(false);
    const { eventStreamService } = require('../../../src/components/eventStreamService');
    expect(eventStreamService).toBeTruthy();
    expect(eventStreamService.servers).toBeFalsy();
  });
});
