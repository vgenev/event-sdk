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

const Test = require('tapes')(require('tape'))
import { EventLogger } from "../../src/eventLogger"

Test('EventLogger Class Test', (eventLoggerTests: any) => {

    eventLoggerTests.test('log', (logTest: any) => {
        logTest.test('should console log a simple event', async (test: any) => {
            try {
                const eventLogger: EventLogger = new EventLogger()
                eventLogger.log("dfsp1", "some_unique_id_here", {version: 1}, { hello: 'world'});
                test.equal(true, true, 'OK!')
                test.end()
            } catch (e) {
                test.fail(`Error Thrown - ${e}`)
                test.end()
            }
        })
        logTest.end()
    })
    eventLoggerTests.end()
})
