const routes = require('express').Router();

const originAccess = require('../../common/middleware/originAccess');
const { createAssetRoute, createFileRoute } = require('./assetRouteUtils');

// CHEFS CSS assets for embed components
routes.get('/chefs-index.css', originAccess, createAssetRoute('chefs-index.css', 'text/css', 'CHEFS index CSS not found'));
routes.get('/chefs-theme.css', originAccess, createAssetRoute('chefs-theme.css', 'text/css', 'CHEFS theme CSS not found'));

// GET /webcomponents/v1/assets/chefs-assets/:file
// Fonts and images referenced by chefs-index.css
routes.get('/chefs-assets/:file', originAccess, createFileRoute('chefs-assets', 'Invalid asset path', 'Asset file not found'));

// Form.io assets
routes.get('/formio.js', originAccess, createAssetRoute('formio.full.min.js', 'application/javascript', 'Form.io asset not found'));
routes.get('/formio.css', originAccess, createAssetRoute('formio.full.min.css', 'text/css', 'Form.io CSS not found'));

// Font Awesome 4.7 assets for Shadow DOM compatibility
routes.get('/font-awesome/css/font-awesome.min.css', originAccess, createAssetRoute('font-awesome/css/font-awesome.min.css', 'text/css', 'Font Awesome CSS not found'));

// GET /webcomponents/v1/assets/font-awesome/fonts/:file
routes.get('/font-awesome/fonts/:file', originAccess, createFileRoute('font-awesome/fonts', 'Invalid font path', 'Font file not found'));

module.exports = routes;
