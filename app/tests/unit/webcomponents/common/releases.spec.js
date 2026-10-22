const fs = require('node:fs');
const path = require('node:path');

const { RELEASES_DIR, INTEGRITY_FILE, releaseDir, hashRelease } = require('../../../../src/webcomponents/common/releases');

const releases = fs
  .readdirSync(RELEASES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

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

  // Releases are immutable: any change to a released file must fail here
  it.each(releases)('release %s matches its integrity.json', (version) => {
    const integrity = JSON.parse(fs.readFileSync(path.join(releaseDir(version), INTEGRITY_FILE), 'utf8'));
    expect(hashRelease(version)).toEqual(integrity);
  });
});
