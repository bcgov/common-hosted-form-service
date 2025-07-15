const config = require('config');
const falsey = require('falsey');
const { JSONCodec, nanos } = require('nats');
const axios = require('axios');

// different connection libraries if we are using websockets or nats protocols.
const WEBSOCKETS = !falsey(config.get('eventStreamService.websockets'));

const HEADERS_SIZE = 1024; // account for NATS headers in messages, use 1kb.

let natsConnect;
if (WEBSOCKETS) {
  // shim the websocket library
  globalThis.WebSocket = require('websocket').w3cwebsocket;
  const { connect } = require('nats.ws');
  natsConnect = connect;
} else {
  const { connect } = require('nats');
  natsConnect = connect;
}

const log = require('./log')(module.filename);

const { FormVersion, Form, FormEventStreamConfig, FormSubscription } = require('../forms/common/models');
const formMetadataService = require('../forms/form/formMetadata/service');
const { encryptionService } = require('./encryptionService');

const SERVICE = 'EventStreamService';

const FORM_EVENT_TYPES = {
  PUBLISHED: 'published',
  UNPUBLISHED: 'unpublished',
};

const SUBMISSION_EVENT_TYPES = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
};

const jsonCodec = JSONCodec();

class EventStreamService {
  constructor(cfg) {
    if (!cfg || !cfg.servers || !cfg.streamName || !cfg.source || !cfg.domain || !cfg.username || !cfg.password) {
      throw new Error('EventStreamService is not configured. Check configuration.');
    }

    if (!cfg.maxAge || !cfg.maxBytes || !cfg.maxMsgs || !cfg.maxMsgSize || !cfg.duplicateWindow || !cfg.numReplicas) {
      throw new Error('EventStreamService is not configured (missing stream limits). Check configuration.');
    }

    this.servers = cfg.servers;
    this.streamName = cfg.streamName;
    this.source = cfg.source;
    this.domain = cfg.domain;
    this.username = cfg.username;
    this.password = cfg.password;

    this.configured = false;

    // stream limits configuration
    try {
      this.maxAge = parseInt(cfg.maxAge);
      this.maxBytes = parseInt(cfg.maxBytes);
      this.maxMsgs = parseInt(cfg.maxMsgs);
      this.maxMsgSize = parseInt(cfg.maxMsgSize);
      this.duplicateWindow = parseInt(cfg.duplicateWindow);

      this.numReplicas = parseInt(cfg.numReplicas);
    } catch (error) {
      throw new Error('EventStreamService configuration, error parsing integers for stream limits. Check configuration.');
    }

    this.allowedMsgSize = this.maxMsgSize - HEADERS_SIZE; // the allowed message size is the stream limit less the nats headers.

    this.nc = null; // nats connection
    this.js = null; // jet stream
    this.jsm = null; // jet stream manager
    this.natsOptions = {
      servers: this.servers.split(','),
      maxReconnectAttempts: 5,
      name: this.streamName,
      reconnectTimeWait: 5000, // wait 5 seconds before retrying...
      waitOnFirstConnect: true,
      pingInterval: 500,
      user: this.username,
      pass: this.password,
    };

    this.publicSubject = `PUBLIC.${this.domain}`;
    this.privateSubject = `PRIVATE.${this.domain}`;
    this.firstConnect = true;
  }

  async checkConnection() {
    // this is for health checks
    // it will also open our connection on first check...
    try {
      await this.openConnection();
      return this.connected;
    } catch (e) {
      log.error(e.message, { function: 'checkConnection' });
    }
    return false;
  }

  async openConnection() {
    try {
      if (this.connected) return this.nc;

      const me = this;
      const connectToNats = async function () {
        // nats.connect will throw errors only if the server is running.
        // nats.connect will NOT timeout if the server isn't reachable/not started.
        // so, let's wait twice the reconnect time and create our own timeout.
        let timeout;
        // eslint-disable-next-line no-unused-vars
        const timeoutPromise = new Promise((resolve, reject) => {
          timeout = setTimeout(() => {
            resolve(null);
          }, me.natsOptions.reconnectTimeWait * 2);
        });

        // we either timeout or connect...
        const result = await Promise.race([natsConnect(me.natsOptions), timeoutPromise]);

        if (timeout) {
          clearTimeout(timeout);
        }
        return result;
      };

      this.nc = await connectToNats();
      if (this.connected) {
        log.info(`Connected to server: ${this.nc.info.server_name}`, { function: 'openConnection' });
        this.js = this.nc.jetstream();
        this.jsm = await this.js.jetstreamManager();
        if (!this.configured) {
          const cfg = {
            name: this.streamName,
            subjects: [`${this.publicSubject}.>`, `${this.privateSubject}.>`],
          };
          let streamInfo;
          try {
            // this will throw an error if stream is not created.
            streamInfo = await this.jsm.streams.info(cfg.name);
          } catch (err) {
            // catch the error and add the stream, it doesn't exist!
            if (err.message === 'stream not found') {
              log.info(`Stream: ${cfg.name} not found, creating stream...`, { function: 'openConnection' });
              Object.assign(
                cfg,
                { max_msgs: this.maxMsgs, max_bytes: this.maxBytes, max_msg_size: this.maxMsgSize, num_replicas: this.numReplicas },
                { max_age: nanos(this.maxAge), duplicate_window: nanos(this.duplicateWindow) }
              );
              await this.jsm.streams.add(cfg);
              log.info(`Stream: ${cfg.name} created.`, { function: 'openConnection' });
            }
          }
          try {
            streamInfo = await this.jsm.streams.info(cfg.name);
            const upd = {};
            if (streamInfo.config.max_msgs !== this.maxMsgs) {
              upd['max_msgs'] = this.maxMsgs;
            }
            if (streamInfo.config.max_bytes !== this.maxBytes) {
              upd['max_bytes'] = this.maxBytes;
            }
            if (streamInfo.config.max_msg_size !== this.maxMsgSize) {
              upd['max_msg_size'] = this.maxMsgSize;
            }
            if (streamInfo.config.num_replicas !== this.numReplicas) {
              upd['num_replicas'] = this.maxMsgs;
            }
            if (streamInfo.config.max_age !== nanos(this.maxAge)) {
              upd['max_age'] = nanos(this.maxAge);
            }
            if (streamInfo.config.duplicate_window !== nanos(this.duplicateWindow)) {
              upd['duplicate_window'] = nanos(this.duplicateWindow);
            }
            if (Object.keys(upd).length) {
              log.info(`Stream: ${cfg.name} updating configuration...`, { function: 'openConnection' });
              await this.jsm.streams.update(cfg.name, upd);
              await new Promise((r) => setTimeout(r, 1000));
              log.info(`Stream: ${cfg.name} configuration updated.`, { function: 'openConnection' });
            }
          } catch (err) {
            log.error(err.message, { function: 'openConnection' });
          }
          this.configured = true;
        }

        this.nc.closed().then((err) => {
          if (err) {
            log.warn(`the connection closed with an error ${err.message}`, { function: 'connection.closed' });
          } else {
            log.info('the connection closed.', { function: 'connection.closed' });
          }
        });
        // log will be littered with these messages... (every 10 seconds).
        //} else {
        //  log.warn(`the connection to event stream service [${this.servers}] can not be established.`);
      }
      return this.nc;
    } catch (e) {
      log.error(e.message, { function: 'openConnection' });
    }
  }

  closeConnection() {
    if (this.connected) {
      try {
        // make this sync so we can use it in our app shutdown/clean up
        this.nc.close().then(() => {});
        log.info('Disconnected', { function: 'closeConnection' });
      } catch (e) {
        log.error(e.message, { function: 'closeConnection' });
      }
    }
  }

  get connected() {
    try {
      if (this.nc && this.nc.info != undefined) {
        return true;
      }
    } catch (e) {
      log.error(e.message, { function: 'connected' });
    }
    return false;
  }

  async _getForm(formId) {
    return Form.query().findById(formId).allowGraph('[identityProviders]').withGraphFetched('identityProviders(orderDefault)').throwIfNotFound();
  }

  async _getFormVersion(formVersionId) {
    return FormVersion.query().findById(formVersionId).throwIfNotFound();
  }

  async _getEventStreamConfig(formId) {
    return FormEventStreamConfig.query().modify('filterFormId', formId).allowGraph('[encryptionKey]').withGraphFetched('encryptionKey').first();
  }

  async _getWebhook(formId) {
    return FormSubscription.query().modify('filterFormId', formId).first();
  }

  _sizeCheck(msg) {
    const size = Buffer.byteLength(JSON.stringify(msg));
    if (size > this.allowedMsgSize) {
      // we need to remove the payload data and add metadata that this is too big.
      msg.payload = { data: {} };
      msg.error = { code: 'MAX_MSG_SIZE', message: `Message is ${size} bytes. This exceeds maximum allowed of ${this.allowedMsgSize} bytes. Please download payload via API.` };
    }
    return jsonCodec.encode(msg);
  }

  async _onPublishEventStream(eventType, meta, formId, formVersionId) {
    try {
      await this.openConnection();
      if (this.connected) {
        // fetch form (don't fetch all versions...)
        const form = await this._getForm(formId);
        // fetch version and place in form.versions[]
        const formVersion = await this._getFormVersion(formVersionId);
        form['versions'] = [formVersion];

        // need to fetch the encryption key...
        const evntStrmCfg = await this._getEventStreamConfig(formId);

        if (evntStrmCfg && evntStrmCfg.enabled) {
          const sub = `schema.${eventType}.${formId}`;
          const publicSubj = `${this.publicSubject}.${sub}`;
          const privateSubj = `${this.privateSubject}.${sub}`;

          if (evntStrmCfg.enablePrivateStream) {
            const encPayload = encryptionService.encryptExternal(evntStrmCfg.encryptionKey.algorithm, evntStrmCfg.encryptionKey.key, form);
            const privMsg = {
              meta: meta,
              payload: {
                data: encPayload,
              },
            };
            const encodedPayload = this._sizeCheck(privMsg);
            const ack = await this._publishToStream(privateSubj, encodedPayload);
            if (ack) {
              log.info(`form ${eventType} event (private) - formId: ${formId}, version: ${formVersion.version}, seq: ${ack.seq}`, { function: 'onPublish' });
            } else {
              log.error(`failed: form ${eventType} event (private) - formId: ${formId}, version: ${formVersion.version}, seq: ${ack.seq}`, { function: 'onPublish' });
            }
          }
          if (evntStrmCfg.enablePublicStream) {
            const pubMsg = {
              meta: meta,
              payload: {},
            };
            const encodedPayload = jsonCodec.encode(pubMsg);
            const ack = await this._publishToStream(publicSubj, encodedPayload);
            if (ack) {
              log.info(`form ${eventType} event (public) - formId: ${formId}, version: ${formVersion.version}, seq: ${ack.seq}`, { function: 'onPublish' });
            } else {
              log.error(`failed: form ${eventType} event (public) - formId: ${formId}, version: ${formVersion.version}, seq: ${ack.seq}`, { function: 'onPublish' });
            }
          }
        } else {
          log.info(`formId '${formId}' has no event stream configuration (or it is not enabled); will not publish events.`);
        }
      } else {
        // warn, error???
        log.warn(`${SERVICE} is not connected. Cannot publish (form) event. [event: form.'${eventType}', formId: ${formId}, versionId: ${formVersionId}]`, {
          function: 'onPublish',
        });
      }
    } catch (e) {
      log.error(`${SERVICE}._onPublishEventStream: ${e.message}`, e);
    }
  }

  async _onPublishWebhook(meta) {
    try {
      const cfg = await this._getWebhook(meta.formId);
      if (cfg && cfg.endpointUrl && cfg.eventStreamNotifications) {
        const axiosOptions = { timeout: 10000 };
        const axiosInstance = axios.create(axiosOptions);
        axiosInstance.interceptors.request.use(
          (cfg) => {
            cfg.headers = { [cfg.key]: `${cfg.endpointToken}` };
            return Promise.resolve(cfg);
          },
          (error) => {
            return Promise.reject(error);
          }
        );
        axiosInstance.post(cfg.endpointUrl, meta);
      }
    } catch (e) {
      log.error(`${SERVICE}._onPublishWebhook: ${e.message}`, e);
    }
  }

  async onPublish(formId, formVersionId, published) {
    try {
      const eventType = published ? FORM_EVENT_TYPES.PUBLISHED : FORM_EVENT_TYPES.UNPUBLISHED;
      const meta = {
        source: this.source,
        domain: this.domain,
        class: 'schema',
        type: eventType,
        formId: formId,
        formVersionId: formVersionId,
        timestamp: new Date(),
      };
      await formMetadataService.addAttribute(formId, meta);

      const tasks = [this._onPublishEventStream(eventType, meta, formId, formVersionId, published), this._onPublishWebhook(meta)];

      return Promise.all(tasks);
    } catch (e) {
      log.error(`${SERVICE}.onPublish: ${e.message}`, e);
    }
  }

  async _publishToStream(subject, payload) {
    let conn;
    let ack;
    try {
      conn = await natsConnect(this.natsOptions);
      log.info(`Connected to server: ${conn.info.server_name}`, { function: '_publishToStream' });
      const js = conn.jetstream();
      ack = await js.publish(subject, payload);
    } catch (e) {
      log.error(`${e.message}, try again.`);
    } finally {
      try {
        await conn.close();
      } catch (e) {
        log.error(e.message, { function: '_publishToStream' });
      }
    }
    return ack;
  }

  async _onSubmitEventStream(eventType, meta, submission, formVersion) {
    try {
      await this.openConnection();
      if (this.connected) {
        // need to fetch the encryption key...
        const evntStrmCfg = await this._getEventStreamConfig(formVersion.formId);

        if (evntStrmCfg && evntStrmCfg.enabled) {
          const sub = `submission.${eventType}.${formVersion.formId}`;
          const publicSubj = `${this.publicSubject}.${sub}`;
          const privateSubj = `${this.privateSubject}.${sub}`;

          if (evntStrmCfg.enablePrivateStream) {
            const encPayload = encryptionService.encryptExternal(evntStrmCfg.encryptionKey.algorithm, evntStrmCfg.encryptionKey.key, submission);
            const privMsg = {
              meta: meta,
              payload: {
                data: encPayload,
              },
            };
            const encodedPayload = this._sizeCheck(privMsg);
            const ack = await this._publishToStream(privateSubj, encodedPayload);
            if (ack) {
              log.info(
                `submission ${eventType} event (private) - formId: ${formVersion.formId}, version: ${formVersion.version}, submissionId: ${submission.id}, seq: ${ack.seq}`,
                {
                  function: 'onSubmit',
                }
              );
            } else {
              log.error(`failed: submission ${eventType} event (private) - formId: ${formVersion.formId}, version: ${formVersion.version}, submissionId: ${submission.id}`, {
                function: 'onSubmit',
              });
            }
          }
          if (evntStrmCfg.enablePublicStream) {
            const pubMsg = {
              meta: meta,
              payload: {},
            };
            const encodedPayload = jsonCodec.encode(pubMsg);
            const ack = await this._publishToStream(publicSubj, encodedPayload);
            if (ack) {
              log.info(`submission ${eventType} event (public) - formId: ${formVersion.formId}, version: ${formVersion.version}, submissionId: ${submission.id}, seq: ${ack.seq}`, {
                function: 'onSubmit',
              });
            } else {
              log.error(
                `failed: submission ${eventType} event (public) - formId: ${formVersion.formId}, version: ${formVersion.version}, submissionId: ${submission.id}, seq: ${ack.seq}`,
                {
                  function: 'onSubmit',
                }
              );
            }
          }
        } else {
          log.info(`formId '${formVersion.formId}' has no event stream configuration (or it is not enabled); will not publish events.`);
        }
      } else {
        // warn, error???
        log.warn(`${SERVICE} is not connected. Cannot publish (submission) event. [submission.event: '${eventType}', submissionId: ${submission.id}]`, {
          function: 'onSubmit',
        });
      }
    } catch (e) {
      log.error(`${SERVICE}._onSubmitEventStream: ${e.message}`, e);
    }
  }

  async _onSubmitWebhook(meta) {
    try {
      const cfg = await this._getWebhook(meta.formId);
      if (cfg && cfg.endpointUrl && cfg.eventStreamNotifications) {
        const axiosOptions = { timeout: 10000 };
        const axiosInstance = axios.create(axiosOptions);
        axiosInstance.interceptors.request.use(
          (cfg) => {
            cfg.headers = { [cfg.key]: `${cfg.endpointToken}` };
            return Promise.resolve(cfg);
          },
          (error) => {
            return Promise.reject(error);
          }
        );
        axiosInstance.post(cfg.endpointUrl, meta);
      }
    } catch (e) {
      log.error(`${SERVICE}._onSubmitWebhook: ${e.message}`, e);
    }
  }

  async onSubmit(eventType, submission, draft) {
    try {
      const formVersion = await this._getFormVersion(submission.formVersionId);

      const meta = {
        source: this.source,
        domain: this.domain,
        class: 'submission',
        type: eventType,
        formId: formVersion.formId,
        formVersionId: submission.formVersionId,
        submissionId: submission.id,
        draft: draft,
        timestamp: new Date(),
      };
      await formMetadataService.addAttribute(formVersion.formId, meta);

      const tasks = [this._onSubmitEventStream(eventType, meta, submission, formVersion), this._onSubmitWebhook(meta)];

      return Promise.all(tasks);
    } catch (e) {
      log.error(`${SERVICE}.onSubmit: ${e.message}`, e);
    }
  }
}

const eventStreamService = new EventStreamService(config.get('eventStreamService'));

module.exports = {
  eventStreamService: eventStreamService,
  FORM_EVENT_TYPES: Object.freeze(FORM_EVENT_TYPES),
  SUBMISSION_EVENT_TYPES: Object.freeze(SUBMISSION_EVENT_TYPES),
};
