const express = require('express');
const router = express.Router();

const formViewerRoutes = require('./v1/form-viewer/routes');
const assetsRoutes = require('./v1/assets/routes');

// Mount web component routes
router.use('/v1/form-viewer', formViewerRoutes);
router.use('/v1/assets', assetsRoutes);

module.exports = router;
