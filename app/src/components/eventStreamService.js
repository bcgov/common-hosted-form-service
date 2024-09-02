const config = require('config');

// shim the websocket library
globalThis.WebSocket = require('websocket').w3cwebsocket;
const { connect } = require('nats.ws');
const log = require('./log')(module.filename);

const { FormVersion, Form, FormEventStreamConfig } = require('../forms/common/models');

const { featureFlags } = require('./featureFlags');
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

class DummyEventStreamService {
  // this class should not be called if we actually check that this feature is enabled.
  // however... if we missed that check these calls will do nothing.
  async checkConnection() {
    log.warn('EventStreamService.checkConnection - EventStreamService is not enabled.');
  }
  async openConnection() {
    log.warn('EventStreamService.openConnection - EventStreamService is not enabled.');
  }
  closeConnection() {
    log.warn('EventStreamService.closeConnection - EventStreamService is not enabled.');
  }
  get connected() {
    log.warn('EventStreamService.connected - EventStreamService is not enabled.');
    return false;
  }
  // eslint-disable-next-line no-unused-vars
  async onPublish(formId, formVersionId, published) {
    log.warn('EventStreamService.onPublish - EventStreamService is not enabled.');
  }
  // eslint-disable-next-line no-unused-vars
  async onSubmit(eventType, submission, draft) {
    log.warn('EventStreamService.onSubmit - EventStreamService is not enabled.');
  }
}

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
        const result = await Promise.race([connect(me.natsOptions), timeoutPromise]);

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

  async onPublish(formId, formVersionId, published) {
    try {
      const eventType = published ? FORM_EVENT_TYPES.PUBLISHED : FORM_EVENT_TYPES.UNPUBLISHED;
      await this.openConnection();
      if (this.connected) {
        // fetch form (don't fetch all versions...)
        const form = await Form.query().findById(formId).allowGraph('[identityProviders]').withGraphFetched('identityProviders(orderDefault)').throwIfNotFound();
        // fetch version and place in form.versions[]
        const formVersion = await FormVersion.query().findById(formVersionId).throwIfNotFound();
        form['versions'] = [formVersion];

        // need to fetch the encryption key...
        const evntStrmCfg = await FormEventStreamConfig.query().modify('filterFormId', formId).allowGraph('[encryptionKey]').withGraphFetched('encryptionKey').first();

        if (evntStrmCfg) {
          const sub = `schema.${eventType}.${formId}`;
          const publicSubj = `${this.publicSubject}.${sub}`;
          const privateSubj = `${this.privateSubject}.${sub}`;
          const meta = {
            source: this.source,
            domain: this.domain,
            class: 'schema',
            type: eventType,
            formId: formId,
            formVersionId: formVersionId,
          };
          if (evntStrmCfg.enablePrivateStream) {
            const encPayload = encryptionService.encryptExternal(evntStrmCfg.encryptionKey.algorithm, evntStrmCfg.encryptionKey.key, form);
            const privMsg = {
              meta: meta,
              payload: {
                data: encPayload,
              },
            };
            const ack = await this.js.publish(privateSubj, JSON.stringify(privMsg));
            log.info(`form ${eventType} event (private) - formId: ${formId}, version: ${formVersion.version}, seq: ${ack.seq}`, { function: 'onPublish' });
          }
          if (evntStrmCfg.enablePublicStream) {
            const pubMsg = {
              meta: meta,
              payload: {},
            };
            const ack = await this.js.publish(publicSubj, JSON.stringify(pubMsg));
            log.info(`form ${eventType} event (public) - formId: ${formId}, version: ${formVersion.version}, seq: ${ack.seq}`, { function: 'onPublish' });
          }
        } else {
          log.info(`formId '${formId}' has no event stream configuration; will not publish events.`);
        }
      } else {
        // warn, error???
        log.warn(`${SERVICE} is not connected. Cannot publish (form) event. [event: form.'${eventType}', formId: ${formId}, versionId: ${formVersionId}]`, {
          function: 'onPublish',
        });
      }
    } catch (e) {
      log.error(`${SERVICE}.onPublish: ${e.message}`, e);
    }
  }

  async onSubmit(eventType, submission, draft) {
    try {
      const submissionId = submission.id;
      await this.openConnection();
      if (this.connected) {
        const formVersion = await FormVersion.query().findById(submission.formVersionId).throwIfNotFound();

        // need to fetch the encryption key...
        const evntStrmCfg = await FormEventStreamConfig.query().modify('filterFormId', formVersion.formId).allowGraph('[encryptionKey]').withGraphFetched('encryptionKey').first();

        if (evntStrmCfg) {
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

          if (evntStrmCfg.enablePrivateStream) {
            const encPayload = encryptionService.encryptExternal(evntStrmCfg.encryptionKey.algorithm, evntStrmCfg.encryptionKey.key, submission);
            const privMsg = {
              meta: meta,
              payload: {
                data: encPayload,
              },
            };
            const ack = await this.js.publish(privateSubj, JSON.stringify(privMsg));
            log.info(`submission ${eventType} event (private) - formId: ${formVersion.formId}, version: ${formVersion.version}, submissionId: ${submission.id}, seq: ${ack.seq}`, {
              function: 'onSubmit',
            });
          }
          if (evntStrmCfg.enablePublicStream) {
            const pubMsg = {
              meta: meta,
              payload: {},
            };
            const ack = await this.js.publish(publicSubj, JSON.stringify(pubMsg));
            log.info(`submission ${eventType} event (public) - formId: ${formVersion.formId}, version: ${formVersion.version}, submissionId: ${submission.id}, seq: ${ack.seq}`, {
              function: 'onSubmit',
            });
          }
        } else {
          log.info(`formId '${formVersion.formId}' has no event stream configuration; will not publish events.`);
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

// we need something to import when feature flag is off...
let eventStreamService = new DummyEventStreamService();

if (featureFlags.eventStreamService) {
  // feature flag on, let's use the real thing.
  eventStreamService = new EventStreamService(config.get('eventStreamService'));
}

module.exports = eventStreamService;

module.exports = {
  eventStreamService: eventStreamService,
  FORM_EVENT_TYPES: Object.freeze(FORM_EVENT_TYPES),
  SUBMISSION_EVENT_TYPES: Object.freeze(SUBMISSION_EVENT_TYPES),
};
