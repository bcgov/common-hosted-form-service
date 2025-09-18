const routes = require('express').Router();
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const config = require('config');

const originAccess = require('../../common/middleware/originAccess');

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

// CHEFS CSS assets for embed components
// GET /webcomponents/v1/assets/chefs-index.css
routes.get('/chefs-index.css', cors(), originAccess, async (_req, res, next) => {
  try {
    const rel = 'vendor/chefs/chefs-index.css';
    for (const root of assetRoots) {
      const p = path.join(root, rel);
      if (trySend(res, p, 'text/css')) return;
    }
    res.status(404).json({ detail: 'CHEFS index CSS not found' });
  } catch (err) {
    next(err);
  }
});

// GET /webcomponents/v1/assets/chefs-theme.css
routes.get('/chefs-theme.css', cors(), originAccess, async (_req, res, next) => {
  try {
    const rel = 'vendor/chefs/chefs-theme.css';
    for (const root of assetRoots) {
      const p = path.join(root, rel);
      if (trySend(res, p, 'text/css')) return;
    }
    res.status(404).json({ detail: 'CHEFS theme CSS not found' });
  } catch (err) {
    next(err);
  }
});

// Form.io assets
// GET /webcomponents/v1/assets/formio.js
routes.get('/formio.js', cors(), originAccess, async (_req, res, next) => {
  try {
    const rel = 'vendor/formiojs/dist/formio.full.min.js';
    for (const root of assetRoots) {
      const p = path.join(root, rel);
      if (trySend(res, p, 'application/javascript')) return;
    }
    res.status(404).json({ detail: 'Form.io asset not found' });
  } catch (err) {
    next(err);
  }
});

// GET /webcomponents/v1/assets/formio.css
routes.get('/formio.css', cors(), originAccess, async (_req, res, next) => {
  try {
    const rel = 'vendor/formiojs/dist/formio.full.min.css';
    for (const root of assetRoots) {
      const p = path.join(root, rel);
      if (trySend(res, p, 'text/css')) return;
    }
    res.status(404).json({ detail: 'Form.io CSS not found' });
  } catch (err) {
    next(err);
  }
});

// Font Awesome 4.7 assets for Shadow DOM compatibility
// GET /webcomponents/v1/assets/font-awesome/css/font-awesome.min.css
routes.get('/font-awesome/css/font-awesome.min.css', cors(), originAccess, async (_req, res, next) => {
  try {
    const rel = 'vendor/font-awesome/css/font-awesome.min.css';
    for (const root of assetRoots) {
      const p = path.join(root, rel);
      if (trySend(res, p, 'text/css')) return;
    }
    res.status(404).json({ detail: 'Font Awesome CSS not found' });
  } catch (err) {
    next(err);
  }
});

// GET /webcomponents/v1/assets/font-awesome/fonts/:file
routes.get('/font-awesome/fonts/:file', cors(), originAccess, async (req, res, next) => {
  try {
    const file = req.params.file || '';
    // Reject any filename that contains path navigation or disallowed characters
    // Allow only alphanumerics, dot, underscore, hyphen
    if (!/^[A-Za-z0-9._-]+$/.test(file)) {
      return res.status(400).json({ detail: 'Invalid font path' });
    }
    // Explicitly reject dot-paths and traversal attempts
    if (file === '.' || file === '..' || file.includes('..')) {
      return res.status(400).json({ detail: 'Invalid font path' });
    }
    const typeMap = {
      '.woff2': 'font/woff2',
      '.woff': 'font/woff',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'font/otf',
      '.svg': 'image/svg+xml',
    };
    for (const root of assetRoots) {
      const fontsDir = path.join(root, 'vendor/font-awesome/fonts');
      const filePath = path.resolve(fontsDir, file);
      if (!filePath.startsWith(fontsDir + path.sep)) {
        return res.status(400).json({ detail: 'Invalid font path' });
      }
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        res.setHeader('Content-Type', typeMap[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    }
    res.status(404).json({ detail: 'Font file not found' });
  } catch (err) {
    next(err);
  }
});

module.exports = routes;
