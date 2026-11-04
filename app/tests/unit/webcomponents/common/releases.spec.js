const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { RELEASES_DIR, INTEGRITY_FILE, releaseDir, hashDir, hashRelease } = require('../../../../src/webcomponents/common/releases');

// sha384 of each release's integrity.json; a release cannot change without editing this list
const PINNED_INTEGRITY = {
  v1: 'sha384-Rr8+o3qvZIMeaEPizONUw7+/26/hw4LlBY6wNTJYSdDPZ/n7Hp6kp2yBJ5R0dZWa',
  '1.0.0': 'sha384-G8rgwb5MrQ0kMVCQUVg4zwCzTWFqltXA2ZLvBtF0gMzXPRWZgGFwlUrJhkg53E9h',
  '1.1.0': 'sha384-dVRmjPGLIdKWe0+PJsodtvNGXf4FyqR6XiK8w2Hy5hI8ZHf/ILUED2XJSjgfDPmm',
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

  // Pages pin a release by version, so removing or renaming one must fail here too
  it('has exactly the pinned releases', () => {
    expect([...releases].sort((a, b) => a.localeCompare(b))).toEqual(Object.keys(PINNED_INTEGRITY).sort((a, b) => a.localeCompare(b)));
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

  describe('hashDir', () => {
    let dir;

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chefs-release-links-'));
      fs.writeFileSync(path.join(dir, 'a.js'), 'a');
    });

    afterEach(() => {
      fs.rmSync(dir, { recursive: true, force: true });
    });

    it('hashes every file except dotfiles and integrity.json', () => {
      fs.writeFileSync(path.join(dir, '.hidden'), 'x');
      fs.writeFileSync(path.join(dir, INTEGRITY_FILE), '{}');
      expect(Object.keys(hashDir(dir))).toEqual(['a.js']);
    });

    it('refuses a link, which would be served as the file it points at', () => {
      fs.symlinkSync(path.join(dir, 'a.js'), path.join(dir, 'b.js'));
      expect(() => hashDir(dir)).toThrow('Release files must not be links: b.js');
    });
  });
});
