const config = require('config');
const log = require('./log')(module.filename);
const Problem = require('api-problem');

const FEATURES = {
  EVENT_STREAM_SERVICE: 'eventStreamService',
};

class FeatureFlags {
  constructor() {
    this._eventStreamService = this.enabled(FEATURES.EVENT_STREAM_SERVICE);
  }

  // generic flag check
  enabled(feature) {
    try {
      const flag = config.get(`features.${feature}`);
      return flag;
    } catch (e) {
      log.warn(`feature flag '${feature}' not found.`);
    }
    return false;
  }

  // just add direct access helper functions
  get eventStreamService() {
    return this._eventStreamService;
  }

  // middleware, so we can short-circuit any api calls
  async featureEnabled(_req, _res, next, feature) {
    try {
      const flag = this.enabled(feature);
      if (flag) {
        next(); // all good, feature enabled...
      } else {
        throw new Problem(400, {
          detail: `Feature '${feature}' is not enabled.`,
        });
      }
    } catch (error) {
      next(error);
    }
  }
  async eventStreamServiceEnabled(_req, _res, next) {
    try {
      if (this._eventStreamService) {
        next(); // all good, feature enabled...
      } else {
        throw new Problem(400, {
          detail: `Feature '${FEATURES.EVENT_STREAM_SERVICE}' is not enabled.`,
        });
      }
    } catch (error) {
      next(error);
    }
  }
}

let featureFlags = new FeatureFlags();

module.exports = {
  featureFlags: featureFlags,
  FEATURES: Object.freeze(FEATURES),
};
