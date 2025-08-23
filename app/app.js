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
const webcomponentRouter = require('./src/webcomponents');

const DataConnection = require('./src/db/dataConnection');
const dataConnection = new DataConnection();
const { eventStreamService } = require('./src/components/eventStreamService');
const clamAvScanner = require('./src/components/clamAvScanner');

const statusService = require('./src/components/statusService');
statusService.registerConnection('dataConnection', 'Database', dataConnection, 'checkAll', 'checkConnection');
statusService.registerConnection('eventStreamService', 'Event Stream Service', eventStreamService, 'checkConnection', 'checkConnection');
statusService.registerConnection('clamAvScanner', 'Virus Scanner', clamAvScanner, 'checkConnection', 'checkConnection');

const apiRouter = express.Router();

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
  // Initialize connections and wait for completion
  statusService.initializeAllConnections();
  app.use(httpLogger);
}

const statusPath = `${config.get('server.basePath')}${config.get('server.apiPath')}/status`;

// Block requests until service is ready, except for /config and /status
app.use((req, res, next) => {
  // Only skip for exact /config or /status
  if (req.path === '/config' || req.path === statusPath) {
    return next();
  }
  const status = statusService.getStatus();
  if (status.stopped) {
    new Problem(503, { details: { message: 'Server is shutting down', ...status } }).send(res);
  } else if (!status.ready) {
    new Problem(503, { details: { message: 'Server is not ready', ...status } }).send(res);
  } else {
    next();
  }
});

app.use(config.get('server.basePath') + config.get('server.apiPath'), rateLimiter);

// Frontend configuration endpoint
apiRouter.get('/config', (_req, res, next) => {
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
  const status = statusService.getStatus();
  if (status.stopped) {
    throw new Error('Server shutting down');
  } else {
    res.status(200).json('ok');
  }
});

// Host API endpoints
apiRouter.use(config.get('server.apiPath'), v1Router);
app.use(config.get('server.basePath'), apiRouter);

// Host web component endpoints (separate from API) and apply rate limiting
app.use(`${config.get('server.basePath')}/webcomponents`, rateLimiter, webcomponentRouter);

app.use(middleware.errorHandler);

// Host the static frontend assets
const staticFilesPath = config.get('frontend.basePath');
app.use('/favicon.ico', (_req, res) => {
  res.redirect(`${staticFilesPath}/favicon.ico`);
});
app.use(staticFilesPath, express.static(path.join(__dirname, 'frontend/dist')));

// Host embed assets (CSS and JS files) separately to avoid Vue router conflicts
app.use(`${config.get('server.basePath')}/embed`, express.static(path.join(__dirname, 'frontend/dist')));

// Handle 500
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.stack) {
    log.error(err);
  }
  const status = statusService.getStatus();
  if (err instanceof Problem) {
    // Attempt to reset DB connection if 5xx error
    if (err.status >= 500 && !status.stopped) dataConnection.resetConnection();
    err.send(res, null);
  } else {
    // Attempt to reset DB connection
    if (!status.stopped) dataConnection.resetConnection();
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
  const status = statusService.getStatus();
  // Wait 3 seconds before starting cleanup
  if (!status.stopped) setTimeout(cleanup, 3000);
}

/**
 * @function cleanup
 * Cleans up connections in this application.
 */
function cleanup() {
  log.info('Service no longer accepting traffic', { function: 'cleanup' });
  statusService.stopAll();

  log.info('Cleaning up...', { function: 'cleanup' });
  clearInterval(probeId);

  eventStreamService.closeConnection();
  dataConnection.close(() => process.exit());

  // Wait 10 seconds max before hard exiting
  setTimeout(() => process.exit(), 10000);
}

module.exports = app;
