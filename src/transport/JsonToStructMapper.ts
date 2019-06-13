'use strict'

function convertJSONtoStruct(data: any) {
  var toString = Object.prototype.toString;
  var result: any = {};
  Object.keys(data).forEach(function (key) {
    var valueRep: any = {};
    var value = data[key];
    var typeString = toString.call(value);
    switch (typeString) {
      case '[object Null]':
      case '[object Undefined]':
        valueRep.nullValue = 0;
        break;
      case '[object Object]':
        valueRep.structValue = convertJSONtoStruct(value);
        break;
      case '[object Array]':
        var typed: any = convertJSONtoStruct(value);
        var values = Object.keys(typed).map(function (key) {
          return typed[key];
        });
        valueRep.listValue = values;
        break;
      case '[object Number]':
        valueRep.numberValue = value;
        break;
      case '[object Boolean]':
        valueRep.boolValue = value;
        break;
      case '[object String]':
        valueRep.stringValue = value;
        break;
      case '[object Date]':
        valueRep.stringValue = value;
        break;
      default:
        throw new Error('Unsupported type: ' + typeString);
    }
    result[key] = valueRep;
  });
  return {
    fields: result
  };
}


function protoValueToJs (val: any) {
  var kind = val.kind
  var value = val[kind]
  if (kind === 'listValue') { // FIXME check this
    return value.values.map(function (value: any) {
      return protoValueToJs(value)
    })
  } else if (kind === 'structValue') {
    return convertStructToJson(value.fields)
  } else {
    return value
  }
}

function convertStructToJson (struct: any) {
  var result : any = {}
  Object.keys(struct).forEach(function (key) {
    result[key] = protoValueToJs(struct[key])
  })
  return result
}

export {
  convertJSONtoStruct,
  convertStructToJson
}