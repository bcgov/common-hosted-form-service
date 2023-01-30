const Cache = require('file-system-cache').default;

const cache = Cache({
  basePath: '../app/src/forms/common/cache/cachetest.cache', // Optional. Path where cache files are stored (default).
  ns: 'my-namespace'    // Optional. A grouping namespace for items.
});
module.exports =  cache;

