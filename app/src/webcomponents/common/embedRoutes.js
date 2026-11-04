const express = require('express');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const log = require('../../components/log')(module.filename);
const { RELEASES_DIR, INTEGRITY_FILE, VERSION_PATTERN } = require('./releases');

// Matches only an x.y.z first segment, so no other path is decoded or claimed here
const VERSION_ROUTE = /^\/(\d+\.\d+\.\d+)(?=\/|$)/;

// Headers express.static sets for the file before an error can occur
const FILE_HEADERS = ['Cache-Control', 'ETag', 'Last-Modified', 'Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges'];

// Releases are loaded cross-origin with SRI, which needs CORS; CORP allows embedding under COEP
function setReleaseHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

// Exact-version release folders that have an integrity.json
function listVersions(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && VERSION_PATTERN.test(entry.name) && fs.existsSync(path.join(dir, entry.name, INTEGRITY_FILE)))
    .map((entry) => entry.name);
}

// Serves exact-version releases at /<x.y.z>/<path> and the frozen v1 embed files at their legacy URLs
function createEmbedRouter(dir = RELEASES_DIR) {
  const router = express.Router();

  for (const version of listVersions(dir)) {
    router.use(`/${version}`, express.static(path.join(dir, version), { index: false, redirect: false, immutable: true, maxAge: '365d', setHeaders: setReleaseHeaders }));
  }

  // Answer release misses and errors here rather than in the app handlers, keeping CORS so cross-origin loads see the status
  router.use(VERSION_ROUTE, (_req, res) => {
    setReleaseHeaders(res);
    res.status(404).json({ detail: 'Release file not found' });
  });
  // eslint-disable-next-line no-unused-vars
  router.use(VERSION_ROUTE, (err, _req, res, _next) => {
    // Client errors from range and conditional requests (416, 412) keep their status and headers
    const status = err.status || err.statusCode;
    const clientError = status >= 400 && status < 500;
    // The error message carries the request path, so log only the error code
    if (!clientError) log.error(`Embed release file could not be read: ${err.code || err.name}`);
    if (res.headersSent) return res.destroy();

    // The file's own headers are already set; an error must not be cached or typed as the file
    for (const name of FILE_HEADERS) res.removeHeader(name);
    res.setHeader('Cache-Control', 'no-store');
    setReleaseHeaders(res);

    if (clientError) {
      for (const [name, value] of Object.entries(err.headers || {})) res.setHeader(name, value);
      return res.status(status).json({ detail: http.STATUS_CODES[status] || 'Bad Request' });
    }
    return res.status(500).json({ detail: 'Release file could not be read' });
  });

  // Frozen v1 embed scripts at their legacy URLs
  router.use(express.static(path.join(dir, 'v1', 'embed')));

  return router;
}

module.exports = {
  createEmbedRouter,
};
