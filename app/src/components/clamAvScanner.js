const config = require('config');
const errorToProblem = require('./errorToProblem');
const log = require('./log')(module.filename);

const host = config.get('files.clamav.host');
const port = config.get('files.clamav.port');

const NodeClam = require('clamscan');

class ClamAVScanner {
  constructor() {
    this.clamscan = null;
    this.isInitialized = false;
  }

  async _initialize() {
    try {
      this.clamscan = await new NodeClam().init({
        removeInfected: true, // If true, removes infected files
        quarantineInfected: false,
        debugMode: false, // Whether or not to log info/debug/error msgs to the console
        scanRecursively: true, // If true, deep scan folders recursively
        clamdscan: {
          host: host, // IP of host to connect to TCP interface
          port: port, // Port of host to use when connecting via TCP interface
          timeout: 60000, // Timeout for scanning files
          localFallback: false, // Use local preferred binary to scan if socket/tcp fails
          multiscan: true, // Scan using all available cores! Yay!
          active: true, // If true, this module will consider using the clamdscan binary
          bypassTest: false, // Check to see if socket is available when applicable
        },
        preference: 'clamdscan', // If clamdscan is found and active, it will be used by default
      });
      this.isInitialized = true;
    } catch (err) {
      if (err.message && err.message.includes('virus database is empty')) {
        log.error('ClamAV database is not initialized. Please run freshclam');
      } else if (err.code === 'ENOENT') {
        log.error('ClamAV socket not found. Check if clamd is running');
      } else {
        log.error('ClamAV initialization error:', err);
      }
      errorToProblem('clamscan', err);
    }
  }

  async checkConnection(retries = 3, delay = 5000) {
    for (let i = 0; i < retries; i++) {
      try {
        await this._initialize();
        return this.isInitialized;
      } catch (err) {
        log.error(`Failed to initialize ClamAV (attempt ${i + 1}/${retries}):`, err);
        if (i < retries - 1) await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async scanFile(filePath) {
    if (!this.isInitialized) {
      throw new Error('ClamAV scanner not initialized');
    }

    try {
      const { isInfected, viruses } = await this.clamscan.scanFile(filePath);
      return { isInfected, viruses };
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('File not found or ClamAV socket connection failed');
      }
      log.error('Error scanning file:', error);
      throw error;
    }
  }
}

let clamavScanner = new ClamAVScanner();

module.exports = clamavScanner;
