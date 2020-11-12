const compression = require('compression');
const config = require('config');
const express = require('express');
const log = require('npmlog');
const morgan = require('morgan');
const path = require('path');
const Problem = require('api-problem');
const querystring = require('querystring');

const keycloak = require('./src/components/keycloak');
const v1Router = require('./src/routes/v1');

const DataConnection = require('./src/db/dataConnection');
const dataConnection = new DataConnection();

const apiRouter = express.Router();
const state = {
  connections: {
    data: false
  },
  shutdown: false
};

const app = express();
app.use(compression());
app.use(express.json({ limit: config.get('server.bodyLimit') }));
app.use(express.urlencoded({ extended: true }));

// Logging Setup
log.level = config.get('server.logLevel');
log.addLevel('debug', 1500, { fg: 'cyan' });

// Skip if running tests
if (process.env.NODE_ENV !== 'test') {
  // Add Morgan endpoint logging
  app.use(morgan(config.get('server.morganFormat')));
  initializeConnections();
}

// Use Keycloak OIDC Middleware
app.use(keycloak.middleware());

// Frontend configuration endpoint
apiRouter.use('/config', (_req, res, next) => {
  try {
    const frontend = config.get('frontend');
    // we will need to pass
    const uploads = config.get('files.uploads');
    const feConfig = {...frontend, uploads: uploads };
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

// Host the static frontend assets
const staticFilesPath = config.get('frontend.basePath');
app.use('/favicon.ico', (_req, res) => { res.redirect(`${staticFilesPath}/favicon.ico`); });
app.use(staticFilesPath, express.static(path.join(__dirname, 'frontend/dist')));

// Handle 500
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.stack) {
    log.error(err.stack);
  }

  if (err instanceof Problem) {
    err.send(res, null);
  } else {
    new Problem(500, 'Server Error', {
      detail: (err.message) ? err.message : err
    }).send(res);
  }
});

// Handle 404
app.use((req, res) => {
  if (req.originalUrl.startsWith(`${config.get('server.basePath')}/api`)) {
    // Return a 404 problem if attempting to access API
    new Problem(404, 'Page Not Found', {
      detail: req.originalUrl
    }).send(res);
  } else {
    // Redirect any non-API requests to static frontend with redirect breadcrumb
    const query = querystring.stringify({ ...req.query, r: req.path });
    res.redirect(`${staticFilesPath}/?${query}`);
  }
});

// Prevent unhandled errors from crashing application
process.on('unhandledRejection', err => {
  if (err && err.stack) {
    log.error(err.stack);
  }
});

/**
 * @function shutdown
 * Begins shutting down this application. It will hard exit after 3 seconds.
 */
function shutdown() {
  if (!state.shutdown) {
    log.info('Received kill signal. Shutting down...');
    state.shutdown = true;
    // Wait 3 seconds before hard exiting
    setTimeout(() => process.exit(), 3000);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

/**
 *  @function initializeConnections
 *  Initializes the database, queue and email connections
 *  This will force the application to exit if it fails
 */
function initializeConnections() {
  // Initialize connections and exit if unsuccessful
  try {
    const tasks = [
      dataConnection.checkAll()
    ];

    Promise.all(tasks)
      .then(results => {
        state.connections.data = results[0];

        if (state.connections.data) log.info('DataConnection', 'Connected');
      })
      .catch(error => {
        log.error(error);
        log.error('initializeConnections', `Initialization failed: Database OK = ${state.connections.data}`);
      })
      .finally(() => {
        state.ready = Object.values(state.connections).every(x => x);
        if (!state.ready) shutdown();
      });

  } catch (error) {
    log.error('initializeConnections', 'Connection initialization failure', error.message);
    if (!state.ready) shutdown();
  }

  // Start asynchronous connection probe
  connectionProbe();
}

/**
 *  @function connectionProbe
 *  Periodically checks the status of the connections at a specific interval
 *  This will force the application to exit a connection fails
 *  @param {integer} [interval=10000] Number of milliseconds to wait before
 */
function connectionProbe(interval = 10000) {
  const checkConnections = () => {
    if (!state.shutdown) {
      const tasks = [
        dataConnection.checkConnection()
      ];

      log.verbose(JSON.stringify(state));
      Promise.all(tasks).then(results => {
        state.connections.data = results[0];
        state.ready = Object.values(state.connections).every(x => x);
        if (!state.ready) shutdown();
      });
    }
  };

  setInterval(checkConnections, interval);
}

module.exports = app;
