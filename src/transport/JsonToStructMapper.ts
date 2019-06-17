/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Ramiro González Maciel <ramiro@modusbox.com>

 --------------
 ******/
'use strict'
const moment = require('moment');

/*
 * Base on code from https://github.com/protobufjs/protobuf.js/issues/338 
 */

/**
 * Returns a new `Object` representing `data` in a structure compatible with `proto3` `Struct`s
 * @see https://github.com/protocolbuffers/protobuf/blob/master/src/google/protobuf/struct.proto#L51
 * 
 * @param data Any `Object` to be converted into a structure compatible with `proto3` `Struct`s
 */
function convertJsontoStruct(data: any) {
  var toString = Object.prototype.toString;
  var result: any = {};
  Object.keys(data).forEach(function (key) {
    var value = data[key];
    result[key] = valueToProto(value);
  });
  return {
    fields: result
  };
}

function valueToProto (value: any) : any {
  var valueRep: any = {};
  var typeString = toString.call(value);
  switch (typeString) {
    case '[object Null]':
    case '[object Undefined]':
      valueRep.nullValue = null;
      break;
    case '[object Object]':
      valueRep.structValue = convertJsontoStruct(value);
      break;
    case '[object Array]':
      // // `ListValue` is a wrapper around a repeated field of values.
      // //
      // // The JSON representation for `ListValue` is JSON array.
      // message ListValue {
      //   // Repeated field of dynamically typed values.
      //   repeated Value values = 1;
      // }        
      var values = value.map ( (each : any) => valueToProto(each));
      valueRep.listValue =  { values : values };
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
      valueRep.stringValue = moment(value).format();
      break;
    default:
      throw new Error('Unsupported type: ' + typeString);
  }
  return valueRep;
}

function protoValueToJs (val: any) {
  var kind = val.kind
  var value = val[kind]
  if (kind === 'listValue') {
    return value.values.map(function (value: any) {
      return protoValueToJs(value)
    })
  } else if (kind === 'structValue') {
    return convertStructToJson(value.fields)
  } else { // FIXME convert date back to Date
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
  convertJsontoStruct,
  convertStructToJson
}