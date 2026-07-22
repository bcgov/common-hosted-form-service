const fs = require('node:fs');
const path = require('node:path');
const config = require('config');

// Resolve asset roots from config
const assetRoots = (() => {
  const hasRoots = typeof config.has === 'function' && config.has('webcomponents.assets.roots');
  const raw = hasRoots ? config.get('webcomponents.assets.roots') : [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim().length) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
})();

function trySend(res, filePath, contentType) {
  if (fs.existsSync(filePath)) {
    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    fs.createReadStream(filePath).pipe(res);
    return true;
  }
  return false;
}

function createAssetRoute(relPath, contentType, errorMessage, roots = assetRoots) {
  return async (_req, res, next) => {
    try {
      for (const root of roots) {
        const p = path.join(root, relPath);
        if (trySend(res, p, contentType)) return;
      }
      res.status(404).json({ detail: errorMessage });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  assetRoots,
  trySend,
  createAssetRoute,
};
