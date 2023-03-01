const falsey = require('falsey');
const clone = require('lodash/clone');
const _ = require('lodash');

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

const flattenComponents = (components, includeAll) => {
  const flattened = [];
  eachComponent(components, (component, path) => {
    flattened.push(path);
  }, includeAll);
  return flattened.flatMap(path => path);
};

const eachComponent = (components, fn, includeAll, path, parent, inRecursion) => {
  if (!components) return;
  path = path || '';
  if (inRecursion) {
    if (components.noRecurse) {
      delete components.noRecurse;
      return;
    }
    components.noRecurse = true;
  }
  components.forEach((component) => {
    if (!component) {
      return;
    }

    const hasColumns = component.columns && Array.isArray(component.columns);
    const hasRows = component.rows && Array.isArray(component.rows);
    const hasComps = component.components && Array.isArray(component.components);
    let noRecurse = false;
    const newPath = component.key ? (path ? (`${path}.${component.key}`) : component.key) : '';

    // Keep track of parent references.
    if (parent) {
      // Ensure we don't create infinite JSON structures.
      component.parent = clone(parent);
      delete component.parent.components;
      delete component.parent.componentMap;
      delete component.parent.columns;
      delete component.parent.rows;
    }


    // there's no need to add other layout components here because we expect that those would either have columns, rows or components
    const layoutTypes = ['htmlelement', 'content','simplecontent','button',];
    const isLayoutComponent = hasColumns || hasRows || (hasComps && !component.input) || layoutTypes.indexOf(component.type) > -1;
    if (includeAll || component.tree || !isLayoutComponent) {
      let keyPath = [];
      const componentsWithSubValues = ['simplecheckboxes', 'selectboxes', 'survey', 'tree'];
      if (component.type && componentsWithSubValues.includes(component.type)) {

        // for survey component, get field name from obj.questions.value
        if (component.type === 'survey') {

          component.questions.forEach(e => keyPath.push(path?`${path}.${component.key}.${e.value}`:`${component.key}.${e.value}`));
        }
        // for checkboxes and selectboxes, get field name from obj.values.value
        else if (component.values) component.values.forEach(e => keyPath.push(path?`${path}.${component.key}.${e.value}`:`${component.key}.${e.value}`));
        // else push the parent field
        else {
          keyPath.push(component.key);
        }

        noRecurse = fn(component, keyPath, components);
      }
      else{
        noRecurse = fn(component, newPath, components);
      }

    }

    const subPath = () => {
      if (
        component.key &&
        !['panel', 'table', 'well', 'columns', 'fieldset', 'tabs', 'form'].includes(component.type) &&
        (
          ['datagrid', 'container', 'editgrid', 'address', 'dynamicWizard', 'datatable', 'tagpad',].includes(component.type) ||
          component.tree
        )
      ) {
        return newPath;
      }
      else if (
        component.key &&
        component.type === 'form'
      ) {
        return `${newPath}.data`;
      }
      return path;
    };

    if (!noRecurse) {
      if (hasColumns) {
        component.columns.forEach((column) =>
          eachComponent(column.components, fn, includeAll, subPath(), parent ? component : null), true);
      }

      else if (hasRows) {
        component.rows.forEach((row) => {
          if (Array.isArray(row)) {
            row.forEach((column) =>
              eachComponent(column.components, fn, includeAll, subPath(), parent ? component : null), true);
          }
        });
      }

      else if (hasComps) {
        eachComponent(component.components, fn, includeAll, subPath(), parent ? component : null, true);
      }
    }
  });
  if (components.noRecurse) {
    delete components.noRecurse;
  }
};

const unwindPath = (schema) => {
  let path = [];
  for(let obj of schema ) {
    const findField = (obj, keyPath) => {
      let keys = keyPath;
      Object.keys(obj).forEach((key)=>{
        if(Array.isArray(obj[key]) && !key.includes('address')) {
          path.push(keys!== undefined ? keys+'.'+key:key);
          for (let value of obj[key]) {
            findField(value,  keys!== undefined ? keys+'.'+key:key );
          }
        }
        if(obj[key] instanceof Object  && !key.includes('address')){
          findField(obj[key], keys!== undefined ? keys+'.'+key:key);
        }
      });
    };
    findField(obj, undefined);
  }
  return path;
};

const submissionHeaders = (obj) => {
  let objectMap = new Set();
  const findField = (obj, keyPath) => {
    Object.keys(obj).forEach((key)=>{
      if(Array.isArray(obj[key])) {
        for (let value of obj[key]) {
          findField(value, keyPath?keyPath+'.'+key:key);
        }
      }

      else if(_.isPlainObject(obj[key])) {

        findField(obj[key], keyPath?keyPath+'.'+key:key);
      }

      else if (_.isString(obj[key]) || _.isNumber(obj[key]) || _.isPlainObject(obj[key])  || _.isDate(obj[key])) {
        if(key!=='submit') {
          objectMap.add(keyPath?keyPath+'.'+key:key);
        }
      }
    });
  };

  findField(obj, undefined);

  return objectMap;
};

const escapeSpecialCharacters =(unsafe)=> {
  let textDelimiter ='_';
  let textDelimiterRegex = new RegExp('\\' + ',', 'g');
  return unsafe
    .replace(textDelimiterRegex, textDelimiter);
};


module.exports = {
  falsey,
  setupMount,
  queryUtils,
  typeUtils,
  flattenComponents,
  unwindPath,
  submissionHeaders,
  escapeSpecialCharacters
};
