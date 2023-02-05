const falsey = require('falsey');
const clone = require('lodash/clone');


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
      const componentsWithSubValues = ['simplecheckboxes', 'selectboxes', 'survey', 'address'];
      if (component.type && componentsWithSubValues.includes(component.type)) {

        // for survey component, get field name from obj.questions.value
        if (component.type === 'survey') {
          component.questions.forEach(e => keyPath.push(`${component.key}.${e.value}`));
        }
        // for checkboxes and selectboxes, get field name from obj.values.value
        else if (component.values) component.values.forEach(e => keyPath.push(`${component.key}.${e.value}`));
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

const flattenedSubmissionData = (schema) => {
  let objectMap = [];
  let arrayValue=[];
  for(let obj of schema ) {
    const findField = (obj, keyPath) => {
      let keys = keyPath;
      Object.keys(obj).forEach((key)=>{

        if(Array.isArray(obj[key])) {
          arrayValue.push(keys!== undefined ? keys+'.'+key:key);
          for (let [index,value] of (obj[key]).entries()) {
            findField(value,  keys!== undefined ? keys+'.'+key:key);
          }
        }
        else if(obj[key] instanceof Object){
          findField(obj[key], keys!== undefined ? keys+'.'+key:key);
        }
        else if (typeof obj[key] === 'string' || typeof obj[key] ==='number' || typeof obj[key] ==='boolean' || obj[key] instanceof Date) {
          if(key!=='submit') {
            objectMap.push({item:keys!== undefined?keys+'.'+key:key, value:obj[key]});
          }
        }
      });
  };
    findField(obj, undefined);
  }

  return {extractedData:objectMap, arrayFields:arrayValue};
};

const extractJSONToCSV = async (flattenedSubmission, arrayFields, headers)=> {

  let rows = [];
  const finalRow=[];
  let newRow = new Array(headers.length).fill('');
  let seen = new Array(headers.length).fill(false);
  let lastFillIndex = 0;

  let getHeaderIndex = function(header) {
    return headers.indexOf(header);
  }

  let isBelowThreshold = (currentValue) => currentValue ==='';

  let fillRow = ()=>{
    //let aRows = rows;
    for(let m=lastFillIndex; m<rows.length; m++ ) {

    let row = rows[m];
    for (let i in rows) {
      for (let j in rows[i]) {
        rows[i][j] = (rows[i][j]!=='')?rows[i][j]:row[j];
      }
    }
  }
  finalRow.push(rows);
  rows=[];
  };

  let lastFillRow = ()=>{
    //let aRows = rows
    for(let row of rows ) {
    for (let i in rows){
      for (let j in rows[i]) {
        rows[i][j] = (rows[i][j]!=='')?rows[i][j]:row[j];
      }
    }
  }

  };


  let insertAndFillRow  = (index, value)=>{
    rows[0][index]=value;
    fillRow();
  };
  let isFieldPush = (index)=> {
    for(let row of rows) {
      if(row[index]!==''){
        return true;
      }
    }
    return false;
  }
  for (let data of flattenedSubmission) {

    let index = getHeaderIndex(data.item);

    if(!data.item.includes('.')){
      newRow[index] = data.value;

    }
    else {

    if(seen[index]) {
      if(newRow[index]!=='') {
        rows.push(newRow);
        newRow = new Array(headers.length).fill('');
      }
      newRow[index]=data.value;
    }
    else {
      let t = data.item.includes('.')?data.item.match(/[.]/g).length:0;
      if(t===1) {

        let path = data.item.substring(0,data.item.lastIndexOf('.'));
        if(arrayFields.includes(path)) {
          if(isFieldPush(index)) {
             fillRow();
            if(newRow[index]==='') {
              newRow[index]=data.value;
            }
            else {
              rows.push(newRow);
              newRow = new Array(headers.length).fill('');
            }
          }
          else {
            if(!newRow.every(isBelowThreshold)) {
              rows.push(newRow);
              newRow = new Array(headers.length).fill('');
            }

            insertAndFillRow(index, data.value)
          }
        }
        //newRow[index]=data.value;

      }
      else {
        newRow[index]=data.value;
      }
  }

}
seen[index]=true;
  }
 fillRow();
 console.log(rows)
 console.log(finalRows)
 lastFillRow();
  console.log(rows)
}


const reArrangeFormSubmissionJSon2 = (schema) => {
  let objectMap = [];
  let arrayTrack =[]
  for(let obj of schema ) {
    const findField = (obj, keyPath) => {
      let keys = keyPath;
      Object.keys(obj).forEach((key)=>{

        if(Array.isArray(obj[key])) {
          for (let [index,value] of (obj[key]).entries()) {
            findField(value,  keys!== undefined ? keys+'.'+key+'.'+index :key );
          }
        }
        else if(obj[key] instanceof Object){
          findField(obj[key], keys!== undefined ? keys+'.'+key:key);
        }
        else if (typeof obj[key] === 'string' || typeof obj[key] ==='number' || typeof obj[key] ==='boolean' || obj[key] instanceof Date) {
          if(key!=='submit') {
            objectMap.push({item:keys!== undefined?keys+'.'+key:key, value:obj[key]});
          }
        }
      });
  };
    findField(obj, undefined);
  }
  console.log(arrayTrack)
  return objectMap;
};


const reArrangeFormSubmissionJSon1 = (schema) => {
  let objectMap = [];
  for(let obj of schema ) {
    const findField = (obj, keyPath) => {
      Object.keys(obj).forEach((key)=>{
        let track = (keyPath!==undefined)?keyPath+'.'+key:key
        if(Array.isArray(obj[key])) {

          for (let value of obj[key]) {
            findField(value, track);
          }
        }
        if(obj[key] instanceof Object){
          findField(obj[key], track);
        }
        else if (typeof obj[key] === 'string' || typeof obj[key] ==='number' || typeof obj[key] ==='boolean' || obj[key] instanceof Date) {
          if(key!=='submit') {
            objectMap.push(track);
          }
        }
      });
  };
    findField(obj, undefined);
  }
  return objectMap;
};



module.exports = {
  falsey,
  setupMount,
  queryUtils,
  typeUtils,
  flattenComponents,
  flattenedSubmissionData,
  extractJSONToCSV
};
