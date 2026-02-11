const express = require('express');
const router = express.Router();

// just reusing this for now...
const apiAccess = require('../../../forms/auth/middleware/apiAccess');

const controller = require('./controller');

// Issue a new token for a specific form
router.post('/token/forms/:formId', apiAccess, controller.issueFormToken);

// Refresh an existing token
router.post('/refresh', controller.refreshToken);

// Validate a token
router.post('/validate', controller.validateToken);

module.exports = router;
