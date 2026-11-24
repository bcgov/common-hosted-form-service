const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// Committed, immutable web component releases: embed/releases/<version>
const RELEASES_DIR = path.join(__dirname, '../../../embed/releases');
const INTEGRITY_FILE = 'integrity.json';
// Versioned releases are exact x.y.z; v1 is the frozen legacy release
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

function releaseDir(version) {
  if (version !== 'v1' && !VERSION_PATTERN.test(version)) {
    throw new Error(`Invalid release version "${version}"`);
  }
  return path.join(RELEASES_DIR, version);
}

// Release-relative file paths; dotfiles are skipped as express.static does not serve them
function listFiles(dir, prefix = '') {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'))
    .flatMap((entry) => {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      // A link would be hashed and served as whatever it points at, outside the release
      if (entry.isSymbolicLink()) throw new Error(`Release files must not be links: ${rel}`);
      return entry.isDirectory() ? listFiles(path.join(dir, entry.name), rel) : [rel];
    });
}

function hashFile(filePath) {
  return `sha384-${crypto.createHash('sha384').update(fs.readFileSync(filePath)).digest('base64')}`;
}

// SRI hash of every file under dir except integrity.json, keyed by dir-relative path
function hashDir(dir) {
  return Object.fromEntries(
    listFiles(dir)
      .filter((file) => file !== INTEGRITY_FILE)
      .sort()
      .map((file) => [file, hashFile(path.join(dir, file))])
  );
}

function hashRelease(version) {
  return hashDir(releaseDir(version));
}

module.exports = {
  RELEASES_DIR,
  INTEGRITY_FILE,
  VERSION_PATTERN,
  releaseDir,
  hashFile,
  hashDir,
  hashRelease,
};
