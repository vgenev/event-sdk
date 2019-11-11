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

 * Crosslake
 - Lewis Daly <lewisd@crosslaketech.com>

 --------------
 ******/

import Sinon, { SinonSandbox } from 'sinon'

import { Tracer } from '../../src/Tracer'
import Config from '../../src/lib/config'
import { Recorders } from '../../src/Span'
import { EventMessage, LogResponseStatus } from '../../src/model/EventMessage'


let sandbox: SinonSandbox

const testRecorder: (delayMs: number) => Recorders = (delayMs: number) => ({
  defaultRecorder: {
    recorder: Function,
    preProcess: (event: EventMessage) => event,
    record: async (event: EventMessage) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {

          resolve({
            status: LogResponseStatus.accepted,
          })
        }, delayMs)
      })
    }
  }
})

describe('Span', () => {
  beforeEach(() => {
    sandbox = Sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.reset()
  })

  describe('Async Logging', () => {
    const testTimeoutAsync = 1 * 1000 //1 second
    const testTimeoutNonAsync = 3 * 1000 //3 seconds
    const recordDelay = 2 * 1000 //2 seconds

    it('returns immediately when ASYNC_OVERRIDE is on', async () => {
      // Arrange
      sandbox.mock(Config)
      Config.ASYNC_OVERRIDE = true
      const parentSpan = Tracer.createSpan('parent_service', {tagA: 'valueA'}, testRecorder(recordDelay))
      
      // Act
      await parentSpan.info('async message')

      // Assert
      expect(true).toBe(true)
    }, testTimeoutAsync)

    it('waits until logging is complete when ASYNC_OVERRIDE is off', async () => {
      // Arrange
      sandbox.mock(Config)
      Config.ASYNC_OVERRIDE = false
      const parentSpan = Tracer.createSpan('parent_service', { tagA: 'valueA' }, testRecorder(recordDelay))

      // Act
      await parentSpan.info('async message')

      // Assert
      expect(true).toBe(true)
    }, testTimeoutNonAsync)
  })
})