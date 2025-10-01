const routes = require('express').Router();
const fs = require('node:fs');
const path = require('node:path');
const cors = require('cors');

const originAccess = require('../../common/middleware/originAccess');
const { assetRoots, createAssetRoute } = require('./assetRouteUtils');

// CHEFS CSS assets for embed components
routes.get('/chefs-index.css', cors(), originAccess, createAssetRoute('vendor/chefs/chefs-index.css', 'text/css', 'CHEFS index CSS not found'));
routes.get('/chefs-theme.css', cors(), originAccess, createAssetRoute('vendor/chefs/chefs-theme.css', 'text/css', 'CHEFS theme CSS not found'));

// Form.io assets
routes.get('/formio.js', cors(), originAccess, createAssetRoute('vendor/formiojs/dist/formio.full.min.js', 'application/javascript', 'Form.io asset not found'));
routes.get('/formio.css', cors(), originAccess, createAssetRoute('vendor/formiojs/dist/formio.full.min.css', 'text/css', 'Form.io CSS not found'));

// Font Awesome 4.7 assets for Shadow DOM compatibility
routes.get(
  '/font-awesome/css/font-awesome.min.css',
  cors(),
  originAccess,
  createAssetRoute('vendor/font-awesome/css/font-awesome.min.css', 'text/css', 'Font Awesome CSS not found')
);

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
