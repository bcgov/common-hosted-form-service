const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { RELEASES_DIR, INTEGRITY_FILE, VERSION_PATTERN, hashDir, hashFile } = require('./releases');

const APP_DIR = path.join(__dirname, '../../..');
const FRONTEND_DIR = path.join(APP_DIR, 'frontend');
const COMPONENTS_DIR = path.join(APP_DIR, '../components');

// The component source carries these defaults; a release replaces them with real values
const INTEGRITY_PLACEHOLDER = '/*__CHEFS_RELEASE_INTEGRITY__*/ {}';
const VERSION_PLACEHOLDER = '/*__CHEFS_RELEASE_VERSION__*/ null';

// Built in order: each script's integrity placeholder covers every file written before it
const EMBED_SCRIPTS = ['chefs-form-viewer', 'chefs-form-viewer-embed'];
const EMBED_STYLES = ['chefs-form-viewer-override-template.css', 'chefs-form-viewer-theme-dark.css', 'chefs-form-viewer-theme-material.css'];
const FRONTEND_BUILD = ['build:formio', 'deploy:formio', 'build'];

function assertVersion(version) {
  if (!VERSION_PATTERN.test(version || '')) {
    throw new Error(`Release version must be x.y.z, got "${version}"`);
  }
}

function parseReleaseArgs(argv) {
  const args = { build: true };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--skip-build') args.build = false;
    else if (argv[i] === '--out') args.outDir = argv[++i];
    else if (!args.version) args.version = argv[i];
    else throw new Error(`Unexpected argument "${argv[i]}"`);
  }
  assertVersion(args.version);
  if (args.outDir === undefined && argv.includes('--out')) throw new Error('--out needs a folder');
  return args;
}

const countOf = (text, part) => text.split(part).length - 1;

// Point the frontend build's asset URLs at the release's chefs-assets folder
function rewriteCssUrls(css, assetNames) {
  const assets = new Set();
  const rewritten = css.replace(/url\(\s*(['"]?)([^'"()\s]+)\1\s*\)/gi, (match, quote, url) => {
    if (url.startsWith('data:') || url.startsWith('#')) return match;
    const found = /^(?:.*\/)?assets\/([^/?#]+)([?#].*)?$/.exec(url);
    if (!found || !assetNames.has(found[1])) {
      throw new Error(`Unexpected url(${url}) in frontend CSS`);
    }
    assets.add(found[1]);
    return `url(${quote}chefs-assets/${found[1]}${found[2] || ''}${quote})`;
  });
  // A reference in a form the url() pattern skipped would still point at the frontend build
  for (const name of assetNames) {
    if (countOf(rewritten, name) > countOf(rewritten, `chefs-assets/${name}`)) {
      throw new Error(`Unrewritten reference to ${name} in frontend CSS`);
    }
  }
  return { css: rewritten, assets: [...assets].sort((a, b) => a.localeCompare(b)) };
}

function injectPlaceholders(code, { version, integrity }) {
  const counts = {
    integrity: countOf(code, INTEGRITY_PLACEHOLDER),
    version: countOf(code, VERSION_PLACEHOLDER),
  };
  const injected = code.replaceAll(INTEGRITY_PLACEHOLDER, () => JSON.stringify(integrity)).replaceAll(VERSION_PLACEHOLDER, () => JSON.stringify(version));
  if (/__CHEFS_RELEASE_(INTEGRITY|VERSION)__/.test(injected)) {
    throw new Error(`Release placeholder must be exactly "${INTEGRITY_PLACEHOLDER}" or "${VERSION_PLACEHOLDER}"`);
  }
  return { code: injected, counts };
}

// Use the node and npm that started this tool rather than whatever PATH finds
function runNpm(cwd, script) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error('Run the release tool with npm run embed:release');
  const result = spawnSync(process.execPath, [npmCli, 'run', script], { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`npm run ${script} failed in ${cwd}`);
}

// Same output as the v1 build: terser CLI defaults (no compress, no mangle) with an external map
function terserMinifier(frontendDir) {
  return async (sourceName, code) => {
    const { minify } = require(require.resolve('terser', { paths: [frontendDir] }));
    const result = await minify({ [sourceName]: code }, { compress: false, mangle: false, sourceMap: { includeSources: true } });
    return { code: result.code, map: result.map };
  };
}

function themeBuilder(frontendDir) {
  return (css) => {
    const { extractThemeVariables, buildHostThemeCss } = require(path.join(frontendDir, 'src/embed/themeExtractor'));
    return buildHostThemeCss(extractThemeVariables(css).variables);
  };
}

function readIndexCss(distAssetsDir) {
  const names = fs.readdirSync(distAssetsDir);
  const candidates = names.filter((name) => /^index-.*\.css$/.test(name));
  if (candidates.length !== 1) {
    throw new Error(`Expected one index-*.css in ${distAssetsDir}, found ${candidates.length}`);
  }
  return { css: fs.readFileSync(path.join(distAssetsDir, candidates[0]), 'utf8'), names: new Set(names) };
}

// Release-relative path -> source file, copied as-is
function copiedFiles(frontendDir, componentsDir) {
  const formio = path.join(frontendDir, 'node_modules/formiojs/dist');
  const fontAwesome = path.join(frontendDir, 'node_modules/font-awesome');
  const components = path.join(componentsDir, 'dist');
  return [
    ['assets/formio.full.min.js', path.join(formio, 'formio.full.min.js')],
    ['assets/formio.full.min.js.LICENSE.txt', path.join(formio, 'formio.full.min.js.LICENSE.txt')],
    ['assets/formio.full.min.css', path.join(formio, 'formio.full.min.css')],
    ['assets/font-awesome/css/font-awesome.min.css', path.join(fontAwesome, 'css/font-awesome.min.css')],
    ...fs.readdirSync(path.join(fontAwesome, 'fonts')).map((name) => [`assets/font-awesome/fonts/${name}`, path.join(fontAwesome, 'fonts', name)]),
    ['form-viewer/bcgov-formio-components.use.min.js', path.join(components, 'bcgov-formio-components.use.min.js')],
    ['form-viewer/bcgov-formio-components.use.min.js.LICENSE.txt', path.join(components, 'bcgov-formio-components.use.min.js.LICENSE.txt')],
    ['form-viewer/chefs-form-viewer.css', path.join(components, 'chefs-form-viewer.css')],
    ['form-viewer/bcgov-theme.css', path.join(components, 'bcgov-theme.css')],
    ...EMBED_STYLES.map((name) => [`embed/${name}`, path.join(frontendDir, 'public/embed', name)]),
  ];
}

/**
 * Cut an immutable release folder from the current frontend and components sources.
 * The folder is assembled next to the target and renamed into place only when complete.
 */
async function buildRelease({ version, outDir, build = true, frontendDir = FRONTEND_DIR, componentsDir = COMPONENTS_DIR, releasesDir = RELEASES_DIR, deps = {} }) {
  assertVersion(version);
  const target = path.resolve(outDir || path.join(releasesDir, version));
  if (fs.existsSync(target)) throw new Error(`Release folder already exists: ${target}`);
  const { npm = runNpm, minify = terserMinifier(frontendDir), theme = themeBuilder(frontendDir) } = deps;

  if (build) FRONTEND_BUILD.forEach((script) => npm(frontendDir, script));

  const staging = path.join(path.dirname(target), `.${path.basename(target)}.partial`);
  fs.rmSync(staging, { recursive: true, force: true });
  const write = (rel, content) => {
    fs.mkdirSync(path.dirname(path.join(staging, rel)), { recursive: true });
    fs.writeFileSync(path.join(staging, rel), content);
  };

  try {
    for (const [rel, source] of copiedFiles(frontendDir, componentsDir)) write(rel, fs.readFileSync(source));

    const distAssetsDir = path.join(frontendDir, 'dist/assets');
    const index = readIndexCss(distAssetsDir);
    const { css, assets } = rewriteCssUrls(index.css, index.names);
    write('assets/chefs-index.css', css);
    write('assets/chefs-theme.css', theme(index.css));
    for (const name of assets) write(`assets/chefs-assets/${name}`, fs.readFileSync(path.join(distAssetsDir, name)));

    const placeholders = {};
    const buildScript = async (name) => {
      const source = fs.readFileSync(path.join(frontendDir, 'public/embed', `${name}.js`), 'utf8');
      const { code, counts } = injectPlaceholders(source, { version, integrity: hashDir(staging) });
      // A missing placeholder would ship a release that loads its files without SRI
      if (counts.integrity !== 1 || counts.version !== 1) {
        throw new Error(`${name}.js must contain each release placeholder exactly once (integrity x${counts.integrity}, version x${counts.version})`);
      }
      placeholders[`embed/${name}.js`] = counts;
      write(`embed/${name}.js`, code);
      const min = await minify(`public/embed/${name}.js`, code);
      write(`embed/${name}.min.js`, min.code);
      write(`embed/${name}.min.js.map`, min.map);
    };
    // One at a time, so each script's integrity map includes the scripts built before it
    await EMBED_SCRIPTS.reduce((previous, name) => previous.then(() => buildScript(name)), Promise.resolve());

    const integrity = hashDir(staging);
    write(INTEGRITY_FILE, `${JSON.stringify(integrity, null, 2)}\n`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.renameSync(staging, target);

    return { dir: target, files: Object.keys(integrity).length, placeholders, pinned: hashFile(path.join(target, INTEGRITY_FILE)) };
  } catch (err) {
    fs.rmSync(staging, { recursive: true, force: true });
    throw err;
  }
}

module.exports = {
  INTEGRITY_PLACEHOLDER,
  VERSION_PLACEHOLDER,
  assertVersion,
  parseReleaseArgs,
  rewriteCssUrls,
  injectPlaceholders,
  buildRelease,
};
