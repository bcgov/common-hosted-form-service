const config = require('config');
const falsey = require('falsey');
const clone = require('lodash/clone');
const _ = require('lodash');

const setupMount = (type, app, routes) => {
  const p = `/${type}`;
  if (Array.isArray(routes)) {
    for (let r of routes) {
      app.use(p, r);
    }
  } else {
    app.use(p, routes);
  }

  return p;
};

/**
 * Gets the base url used when providing links to the application, such as in
 * emails that are sent out by the application. Handles both localhost and
 * deployed versions of the application, in the form:
 *  - http://localhost:5173/app (localhost development including port)
 *  - https://chefs-dev.apps.silver.devops.gov.bc.ca/pr-1234 (pr deployment)
 *  - https://chefs-dev.apps.silver.devops.gov.bc.ca/app (non-prod deployment)
 *  - https://submit.digital.gov.bc.ca/app (vanity url deployment)
 * @returns a string containing the base url
 */
const getBaseUrl = () => {
  let protocol = 'https';
  let host = process.env.SERVER_HOST;

  if (!host) {
    protocol = 'http';
    host = 'localhost';

    // This only needs to be defined to use the email links in local dev.
    if (config.has('frontend.localhostPort')) {
      host += ':' + config.get('frontend.localhostPort');
    }
  }

  const basePath = config.get('frontend.basePath');

  return `${protocol}://${host}${basePath}`;
};

const typeUtils = {
  isInt: (x) => {
    if (isNaN(x)) {
      return false;
    }
    const num = parseFloat(x);
    // use modulus to determine if it is an int
    return num % 1 === 0;
  },
  isNumeric: (x) => {
    return Object.prototype.toString.call(x) === '[object Number]';
  },
  isString: (x) => {
    return Object.prototype.toString.call(x) === '[object String]';
  },
  isBoolean: (x) => {
    return Object.prototype.toString.call(x) === '[object Boolean]';
  },
  isObject: (x) => {
    return Object.prototype.toString.call(x) === '[object Object]';
  },
  isNil: (x) => {
    return x == null;
  },
  isDate: (x) => {
    var d = new Date(x);
    return !isNaN(d.valueOf());
  },
};

const queryUtils = {
  defaultActiveOnly: (params) => {
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
  },
};

const periodType = {
  Daily: { name: 'Daily', value: 1, regex: 'days' },
  Weekly: { name: 'Weekly', value: 7, regex: 'days' },
  BiWeekly: { name: 'Bi-weekly', value: 14, regex: 'days' },
  Monthly: { name: 'Monthly', value: 1, regex: 'months' },
  Quaterly: { name: 'Quaterly', value: 3, regex: 'months' },
  SemiAnnually: { name: 'Semi-Annually', value: 6, regex: 'months' },
  Annually: { name: 'Annually', value: 1, regex: 'years' },
};
const flattenComponents = (components, includeAll) => {
  const flattened = [];
  eachComponent(
    components,
    (component, path) => {
      flattened.push(path);
    },
    includeAll
  );
  return flattened.flatMap((path) => path);
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
    const newPath = component.key ? (path ? `${path}.${component.key}` : component.key) : '';

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
    const layoutTypes = ['htmlelement', 'content', 'simplecontent', 'button'];
    const isLayoutComponent = hasColumns || hasRows || (hasComps && !component.input) || layoutTypes.indexOf(component.type) > -1;
    if (includeAll || component.tree || !isLayoutComponent) {
      let keyPath = [];
      const componentsWithSubValues = ['simplecheckboxes', 'selectboxes', 'survey', 'tree'];
      if (component.type && componentsWithSubValues.includes(component.type)) {
        // for survey component, get field name from obj.questions.value
        if (component.type === 'survey') {
          component.questions.forEach((e) => keyPath.push(path ? `${path}.${component.key}.${e.value}` : `${component.key}.${e.value}`));
        }
        // for checkboxes and selectboxes, get field name from obj.values.value
        else if (component.values) component.values.forEach((e) => keyPath.push(path ? `${path}.${component.key}.${e.value}` : `${component.key}.${e.value}`));
        // else push the parent field
        else {
          keyPath.push(component.key);
        }

        noRecurse = fn(component, keyPath, components);
      } else {
        noRecurse = fn(component, newPath, components);
      }
    }

    const subPath = () => {
      if (
        component.key &&
        !['panel', 'table', 'well', 'columns', 'fieldset', 'tabs', 'form'].includes(component.type) &&
        (['datagrid', 'container', 'editgrid', 'address', 'dynamicWizard', 'datatable', 'tagpad'].includes(component.type) || component.tree)
      ) {
        return newPath;
      } else if (component.key && component.type === 'form') {
        return `${newPath}.data`;
      }
      return path;
    };

    if (!noRecurse) {
      if (hasColumns) {
        component.columns.forEach((column) => eachComponent(column.components, fn, includeAll, subPath(), parent ? component : null), true);
      } else if (hasRows) {
        component.rows.forEach((row) => {
          if (Array.isArray(row)) {
            row.forEach((column) => eachComponent(column.components, fn, includeAll, subPath(), parent ? component : null), true);
          }
        });
      } else if (hasComps) {
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
  for (let obj of schema) {
    const findField = (obj, keyPath) => {
      let keys = keyPath;
      if (!_.isUndefined(obj) && !_.isNull(obj)) {
        Object.keys(obj).forEach((key) => {
          if (Array.isArray(obj[key]) && !key.includes('address')) {
            path.push(keys !== undefined ? keys + '.' + key : key);
            for (let value of obj[key]) {
              findField(value, keys !== undefined ? keys + '.' + key : key);
            }
          }
          if (obj[key] instanceof Object && !key.includes('address')) {
            findField(obj[key], keys !== undefined ? keys + '.' + key : key);
          }
        });
      }
    };
    findField(obj, undefined);
  }
  return path;
};

const submissionHeaders = (obj) => {
  let objectMap = new Set();

  const findField = (obj, keyPath) => {
    if (_.isUndefined(obj) || _.isNull(obj)) {
      objectMap.add(keyPath);
    } else {
      Object.keys(obj).forEach((key) => {
        if (_.isString(obj[key]) || _.isNumber(obj[key]) || _.isDate(obj[key])) {
          if (key !== 'submit') {
            objectMap.add(keyPath ? keyPath + '.' + key : key);
          }
        } else if (Array.isArray(obj[key])) {
          for (let value of obj[key]) {
            findField(value, keyPath ? keyPath + '.' + key : key);
          }
        } else if (_.isPlainObject(obj[key])) {
          findField(obj[key], keyPath ? keyPath + '.' + key : key);
        }
      });
    }
  };

  findField(obj, undefined);

  return objectMap;
};

const encodeURI = (unsafe) => {
  let textDelimiter = '_';
  let textDelimiterRegex = new RegExp('\\' + ',', 'g');
  return unsafe.replace(textDelimiterRegex, textDelimiter);
};

const getLatestVersion = (versions) => {
  if (!versions?.length) return null;

  return [...versions].sort((a, b) => {
    const aDate = new Date(a.updatedAt || a.createdAt);
    const bDate = new Date(b.updatedAt || b.createdAt);
    return bDate - aDate;
  })[0];
};

module.exports = {
  falsey,
  getBaseUrl,
  setupMount,
  queryUtils,
  typeUtils,
  periodType,
  flattenComponents,
  unwindPath,
  submissionHeaders,
  encodeURI,
  getLatestVersion,
};
