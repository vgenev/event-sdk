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

const sinon = require('sinon');
const Test = require('tapes')(require('tape'))
const Uuid = require('uuid4')

import {
  EventMessage,
  EventMetadata,
  LogEventTypeAction,
  LogEventAction,
  EventStatusType,
  MessageMetadata,
  EventStateMetadata,
  EventTraceMetadata,
  AuditEventAction,
  TraceEventAction,
  ErrorEventAction,
  EventType,
  LogResponse,
  LogResponseStatus,
  newTraceId,
  newSpanId
} from "../../src/model/EventMessage"

import {
  DefaultEventLogger
} from "../../src/DefaultEventLogger"

Test('EventLogger Class Test', (eventLoggerTests: any) => {

  eventLoggerTests.test('EventMessage', (EventMessageTest: any) => {
    EventMessageTest.test('should create a log/debug EventMessage', async (test: any) => {
      try {
        const event: EventMessage = {
          from: "noresponsepayeefsp",
          to: "payerfsp",
          id: "aa398930-f210-4dcd-8af0-7c769cea1660",
          content: {
            headers: {
              "content-type": "application/vnd.interoperability.transfers+json;version=1.0",
              date: "2019-05-28T16:34:41.000Z",
              "fspiop-source": "noresponsepayeefsp",
              "fspiop-destination": "payerfsp",
              priority: 100,
              blocking: false
            },
            payload: "data:application/vnd.interoperability.transfers+json;version=1.0;base64,ewogICJmdWxmaWxtZW50IjogIlVObEo5OGhaVFlfZHN3MGNBcXc0aV9VTjN2NHV0dDdDWkZCNHlmTGJWRkEiLAogICJjb21wbGV0ZWRUaW1lc3RhbXAiOiAiMjAxOS0wNS0yOVQyMzoxODozMi44NTZaIiwKICAidHJhbnNmZXJTdGF0ZSI6ICJDT01NSVRURUQiCn0"
          },
          type: "application/json",
          metadata: {
            event: new EventMetadata(
              "3920382d-f78c-4023-adf9-0d7a4a2a3a2f",
              new LogEventTypeAction(LogEventAction.debug),
              "2019-05-29T23:18:32.935Z",
              {
                status: EventStatusType.success,
                code: 0,
                description: "action successful"
              },
              "1a396c07-47ab-4d68-a7a0-7a1ea36f0012"
            )
            ,
            trace: {
              service: "central-ledger-prepare-handler",
              traceId: "bbd7b2c7-3978-408e-ae2e-a13012c47739",
              parentSpanId: "4e3ce424-d611-417b-a7b3-44ba9bbc5840",
              spanId: "efeb5c22-689b-4d04-ac5a-2aa9cd0a7e87"
            } as EventTraceMetadata
          }
        }

        test.equal(event.metadata!.event.state.code, 0)

        test.end()
      } catch (e) {
        test.fail(`Error Thrown - ${e}`)
        test.end()
      }
    })


    EventMessageTest.test('should create a log/debug EventMessage using a factory method', async (test: any) => {
      try {
        const event: EventMessage = {
          from: "noresponsepayeefsp",
          to: "payerfsp",
          id: "aa398930-f210-4dcd-8af0-7c769cea1660",
          content: {
            headers: {
              "content-type": "application/vnd.interoperability.transfers+json;version=1.0",
              date: "2019-05-28T16:34:41.000Z",
              "fspiop-source": "noresponsepayeefsp",
              "fspiop-destination": "payerfsp",
              priority: 100,
              blocking: false
            },
            payload: "data:application/vnd.interoperability.transfers+json;version=1.0;base64,ewogICJmdWxmaWxtZW50IjogIlVObEo5OGhaVFlfZHN3MGNBcXc0aV9VTjN2NHV0dDdDWkZCNHlmTGJWRkEiLAogICJjb21wbGV0ZWRUaW1lc3RhbXAiOiAiMjAxOS0wNS0yOVQyMzoxODozMi44NTZaIiwKICAidHJhbnNmZXJTdGF0ZSI6ICJDT01NSVRURUQiCn0"
          },
          type: "application/json",
          metadata: {
            event: EventMetadata.log(
              "3920382d-f78c-4023-adf9-0d7a4a2a3a2f",
              LogEventAction.debug,
              "2019-05-29T23:18:32.935Z",
              {
                status: EventStatusType.success,
                code: 0,
                description: "action successful"
              },
              "1a396c07-47ab-4d68-a7a0-7a1ea36f0012"
            )
            ,
            trace: {
              service: "central-ledger-prepare-handler",
              traceId: "bbd7b2c7-3978-408e-ae2e-a13012c47739",
              parentSpanId: "4e3ce424-d611-417b-a7b3-44ba9bbc5840",
              spanId: "efeb5c22-689b-4d04-ac5a-2aa9cd0a7e87"
            } as EventTraceMetadata
          }
        }

        test.equal(event.metadata!.event.state.code, 0)

        test.end()
      } catch (e) {
        test.fail(`Error Thrown - ${e}`)
        test.end()
      }
    })

    EventMessageTest.test('should create the minimum required EventMessage', async (test: any) => {
      const ID = "aa398930-f210-4dcd-8af0-7c769cea1660";
      try {
        const event: EventMessage = {
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

    EventMessageTest.test('should create an EventMessage building it', async (test: any) => {
      const ID = "aa398930-f210-4dcd-8af0-7c769cea1660";
      try {
        const event: EventMessage = new EventMessage(ID, 'application/json', {})
        event.metadata = new MessageMetadata(
          new EventMetadata(ID, new LogEventTypeAction(LogEventAction.debug), (new Date()).toISOString(), new EventStateMetadata(EventStatusType.success)),
          new EventTraceMetadata("service_1", newTraceId(), newSpanId())
        )

        test.equal(event.id, ID)

        test.end()
      } catch (e) {
        test.fail(`Error Thrown - ${e}`)
        test.end()
      }
    })

    EventMessageTest.test('should create an EventMessage using the EventMetadata factory methods', async (test: any) => {
      const ID = "aa398930-f210-4dcd-8af0-7c769cea1660";
      try {
        const event: EventMessage = new EventMessage(ID, 'application/json', {})
        event.metadata = new MessageMetadata(
          EventMetadata.create(ID, new LogEventTypeAction(LogEventAction.verbose), (new Date()).toISOString(), new EventStateMetadata(EventStatusType.success)),
          new EventTraceMetadata("service_1", newTraceId(), newSpanId())
        )
        test.equal(event.metadata.event.type, EventType.log)
        test.equal(event.metadata.event.action, LogEventAction.verbose)


        event.metadata = new MessageMetadata(
          EventMetadata.log(ID, LogEventAction.debug, (new Date()).toISOString(), new EventStateMetadata(EventStatusType.success)),
          new EventTraceMetadata("service_1", newTraceId(), newSpanId())
        )
        test.equal(event.metadata.event.type, EventType.log)
        test.equal(event.metadata.event.action, LogEventAction.debug)

        event.metadata = new MessageMetadata(
          EventMetadata.audit(ID, AuditEventAction.default, (new Date()).toISOString(), new EventStateMetadata(EventStatusType.success)),
          new EventTraceMetadata("service_1", newTraceId(), newSpanId())
        )
        test.equal(event.metadata.event.type, EventType.audit)
        test.equal(event.metadata.event.action, AuditEventAction.default)

        event.metadata = new MessageMetadata(
          EventMetadata.trace(ID, TraceEventAction.span, (new Date()).toISOString(), new EventStateMetadata(EventStatusType.success)),
          new EventTraceMetadata("service_1", newTraceId(), newSpanId())
        )
        test.equal(event.metadata.event.type, EventType.trace)
        test.equal(event.metadata.event.action, TraceEventAction.span)

        event.metadata = new MessageMetadata(
          EventMetadata.error(ID, ErrorEventAction.internal, (new Date()).toISOString(), new EventStateMetadata(EventStatusType.success)),
          new EventTraceMetadata("service_1", newTraceId(), newSpanId())
        )
        test.equal(event.metadata.event.type, EventType.error)
        test.equal(event.metadata.event.action, ErrorEventAction.internal)

        test.end()
      } catch (e) {
        test.fail(`Error Thrown - ${e}`)
        test.end()
      }
    })

    EventMessageTest.test('should create an EventMetadata using Date as the createdAt type', async (test: any) => {
      let now = new Date()
      let meta = new EventMetadata('a', new LogEventTypeAction(LogEventAction.debug), now, new EventStateMetadata(EventStatusType.success))
      test.equal(meta.createdAt, now.toISOString());
      test.end()
    })

    EventMessageTest.test('should create an EventTraceMetadata using Date as the createdAt type', async (test: any) => {
      let now = new Date()
      let meta = new EventTraceMetadata('a', newTraceId(), newSpanId(), undefined, undefined, undefined, now)
      test.equal(meta.startTimestamp, now.toISOString());
      test.end()
    })

    EventMessageTest.test('should create an EventTraceMetadata using string as the createdAt type', async (test: any) => {
      let now = new Date()
      let meta = new EventTraceMetadata('a', newTraceId(), newSpanId(), undefined, undefined, undefined, now.toISOString())
      test.equal(meta.startTimestamp, now.toISOString());
      test.end()
    })

    EventMessageTest.test('should create LogResponses of different status', async (test: any) => {
      let response = new LogResponse(LogResponseStatus.UNDEFINED)
      test.equal(response.status, LogResponseStatus.UNDEFINED)
      response = new LogResponse(LogResponseStatus.accepted)
      test.equal(response.status, LogResponseStatus.accepted)
      test.end()
    })

    EventMessageTest.test('should create an EventTraceMetadata and finish it', async (test: any) => {
      let now = new Date()
      let meta = new EventTraceMetadata('a', newTraceId(), newSpanId())
      meta.finish()
      test.ok(meta.finishTimestamp);
      meta.finish(now)
      test.deepEqual(now.toISOString(),meta.finishTimestamp)
      meta.finish(now.toISOString())
      test.deepEqual(now.toISOString(),meta.finishTimestamp)
      test.end()
    })

    EventMessageTest.test('should throw Error when creating an EventTraceMetadata with invalid traceId', async (test: any) => {
      test.throws(() => new EventTraceMetadata('a', 'b', 'c'), Error);
      test.end()
    })

    EventMessageTest.test('should throw Error when creating an EventTraceMetadata with invalid spanId', async (test: any) => {
      test.throws(() => new EventTraceMetadata('a', newTraceId(), 'c'), Error);
      test.end()
    })

    EventMessageTest.test('should throw Error when creating an EventTraceMetadata with invalid parentSpanId', async (test: any) => {
      test.throws(() => new EventTraceMetadata('a', newTraceId(), newSpanId(), 'c'), Error);
      test.end()
    })

    EventMessageTest.end()
  })

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

  let eventLogger = new DefaultEventLogger(undefined);
  sinon.stub(eventLogger.client.grpcClient, "log").callsFake((wireEvent: any, cb: any) => {
    cb(null, new LogResponse(LogResponseStatus.accepted))
  });

  eventLoggerTests.test('EventLoger should create a parent span', async (test: any) => {
    let rootSpan = await eventLogger.createSpanForMessageEnvelope(messageProtocol, 'ml-api-adapter');
    await eventLogger.logSpan(rootSpan);
    test.end()
  })
  
  eventLoggerTests.test('EventLoger should create a child span', async (test: any) => {
    let rootSpan = await eventLogger.createSpanForMessageEnvelope(messageProtocol, 'ml-api-adapter');
    // const topicConfig = Utility.createGeneralTopicConf(TRANSFER, PREPARE, message.transferId)
    // Logger.debug(`domain::transfer::prepare::messageProtocol - ${messageProtocol}`)
    let childSpan1 = await eventLogger.createChildSpanForMessageEnvelope(messageProtocol, rootSpan, 'ml-api-adapter-stage1')
    await eventLogger.logSpan(childSpan1);
    await eventLogger.logSpan(rootSpan);
    test.equal(childSpan1.traceId, rootSpan.traceId)
    test.equal(childSpan1.parentSpanId, rootSpan.spanId)
    test.notEqual(childSpan1.spanId, rootSpan.spanId)
    test.end()
  })


  eventLoggerTests.end()
})
