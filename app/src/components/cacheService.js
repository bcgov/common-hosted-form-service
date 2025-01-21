const { createCache } = require('cache-manager');
const { Keyv } = require('keyv');
const { KeyvCacheableMemory } = require('cacheable');
const log = require('./log')(module.filename);

const TTL = 300000; // time to live in milliseconds (match token age - 5 minutes)
const LRU_SIZE = 5000; //least recently used size

const initCache = (name) => {
  const store = new KeyvCacheableMemory({ ttl: TTL, lruSize: LRU_SIZE });
  const keyv = new Keyv({ store });
  const items = createCache({ stores: [keyv] });
  return {
    name: name,
    items: items,
  };
};

const loginUserCache = initCache('login');

const getFromCache = async (cache, key) => {
  let result;
  if (key) {
    try {
      result = await cache.items.get(key);
      log.debug(`cache('${cache.name}').get('${key}'): ${result ? 'found' : 'not found'}`);
    } catch {
      /* empty */
    }
  }
  return result;
};

const setToCache = async (cache, key, value, ttl = TTL) => {
  let result;
  if (key && value) {
    try {
      result = await cache.items.set(key, value, ttl);
      log.debug(`cache('${cache.name}').set('${key}')`);
    } catch {
      /* empty */
    }
  }
  return result;
};

const deleteFromCache = async (cache, key) => {
  if (key) {
    try {
      await cache.items.del(key);
      log.debug(`cache('${cache.name}').del('${key}')`);
    } catch {
      /* empty */
    }
  }
};

class CacheService {
  async clear() {
    try {
      await loginUserCache.items.clear();
    } catch {
      /* empty */
    }
  }
  async getLoginUser(userInfo) {
    if (userInfo && userInfo.idpUserId && userInfo.hash) {
      const loginUser = await getFromCache(loginUserCache, userInfo.idpUserId);
      if (loginUser && loginUser.hash !== userInfo.hash) {
        // info has changed, remove from cache and don't return it.
        await deleteFromCache(loginUserCache, userInfo.idpUserId);
      } else {
        return loginUser;
      }
    }
  }

  async setLoginUser(userInfo, value, ttl) {
    if (userInfo && userInfo.idpUserId && userInfo.hash) {
      return await setToCache(loginUserCache, userInfo.idpUserId, value, ttl);
    }
  }
}

let cacheService = new CacheService();
module.exports = cacheService;
