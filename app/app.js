const compression = require('compression');
const config = require('config');
const express = require('express');
const path = require('path');
const Problem = require('api-problem');
const querystring = require('querystring');

const log = require('./src/components/log')(module.filename);
const httpLogger = require('./src/components/log').httpLogger;
const middleware = require('./src/forms/common/middleware');
const rateLimiter = require('./src/forms/common/middleware').apiKeyRateLimiter;
const v1Router = require('./src/routes/v1');

const DataConnection = require('./src/db/dataConnection');
const dataConnection = new DataConnection();
const { eventStreamService } = require('./src/components/eventStreamService');

const apiRouter = express.Router();
const state = {
  connections: {
    data: false,
    eventStreamService: false,
  },
  ready: false,
  shutdown: false,
};

let probeId;
const app = express();
app.use(compression());
app.use(express.json({ limit: config.get('server.bodyLimit') }));
app.use(express.urlencoded({ extended: true }));

// Express needs to know about the OpenShift proxy. With this setting Express
// pulls the IP address from the headers, rather than use the proxy IP address.
// This gives the correct IP address in the logs and for the rate limiting.
// See https://express-rate-limit.github.io/ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set('trust proxy', 1);

app.set('x-powered-by', false);

// Skip if running tests
if (process.env.NODE_ENV !== 'test') {
  // Initialize connections and exit if unsuccessful
  initializeConnections();
  app.use(httpLogger);
}

// Block requests until service is ready
app.use((_req, res, next) => {
  if (state.shutdown) {
    new Problem(503, { details: 'Server is shutting down' }).send(res);
  } else if (!state.ready) {
    new Problem(503, { details: 'Server is not ready' }).send(res);
  } else {
    next();
  }
});

app.use(config.get('server.basePath') + config.get('server.apiPath'), rateLimiter);

// Frontend configuration endpoint
apiRouter.use('/config', (_req, res, next) => {
  try {
    const frontend = config.get('frontend');
    // we will need to pass
    const uploads = config.get('files.uploads');
    const feConfig = { ...frontend, uploads: uploads };
    let ess = config.util.cloneDeep(config.get('eventStreamService'));
    if (ess) {
      delete ess['username'];
      delete ess['password'];
      feConfig['eventStreamService'] = {
        ...ess,
      };
    }
    res.status(200).json(feConfig);
  } catch (err) {
    next(err);
  }
});

// Base API Directory
apiRouter.get('/api', (_req, res) => {
  if (state.shutdown) {
    throw new Error('Server shutting down');
  } else {
    res.status(200).json('ok');
  }
});

// Host API endpoints
apiRouter.use(config.get('server.apiPath'), v1Router);
app.use(config.get('server.basePath'), apiRouter);
app.use(middleware.errorHandler);

// Host the static frontend assets
const staticFilesPath = config.get('frontend.basePath');
app.use('/favicon.ico', (_req, res) => {
  res.redirect(`${staticFilesPath}/favicon.ico`);
});
app.use(staticFilesPath, express.static(path.join(__dirname, 'frontend/dist')));

// Handle 500
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.stack) {
    log.error(err);
  }

  if (err instanceof Problem) {
    // Attempt to reset DB connection if 5xx error
    if (err.status >= 500 && !state.shutdown) dataConnection.resetConnection();
    err.send(res, null);
  } else {
    // Attempt to reset DB connection
    if (!state.shutdown) dataConnection.resetConnection();
    new Problem(500, 'Server Error', {
      detail: err.message ? err.message : err,
    }).send(res);
  }
});

// Handle 404
app.use((req, res) => {
  if (req.originalUrl.startsWith(`${config.get('server.basePath')}/api`)) {
    // Return a 404 problem if attempting to access API
    new Problem(404, 'Page Not Found', {
      detail: req.originalUrl,
    }).send(res);
  } else {
    // Redirect any non-API requests to static frontend with redirect breadcrumb
    const query = querystring.stringify({ ...req.query, r: req.path });
    res.redirect(`${staticFilesPath}/?${query}`);
  }
});

// Prevent unhandled errors from crashing application
process.on('unhandledRejection', (err) => {
  if (err && err.stack) {
    log.error(err);
  }
});

// Graceful shutdown support
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGUSR1', shutdown);
process.on('SIGUSR2', shutdown);
process.on('exit', () => {
  log.info('Exiting...');
});

/**
 * @function shutdown
 * Shuts down this application after at least 3 seconds.
 */
function shutdown() {
  log.info('Received kill signal. Shutting down...');
  // Wait 3 seconds before starting cleanup
  if (!state.shutdown) setTimeout(cleanup, 3000);
}

/**
 * @function cleanup
 * Cleans up connections in this application.
 */
function cleanup() {
  log.info('Service no longer accepting traffic', { function: 'cleanup' });
  state.shutdown = true;

  log.info('Cleaning up...', { function: 'cleanup' });
  clearInterval(probeId);

  eventStreamService.closeConnection();
  dataConnection.close(() => process.exit());

  // Wait 10 seconds max before hard exiting
  setTimeout(() => process.exit(), 10000);
}

/**
 *  @function initializeConnections
 *  Initializes the database connections
 *  This will force the application to exit if it fails
 */
function initializeConnections() {
  // Initialize connections and exit if unsuccessful
  const tasks = [dataConnection.checkAll(), eventStreamService.checkConnection()];

  Promise.all(tasks)
    .then((results) => {
      state.connections.data = results[0];

      if (state.connections.data)
        log.info('DataConnection Reachable', {
          function: 'initializeConnections',
        });

      state.connections.eventStreamService = results[1];
      const reachable = state.connections.eventStreamService ? 'Reachable' : 'Unreachable';
      log.info(`EventStreamService ${reachable}`, {
        function: 'initializeConnections',
      });
    })
    .catch((error) => {
      log.error(`Initialization failed: Database OK = ${state.connections.data}`, { function: 'initializeConnections' });
      log.error(`Initialization failed: EventStreamService OK = ${state.connections.eventStreamService}`, { function: 'initializeConnections' });
      log.error('Connection initialization failure', error.message, {
        function: 'initializeConnections',
      });
      if (!state.ready) {
        process.exitCode = 1;
        shutdown();
      }
    })
    .finally(() => {
      state.ready = state.connections.data; // only need db running
      if (state.ready) {
        log.info('Service ready to accept traffic', {
          function: 'initializeConnections',
        });
        // Start periodic 10 second connection probe check
        probeId = setInterval(checkConnections, 10000);
      }
    });
}

/**
 * @function checkConnections
 * Checks Database connectivity
 * This will force the application to exit if a connection fails
 */
function checkConnections() {
  const wasReady = state.ready;
  if (!state.shutdown) {
    const tasks = [dataConnection.checkConnection(), eventStreamService.checkConnection()];

    Promise.all(tasks).then((results) => {
      state.connections.data = results[0];
      state.connections.eventStreamService = results[1];

      state.ready = state.connections.data; // only want no db to halt application
      if (!wasReady && state.ready)
        log.info('Service ready to accept traffic', {
          function: 'checkConnections',
        });
      log.verbose(state);
      if (!state.ready) {
        log.error(`Database connected = ${state.connections.data}`, { function: 'checkConnections' });
        log.error(`EventStreamService connected = ${state.connections.eventStreamService}`, { function: 'checkConnections' });
        process.exitCode = 1;
        shutdown();
      }
    });
  }
}

module.exports = app;
