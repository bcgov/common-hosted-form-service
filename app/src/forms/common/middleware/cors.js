const cors = require('cors');
const config = require('config');
const log = require('../../../components/log')(module.filename);

const corsOriginRequestService = require('../../cors/service');
const { ApprovalStatusCodes } = require('../constants');
const CorsError = require('../errors/CorsError');

/**
 * Get allowed origins for CORS
 * This can be extended to read from database, config file, or environment variables
 */
async function getAllowedOrigins(origin, formId) {
  console.log(origin);
  const allowedCorsOrigins = await corsOriginRequestService.listCorsOriginRequests({ statusCode: ApprovalStatusCodes.APPROVED, formId });
  return allowedCorsOrigins.map((corsOrigin) => corsOrigin.origin).concat(config.get('cors.allowedOrigins'));
}

function corsMiddleware(req, res, next) {
  const formId = req.query.formId || req.params.formId || req.body?.formId;

  cors({
    ...corsOptions,
    origin: async (origin, callback) => {
      const allowedOrigins = await getAllowedOrigins(origin, formId);
      console.log('Allowed origins:', allowedOrigins);

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        log.warn(`CORS blocked request from origin: ${origin}`);
        callback(new CorsError());
      }
    },
  })(req, res, next);
}

/**
 * CORS configuration for file uploads
 */
const corsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition'],
};

module.exports = {
  corsOptions,
  getAllowedOrigins,
  corsMiddleware,
};
