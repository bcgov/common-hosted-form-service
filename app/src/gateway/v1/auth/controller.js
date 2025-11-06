const tokenService = require('./service');

module.exports = {
  /**
   * Issue a new JWT token for a form
   */
  issueFormToken: async (req, res, next) => {
    try {
      // You may want to validate input here
      const payload = { ...req.body, formId: req.params.formId };
      const token = await tokenService.createToken(payload);
      res.status(201).json({ token });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Refresh an existing JWT token
   */
  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ detail: 'Missing refreshToken' });
        return;
      }
      const token = await tokenService.refreshToken(refreshToken);
      res.status(200).json({ token });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Validate a JWT token
   */
  validateToken: async (req, res, next) => {
    try {
      const { token } = req.body;
      if (!token) {
        res.status(400).json({ detail: 'Missing token' });
        return;
      }
      const valid = await tokenService.validateToken(token);
      if (valid) {
        res.sendStatus(204); // No Content (valid)
      } else {
        res.status(401).json({ detail: 'Invalid token' });
      }
    } catch (error) {
      next(error);
    }
  },
};
