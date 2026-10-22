const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// Committed, immutable web component releases: embed/releases/<version>
const RELEASES_DIR = path.join(__dirname, '../../../embed/releases');
const INTEGRITY_FILE = 'integrity.json';

function releaseDir(version) {
  if (!/^(v1|\d+\.\d+\.\d+)$/.test(version)) {
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
      return entry.isDirectory() ? listFiles(path.join(dir, entry.name), rel) : [rel];
    });
}

function hashFile(filePath) {
  return `sha384-${crypto.createHash('sha384').update(fs.readFileSync(filePath)).digest('base64')}`;
}

// SRI hash of every file in a release except integrity.json, keyed by release-relative path
function hashRelease(version) {
  const dir = releaseDir(version);
  return Object.fromEntries(
    listFiles(dir)
      .filter((file) => file !== INTEGRITY_FILE)
      .sort()
      .map((file) => [file, hashFile(path.join(dir, file))])
  );
}

module.exports = {
  RELEASES_DIR,
  INTEGRITY_FILE,
  releaseDir,
  hashRelease,
};
