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

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const Test = require('tapes')(require('tape'))
const Uuid = require('uuid4')

const {
  EventMessage,
  EventMetadata,
  LogEventTypeAction,
  LogEventAction,
  EventStatusType,
  EventStateMetadata,
  EventTraceMetadata,
  AuditEventAction,
  AuditEventTypeAction,
  TraceEventTypeAction,
  TraceEventAction,
  EventType,
  LogResponse,
  LogResponseStatus,
  IMessageMetadata,
  NullEventAction
} = require('../../lib/model/EventMessage')

// import { Span } from "../../src/Span"
const { Tracer } = require('../../lib/Tracer')
const { DefaultSidecarRecorder, DefaultLoggerRecorder, IEventRecorder } = require('../../lib/Recorder')
const { EventLoggingServiceClient } = require('../../lib/transport/EventLoggingServiceClient')

Test('EventLogger Class Test', async (eventLoggerTests) => {
  await eventLoggerTests.test('EventMessage', async (EventMessageTest) => {
    let config_without_sidecar = {
      SIDECAR_DISABLED: true,
      EVENT_LOGGER_SERVER_HOST: 'localhost',
      EVENT_LOGGER_SERVER_PORT: 50051
    }

    let Span = proxyquire('../../lib/Span', { '../config/default.json': config_without_sidecar })

    await EventMessageTest.test('LogEventTypeAction should get undefined action', async (test) => {
      try {
        let { type, action } = new LogEventTypeAction()
        test.equal(EventType.log, type)
        test.equal(EventType.log, LogEventTypeAction.getType())
        test.equal(action, NullEventAction.undefined)
        test.end()
      } catch (e) {
        test.fail(e)
        test.end()
      }
    })

    await EventMessageTest.test('LogEventTypeAction should get type and action', async (test) => {
      try {
        let { type, action } = new LogEventTypeAction({ action: LogEventAction.info })
        test.equal(EventType.log, type)
        test.equal(EventType.log, LogEventTypeAction.getType())
        test.equal(action, LogEventAction.info)
        test.end()
      } catch (e) {
        test.fail(e)
        test.end()
      }
    })

    await EventMessageTest.test('AuditEventTypeAction should get undefined action', async (test) => {
      try {
        let { type, action } = new AuditEventTypeAction()
        test.equal(EventType.audit, type)
        test.equal(EventType.audit, AuditEventTypeAction.getType())
        test.equal(action, NullEventAction.undefined)
        test.end()
      } catch (e) {
        test.fail(e)
        test.end()
      }
    })

    await EventMessageTest.test('AuditEventTypeAction should get type and action', async (test) => {
      try {
        let { type, action } = new AuditEventTypeAction({ action: AuditEventAction.default })
        test.equal(EventType.audit, type)
        test.equal(EventType.audit, AuditEventTypeAction.getType())
        test.equal(action, AuditEventAction.default)
        test.end()
      } catch (e) {
        test.fail(e)
        test.end()
      }
    })

    await EventMessageTest.test('TraceEventTypeAction should get undefined action', async (test) => {
      try {
        let { type, action } = new TraceEventTypeAction()
        test.equal(EventType.trace, type)
        test.equal(EventType.trace, TraceEventTypeAction.getType())
        test.equal(action, NullEventAction.undefined)
        test.end()
      } catch (e) {
        test.fail(e)
        test.end()
      }
    })

    await EventMessageTest.test('TraceEventTypeAction should get type and action', async (test) => {
      try {
        let { type, action } = new TraceEventTypeAction({ action: TraceEventAction.span })
        test.equal(EventType.trace, type)
        test.equal(EventType.trace, TraceEventTypeAction.getType())
        test.equal(action, TraceEventAction.span)
        test.end()
      } catch (e) {
        test.fail(e)
        test.end()
      }
    })

    await EventMessageTest.test('should create a log/debug EventMessage', async (test) => {
      try {
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
          type: 'application/json',
          metadata: {
            event: new EventMetadata({
              id: '3920382d-f78c-4023-adf9-0d7a4a2a3a2f',
              type: EventType.log,
              action: LogEventAction.info,
              createdAt: '2019-05-29T23:18:32.935Z',
              state: {
                status: EventStatusType.success,
                code: 0,
                description: 'action successful'
              },
              responseTo: '1a396c07-47ab-4d68-a7a0-7a1ea36f0012'
            }),
            trace: {
              service: 'central-ledger-prepare-handler',
              traceId: 'bbd7b2c7-3978-408e-ae2e-a13012c47739',
              parentSpanId: '4e3ce424-d611-417b-a7b3-44ba9bbc5840',
              spanId: 'efeb5c22-689b-4d04-ac5a-2aa9cd0a7e87'
            }
          }
        }

        test.equal(event.metadata.event.state.code, 0)

        test.end()
      } catch (e) {
        test.fail(`Error Thrown - ${e}`)
        test.end()
      }
    })

    await EventMessageTest.test('should create a log/debug EventMessage using a factory method', async (test) => {
      try {
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
          type: 'application/json',
          metadata: {
            event: new EventMetadata({
              id: '3920382d-f78c-4023-adf9-0d7a4a2a3a2f',
              type: EventType.log,
              action: LogEventAction.info,
              createdAt: '2019-05-29T23:18:32.935Z',
              state: {
                status: EventStatusType.success,
                code: 0,
                description: 'action successful'
              },
              responseTo: '1a396c07-47ab-4d68-a7a0-7a1ea36f0012'
            }),
            trace: {
              service: 'central-ledger-prepare-handler',
              traceId: 'bbd7b2c7-3978-408e-ae2e-a13012c47739',
              parentSpanId: '4e3ce424-d611-417b-a7b3-44ba9bbc5840',
              spanId: 'efeb5c22-689b-4d04-ac5a-2aa9cd0a7e87'
            }
          }
        }

        test.equal(event.metadata.event.state.code, 0)

        test.end()
      } catch (e) {
        test.fail(`Error Thrown - ${e}`)
        test.end()
      }
    })

    await EventMessageTest.test('should create the minimum required EventMessage', async (test) => {
      const ID = 'aa398930-f210-4dcd-8af0-7c769cea1660'
      try {
        const event = {
          id: ID,
          type: 'application/json',
          content: {}
        }

        test.equal(event.id, ID)

        test.end()
      } catch (e) {
        test.fail(`Error Thrown - ${e}`)
        test.end()
      }
    })

    await EventMessageTest.test('should create an EventMessage building it', async (test) => {
      const id = 'aa398930-f210-4dcd-8af0-7c769cea1660'
      try {
        const message = new EventMessage({ id, type: 'application/json', content: {} })
        message.metadata = {
          event: {
            id,
            type: EventType.log,
            action: LogEventAction.info,
            createdAt: (new Date()).toISOString(),
            state: new EventStateMetadata(EventStatusType.success)
          },
          trace: new EventTraceMetadata({ service: 'service_1' })
        }

        test.equal(message.id, id)

        test.end()
      } catch (e) {
        test.fail(`Error Thrown - ${e}`)
        test.end()
      }
    })

    await EventMessageTest.test('should create an EventMessage using the EventMetadata factory methods', async (test) => {
      const id = 'aa398930-f210-4dcd-8af0-7c769cea1660'
      try {
        const message = new EventMessage({ id, type: 'application/json', content: {} })
        message.metadata = {
          event: {
            id,
            type: EventType.log,
            action: LogEventAction.verbose,
            createdAt: (new Date()).toISOString(),
            state: new EventStateMetadata(EventStatusType.success)
          },
          trace: new EventTraceMetadata({ service: 'service_1' })
        }
        test.equal(message.metadata.event.type, EventType.log)
        test.equal(message.metadata.event.action, LogEventAction.verbose)

        message.metadata = {
          event: {
            id,
            type: EventType.log,
            action: LogEventAction.debug,
            createdAt: (new Date()).toISOString(),
            state: new EventStateMetadata(EventStatusType.success)
          },
          trace: new EventTraceMetadata({ service: 'service_1' })
        }
        test.equal(message.metadata.event.type, EventType.log)
        test.equal(message.metadata.event.action, LogEventAction.debug)

        message.metadata = {
          event: {
            id,
            type: EventType.audit,
            action: AuditEventAction.default,
            createdAt: (new Date()).toISOString(),
            state: new EventStateMetadata(EventStatusType.success)
          },
          trace: new EventTraceMetadata({ service: 'service_1' })
        }

        test.equal(message.metadata.event.type, EventType.audit)
        test.equal(message.metadata.event.action, AuditEventAction.default)

        message.metadata = {
          event: {
            id,
            type: EventType.trace,
            action: TraceEventAction.span,
            createdAt: (new Date()).toISOString(),
            state: new EventStateMetadata(EventStatusType.success)
          },
          trace: new EventTraceMetadata({ service: 'service_1' })
        }
        test.equal(message.metadata.event.type, EventType.trace)
        test.equal(message.metadata.event.action, TraceEventAction.span)

        message.metadata = {
          event: {
            id,
            type: EventType.log,
            action: LogEventAction.error,
            createdAt: (new Date()).toISOString(),
            state: new EventStateMetadata(EventStatusType.success)
          },
          trace: new EventTraceMetadata({ service: 'service_1' })
        }
        test.equal(message.metadata.event.type, EventType.log)
        test.equal(message.metadata.event.action, LogEventAction.error)

        test.end()
      } catch (e) {
        test.fail(`Error Thrown - ${e}`)
        test.end()
      }
    })

    await EventMessageTest.test('should create an EventMetadata using Date as the createdAt type', async (test) => {
      let createdAt = new Date()
      let id = 'a'
      let { type, action } = new LogEventTypeAction(LogEventAction.debug)
      let state = new EventStateMetadata(EventStatusType.success)
      let meta = new EventMetadata({ id, type, action, createdAt, state })
      test.equal(meta.createdAt, createdAt.toISOString())
      test.end()
    })

    await EventMessageTest.test('should create an EventTraceMetadata using Date as the createdAt type', async (test) => {
      let startTimestamp = new Date()
      let service = 'a'
      let meta = new EventTraceMetadata({ startTimestamp, service })
      test.equal(meta.startTimestamp, startTimestamp.toISOString())
      test.end()
    })

    await EventMessageTest.test('should create LogResponses of different status', async (test) => {
      let response = new LogResponse(LogResponseStatus.UNDEFINED)
      test.equal(response.status, LogResponseStatus.UNDEFINED)
      response = new LogResponse(LogResponseStatus.accepted)
      test.equal(response.status, LogResponseStatus.accepted)
      test.end()
    })

    await EventMessageTest.test('should create an EventTraceMetadata and finish it', async (test) => {
      let now = new Date()
      let trace = Tracer.createSpan('a')
      trace.finish()
      test.ok(trace.traceContext.finishTimestamp)
      trace.finish(now)
      test.deepEqual(now.toISOString(), trace.traceContext.finishTimestamp)
      trace.finish(now.toISOString())
      test.deepEqual(now.toISOString(), trace.traceContext.finishTimestamp)
      test.end()
    })

    await EventMessageTest.test('should throw Error when creating an EventTraceMetadata with invalid trace id', async (test) => {
      test.throws(() => new EventTraceMetadata({ service: 'a', traceId: 'b' }), Error)
      test.end()
    })

    await EventMessageTest.test('should throw Error when creating an EventTraceMetadata with invalid span id', async (test) => {
      test.throws(() => new EventTraceMetadata({ service: 'a', spanId: 'b' }), Error)
      test.end()
    })

    await EventMessageTest.test('should throw Error when creating an EventTraceMetadata with invalid parentSpan id', async (test) => {
      test.throws(() => new EventTraceMetadata({ service: 'a', parentSpanId: 'b' }), Error)
      test.end()
    })

    await EventMessageTest.test('GetContext should return the context', async (test) => {
      let context = {
        'startTimestamp': '2019-07-16T11:40:44.320Z',
        'service': 'new-span',
        'traceId': '17cb38fa88cc98aa8d1aa15d230b7e6a',
        'spanId': '6ae55cdac0c97978',
        'tags': {}
      }

      let trace = Tracer.createChildSpanFromContext(context.service, context)
      test.equal(context.traceId, trace.getContext().traceId)
      test.end()
    })

    await EventMessageTest.end()
  })

  const messageProtocol = {
    id: 'xyz1234',
    to: 'DFSP1',
    from: 'DFSP1',
    type: 'application/json',
    content: {
      headers: {},
      payload: 'http://example.com/v1/go'
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

  let config_with_sidecar = {
    SIDECAR_DISABLED: false,
    EVENT_LOGGER_SERVER_HOST: 'localhost',
    EVENT_LOGGER_SERVER_PORT: 50051
  }

  // process.env.EVENT_SDK_SIDECAR_DISABLED = 'false'

  let Span = proxyquire('../../lib/Span', { '../config/default.json': config_with_sidecar })

  let grpcClient = new EventLoggingServiceClient(config_with_sidecar.EVENT_LOGGER_SERVER_HOST, config_with_sidecar.EVENT_LOGGER_SERVER_PORT)
  let tracer = Tracer.createSpan('span', {}, { defaultRecorder: new DefaultSidecarRecorder(grpcClient) })
  sinon.stub(grpcClient.grpcClient, 'log').callsFake((wireEvent, cb) => {
    cb(null, new LogResponse(LogResponseStatus.accepted))
  })
  await eventLoggerTests.test('Tracer should create a parent span', async (test) => {
    try {
      await tracer.info({ content: { messageProtocol } })
      await tracer.debug({ content: { messageProtocol } })
      await tracer.verbose({ content: { messageProtocol } })
      await tracer.error({ content: { messageProtocol } })
      await tracer.warning({ content: { messageProtocol } })
      await tracer.performance({ content: { messageProtocol } })
      test.equal(tracer.traceContext.service, 'span')
      test.end()
    } catch (e) {
      test.fail(e)
      test.end()
    }
  })

  // config.SIDECAR_DISABLED = true

  let newTracer = Tracer.createSpan('service1')
  newTracer.setTags({ tag: 'value' })
  await eventLoggerTests.test('Tracer should get child span', async (test) => {
    let child = newTracer.getChild('service2')
    test.equal(newTracer.traceContext.spanId, child.traceContext.parentSpanId, 'parentSpanId taken from parent spanId')
    test.equal(newTracer.traceContext.traceId, child.traceContext.traceId, 'traceId same as parent trace')
    test.equal(child.traceContext.service, 'service2')
    test.deepEqual(child.traceContext.tags, { tag: 'value' }, 'tags match')
    let traceContext = child.getContext()
    let IIChild = Tracer.createChildSpanFromContext('service3', traceContext)
    test.equal(child.traceContext.spanId, IIChild.traceContext.parentSpanId, 'parentSpanId taken from parent spanId')
    test.equal(newTracer.traceContext.traceId, IIChild.traceContext.traceId, 'traceId same as parent trace')
    test.equal(IIChild.traceContext.service, 'service3')
    let newMessage = await IIChild.injectContextToMessage(messageProtocol)
    let expected = Object.assign({}, messageProtocol, { metadata: { event: messageProtocol.metadata.event, trace: IIChild.getContext() } })
    test.equal(JSON.stringify(newMessage), JSON.stringify(expected))
    let extractedContext = Tracer.extractContextFromMessage(newMessage)
    let IIIChild = Tracer.createChildSpanFromContext('service4', extractedContext)
    test.equal(IIChild.traceContext.spanId, IIIChild.traceContext.parentSpanId, 'parentSpanId taken from parent spanId')
    test.equal(newTracer.traceContext.traceId, IIIChild.traceContext.traceId, 'traceId same as parent trace')
    test.equal(IIIChild.traceContext.service, 'service4')
    let finishtime = new Date()
    await newTracer.finish(finishtime)
    test.deepEqual(finishtime.toISOString(), newTracer.traceContext.finishTimestamp)
    try {
      await newTracer.finish()
      test.fail('should throw')
      test.end()
    } catch (e) {
      test.ok(e)
    }
    try {
      await newTracer.audit(newMessage)
      test.fail('should throw')
      test.end()
    } catch (e) {
      test.ok(e)
    }

    // try {
    //   await child.trace(null, { state: { status: 'fake' } })
    //   test.fail('should throw')
    // } catch (e) {
    //   test.ok(e)
    // }
    let logresult = await child.audit(newMessage)
    test.ok(logresult)

    await child.info('message')
    await child.debug('message')
    await child.verbose('message')
    await child.error('message')
    await child.warning('message')
    await child.performance('message')

    test.end()
  })

  // eventLoggerTests.test('EventLoger should create a child span', async (test: any) => {
  //   let rootSpan = await eventLogger.createSpanForMessageEnvelope(messageProtocol, 'ml-api-adapter');
  //   // const topicConfig = Utility.createGeneralTopicConf(TRANSFER, PREPARE, message.transferId)
  //   // Logger.debug(`domain::transfer::prepare::messageProtocol - ${messageProtocol}`)
  //   let childSpan1 = await eventLogger.createChildSpanForMessageEnvelope(messageProtocol, rootSpan, 'ml-api-adapter-stage1')
  //   await eventLogger.logSpan(childSpan1);
  //   await eventLogger.logSpan(rootSpan);
  //   test.equal(childSpan1.traceId, rootSpan.traceId)
  //   test.equal(childSpan1.parentSpanId, rootSpan.spanId)
  //   test.notEqual(childSpan1.spanId, rootSpan.spanId)
  //   test.end()
  // })

  await eventLoggerTests.end()
})
