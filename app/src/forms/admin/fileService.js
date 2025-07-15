const storageService = require('../file/storage/storageService');

const fileService = {
  create: async (imageData) => {
    return await storageService.uploadImage(imageData);
  },

  signedUrl: async (param) => {
    return await storageService.readSignedUrl(param.imageName);
  },
};

module.exports = fileService;
