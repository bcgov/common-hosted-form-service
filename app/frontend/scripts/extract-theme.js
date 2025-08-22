/* eslint-disable no-console */
// Post-build helper: copy dist/assets/index-*.css to public/embed/chefs-index.css
// and generate public/embed/chefs-theme.css by extracting CSS variables.

const fs = require('fs');
const path = require('path');
const {
  extractThemeVariables,
  buildHostThemeCss,
} = require('../src/embed/themeExtractor');

function getAbsolutePath(relativePath) {
  return path.resolve(process.cwd(), relativePath);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function listIndexCssFiles(distAssetsDir) {
  if (!fs.existsSync(distAssetsDir)) return [];
  const entries = fs.readdirSync(distAssetsDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => /^index-.*\.css$/.test(name));
}

function pickLatestFileByMtime(dir, fileNames) {
  if (!fileNames.length) return null;
  let latest = null;
  let latestMtime = 0;
  for (const name of fileNames) {
    const p = path.join(dir, name);
    if (!fs.existsSync(p)) continue;
    const stat = fs.statSync(p);
    const mtimeMs = Number(stat.mtimeMs || 0);
    if (mtimeMs >= latestMtime) {
      latestMtime = mtimeMs;
      latest = p;
    }
  }
  return latest;
}

function main() {
  const distAssetsDir = getAbsolutePath('./dist/assets');
  const embedDir = getAbsolutePath('./public/embed');

  const candidates = listIndexCssFiles(distAssetsDir);
  if (!candidates.length) {
    console.error('[extract-theme] No index-*.css found in dist/assets');
    process.exit(1);
  }

  const indexCssPath = pickLatestFileByMtime(distAssetsDir, candidates);
  if (!indexCssPath) {
    console.error('[extract-theme] Could not resolve latest index-*.css');
    process.exit(1);
  }

  const cssContent = fs.readFileSync(indexCssPath, 'utf8');

  // 1) Copy consolidated CSS bundle to public/embed
  ensureDir(embedDir);
  const outCssPath = path.join(embedDir, 'chefs-index.css');
  fs.writeFileSync(outCssPath, cssContent);
  console.log(
    `[extract-theme] Wrote ${path.relative(process.cwd(), outCssPath)}`
  );

  // 2) Extract variables and write a :host-scoped CSS variables file for direct inclusion
  const theme = extractThemeVariables(cssContent);
  const themeCss = buildHostThemeCss(theme.variables);
  const outCssThemePath = path.join(embedDir, 'chefs-theme.css');
  fs.writeFileSync(outCssThemePath, themeCss);
  console.log(
    `[extract-theme] Wrote theme CSS ${path.relative(
      process.cwd(),
      outCssThemePath
    )}`
  );
}

main();
