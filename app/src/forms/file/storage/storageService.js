const config = require('config');

const StorageTypes = require('../../common/constants').StorageTypes;
const _isLocal = (x) => StorageTypes.LOCAL_STORES.includes(x.storage);

const PERMANENT_STORAGE = config.get('files.permanent');
const localStorageService = require('./localStorageService');
const objectStorageService = require('./objectStorageService');

const service = {
  _deleteFile: async (fileStorage) => {
    if (_isLocal(fileStorage)) {
      return localStorageService.delete(fileStorage);
    } else if (StorageTypes.OBJECT_STORAGE === fileStorage.storage) {
      return objectStorageService.delete(fileStorage);
    }
  },

  _readFile: async (fileStorage) => {
    if (_isLocal(fileStorage)) {
      return localStorageService.read(fileStorage);
    } else if (StorageTypes.OBJECT_STORAGE === fileStorage.storage) {
      return objectStorageService.read(fileStorage);
    }
  },

  _moveFile: async (fileStorage, ...subdirs) => {
    // move file only works on the same storage system
    if (_isLocal(fileStorage)) {
      return localStorageService.move(fileStorage, ...subdirs);
    } else if (StorageTypes.OBJECT_STORAGE === fileStorage.storage) {
      return objectStorageService.move(fileStorage, ...subdirs);
    }
  },

  _uploadFile: async (fileStorage) => {
    if (PERMANENT_STORAGE === StorageTypes.LOCAL_STORAGE) {
      return localStorageService.uploadFile(fileStorage);
    } else if (PERMANENT_STORAGE === StorageTypes.OBJECT_STORAGE) {
      return objectStorageService.uploadFile(fileStorage);
    }
  },

  delete: async (fileStorage) => {
    return service._deleteFile(fileStorage);
  },

  move: async (fileStorage, ...subdirs) => {
    return service._moveFile(fileStorage, ...subdirs);
  },

  read: async (fileStorage) => {
    return service._readFile(fileStorage);
  },

  upload: async (fileStorage) => {
    return service._uploadFile(fileStorage);
  },
};

module.exports = service;
