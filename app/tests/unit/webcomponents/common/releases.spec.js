const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { RELEASES_DIR, INTEGRITY_FILE, releaseDir, hashRelease } = require('../../../../src/webcomponents/common/releases');

// sha384 of each release's integrity.json; a release cannot change without editing this list
const PINNED_INTEGRITY = {
  v1: 'sha384-Rr8+o3qvZIMeaEPizONUw7+/26/hw4LlBY6wNTJYSdDPZ/n7Hp6kp2yBJ5R0dZWa',
};

const folders = fs
  .readdirSync(RELEASES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const releases = folders.filter((name) => !name.startsWith('.'));

describe('webcomponents releases', () => {
  describe('releaseDir', () => {
    it.each(['v1', '2.0.0', '10.20.30'])('resolves %s inside the releases folder', (version) => {
      expect(releaseDir(version)).toBe(path.join(RELEASES_DIR, version));
    });

    it.each(['', 'v2', '2.0', '2.0.0-beta', 'latest', '../v1', '2.0.0/../../src'])('rejects %p', (version) => {
      expect(() => releaseDir(version)).toThrow('Invalid release version');
    });
  });

  it('includes the frozen v1 release', () => {
    expect(releases).toContain('v1');
  });

  it('has no staging folder left by an interrupted npm run embed:release', () => {
    expect(folders.filter((name) => name.startsWith('.'))).toEqual([]);
  });

  // Releases are immutable: any change to a released file must fail here
  it.each(releases)('release %s matches its integrity.json', (version) => {
    const integrity = JSON.parse(fs.readFileSync(path.join(releaseDir(version), INTEGRITY_FILE), 'utf8'));
    expect(hashRelease(version)).toEqual(integrity);
  });

  it.each(releases)('release %s integrity.json matches its pinned hash', (version) => {
    const bytes = fs.readFileSync(path.join(releaseDir(version), INTEGRITY_FILE));
    expect(`sha384-${crypto.createHash('sha384').update(bytes).digest('base64')}`).toBe(PINNED_INTEGRITY[version]);
  });
});
