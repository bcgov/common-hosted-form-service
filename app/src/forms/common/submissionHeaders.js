const isArray = (arr) => Array.isArray(arr);
const isObject = (obj) => obj instanceof Object;
const isString = (str) => typeof str === 'string';
const isNumber = (num) => typeof num === 'number';
const isBoolean = (bool) => typeof bool === 'boolean';
const isDate = (date) => date instanceof Date;

class submissionsHeaders {
  constructor(option) {
    this.option = option;
  }
  isArray= () => {

  };

  isObject =(obj) => {

    let keyPaths = [];

    for (let prop in obj) {

      let value = obj[prop];

      var resultCheckType = this.evaluate(propData, prop, prop, obj);
      //Append to results aka merge results aka array-append-array
      result = result.concat(resultCheckType);
    }
    return result;
  };


  evaluate(element, item, index, parent) {
    element = this.castValue(element, item, index, parent);
    // try simple value by highier performance switch
    switch(typeof item){
      case 'string':
        return [{
          item: item,
          value: this._handleString(element, item),
        }];

      case 'number':
        return [{
          item: item,
          value: this._handleNumber(element, item),
        }];

      case 'boolean':
        return [{
          item: item,
          value: this._handleBoolean.bind(this)(element, item),
        }];
    }

    return this.checkComplex(element, item);
  }

}

