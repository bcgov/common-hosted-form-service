const cors = require('cors');
const config = require('config');
const log = require('../../../components/log')(module.filename);

const corsDomainRequestService = require('../../cors/service');
const { ApprovalStatusCodes } = require('../constants');

/**
 * Get allowed origins for CORS
 * This can be extended to read from database, config file, or environment variables
 */
async function getAllowedOrigins() {
  return (await corsDomainRequestService.listCorsDomainRequests({ statusCode: ApprovalStatusCodes.APPROVED })).concat(config.get('cors.allowedOrigins'));
}

/**
 * CORS configuration for file uploads
 */
const corsOptions = {
  origin: async function (origin, callback) {
    const allowedOrigins = await getAllowedOrigins();

    console.log(allowedOrigins);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      log.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition'],
};

module.exports = {
  corsOptions,
  getAllowedOrigins,
  corsMiddleware: cors(corsOptions),
};
