const storageService = require('../file/storage/storageService');

const fileService = {
  create: async (name) => {
    let result = await storageService.uploadUrl(name);
   return await result;
  }
};

module.exports = fileService;