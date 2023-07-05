export function sanitizeConfig(config) {
  const renameProp = (oldProp, newProp, { [oldProp]: old, ...others }) => {
    return {
      [newProp]: old,
      ...others,
    };
  };
  return Object.keys(config).reduce(function (previous, key) {
    if (['authRealm', 'authUrl', 'authClientId'].includes(key)) {
      const cleaned = key.replace('auth', '');
      const newKey = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
      return renameProp(key, newKey, previous);
    }
    return previous;
  }, config);
}

function _isObject(obj) {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    Object.prototype.toString.call(obj) !== '[object Array]'
  );
}

export function getConfig(config) {
  if (_isObject(config)) return Promise.resolve(config);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', config);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(Error(xhr.statusText));
        }
      }
    };
    xhr.send();
  });
}

export function assertOptions(options) {
  const { config, init, onReady, onInitError } = options;
  if (typeof config !== 'string' && !_isObject(config)) {
    return {
      hasError: true,
      error: `'config' option must be a string or an object. Found: '${config}'`,
    };
  }
  if (!_isObject(init) || typeof init.onLoad !== 'string') {
    return {
      hasError: true,
      error: `'init' option must be an object with an 'onLoad' property. Found: '${init}'`,
    };
  }
  if (onReady && typeof onReady !== 'function') {
    return {
      hasError: true,
      error: `'onReady' option must be a function. Found: '${onReady}'`,
    };
  }
  if (onInitError && typeof onInitError !== 'function') {
    return {
      hasError: true,
      error: `'onInitError' option must be a function. Found: '${onInitError}'`,
    };
  }
  return {
    hasError: false,
    error: null,
  };
}
