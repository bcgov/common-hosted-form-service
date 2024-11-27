const { MockModel } = require('../../common/dbHelper');
const { JSONCodec } = require('nats');
const crypto = require('crypto');
const { Form, FormVersion, FormEventStreamConfig } = require('../../../src/forms/common/models');

const formMetadataService = require('../../../src/forms/form/formMetadata/service');
const { eventStreamService, FORM_EVENT_TYPES, SUBMISSION_EVENT_TYPES } = require('../../../src/components/eventStreamService');
const jsonCodec = JSONCodec();
jest.mock('../../../src/forms/form/formMetadata/service');

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

    formMetadataService.addAttribute = jest.fn().mockResolvedValueOnce({});
    service = eventStreamService;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return a implemented service ', () => {
    expect(service).toBeTruthy();
    expect(service.servers).toBeTruthy();
    expect(Object.entries(FORM_EVENT_TYPES)).toHaveLength(FORM_EVENT_TYPES_COUNT);
    expect(Object.entries(SUBMISSION_EVENT_TYPES)).toHaveLength(SUBMISSION_EVENT_TYPES_COUNT);
  });

  it('onPublish should emit published private', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service._publishToStream = jest.fn().mockResolvedValueOnce({ seq: 1 });
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
      enabled: true,
    });
    service._onPublishWebhook = jest.fn().mockResolvedValueOnce({});

    await service.onPublish('123', '456', true);
    expect(service._publishToStream).toBeCalledTimes(1); // called once for private, no public stream enabled
    expect(service._publishToStream).toBeCalledWith('PRIVATE.forms.schema.published.123', expect.anything()); // called once for private, no public stream enabled
  });

  it('onPublish should not emit when config not enabled', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service._publishToStream = jest.fn().mockResolvedValueOnce({ seq: 1 });
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
      enabled: false,
    });
    service._onPublishWebhook = jest.fn().mockResolvedValueOnce({});

    await service.onPublish('123', '456', true);
    expect(service._publishToStream).toBeCalledTimes(0); // config not enabled, js.publish not called
  });

  it('onPublish should emit published public', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service._publishToStream = jest.fn().mockResolvedValueOnce({ seq: 1 });
    // mock out model queries
    service._getForm = jest.fn().mockResolvedValueOnce({ id: '123' });
    service._getFormVersion = jest.fn().mockResolvedValueOnce({ id: '456', formId: '123', version: '1' });
    service._getEventStreamConfig = jest.fn().mockResolvedValueOnce({
      id: '789',
      formId: '123',
      enablePublicStream: true,
      enablePrivateStream: false,
      enabled: true,
    });
    await service.onPublish('123', '456', true);
    service._onPublishWebhook = jest.fn().mockResolvedValueOnce({});

    expect(service._publishToStream).toBeCalledTimes(1); // called once for private, no public stream enabled
    expect(service._publishToStream).toBeCalledWith('PUBLIC.forms.schema.published.123', expect.anything()); // called once for private, no public stream enabled
  });

  it('onPublish should emit unpublished private', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service._publishToStream = jest.fn().mockResolvedValueOnce({ seq: 1 });
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
      enabled: true,
    });
    await service.onPublish('123', '456', false);
    service._onPublishWebhook = jest.fn().mockResolvedValueOnce({});

    expect(service._publishToStream).toBeCalledTimes(1); // called once for private, no public stream enabled
    expect(service._publishToStream).toBeCalledWith('PRIVATE.forms.schema.unpublished.123', expect.anything()); // called once for private, no public stream enabled
  });

  it('onPublish should emit unpublished public', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service._publishToStream = jest.fn().mockResolvedValueOnce({ seq: 1 });
    // mock out model queries
    service._getForm = jest.fn().mockResolvedValueOnce({ id: '123' });
    service._getFormVersion = jest.fn().mockResolvedValueOnce({ id: '456', formId: '123', version: '1' });
    service._getEventStreamConfig = jest.fn().mockResolvedValueOnce({
      id: '789',
      formId: '123',
      enablePublicStream: true,
      enablePrivateStream: false,
      enabled: true,
    });
    service._onPublishWebhook = jest.fn().mockResolvedValueOnce({});

    await service.onPublish('123', '456', false);
    expect(service._publishToStream).toBeCalledTimes(1); // called once for private, no public stream enabled
    expect(service._publishToStream).toBeCalledWith('PUBLIC.forms.schema.unpublished.123', expect.anything()); // called once for private, no public stream enabled
  });

  it('onPublish should emit private and public', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service._publishToStream = jest.fn().mockResolvedValueOnce({ seq: 1 });
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
      enabled: true,
    });
    service._onPublishWebhook = jest.fn().mockResolvedValueOnce({});

    await service.onPublish('123', '456', true);
    expect(service._publishToStream).toBeCalledTimes(2);
  });

  it('onSubmit should emit private', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service._publishToStream = jest.fn().mockResolvedValueOnce({ seq: 1 });
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
      enabled: true,
    });
    service._onSubmitWebhook = jest.fn().mockResolvedValueOnce({});

    await service.onSubmit('created', { id: '345', formId: '123', formVersionId: '456' });
    expect(service._publishToStream).toBeCalledTimes(1); // called once for private, no public stream enabled
    expect(service._publishToStream).toBeCalledWith('PRIVATE.forms.submission.created.123', expect.anything()); // called once for private, no public stream enabled
  });

  it('onSubmit should not emit when config not enabled', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service._publishToStream = jest.fn().mockResolvedValueOnce({ seq: 1 });
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
      enabled: false,
    });
    service._onSubmitWebhook = jest.fn().mockResolvedValueOnce({});

    await service.onSubmit('created', { id: '345', formId: '123', formVersionId: '456' });
    expect(service._publishToStream).toBeCalledTimes(0); // config not enabled, no js.publish
  });

  it('onSubmit should emit public', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service._publishToStream = jest.fn().mockResolvedValueOnce({ seq: 1 });
    // mock out model queries
    service._getForm = jest.fn().mockResolvedValueOnce({ id: '123' });
    service._getFormVersion = jest.fn().mockResolvedValueOnce({ id: '456', formId: '123', version: '1' });
    service._getEventStreamConfig = jest.fn().mockResolvedValueOnce({
      id: '789',
      formId: '123',
      enablePublicStream: true,
      enablePrivateStream: false,
      enabled: true,
    });
    service._onSubmitWebhook = jest.fn().mockResolvedValueOnce({});

    await service.onSubmit('created', { id: '345', formId: '123', formVersionId: '456' });
    expect(service._publishToStream).toBeCalledTimes(1); // called once for private, no public stream enabled
    expect(service._publishToStream).toBeCalledWith('PUBLIC.forms.submission.created.123', expect.anything()); // called once for private, no public stream enabled
  });

  it('onSubmit should emit private and public', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service._publishToStream = jest.fn().mockResolvedValueOnce({ seq: 1 });
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
      enabled: true,
    });
    service._onSubmitWebhook = jest.fn().mockResolvedValueOnce({});

    await service.onSubmit('created', { id: '345', formId: '123', formVersionId: '456' });
    expect(service._publishToStream).toBeCalledTimes(2);
  });

  it('onPublish should not throw error', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service._publishToStream = jest.fn().mockResolvedValueOnce({ seq: 1 });
    // mock out model queries
    service._getForm = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    service._getFormVersion = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    service._getEventStreamConfig = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    service._onPublishWebhook = jest.fn().mockResolvedValueOnce({});

    await service.onPublish('123', '456', true);
    expect(service._publishToStream).toBeCalledTimes(0);
  });

  it('onSubmit should not throw error', async () => {
    // mock out service properties and functions
    service.openConnection = jest.fn().mockResolvedValueOnce(true);
    service.nc = jest.fn().mockReturnThis();
    service.nc.info = jest.fn().mockReturnThis();
    service._publishToStream = jest.fn().mockResolvedValueOnce({ seq: 1 });
    // mock out model queries
    service._getForm = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    service._getFormVersion = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    service._getEventStreamConfig = jest.fn().mockRejectedValueOnce(new Error('SQL Error'));
    service._onSubmitWebhook = jest.fn().mockRejectedValueOnce();
    await service.onSubmit('created', { id: '345', formId: '123', formVersionId: '456' });
    expect(service._publishToStream).toBeCalledTimes(0);
  });

  it('_sizeCheck should handle large message', async () => {
    // mock out service properties and functions
    service.allowedMsgSize = 1000; // allow 1000 bytes max
    const msg = {
      meta: {},
      payload: { data: 'hi' },
    };

    // small message: no error, payload same
    let encoded = service._sizeCheck(msg);
    let decoded = jsonCodec.decode(encoded);
    expect(decoded.error).toBeFalsy();
    expect(decoded.payload.data).toEqual('hi');

    // large message: error, payload removed
    msg.payload.data = crypto.randomBytes(1000).toString('hex');
    encoded = service._sizeCheck(msg);
    decoded = jsonCodec.decode(encoded);
    expect(decoded.error).toBeTruthy();
    expect(decoded.payload.data).toEqual({});
  });
});
