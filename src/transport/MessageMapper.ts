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

 * ModusBox
 - Ramiro González Maciel <ramiro@modusbox.com>

 * Crosslake
 - Lewis Daly <lewisd@crosslaketech.com>

 --------------
 ******/
'use strict'

function toAny(data: any, type: string) {
  let value
  if (!data) {
    throw new Error('`toAny()` called with null or undefined data')
  }

  switch(type) {
    case 'text/plain':
      value = Buffer.from(data)
    break;
    case 'application/json':
      value = Buffer.from(JSON.stringify(data))
    break;
    default: 
      throw new Error(`toAny called with unsupported data type ${type}`)
  }

  return {
    type_url: type,
    value
  }
}

function fromAny(data: {type_url: string, value: any}) {
  const { type_url, value } = data

  switch (type_url) {
    case 'text/plain':
      return value.toString()
    case 'application/json':
      return JSON.parse(value.toString())
    default:
      throw new Error(`fromAny called with unsupported data.type_url ${type_url}`)
  }
}

export {
  toAny,
  fromAny
}