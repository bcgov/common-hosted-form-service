const express = require('express');
const router = express.Router();
const cors = require('cors');
const bcgeoaddressRoutes = require('./v1/bcgeoaddress/routes');
const filesRoutes = require('./v1/files/routes');
const formViewerRoutes = require('./v1/form-viewer/routes');
const assetsRoutes = require('./v1/assets/routes');

router.use(cors());

// Mount web component routes
router.use('/v1/files', filesRoutes);
router.use('/v1/form-viewer', formViewerRoutes);
router.use('/v1/assets', assetsRoutes);
router.use('/v1/bcgeoaddress', bcgeoaddressRoutes);

module.exports = router;
