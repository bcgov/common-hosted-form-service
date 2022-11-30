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

const reArrangeJSon = (obj, keyPath, submissionMap) => {

  Object.keys(obj).forEach((key)=>{
    if(obj[key].constructor.name==="Array") {
      for (value of obj[key]){
        reArrangeJSon(value, keyPath+"."+key, submissionMap);
      }
    }
    if(obj[key].constructor.name==="Object") {
      reArrangeJSon(obj[key],keyPath+"."+key, submissionMap);
    }
    else if (obj[key].constructor.name==="String" || obj[key].constructor.name==="Number" || obj[key].constructor.name==="Boolean" ) {
      submissionMap.add([keyPath+"."+key,obj[key]]);
    }
  })
}

const flatten = (data)=> {
  var result = {};
  function recurse (cur, prop) {
      if (Object(cur) !== cur) {
          result[prop] = cur;
      } else if (Array.isArray(cur)) {
           for(var i=0, l=cur.length; i<l; i++)
               recurse(cur[i], prop + "[" + i + "]");
          if (l == 0)
              result[prop] = [];
      } else {
          var isEmpty = true;
          for (var p in cur) {
              isEmpty = false;
              recurse(cur[p], prop ? prop+"."+p : p);
          }
          if (isEmpty && prop)
              result[prop] = {};
      }
  }
  recurse(data, "");
  return result;
}

module.exports = {
  falsey,
  setupMount,
  queryUtils,
  typeUtils,
  flatten,
  reArrangeJSon
};
