// This script attempts to gracefully rebuild and update @bcgov/formio if necessary
const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = '../../components';
const FORMIO_DIR = 'src/formio';
const TITLE = '@bcgov/formio';

try {
  const args = process.argv.slice(2);
  switch (args[0]) {
    case 'build':
      buildComponents();
      break;
    case 'clean':
      cleanComponents();
      break;
    case 'deploy':
      deployComponents();
      break;
    case 'purge':
      console.log(`Purging "${FORMIO_DIR}"...`); // eslint-disable-line no-console
      if (fs.existsSync(FORMIO_DIR)) fs.rmSync(FORMIO_DIR, { recursive: true });
      break;
    default:
      if (!fs.existsSync(FORMIO_DIR) || !fs.readdirSync(FORMIO_DIR).length) {
        console.log(`${TITLE} not found under "${FORMIO_DIR}"`); // eslint-disable-line no-console
        buildComponents();
        deployComponents();
      } else if (fs.statSync(FORMIO_DIR).mtime < fs.statSync(COMPONENTS_DIR).mtime) {
        console.log(`${TITLE} "${COMPONENTS_DIR}" directory has been modified`); // eslint-disable-line no-console
        buildComponents();
        deployComponents();
      } else {
        console.log(`${TITLE} is present and up to date`); // eslint-disable-line no-console
      }
  }
} catch (err) {
  console.error(err.message); // eslint-disable-line no-console
  console.log(`An error occured while managing ${TITLE}`); // eslint-disable-line no-console
  process.exit(1);
}

//
// Task Functions
//

/**
 * @function buildComponents
 * @description Rebuild `@bcgov/formio` library
 */
function buildComponents() {
  if (!fs.existsSync(`${COMPONENTS_DIR}/node_modules`)) {
    console.warn(`${TITLE} missing dependencies. Reinstalling...`); // eslint-disable-line no-console
    runSync('npm ci', COMPONENTS_DIR);
  }
  console.log(`Rebuilding ${TITLE}...`); // eslint-disable-line no-console
  runSync('npm run build', COMPONENTS_DIR);
  console.log(`${TITLE} has been rebuilt`); // eslint-disable-line no-console
}

/**
 * @function cleanComponents
 * @description Clean `@bcgov/formio` library directory
 */
function cleanComponents() {
  console.log(`Cleaning ${TITLE}...`); // eslint-disable-line no-console
  if (fs.existsSync(`${COMPONENTS_DIR}/coverage`)) fs.rmSync(`${COMPONENTS_DIR}/coverage`, { recursive: true });
  if (fs.existsSync(`${COMPONENTS_DIR}/dist`)) fs.rmSync(`${COMPONENTS_DIR}/dist`, { recursive: true });
  if (fs.existsSync(`${COMPONENTS_DIR}/lib`)) fs.rmSync(`${COMPONENTS_DIR}/lib`, { recursive: true });
  console.log(`${TITLE} has been cleaned`); // eslint-disable-line no-console
}

/**
 * @function deployComponents
 * @description Redeploy `@bcgov/formio` library
 */
function deployComponents() {
  console.log(`Redeploying ${TITLE}...`); // eslint-disable-line no-console
  if (fs.existsSync(FORMIO_DIR)) fs.rmSync(FORMIO_DIR, { recursive: true });
  copyDirRecursiveSync(`${COMPONENTS_DIR}/lib`, FORMIO_DIR);
  console.log(`${TITLE} has been redeployed`); // eslint-disable-line no-console
}

//
// Helper Functions
//

/**
 * @function runSync
 * @description Execute a single shell command where `cmd` is a string
 * @param {string} cmd Shell command to run
 * @param {string} [cwd] Working directory of the command to run
 */
function runSync(cmd, cwd = undefined) {
  const { spawnSync } = require('child_process');
  const parts = cmd.split(/\s+/g);
  const opts = { stdio: 'inherit', shell: true };
  if (cwd) opts.cwd = cwd;

  const p = spawnSync(parts[0], parts.slice(1), opts);
  if (p.status) {
    throw new Error(`Command "${cmd}" exited with status code "${p.status}"`);
  }
  if (p.signal) {
    throw new Error(`Command "${cmd}" exited with signal "${p.signal}"`);
  }
}

/**
 * @function copyFileSync
 * @description Copies `source` file to `target` file
 * @param {string} source Source file location
 * @param {string} target Target file location
 */
function copyFileSync(source, target) {
  let targetFile = target;

  // If target is a directory, a new file with the same name will be created
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
}

/**
 * @function copyDirRecursiveSync
 * @description Recursively copies `source` directory contents to `target` directory
 * @param {string} source Source directory location
 * @param {string} target Target directory location
 */
function copyDirRecursiveSync(source, target) {
  let files = [];

  // Check if folder needs to be created or integrated
  const targetFolder = path.join(target, path.basename(source));
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  // Copy
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach((file) => {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyDirRecursiveSync(curSource, targetFolder);
      } else {
        copyFileSync(curSource, targetFolder);
      }
    });
  }
}

module.exports = { runSync, copyFileSync, copyDirRecursiveSync };
