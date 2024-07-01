class ProxyServiceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProxyServiceError';
  }
}

module.exports = ProxyServiceError;
