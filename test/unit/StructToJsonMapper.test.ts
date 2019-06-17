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
const Test = require('tapes')(require('tape'))

import { convertStructToJson } from "../../src/transport/JsonToStructMapper";

Test('JsonToStructMapper Test', (jsonToStructMapperTests: any) => {

    jsonToStructMapperTests.test('convertStructToJson', (convertStructToJsonTest: any) => {

        convertStructToJsonTest.test('should map a Struct with Lists and sub structs correctly to a JSON', async (test: any) => {
            const docDate = moment("2019-06-17T12:43:46-03:00");
            try {
                const struct = {
                          "fields": {
                            "str1": {
                              "stringValue": "Hi world",
                              "kind": "stringValue"
                            },
                            "number1": {
                              "numberValue": 12345,
                              "kind": "numberValue"
                            },
                            "date1": {
                              "stringValue": "2019-06-17T12:43:46-03:00",
                              "kind": "stringValue"
                            },
                            "bool1": {
                              "boolValue": true,
                              "kind": "boolValue"
                            },
                            "nil1": {},
                            "undef1": {},
                            "array1": {
                              "listValue": {
                                "values": [
                                  {
                                    "stringValue": "Hello",
                                    "kind": "stringValue"
                                  },
                                  {
                                    "numberValue": 1234,
                                    "kind": "numberValue"
                                  },
                                  {
                                    "stringValue": "2019-06-17T12:43:46-03:00",
                                    "kind": "stringValue"
                                  },
                                  {
                                    "boolValue": true,
                                    "kind": "boolValue"
                                  },
                                  {},
                                  {}
                                ]
                              },
                              "kind": "listValue"
                            },
                            "child": {
                              "structValue": {
                                "fields": {
                                  "str2": {
                                    "stringValue": "Hi world",
                                    "kind": "stringValue"
                                  },
                                  "number2": {
                                    "numberValue": 12345,
                                    "kind": "numberValue"
                                  },
                                  "date2": {
                                    "stringValue": "2019-06-17T12:43:46-03:00",
                                    "kind": "stringValue"
                                  },
                                  "bool2": {
                                    "boolValue": true,
                                    "kind": "boolValue"
                                  },
                                  "nil2": {},
                                  "undef2": {},
                                  "array2": {
                                    "listValue": {
                                      "values": [
                                        {
                                          "stringValue": "Hello",
                                          "kind": "stringValue"
                                        },
                                        {
                                          "numberValue": 1234,
                                          "kind": "numberValue"
                                        },
                                        {
                                          "stringValue": "2019-06-17T12:43:46-03:00",
                                          "kind": "stringValue"
                                        },
                                        {
                                          "boolValue": true,
                                          "kind": "boolValue"
                                        },
                                        {},
                                        {}
                                      ]
                                    },
                                    "kind": "listValue"
                                  }
                                }
                              },
                              "kind": "structValue"
                            }
                          }
                        }

                let json = convertStructToJson(struct.fields);
                test.equal(struct.fields.str1.stringValue, "Hi world", 'OK!')
                test.equal(struct.fields.number1.numberValue, 12345, 'OK!')
                test.equal(struct.fields.date1.stringValue, moment(docDate).format(), 'OK!')
                test.equal(struct.fields.bool1.boolValue, true, 'OK!')
                test.equal(Reflect.ownKeys(struct.fields.nil1).length, 0, 'OK!')
                test.equal(Reflect.ownKeys(struct.fields.undef1).length, 0, 'OK!')
                test.equal(struct.fields.array1.listValue.values[0].stringValue, "Hello", 'OK!')
                test.equal(struct.fields.array1.listValue.values[1].numberValue, 1234, 'OK!')
                test.equal(struct.fields.array1.listValue.values[2].stringValue, moment(docDate).format(), 'OK!')
                test.equal(struct.fields.array1.listValue.values[3].boolValue,true, 'OK!')
                test.equal(Reflect.ownKeys(struct.fields.array1.listValue.values[4]).length, 0, 'OK!')
                test.equal(Reflect.ownKeys(struct.fields.array1.listValue.values[5]).length, 0, 'OK!')

                // same for data.child
                test.equal(struct.fields.child.structValue.fields.str2.stringValue, "Hi world", 'OK!')
                test.equal(struct.fields.child.structValue.fields.number2.numberValue, 12345, 'OK!')
                test.equal(struct.fields.child.structValue.fields.date2.stringValue, moment(docDate).format(), 'OK!')
                test.equal(struct.fields.child.structValue.fields.bool2.boolValue, true, 'OK!')
                test.equal(Reflect.ownKeys(struct.fields.child.structValue.fields.nil2).length, 0, 'OK!')
                test.equal(Reflect.ownKeys(struct.fields.child.structValue.fields.undef2).length, 0, 'OK!')
                test.equal(struct.fields.child.structValue.fields.array2.listValue.values[0].stringValue, "Hello", 'OK!')
                test.equal(struct.fields.child.structValue.fields.array2.listValue.values[1].numberValue, 1234, 'OK!')
                test.equal(struct.fields.child.structValue.fields.array2.listValue.values[2].stringValue, moment(docDate).format(), 'OK!')
                test.equal(struct.fields.child.structValue.fields.array2.listValue.values[3].boolValue, true, 'OK!')
                test.equal(Reflect.ownKeys(struct.fields.child.structValue.fields.array2.listValue.values[4]).length, 0, 'OK!')
                test.equal(Reflect.ownKeys(struct.fields.child.structValue.fields.array2.listValue.values[5]).length, 0, 'OK!')
                
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        convertStructToJsonTest.end()
    })
    
    jsonToStructMapperTests.end()
})
