const config = require('config');
const falsey = require('falsey');
const { JSONCodec } = require('nats');
const axios = require('axios');

// different connection libraries if we are using websockets or nats protocols.
const WEBSOCKETS = !falsey(config.get('eventStreamService.websockets'));

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
  constructor({ servers, streamName, source, domain, username, password }) {
    if (!servers || !streamName || !source || !domain || !username || !password) {
      throw new Error('EventStreamService is not configured. Check configuration.');
    }

    this.servers = servers;
    this.streamName = streamName;
    this.source = source;
    this.domain = domain;
    this.username = username;
    this.password = password;

    this.nc = null; // nats connection
    this.js = null; // jet stream
    this.jsm = null; // jet stream manager
    this.natsOptions = {
      servers: this.servers.split(','),
      maxReconnectAttempts: 1,
      name: this.streamName,
      reconnectTimeWait: 5000, // wait 5 seconds before retrying...
      waitOnFirstConnect: true,
      pingInterval: 2000,
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
        log.info('Connected', { function: 'openConnection' });
        this.js = this.nc.jetstream();
        this.jsm = await this.js.jetstreamManager();
        this.jsm.streams.add({ name: this.streamName, subjects: [`${this.publicSubject}.>`, `${this.privateSubject}.>`] });
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
            const encodedPayload = jsonCodec.encode(privMsg);
            const ack = await this.js.publish(privateSubj, encodedPayload);
            log.info(`form ${eventType} event (private) - formId: ${formId}, version: ${formVersion.version}, seq: ${ack.seq}`, { function: 'onPublish' });
          }
          if (evntStrmCfg.enablePublicStream) {
            const pubMsg = {
              meta: meta,
              payload: {},
            };
            const encodedPayload = jsonCodec.encode(pubMsg);
            const ack = await this.js.publish(publicSubj, encodedPayload);
            log.info(`form ${eventType} event (public) - formId: ${formId}, version: ${formVersion.version}, seq: ${ack.seq}`, { function: 'onPublish' });
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

  async _onPublishWebhook(eventType, meta, formId) {
    try {
      const cfg = await this._getWebhook(formId);
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
      };
      await formMetadataService.addAttribute(formId, meta);

      const tasks = [this._onPublishEventStream(eventType, meta, formId, formVersionId, published), this._onPublishWebhook(eventType, meta, formId, formVersionId, published)];

      Promise.all(tasks);
    } catch (e) {
      log.error(`${SERVICE}.onPublish: ${e.message}`, e);
    }
  }

  async onSubmit(eventType, submission, draft) {
    try {
      const submissionId = submission.id;
      await this.openConnection();
      if (this.connected) {
        const formVersion = await this._getFormVersion(submission.formVersionId);

        // need to fetch the encryption key...
        const evntStrmCfg = await this._getEventStreamConfig(formVersion.formId);

        if (evntStrmCfg && evntStrmCfg.enabled) {
          const sub = `submission.${eventType}.${formVersion.formId}`;
          const publicSubj = `${this.publicSubject}.${sub}`;
          const privateSubj = `${this.privateSubject}.${sub}`;
          const meta = {
            source: this.source,
            domain: this.domain,
            class: 'submission',
            type: eventType,
            formId: formVersion.formId,
            formVersionId: submission.formVersionId,
            submissionId: submission.id,
            draft: draft,
          };
          await formMetadataService.addAttribute(formVersion.formId, meta);

          if (evntStrmCfg.enablePrivateStream) {
            const encPayload = encryptionService.encryptExternal(evntStrmCfg.encryptionKey.algorithm, evntStrmCfg.encryptionKey.key, submission);
            const privMsg = {
              meta: meta,
              payload: {
                data: encPayload,
              },
            };
            const encodedPayload = jsonCodec.encode(privMsg);
            const ack = await this.js.publish(privateSubj, encodedPayload);
            log.info(`submission ${eventType} event (private) - formId: ${formVersion.formId}, version: ${formVersion.version}, submissionId: ${submission.id}, seq: ${ack.seq}`, {
              function: 'onSubmit',
            });
          }
          if (evntStrmCfg.enablePublicStream) {
            const pubMsg = {
              meta: meta,
              payload: {},
            };
            const encodedPayload = jsonCodec.encode(pubMsg);
            const ack = await this.js.publish(publicSubj, encodedPayload);
            log.info(`submission ${eventType} event (public) - formId: ${formVersion.formId}, version: ${formVersion.version}, submissionId: ${submission.id}, seq: ${ack.seq}`, {
              function: 'onSubmit',
            });
          }
        } else {
          log.info(`formId '${formVersion.formId}' has no event stream configuration (or it is not enabled); will not publish events.`);
        }
      } else {
        // warn, error???
        log.warn(`${SERVICE} is not connected. Cannot publish (submission) event. [submission.event: '${eventType}', submissionId: ${submissionId}]`, {
          function: 'onSubmit',
        });
      }
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
