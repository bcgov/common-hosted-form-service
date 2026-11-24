const fs = require('node:fs');
const path = require('node:path');

const log = require('../../../components/log')(module.filename);
const { releaseDir } = require('../../common/releases');

// Frozen v1 assets
const assetsDir = path.join(releaseDir('v1'), 'assets');

const fileTypes = {
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.svg': 'image/svg+xml',
};

function trySend(res, filePath, contentType) {
  if (fs.existsSync(filePath)) {
    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    const stream = fs.createReadStream(filePath);
    // Without a listener a read error (e.g. too many open files) would crash the process
    stream.on('error', (err) => {
      log.error(`Web component asset could not be read: ${err.code || err.name}`);
      if (res.headersSent) return res.destroy();
      // Never cache or type the error as the asset
      res.removeHeader('Content-Type');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(500).json({ detail: 'Asset could not be read' });
    });
    stream.pipe(res);
    return true;
  }
  return false;
}

function createAssetRoute(relPath, contentType, errorMessage, root = assetsDir) {
  return async (_req, res, next) => {
    try {
      if (trySend(res, path.join(root, relPath), contentType)) return;
      res.status(404).json({ detail: errorMessage });
    } catch (err) {
      next(err);
    }
  };
}

// Serves req.params.file from a flat directory of font and image files
function createFileRoute(relDir, invalidMessage, errorMessage, root = assetsDir) {
  const dir = path.join(root, relDir);
  return async (req, res, next) => {
    try {
      const file = req.params.file || '';
      // Reject any filename that contains path navigation or disallowed characters
      // Allow only alphanumerics, dot, underscore, hyphen
      if (!/^[A-Za-z0-9._-]+$/.test(file)) {
        return res.status(400).json({ detail: invalidMessage });
      }
      // Explicitly reject dot-paths and traversal attempts
      if (file === '.' || file === '..' || file.includes('..')) {
        return res.status(400).json({ detail: invalidMessage });
      }
      const filePath = path.resolve(dir, file);
      if (!filePath.startsWith(dir + path.sep)) {
        return res.status(400).json({ detail: invalidMessage });
      }
      const contentType = fileTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      if (trySend(res, filePath, contentType)) return;
      res.status(404).json({ detail: errorMessage });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  assetsDir,
  trySend,
  createAssetRoute,
  createFileRoute,
};
