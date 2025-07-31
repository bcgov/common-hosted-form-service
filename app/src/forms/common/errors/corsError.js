class CorsError extends Error {
  constructor(message = 'Not allowed by CORS') {
    super(message);
    this.name = 'CorsError';
    this.status = 403; // Forbidden
  }
}

module.exports = CorsError;
