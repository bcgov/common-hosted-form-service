const { createCache } = require('cache-manager');
const { Keyv } = require('keyv');
const { KeyvCacheableMemory } = require('cacheable');
const hasher = require('node-object-hash').hasher();
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
const currentUserCache = initCache('current');

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

const multiDeleteFromCache = async (cache, keys) => {
  if (keys) {
    try {
      await cache.items.mdel(keys);
    } catch {
      /* empty */
    }
  }
};

class CacheService {
  constructor() {}

  async clear() {
    try {
      await loginUserCache.items.clear();
      await currentUserCache.items.clear();
    } catch {
      /* empty */
    }
  }
  async getLoginUser(userInfo) {
    if (userInfo && userInfo.idpUserId) {
      return await getFromCache(loginUserCache, userInfo.idpUserId);
    }
    return;
  }

  async setLoginUser(userInfo, value, ttl) {
    if (userInfo && userInfo.idpUserId) {
      return await setToCache(loginUserCache, userInfo.idpUserId, value, ttl);
    }
    return;
  }

  async getCurrentUser(currentUser, params = { default: true }) {
    if (currentUser && currentUser.id && !currentUser.public) {
      const user = await getFromCache(currentUserCache, currentUser.id);
      if (user) {
        // params indicate different filters on the forms
        // so each current user could have multiple caches for each
        // set of filters
        // hash the param lists and that is the key
        const hash = hasher.hash(params);
        log.debug(`current.params.hash = ${hash}`);
        return user[hash];
      }
    }
    return;
  }

  async setCurrentUser(currentUser, params, value, ttl) {
    if (currentUser && currentUser.id && !currentUser.public) {
      // params indicate different filters on the forms
      // so each current user could have multiple caches for each
      // set of filters
      if (!params) {
        params = { default: true };
      }
      const hash = hasher.hash(params);
      let user = await getFromCache(currentUserCache, currentUser.id);
      user = user ? user : {};
      user[hash] = value; // hash the param lists and that is the key
      log.debug(`current.params.hash = ${hash}`);
      return await setToCache(currentUserCache, currentUser.id, user, ttl);
    }
    return;
  }

  async clearCurrentUser(currentUser) {
    if (currentUser && currentUser.id && !currentUser.public) {
      await deleteFromCache(currentUserCache, currentUser.id);
    }
  }

  async clearCurrentUsersById(keys) {
    return await multiDeleteFromCache(currentUserCache, keys);
  }
}

let cacheService = new CacheService();
module.exports = cacheService;
