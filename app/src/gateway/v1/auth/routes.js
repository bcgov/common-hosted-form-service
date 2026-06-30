const express = require('express');
const router = express.Router();

const requireApiKeyBasic = require('./middleware/requireApiKeyBasic');

const controller = require('./controller');

// Issue a new token for a specific form
router.post('/token/forms/:formId', requireApiKeyBasic, controller.issueFormToken);

// Refresh an existing token
router.post('/refresh', controller.refreshToken);

// Validate a token
router.post('/validate', controller.validateToken);

module.exports = router;
