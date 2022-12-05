const falsey = require('falsey');
const setupMount = (type, app, routes, dataErrors) => {
  const p = `/${type}`;
  app.use(p, routes);
  app.use(dataErrors);
  return p;
};

const typeUtils = {
  isInt: x => {
    if (isNaN(x)) {
      return false;
    }
    const num = parseFloat(x);
    // use modulus to determine if it is an int
    return num % 1 === 0;
  },
  isString: x => {
    return Object.prototype.toString.call(x) === '[object String]';
  },
  isBoolean: x => {
    return Object.prototype.toString.call(x) === '[object Boolean]';
  },
  isNil: x => {
    return x == null;
  }
};

const queryUtils = {
  defaultActiveOnly: params => {
    if (!params) {
      params = {};
    }
    let active = true;
    if (!typeUtils.isNil(params.active)) {
      // if caller hasn't explicitly set active, then force to active = true, do not return "deleted" forms.
      active = !falsey(params.active);
    }
    params.active = active;
    return params;
  }
};

const unCamelCase = (str) => {
  return str
  // insert a space between lower & upper
    .replace(/([a-z])([A-Z])/g, '$1 $2')
  // space before last upper in a sequence followed by lower
    .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
  // uppercase the first character
    .replace(/^./, function(str){ return str.toUpperCase(); });
};


const reArrangeFormSubmissionJSon = (obj) => {
  let objectMap = [];
  const findField = (obj, level) => {
    Object.keys(obj).forEach((key)=>{
      if(obj[key].constructor.name==='Array') {
        objectMap.push([unCamelCase(key), level]);

        for (let value of obj[key]) {

          findField(value, level+1);
        }
      }

      if(obj[key].constructor.name==='Object'){
        findField(obj[key], level+1);
      }

      else if (obj[key].constructor.name==='String' || obj[key].constructor.name==='Number' || obj[key].constructor.name==='Boolean') {
        if(key!=='submit') {
          objectMap.push([{[unCamelCase(key)] : obj[key]}, level]);
        }
      }
    });
  };

  findField(obj, 0);

  return objectMap;

};


module.exports = {
  falsey,
  setupMount,
  queryUtils,
  typeUtils,
  reArrangeFormSubmissionJSon
};
