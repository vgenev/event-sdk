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

import {
  toAny,
  fromAny
} from '../../../src/transport/MessageMapper'


describe('JsonToStructMapper', () => {
  describe('fromAny', () => {
    it('handles `text/plain` format', () => {
      // Arrange
      const expected = '12345'
      const data = {
        type_url: 'text/plain',
        value: Buffer.from('12345')
      }

      // Act
      const result = fromAny(data)

      
      // Assert
      expect(result).toStrictEqual(expected)
    })

    it('handles `application/json` format', () => {
      // Arrange
      const expected = {abc: 'def'}
      const data = {
        type_url: 'application/json',
        value: Buffer.from(JSON.stringify(expected))
      }

      // Act
      const result = fromAny(data)

      // Assert
      expect(result).toStrictEqual(expected)
    })

    it('throws on unsupported type_url', () => {
      // Arrange
      const expected = {abc: 'def'}
      const data = {
        type_url: 'application/json+vnd??',
        value: Buffer.from(JSON.stringify(expected))
      }

      // Act
      const action = () => fromAny(data)

      // Assert
      expect(action).toThrow()
    })
  })

  describe('toAny', () => {
    it('handles `text/plain` format', () => {
      // Arrange
      const expected = {
        type_url: 'text/plain',
        value: Buffer.from('12345')
      }
      
      // Act
      const result = toAny('12345', 'text/plain')
      
      // Assert
      expect(result).toStrictEqual(expected)
    })

    it('handles `application/json` format', () => {
      // Arrange
      const expected = {
        type_url: 'application/json',
        value: Buffer.from(JSON.stringify({ abc: 'def' }))
      }

      // Act
      const result = toAny({abc: 'def'}, 'application/json')

      // Assert
      expect(result).toStrictEqual(expected)
    })

    it('handles unknown data types', () => {
      // Arrange
      // Act
      const action = () => toAny({ abc: 'def' }, 'unsupported/json')

      // Assert
      expect(action).toThrow()
    })
  })
})