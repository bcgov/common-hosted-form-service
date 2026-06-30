const express = require('express');
const cors = require('cors');
const router = express.Router();

const authRoutes = require('./v1/auth/routes');

// Apply CORS to all gateway routes
router.use(cors());

// Mount web component routes
router.use('/v1/auth', authRoutes);

module.exports = router;
