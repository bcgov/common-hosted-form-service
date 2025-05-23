const log = require('./log')(module.filename);

class StatusService {
  constructor() {
    if (StatusService.instance) return StatusService.instance;
    this.connections = {};
    this.checkIntervals = {};
    this.ready = false;
    this.stopped = false;
    StatusService.instance = this;
  }

  /**
   * Register a new connection type.
   * @param {string} name - Unique name for the connection.
   * @param {object} instance - The instance of the connection.
   * @param {string} startupFnName - Name of the async function to initialize the connection.
   * @param {string} checkFnName - Name of the async function that returns true if connected, false otherwise.
   * @param {number} intervalMs - How often to check (ms).
   */
  registerConnection(name, instance, startupFnName, checkFnName, intervalMs = 10000) {
    log.info(`Registering connection: ${name}`);
    if (this.connections[name]) return;
    if (!instance || !instance[startupFnName] || !instance[checkFnName]) {
      throw new Error(`Invalid instance or function names for connection: ${name}`);
    }
    if (typeof instance[startupFnName] !== 'function' || typeof instance[checkFnName] !== 'function') {
      throw new Error(`Invalid function types for connection: ${name}`);
    }
    if (typeof intervalMs !== 'number' || intervalMs <= 0) {
      throw new Error(`Invalid interval for connection: ${name}`);
    }
    if (this.stopped) {
      throw new Error(`Cannot register connection ${name} after shutdown.`);
    }
    if (this.ready) {
      throw new Error(`Cannot register connection ${name} after server is ready.`);
    }
    this.connections[name] = {
      connected: false,
      instance,
      startupFnName,
      checkFnName,
      started: false,
      intervalMs,
    };
  }

  /**
   * Process all connection startup functions.
   * Calls each startupFn, and if successful, starts periodic checking.
   * @returns {Promise<void>}
   */
  async initializeAllConnections() {
    log.info('Initializing all connections');
    for (const [name, conn] of Object.entries(this.connections)) {
      try {
        await conn.instance[conn.startupFnName]();
        conn.started = true;
        this._startChecking(name, conn.intervalMs);
      } catch (err) {
        conn.connected = false;
        conn.started = false;
      }
    }
    log.info('All connections initialized');
  }

  /**
   * Start periodic checking for a connection.
   * @private
   */
  _startChecking(name, intervalMs) {
    if (this.checkIntervals[name]) clearInterval(this.checkIntervals[name]);
    const checkAndUpdate = async () => {
      log.debug(`Checking connection: ${name}`);
      try {
        const ok = await this.connections[name].instance[this.connections[name].checkFnName]();
        this.connections[name].connected = !!ok;
      } catch {
        this.connections[name].connected = false;
      }
      log.debug(`Connection ${name} connected: ${this.connections[name].connected}`);
    };
    checkAndUpdate(); // Initial check
    this.checkIntervals[name] = setInterval(checkAndUpdate, intervalMs);
  }

  /**
   * Get current status of all connections and overall status.
   * @returns {object}
   */
  getStatus() {
    log.debug('Getting status of all connections');
    const status = {};
    this.ready = true;
    for (const [name, conn] of Object.entries(this.connections)) {
      status[name] = {
        connected: conn.connected,
        started: conn.started,
      };
      if (!conn.connected) this.ready = false;
    }
    const result = {
      ready: this.ready,
      stopped: this.stopped,
      connections: status,
    };
    log.debug('Status of all connections:', result);
    return result;
  }

  /**
   * Stop all interval checks (for shutdown/cleanup) and set stopped status.
   */
  stopAll() {
    log.info('Stopping all connections');
    Object.values(this.checkIntervals).forEach(clearInterval);
    this.checkIntervals = {};
    this.stopped = true;
    this.ready = false;
    log.info('All connections stopped');
  }
}

module.exports = new StatusService();
