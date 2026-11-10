/* eslint-disable no-console */
// Cut an immutable web component release: npm run embed:release -- <x.y.z> [--out <dir>] [--skip-build]
const { buildRelease, parseReleaseArgs } = require('../src/webcomponents/common/releaseBuilder');

async function main() {
  const args = parseReleaseArgs(process.argv.slice(2));
  const result = await buildRelease(args);
  console.log(`Wrote ${result.files} files and integrity.json to ${result.dir}`);
  for (const [file, counts] of Object.entries(result.placeholders)) {
    console.log(`${file}: integrity placeholder x${counts.integrity}, version placeholder x${counts.version}`);
  }
  console.log('Add to PINNED_INTEGRITY in tests/unit/webcomponents/common/releases.spec.js:');
  console.log(`  '${args.version}': '${result.pinned}',`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
