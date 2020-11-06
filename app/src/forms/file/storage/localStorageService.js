const config = require('config');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const _remLastSep = (x) => x && x.endsWith(path.sep) ? x.slice(0, -1) : x;

const _path = config.get('files.localStorage.path') ? config.get('files.localStorage.path') : fs.realpathSync(os.tmpdir());
const BASE_PATH = _remLastSep(_path);

try {
  fs.ensureDirSync(BASE_PATH);
} catch (e) {
  throw new Error(`Could not access local storage directory '${BASE_PATH}'.`);
}


const service = {

  delete: async (fileStorage) => {
    if (fs.existsSync(fileStorage.path)) {
      fs.unlinkSync(fileStorage.path);
      return !fs.existsSync(fileStorage.path);
    } else {
      return false;
    }
  },

  move: async (fileStorage, ...subdirs) => {
    // by default, just move the file to the storage location, we use the id as the filename
    if (fs.existsSync(fileStorage.path)) {
      let bp = `${BASE_PATH}`;

      try {
        // are we supposed to move this to some sub directory structure?
        if (subdirs && subdirs.length) {
          bp = `${bp}${path.sep}${subdirs.join(path.sep)}`;
        }
        // will need to make sure the subdirs are ok...
        fs.ensureDirSync(bp);
      } catch (e) {
        bp = `${BASE_PATH}`;
      }

      const newPath = `${bp}${path.sep}${fileStorage.id}`;
      fs.renameSync(fileStorage.path, newPath);
      if (fs.existsSync(newPath) && !fs.existsSync(fileStorage.path)) {
        return newPath;
      }
    }
  },

  read: async (fileStorage) => {
    // just return a stream...
    if (fs.existsSync(fileStorage.path)) {
      return fs.createReadStream(fileStorage.path);
    }
  },

  uploadFile: async(fileStorage) => {
    // we do not upload, so return current state.
    return {
      path: fileStorage.path,
      storage: fileStorage.storage
    };
  }

};

module.exports = service;
