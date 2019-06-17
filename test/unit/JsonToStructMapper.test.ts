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

import { convertJsontoStruct } from "../../src/transport/JsonToStructMapper";

Test('JsonToStructMapper Test', (jsonToStructMapperTests: any) => {

    jsonToStructMapperTests.test('jsonToStruct', (jsonToStructTest: any) => {

        jsonToStructTest.test('should map a json with arrays and structs correctly to a Struct', async (test: any) => {
            const now = new Date();
            try {
                const data = {
                    str1: 'Hi world',
                    number1: 12345,
                    date1: now,
                    bool1: true,
                    nil1: null,
                    undef1: undefined,
                    array1: [ "Hello", 1234, now, true, null, undefined],
                    child:{
                        str2: 'Hi world',
                        number2: 12345,
                        date2:now,
                        bool2: true,
                        nil2: null,
                        undef2: undefined,
                        array2: [ "Hello", 1234, now, true, null, undefined],    
                    }
                }

                let struct = convertJsontoStruct(data);
                test.equal(struct.fields.str1.stringValue, data.str1, 'OK!')
                test.equal(struct.fields.number1.numberValue, data.number1, 'OK!')
                test.equal(struct.fields.date1.stringValue, moment(now).format(), 'OK!')
                test.equal(struct.fields.bool1.boolValue, data.bool1, 'OK!')
                test.equal(struct.fields.nil1.nullValue, null, 'OK!')
                test.equal(struct.fields.undef1.nullValue, null, 'OK!')
                test.equal(struct.fields.array1.listValue.values[0].stringValue, data.array1[0], 'OK!')
                test.equal(struct.fields.array1.listValue.values[1].numberValue, data.array1[1], 'OK!')
                test.equal(struct.fields.array1.listValue.values[2].stringValue, moment(data.array1[2]).format(), 'OK!')
                test.equal(struct.fields.array1.listValue.values[3].boolValue, data.array1[3], 'OK!')
                test.equal(struct.fields.array1.listValue.values[4].nullValue, null, 'OK!')
                test.equal(struct.fields.array1.listValue.values[5].nullValue, null, 'OK!')

                // same for data.child
                test.equal(struct.fields.child.structValue.fields.str2.stringValue, data.child.str2, 'OK!')
                test.equal(struct.fields.child.structValue.fields.number2.numberValue, data.child.number2, 'OK!')
                test.equal(struct.fields.child.structValue.fields.date2.stringValue, moment(now).format(), 'OK!')
                test.equal(struct.fields.child.structValue.fields.bool2.boolValue, data.child.bool2, 'OK!')
                test.equal(struct.fields.child.structValue.fields.nil2.nullValue, null, 'OK!')
                test.equal(struct.fields.child.structValue.fields.undef2.nullValue, null, 'OK!')
                test.equal(struct.fields.child.structValue.fields.array2.listValue.values[0].stringValue, data.child.array2[0], 'OK!')
                test.equal(struct.fields.child.structValue.fields.array2.listValue.values[1].numberValue, data.child.array2[1], 'OK!')
                test.equal(struct.fields.child.structValue.fields.array2.listValue.values[2].stringValue, moment(data.child.array2[2]).format(), 'OK!')
                test.equal(struct.fields.child.structValue.fields.array2.listValue.values[3].boolValue, data.child.array2[3], 'OK!')
                test.equal(struct.fields.child.structValue.fields.array2.listValue.values[4].nullValue, null, 'OK!')
                test.equal(struct.fields.child.structValue.fields.array2.listValue.values[5].nullValue, null, 'OK!')
                
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })

        jsonToStructTest.test('should map a json with arrays and structs correctly to a Struct', async (test: any) => {
            try {
                const data = {
                    set1: new Set([1])
                }
                let struct = convertJsontoStruct(data);
                test.fail('Should have thrown Unsupported type exception')
            } catch (e) {
                if ( e.message != 'Unsupported type: [object Set]') {
                  test.fail(`Error Thrown - ${e}`)
                }
                test.end()
            }
        })






        jsonToStructTest.end()
    })

    jsonToStructMapperTests.end()
})
