/**
 * Returns a new `Object` representing `data` in a structure compatible with `proto3` `Struct`s
 * @see https://github.com/protocolbuffers/protobuf/blob/master/src/google/protobuf/struct.proto#L51
 *
 * @param data Any `Object` to be converted into a structure compatible with `proto3` `Struct`s
 */
declare function convertJsontoStruct(data: any): {
    fields: any;
};
declare function convertStructToJson(struct: any): any;
declare function toAny(data: any, type: string): {
    type_url: string;
    value: any;
};
declare function fromAny(data: any): any;
export { convertJsontoStruct, convertStructToJson, toAny, fromAny };
