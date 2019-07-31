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
 - Valentin Genev <valentin.genev@modusbox.com>

 --------------
 ******/
/**
 * Example showing how to use EventLogger from JavaScript
 *
 */

const { Tracer, DefaultLoggerRecorder } = require('../../lib/index')

function sleep (ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

const event = {
  from: 'noresponsepayeefsp',
  to: 'payerfsp',
  id: 'aa398930-f210-4dcd-8af0-7c769cea1660',
  content: {
    headers: {
      'content-type': 'application/vnd.interoperability.transfers+json;version=1.0',
      date: '2019-05-28T16:34:41.000Z',
      'fspiop-source': 'noresponsepayeefsp',
      'fspiop-destination': 'payerfsp',
      priority: 100,
      blocking: false
    },
    payload: 'data:application/vnd.interoperability.transfers+json;version=1.0;base64,ewogICJmdWxmaWxtZW50IjogIlVObEo5OGhaVFlfZHN3MGNBcXc0aV9VTjN2NHV0dDdDWkZCNHlmTGJWRkEiLAogICJjb21wbGV0ZWRUaW1lc3RhbXAiOiAiMjAxOS0wNS0yOVQyMzoxODozMi44NTZaIiwKICAidHJhbnNmZXJTdGF0ZSI6ICJDT01NSVRURUQiCn0'
  },
  type: 'application/json'
}

// const traceSpan = Tracer.createSpan('new-service')
// console.log('app: sending message', JSON.stringify(event, null, 2))
// traceSpan.info(event)
//   .then(result => {
//     console.log('app: received back:', JSON.stringify(result, null, 2))
//   })

const main = async () => {
  // let newSpan = new Tracer({ service: 'newSpanService' })
  let parentSpan = Tracer.createSpan('parent service')
  await parentSpan.info(event)
  await parentSpan.debug('this is debug log')
  let IIChildSpan = parentSpan.getChild('child II service')
  await IIChildSpan.audit({ content: event })
  IIChildSpan.setTags({ one: 'two' })
  await IIChildSpan.error({ content: { message: 'error appeared' } })
  await parentSpan.audit(event)
  await parentSpan.finish(event)
  let messageWithContext = await IIChildSpan.injectContextToMessage(event)
  await sleep(2000)
  let contextFromMessage = Tracer.extractContextFromMessage(messageWithContext)
  let IIIChild = Tracer.createChildSpanFromContext('child III service', contextFromMessage, { defaultRecorder: new DefaultLoggerRecorder() })
  await sleep(500)
  IIChildSpan.finish()
  await sleep(1000)
  IIIChild.finish()
}

main()
