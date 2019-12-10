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

import Sinon from 'sinon'
import Uuid from 'uuid/v4'

import { Tracer } from "../../src/Tracer"
import { EventLoggingServiceClient } from '../../src/transport/EventLoggingServiceClient'
import { DefaultSidecarRecorder } from '../../src/Recorder'
import { LogResponse, LogResponseStatus, EventTraceMetadata, HttpRequestOptions, EventMessage } from '../../src/model/EventMessage'

const expectStringifyToMatch = (result: any, expected: any) => {
  return expect(JSON.stringify(result)).toBe(JSON.stringify(expected))
}


let sandbox: Sinon.SinonSandbox
describe('Tracer', () => {
  const messageProtocol = {
    id: "xyz1234",
    to: "DFSP1",
    from: "DFSP1",
    type: 'application/json',
    content: {
      headers: {},
      payload: "http://example.com/v1/go"
    },
    metadata: {
      event: {
        id: Uuid(),
        type: 'prepare',
        action: 'prepare',
        createdAt: new Date(),
        state: {
          status: 'success',
          code: 0
        }
      }
    }
  }

  beforeAll(() => {
    sandbox = Sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should create a parent span', async () => {
    // Arrange
    const configWithSidecar = {
      EVENT_LOGGER_SIDECAR_DISABLED: false,
      EVENT_LOGGER_SERVER_HOST: 'localhost',
      EVENT_LOGGER_SERVER_PORT: 50051
    }
    const grpcClient = new EventLoggingServiceClient(configWithSidecar.EVENT_LOGGER_SERVER_HOST, configWithSidecar.EVENT_LOGGER_SERVER_PORT)

    const tracer = Tracer.createSpan('span', {}, { defaultRecorder: new DefaultSidecarRecorder(grpcClient) })
    sandbox.stub(grpcClient.grpcClient, "log").callsFake((wireEvent: any, cb: any) => {
      return cb(null, new LogResponse(LogResponseStatus.accepted))
    });
    
    // Act
    await tracer.info({ content: { messageProtocol } })
    await tracer.debug({ content: { messageProtocol } })
    await tracer.verbose({ content: { messageProtocol } })
    await tracer.error({ content: { messageProtocol } })
    await tracer.warning({ content: { messageProtocol } })
    await tracer.performance({ content: { messageProtocol } })
    
    // Assert
    expect(tracer.spanContext.service).toBe('span')
  })

  it('should get the child span', async () => {
    // Arrange
    const tracer = Tracer.createSpan('service1')
    tracer.setTags({ tag: 'value' })
    
    // Act
    let child = tracer.getChild('service2')

    // Assert
    expect(tracer.spanContext.spanId).toBe(child.spanContext.parentSpanId)
    expect(tracer.spanContext.traceId).toBe(child.spanContext.traceId)
    expect(child.spanContext.service).toBe('service2')
    expect(child.spanContext.tags).toMatchObject({ tag: 'value' })

    let spanContext = child.getContext()
    let IIChild = Tracer.createChildSpanFromContext('service3', spanContext)
    expect(child.spanContext.spanId).toBe(IIChild.spanContext.parentSpanId)
    expect(tracer.spanContext.traceId).toBe(IIChild.spanContext.traceId)
    expect(IIChild.spanContext.service).toBe('service3')

    let expected = Object.assign({}, messageProtocol, { metadata: { event: messageProtocol.metadata.event, trace: IIChild.getContext() } })
    let newMessageA = await Tracer.injectContextToMessage(IIChild.getContext(), messageProtocol)
    let newMessageB = IIChild.injectContextToMessage(messageProtocol)
    expectStringifyToMatch(newMessageA, expected)
    expectStringifyToMatch(newMessageB, expected)

    let extractedContext = Tracer.extractContextFromMessage(newMessageA)
    let IIIChild = Tracer.createChildSpanFromContext('service4', extractedContext)
    expect(IIChild.spanContext.spanId).toBe(IIIChild.spanContext.parentSpanId)
    expect(tracer.spanContext.traceId).toBe(IIIChild.spanContext.traceId)
    expect(IIIChild.spanContext.service).toBe('service4')

    let newMessageC = IIIChild.injectContextToMessage({ trace: {} })
    let expected1 = { trace: IIIChild.getContext() }
    expectStringifyToMatch(newMessageC, expected1)

    let newMeta = await IIIChild.injectContextToMessage(new EventTraceMetadata({ service: '1' }))
    expectStringifyToMatch(newMeta, IIIChild.getContext())

    let expected2 = { message: { value: { metadata: { here: {}, trace: IIIChild.getContext() } } } }
    let newMessageD = IIIChild.injectContextToMessage({ message: { value: { metadata: { here: {} } } } }, { path: 'message.value.metadata' })
    expectStringifyToMatch(newMessageD, expected2)

    let newMessageE = Tracer.injectContextToMessage(IIIChild.getContext(), { trace: {} })
    let expected3 = { trace: IIIChild.getContext() }
    expectStringifyToMatch(newMessageE, expected3)

    let newMeta2 = await Tracer.injectContextToMessage(IIIChild.getContext(), new EventTraceMetadata({ service: '1' }))
    expectStringifyToMatch(newMeta2, IIIChild.getContext())

    let newMessageF = Tracer.injectContextToMessage(IIIChild.getContext(), { message: { value: { metadata: { here: {} } } } }, { path: 'message.value.metadata' })
    let expected4 = { message: { value: { metadata: { here: {}, trace: IIIChild.getContext() } } } }
    expectStringifyToMatch(newMessageF, expected4)

    let header = await Tracer.injectContextToHttpRequest(IIIChild.getContext(), { headers: {} })
    expect(header.headers.traceparent).not.toBeUndefined()

    header = await Tracer.injectContextToHttpRequest(IIIChild.getContext(), { headers: { tracestate: 'm=dadfafa,j=123' } })
    expect(header.headers.traceparent).not.toBeUndefined()

    header = await Tracer.injectContextToHttpRequest(IIIChild.getContext(), { headers: { tracestate: 'm=dadfafa,j=123,mojaloop=dfasdfads' } })
    expect(header.headers.tracestate).toContain('mojaloop')

    header = await tracer.injectContextToHttpRequest({ headers: { tracestate: 'm=dadfafa,j=123,mojaloop=dfasdfads' } })
    expect(header.headers.traceparent).not.toBeUndefined()
    expect(header.headers.tracestate).toContain('mojaloop')

    header = await tracer.injectContextToHttpRequest({ headers: { tracestate: 'm=dadfafa,j=123,mojaloop=dfasdfads' } }, HttpRequestOptions.xb3)
    expect(header.headers['X-B3-SpanId']).not.toBeUndefined()

    header = await IIChild.injectContextToHttpRequest({ headers: { tracestate: 'm=dadfafa,j=123,mojaloop=dfasdfads' } }, HttpRequestOptions.xb3)
    expect(header.headers['X-B3-SpanId']).not.toBeUndefined()

    header = await Tracer.injectContextToHttpRequest(IIIChild.getContext(), { headers: {} })
    let newContextA = Tracer.extractContextFromHttpRequest(header)
    expect(newContextA).not.toBeUndefined()

    header = await IIChild.injectContextToHttpRequest({ headers: { tracestate: 'm=dadfafa,j=123,mojaloop=dfasdfads' } }, HttpRequestOptions.xb3)
    let newContextB = Tracer.extractContextFromHttpRequest(header, HttpRequestOptions.xb3)
    expect(newContextB).not.toBeUndefined()
    
    header = await Tracer.injectContextToHttpRequest(IIIChild.getContext(), { headers: {tracestate: 'mojaloop=12312312', traceparent: '00-1234567890123456-12345678-01'} })
    let newContextC = Tracer.extractContextFromHttpRequest(header)
    expect(newContextC).not.toBeUndefined()

    let finishtime = new Date()
    await tracer.finish('message', undefined, finishtime)
    await IIChild.finish()
    
    // Throws when new trying to finish already finished trace
    let action = async () => await tracer.finish()
    await expect(action()).rejects.toThrowError('span already finished')

    action = async () => await tracer.audit(<EventMessage>newMessageA)
    await expect(action()).rejects.toThrowError('span finished. no further actions allowed')
    
    const logresult = await child.audit(<EventMessage>newMessageA)
    expect(logresult).not.toBeUndefined()
  })
})