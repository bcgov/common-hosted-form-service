const config = require('config');
const log = require('./log')(module.filename);
const Problem = require('api-problem');

const FEATURES = {
  EVENT_STREAM_SERVICE: 'eventStreamService',
};

class FeatureFlags {
  constructor() {}

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
    return this.enabled(FEATURES.EVENT_STREAM_SERVICE);
  }

  featureEnabled(feature) {
    // actual middleware
    return async (req, res, next) => {
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
    };
  }

  eventStreamServiceEnabled() {
    // actual middleware
    return async (req, res, next) => {
      try {
        const flag = this.enabled(FEATURES.EVENT_STREAM_SERVICE);
        if (flag) {
          next(); // all good, feature enabled...
        } else {
          throw new Problem(400, {
            detail: `Feature '${FEATURES.EVENT_STREAM_SERVICE}' is not enabled.`,
          });
        }
      } catch (error) {
        next(error);
      }
    };
  }
}

let featureFlags = new FeatureFlags();

module.exports = {
  featureFlags: featureFlags,
  FEATURES: Object.freeze(FEATURES),
};
