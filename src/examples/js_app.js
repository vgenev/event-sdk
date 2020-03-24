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
 * Example showing how to use Tracer from JavaScript
 *
 */

const { Tracer } = require('../../dist/index')
const { AuditEventAction } = require('../../dist/index')
const EventSDK = require('../../dist/index')
// const { DefaultLoggerRecorder } = require('../../dist/Recorder')

// const Logger = require('@mojaloop/central-services-logger')

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

const request = {
  headers: {
    host: 'localhost:4000',
    'user-agent': 'curl/7.59.0',
    accept: '*/*',
    traceparent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
    tracestate: 'af=spanId:b7ad6b7169203331,acmevendor=spanId:aaad6b7169203331'
  }
}

const main = async () => {
  // Creates a new parent span for given service
  // this sets new traceId and new spanId.
  const parentSpan = Tracer.createSpan('parent service')
  const IIChildSpan = parentSpan.getChild('child fin service')

  // Logs message with logging level info from the parent span

  const newEvent = new EventSDK.EventMessage(event)
  await parentSpan.info(newEvent)
  await parentSpan.warning('event')
  await parentSpan.debug(event)
  await parentSpan.verbose('message')
  await parentSpan.performance('message')
  await parentSpan.audit('message')
  // Logs message with logging level debug from the parent span
  await parentSpan.debug('this is debug log')

  // Creates child span from the parent span with new service name.
  // The traceId remains the same. The spanId is new and the parentSpanId is the spanId of the parent.

  // Creates audit event message
  await IIChildSpan.audit({ content: event }, AuditEventAction.finish)

  // // Set tags to the span
  IIChildSpan.setTags({ one: 'two' })

  // // Creates error log event from the IIChildSpan
  await IIChildSpan.error({ content: { message: 'error appeared' } })

  // // Creates audit event message
  await parentSpan.audit(event)

  // // Finish the span. This also sends the trace context to the tracing platform. All further operations are forbidden after the span is finished.
  await parentSpan.finish(event)

  // // Injects trace context to a message carrier. When the trace is carried across few services, the trace context can be injects in the carrier that transports the data.
  // const messageWithContext = await IIChildSpan.injectContextToMessage(event)
  await sleep(2000)
  const requestHeadersWithContext = await IIChildSpan.injectContextToHttpRequest(request)

  const httpFromRequest = await Tracer.extractContextFromHttpRequest(request)

  const IVChild = Tracer.createChildSpanFromContext('child III service', httpFromRequest) //, { defaultRecorder: new DefaultLoggerRecorder() })
  // Logger.info(JSON.stringify(requestHeadersWithContext, null, 2))
  // Extracts trace context from message carrier. When the message is received from different service, the trace context is extracted by that method.
  // const contextFromMessage = Tracer.extractContextFromMessage(messageWithContext)
  const context = Tracer.extractContextFromHttpRequest(requestHeadersWithContext)

  IVChild.setTracestateTags({ bar: 'baz' })
  IVChild.setTracestateTags({ foo: 'b' })
  // nconsole.log(IVChild.getTracestateTags())

  // Logger.info(JSON.stringify(context, null, 2))
  const spanFromHttp = Tracer.createChildSpanFromContext('http_span', context)
  // Logger.info(JSON.stringify(spanFromHttp.getContext(), null, 2))
  // Creates child span from extracted trace context.
  const IIIChild = spanFromHttp.getChild('child III service')
  await sleep(500)
  spanFromHttp.finish()
  const state = new EventSDK.EventStateMetadata(EventSDK.EventStatusType.failed, '2001', 'its an errrrrrorrrr')
  await IIChildSpan.finish(('error message'), state)
  await sleep(500)
  await IIIChild.finish()
  await sleep(500)
  await sleep(1000)
  await IVChild.finish()
}

main()
