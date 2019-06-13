'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
function convertJSONtoStruct(data) {
    var toString = Object.prototype.toString;
    var result = {};
    Object.keys(data).forEach(function (key) {
        var valueRep = {};
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
                var typed = convertJSONtoStruct(value);
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
exports.convertJSONtoStruct = convertJSONtoStruct;
function protoValueToJs(val) {
    var kind = val.kind;
    var value = val[kind];
    if (kind === 'listValue') { // FIXME check this
        return value.values.map(function (value) {
            return protoValueToJs(value);
        });
    }
    else if (kind === 'structValue') {
        return convertStructToJson(value.fields);
    }
    else {
        return value;
    }
}
function convertStructToJson(struct) {
    var result = {};
    Object.keys(struct).forEach(function (key) {
        result[key] = protoValueToJs(struct[key]);
    });
    return result;
}
exports.convertStructToJson = convertStructToJson;
//# sourceMappingURL=JsonToStructMapper.js.map