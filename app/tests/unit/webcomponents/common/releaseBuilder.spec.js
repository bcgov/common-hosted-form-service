const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { hashDir, hashFile } = require('../../../../src/webcomponents/common/releases');
const {
  INTEGRITY_PLACEHOLDER,
  VERSION_PLACEHOLDER,
  assertVersion,
  parseReleaseArgs,
  rewriteCssUrls,
  injectPlaceholders,
  buildRelease,
} = require('../../../../src/webcomponents/common/releaseBuilder');

describe('webcomponents releaseBuilder', () => {
  describe('assertVersion', () => {
    it('accepts x.y.z', () => {
      expect(() => assertVersion('1.1.0')).not.toThrow();
    });

    it.each([undefined, '', 'v1', '1.1', '1.1.0-beta', '../1.1.0'])('rejects %p', (version) => {
      expect(() => assertVersion(version)).toThrow('Release version must be x.y.z');
    });
  });

  describe('parseReleaseArgs', () => {
    it('reads the version and defaults to building', () => {
      expect(parseReleaseArgs(['1.1.0'])).toEqual({ version: '1.1.0', build: true });
    });

    it('reads --out and --skip-build in any order', () => {
      expect(parseReleaseArgs(['--skip-build', '--out', 'dry-run/1.1.0', '1.1.0'])).toEqual({ version: '1.1.0', outDir: 'dry-run/1.1.0', build: false });
    });

    it.each([[[]], [['1.1.0', '1.2.0']], [['1.1.0', '--out']]])('rejects %p', (argv) => {
      expect(() => parseReleaseArgs(argv)).toThrow();
    });
  });

  describe('rewriteCssUrls', () => {
    const names = new Set(['font-abc.woff2', 'icons-def.eot', 'sprite.svg']);

    it('points frontend asset URLs at chefs-assets and keeps quotes and suffixes', () => {
      const css = 'a{src:url(/app/assets/font-abc.woff2)}b{src:url("/pr-1/assets/icons-def.eot?#iefix&v=1")}c{src:url(\'assets/sprite.svg#x\')}';
      const result = rewriteCssUrls(css, names);
      expect(result.css).toBe('a{src:url(chefs-assets/font-abc.woff2)}b{src:url("chefs-assets/icons-def.eot?#iefix&v=1")}c{src:url(\'chefs-assets/sprite.svg#x\')}');
      expect(result.assets).toEqual(['font-abc.woff2', 'icons-def.eot', 'sprite.svg']);
    });

    it('rewrites uppercase url() with spaces', () => {
      expect(rewriteCssUrls('a{src:URL( /app/assets/font-abc.woff2 )}', names).css).toBe('a{src:url(chefs-assets/font-abc.woff2)}');
    });

    it('leaves empty url() alone', () => {
      const css = 'a{background:url()}b{background:url( )}c{background:url("")}';
      expect(rewriteCssUrls(css, names)).toEqual({ css, assets: [] });
    });

    it('keeps data and fragment URLs', () => {
      const css = 'a{background:url("data:image/svg+xml,%3csvg%3e")}b{behavior:url(#default#VML)}';
      expect(rewriteCssUrls(css, names)).toEqual({ css, assets: [] });
    });

    it('keeps quoted data URIs that contain quotes and parentheses', () => {
      const css = `a{background:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg'%3e%3ccircle fill='rgba(0, 0, 0, 0.25)'/%3e%3c/svg%3e")}`;
      expect(rewriteCssUrls(css, names)).toEqual({ css, assets: [] });
    });

    it.each(['url(/app/assets/unknown.woff)', 'url(https://example.com/font.woff)', 'url(../fonts/font.woff)'])('rejects %s', (url) => {
      expect(() => rewriteCssUrls(`a{src:${url}}`, names)).toThrow('Unexpected url(');
    });

    it('rejects an asset reference outside url()', () => {
      expect(() => rewriteCssUrls('a{background:image-set("/app/assets/sprite.svg" 1x)}', names)).toThrow('Unrewritten reference to sprite.svg');
    });
  });

  describe('injectPlaceholders', () => {
    it('replaces every placeholder and counts them', () => {
      const code = `const a = ${INTEGRITY_PLACEHOLDER};\nconst b = ${INTEGRITY_PLACEHOLDER};\nconst v = ${VERSION_PLACEHOLDER};`;
      const result = injectPlaceholders(code, { version: '1.1.0', integrity: { 'assets/a$&.css': 'sha384-x' } });
      expect(result.code).toBe('const a = {"assets/a$&.css":"sha384-x"};\nconst b = {"assets/a$&.css":"sha384-x"};\nconst v = "1.1.0";');
      expect(result.counts).toEqual({ integrity: 2, version: 1 });
    });

    it('leaves code without placeholders unchanged', () => {
      expect(injectPlaceholders('const a = {};', { version: '1.1.0', integrity: {} })).toEqual({ code: 'const a = {};', counts: { integrity: 0, version: 0 } });
    });

    it.each(['/*__CHEFS_RELEASE_INTEGRITY__*/ { }', '/*__CHEFS_RELEASE_VERSION__*/\nnull'])('rejects a reformatted placeholder %p', (placeholder) => {
      expect(() => injectPlaceholders(`const a = ${placeholder};`, { version: '1.1.0', integrity: {} })).toThrow('Release placeholder must be exactly');
    });
  });

  describe('buildRelease', () => {
    let root;
    let frontendDir;
    let componentsDir;
    let releasesDir;
    let deps;

    const write = (file, content) => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    };

    beforeEach(() => {
      root = fs.mkdtempSync(path.join(os.tmpdir(), 'chefs-release-'));
      frontendDir = path.join(root, 'frontend');
      componentsDir = path.join(root, 'components');
      releasesDir = path.join(root, 'releases');
      write(path.join(frontendDir, 'public/embed/chefs-form-viewer.js'), `const INTEGRITY = ${INTEGRITY_PLACEHOLDER};\nconst VERSION = ${VERSION_PLACEHOLDER};\n`);
      write(path.join(frontendDir, 'public/embed/chefs-form-viewer-embed.js'), `const INTEGRITY = ${INTEGRITY_PLACEHOLDER};\nconst VERSION = ${VERSION_PLACEHOLDER};\n`);
      for (const name of ['chefs-form-viewer-override-template.css', 'chefs-form-viewer-theme-dark.css', 'chefs-form-viewer-theme-material.css']) {
        write(path.join(frontendDir, 'public/embed', name), `/* ${name} */\n`);
      }
      write(path.join(frontendDir, 'dist/assets/index-abc123.css'), 'body{font:url(/app/assets/font-abc.woff2)}\n');
      write(path.join(frontendDir, 'dist/assets/font-abc.woff2'), 'font');
      write(path.join(frontendDir, 'dist/assets/unused-xyz.png'), 'png');
      for (const name of ['formio.full.min.js', 'formio.full.min.js.LICENSE.txt', 'formio.full.min.css']) {
        write(path.join(frontendDir, 'node_modules/formiojs/dist', name), name);
      }
      write(path.join(frontendDir, 'node_modules/font-awesome/css/font-awesome.min.css'), 'fa');
      write(path.join(frontendDir, 'node_modules/font-awesome/fonts/fontawesome-webfont.woff2'), 'fa-font');
      for (const name of ['bcgov-formio-components.use.min.js', 'bcgov-formio-components.use.min.js.LICENSE.txt', 'chefs-form-viewer.css', 'bcgov-theme.css']) {
        write(path.join(componentsDir, 'dist', name), name);
      }
      deps = {
        npm: jest.fn(),
        minify: jest.fn(async (sourceName, code) => ({ code: `/*min*/${code}`, map: `{"sources":["${sourceName}"]}` })),
        theme: jest.fn(() => ':root{}\n'),
      };
    });

    afterEach(() => {
      fs.rmSync(root, { recursive: true, force: true });
    });

    const build = (opts = {}) => buildRelease({ version: '1.1.0', build: false, frontendDir, componentsDir, releasesDir, deps, ...opts });

    it('writes the release layout and its integrity.json', async () => {
      const result = await build();
      const dir = path.join(releasesDir, '1.1.0');
      const integrity = JSON.parse(fs.readFileSync(path.join(dir, 'integrity.json'), 'utf8'));

      expect(result.dir).toBe(dir);
      expect(Object.keys(integrity)).toEqual([
        'assets/chefs-assets/font-abc.woff2',
        'assets/chefs-index.css',
        'assets/chefs-theme.css',
        'assets/font-awesome/css/font-awesome.min.css',
        'assets/font-awesome/fonts/fontawesome-webfont.woff2',
        'assets/formio.full.min.css',
        'assets/formio.full.min.js',
        'assets/formio.full.min.js.LICENSE.txt',
        'embed/chefs-form-viewer-embed.js',
        'embed/chefs-form-viewer-embed.min.js',
        'embed/chefs-form-viewer-embed.min.js.map',
        'embed/chefs-form-viewer-override-template.css',
        'embed/chefs-form-viewer-theme-dark.css',
        'embed/chefs-form-viewer-theme-material.css',
        'embed/chefs-form-viewer.js',
        'embed/chefs-form-viewer.min.js',
        'embed/chefs-form-viewer.min.js.map',
        'form-viewer/bcgov-formio-components.use.min.js',
        'form-viewer/bcgov-formio-components.use.min.js.LICENSE.txt',
        'form-viewer/bcgov-theme.css',
        'form-viewer/chefs-form-viewer.css',
      ]);
      expect(integrity).toEqual(hashDir(dir));
      expect(result.files).toBe(21);
      expect(result.pinned).toBe(hashFile(path.join(dir, 'integrity.json')));
      expect(fs.readFileSync(path.join(dir, 'assets/chefs-index.css'), 'utf8')).toBe('body{font:url(chefs-assets/font-abc.woff2)}\n');
      expect(deps.theme).toHaveBeenCalledWith('body{font:url(/app/assets/font-abc.woff2)}\n');
      expect(fs.readdirSync(releasesDir)).toEqual(['1.1.0']);
      expect(deps.npm).not.toHaveBeenCalled();
    });

    it('injects the integrity of every file written before each script', async () => {
      const result = await build();
      const dir = path.join(releasesDir, '1.1.0');
      const integrity = JSON.parse(fs.readFileSync(path.join(dir, 'integrity.json'), 'utf8'));
      const injected = (file) => JSON.parse(/const INTEGRITY = (\{.*\});/.exec(fs.readFileSync(path.join(dir, file), 'utf8'))[1]);

      const viewer = injected('embed/chefs-form-viewer.js');
      expect(Object.keys(viewer).filter((file) => file.startsWith('embed/chefs-form-viewer'))).toEqual([
        'embed/chefs-form-viewer-override-template.css',
        'embed/chefs-form-viewer-theme-dark.css',
        'embed/chefs-form-viewer-theme-material.css',
      ]);
      expect(viewer['assets/formio.full.min.js']).toBe(integrity['assets/formio.full.min.js']);
      expect(fs.readFileSync(path.join(dir, 'embed/chefs-form-viewer.js'), 'utf8')).toContain('const VERSION = "1.1.0";');

      const loader = injected('embed/chefs-form-viewer-embed.js');
      expect(loader['embed/chefs-form-viewer.min.js']).toBe(integrity['embed/chefs-form-viewer.min.js']);
      expect(loader['embed/chefs-form-viewer-embed.js']).toBeUndefined();

      expect(result.placeholders).toEqual({
        'embed/chefs-form-viewer.js': { integrity: 1, version: 1 },
        'embed/chefs-form-viewer-embed.js': { integrity: 1, version: 1 },
      });
      expect(deps.minify).toHaveBeenCalledWith('public/embed/chefs-form-viewer.js', expect.any(String));
      expect(fs.readFileSync(path.join(dir, 'embed/chefs-form-viewer.min.js.map'), 'utf8')).toBe('{"sources":["public/embed/chefs-form-viewer.js"]}');
    });

    it.each([
      ['a missing integrity placeholder', `const INTEGRITY = {};\nconst VERSION = ${VERSION_PLACEHOLDER};\n`],
      ['a missing version placeholder', `const INTEGRITY = ${INTEGRITY_PLACEHOLDER};\n`],
      ['a repeated placeholder', `const A = ${INTEGRITY_PLACEHOLDER};\nconst B = ${INTEGRITY_PLACEHOLDER};\nconst VERSION = ${VERSION_PLACEHOLDER};\n`],
    ])('refuses a script with %s and leaves nothing behind', async (_name, source) => {
      write(path.join(frontendDir, 'public/embed/chefs-form-viewer-embed.js'), source);
      await expect(build()).rejects.toThrow('chefs-form-viewer-embed.js must contain each release placeholder exactly once');
      expect(fs.readdirSync(releasesDir)).toEqual([]);
    });

    it('runs the frontend build unless skipped', async () => {
      await build({ build: true });
      expect(deps.npm.mock.calls).toEqual([
        [frontendDir, 'build:formio'],
        [frontendDir, 'deploy:formio'],
        [frontendDir, 'build'],
      ]);
    });

    it('writes to --out instead of the releases folder', async () => {
      const outDir = path.join(root, 'dry-run');
      const result = await build({ outDir });
      expect(result.dir).toBe(outDir);
      expect(fs.existsSync(path.join(outDir, 'integrity.json'))).toBe(true);
      expect(fs.existsSync(releasesDir)).toBe(false);
    });

    it('refuses an existing release folder', async () => {
      fs.mkdirSync(path.join(releasesDir, '1.1.0'), { recursive: true });
      await expect(build({ build: true })).rejects.toThrow('Release folder already exists');
      expect(deps.npm).not.toHaveBeenCalled();
    });

    it('refuses a frontend build without exactly one index CSS bundle', async () => {
      write(path.join(frontendDir, 'dist/assets/index-def456.css'), 'body{}');
      await expect(build()).rejects.toThrow('Expected one index-*.css');
      expect(fs.readdirSync(releasesDir)).toEqual([]);
    });

    it('leaves nothing behind when a step fails', async () => {
      deps.minify.mockRejectedValueOnce(new Error('terser failed'));
      await expect(build()).rejects.toThrow('terser failed');
      expect(fs.readdirSync(releasesDir)).toEqual([]);
    });
  });
});
