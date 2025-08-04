const express = require('express');
const router = express.Router();
const formViewerRoutes = require('./v1/form-viewer/routes');

// Mount web component routes
router.use('/v1/form-viewer', formViewerRoutes);

module.exports = router;
