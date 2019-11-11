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

import { 
  AuditEventTypeAction,
  EventType,
  LogEventAction, 
  LogEventTypeAction,
  NullEventAction,
  AuditEventAction,
  TraceEventTypeAction,
  TraceEventAction,
  EventMessage,
  EventMetadata,
  EventStatusType,
  EventTraceMetadata,
  EventStateMetadata,
  TypeMessageMetadata,
  LogResponse,
  LogResponseStatus
} from "../../../src/model/EventMessage"
import { Tracer } from "../../../src/Tracer"

describe('EventMessage', () => {
  describe('LogEventTypeAction', () => {
    it('should get undefined action', async () => {
      // Arrange
      // Act
      const { type, action } = new LogEventTypeAction()
      
      // Assert
      expect(action).toBe(NullEventAction.undefined)
      expect(type).toBe(EventType.log)
      expect(LogEventTypeAction.getType()).toBe(EventType.log)
    })

    it('should get type and action', async () => {
      // Arrange

      // Act
      const { type, action } = new LogEventTypeAction({ action: LogEventAction.info })

      // Assert
      expect(action).toBe(LogEventAction.info)
      expect(type).toBe(EventType.log)
      expect(LogEventTypeAction.getType()).toBe(EventType.log)
    })
  })

  describe('AuditEventTypeAction', () => {
    it('should get undefined action', async () => {
      // Arrange
      // Act
      const { type, action } = new AuditEventTypeAction()

      // Assert
      expect(action).toBe(NullEventAction.undefined)
      expect(type).toBe(EventType.audit)
      expect(AuditEventTypeAction.getType()).toBe(EventType.audit)
    })

    it('should get type and action', async () => {
      // Arrange
      // Act
      const { type, action } = new AuditEventTypeAction({ action: AuditEventAction.default })

      // Assert
      expect(action).toBe(AuditEventAction.default)
      expect(type).toBe(EventType.audit)
      expect(AuditEventTypeAction.getType()).toBe(EventType.audit)
    })
  })

  describe('TraceEventTypeAction', () => {
    it('should get undefined action', async () => {
      // Arrange
      // Act
      const { type, action } = new TraceEventTypeAction()

      // Assert
      expect(action).toBe(NullEventAction.undefined)
      expect(type).toBe(EventType.trace)
      expect(TraceEventTypeAction.getType()).toBe(EventType.trace)
    })

    it('should get type and action', async () => {
      // Arrange
      // Act
      const { type, action } = new TraceEventTypeAction({ action: TraceEventAction.span })

      // Assert
      expect(action).toBe(TraceEventAction.span)
      expect(type).toBe(EventType.trace)
      expect(TraceEventTypeAction.getType()).toBe(EventType.trace)
    })
  })

  describe('EventMessage creation', () => {
    it('should create a log/debug EventMessage', async () => {
      // Arrange
      // Act
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
          event: new EventMetadata({
            id: "3920382d-f78c-4023-adf9-0d7a4a2a3a2f",
            type: EventType.log,
            action: LogEventAction.info,
            createdAt: "2019-05-29T23:18:32.935Z",
            state: {
              status: EventStatusType.success,
              code: 0,
              description: "action successful"
            },
            responseTo: "1a396c07-47ab-4d68-a7a0-7a1ea36f0012"
          }),
          trace: {
            service: "central-ledger-prepare-handler",
            traceId: "bbd7b2c7-3978-408e-ae2e-a13012c47739",
            parentSpanId: "4e3ce424-d611-417b-a7b3-44ba9bbc5840",
            spanId: "efeb5c22-689b-4d04-ac5a-2aa9cd0a7e87"
          } as EventTraceMetadata
        }
      }

      // Assert
      expect(event.metadata!.event.state.code).toBe(0)
    })

    it('should create a log/debug EventMessage using a factory method', async () => {
      // Arrange
      // Act
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
          event: new EventMetadata({
            id: "3920382d-f78c-4023-adf9-0d7a4a2a3a2f",
            type: EventType.log,
            action: LogEventAction.info,
            createdAt: "2019-05-29T23:18:32.935Z",
            state: {
              status: EventStatusType.success,
              code: 0,
              description: "action successful"
            },
            responseTo: "1a396c07-47ab-4d68-a7a0-7a1ea36f0012"
          }),
          trace: {
            service: "central-ledger-prepare-handler",
            traceId: "bbd7b2c7-3978-408e-ae2e-a13012c47739",
            parentSpanId: "4e3ce424-d611-417b-a7b3-44ba9bbc5840",
            spanId: "efeb5c22-689b-4d04-ac5a-2aa9cd0a7e87"
          } as EventTraceMetadata
        }
      }

      // Assert
      expect(event.metadata!.event.state.code).toBe(0)
    })

    it('should create the minimum required EventMessage', async () => {
      // Arrange
      const id = "aa398930-f210-4dcd-8af0-7c769cea1660"

      // Act
      const event: EventMessage = {
        id,
        type: 'application/json',
        content: {}
      }

      // Assert
      expect(event.id).toBe(id)
    })

    it('should create an EventMessage building it', async () => {
      // Arrange
      const id = "aa398930-f210-4dcd-8af0-7c769cea1660"

      // Act
      const message: EventMessage = new EventMessage({ id, type: 'application/json', content: {} })
      message.metadata = {
        event: {
          id,
          type: EventType.log,
          action: LogEventAction.info,
          createdAt: (new Date()).toISOString(),
          state: new EventStateMetadata(EventStatusType.success)
        },
        trace: new EventTraceMetadata({ service: "service_1" })
      } as TypeMessageMetadata
        
      // Assert
      expect(message.id).toBe(id)
    })

    describe('EventMetadata factory methods', () => {
      const id = "aa398930-f210-4dcd-8af0-7c769cea1660"

      it('should create an EventMessage with EventType.log', () => {
        // Arrange
        // Act
        const message: EventMessage = new EventMessage({ id, type: 'application/json', content: {} })
        message.metadata = {
          event: {
            id,
            type: EventType.log,
            action: LogEventAction.verbose,
            createdAt: (new Date()).toISOString(),
            state: new EventStateMetadata(EventStatusType.success)
          },
          trace: new EventTraceMetadata({ service: "service_1" })
        } as TypeMessageMetadata
        
        // Assert
        expect(message.metadata!.event.type).toBe(EventType.log)
        expect(message.metadata!.event.action).toBe(LogEventAction.verbose)
      })

      it('should create an EventMessage with EventType.audit', () => {
        // Arrange
        // Act
        const message: EventMessage = new EventMessage({ id, type: 'application/json', content: {} })
        message.metadata = {
          event: {
            id,
            type: EventType.audit,
            action: AuditEventAction.default,
            createdAt: (new Date()).toISOString(),
            state: new EventStateMetadata(EventStatusType.success)
          },
          trace: new EventTraceMetadata({ service: "service_1" })
        } as TypeMessageMetadata
        
        // Assert
        expect(message.metadata!.event.type).toBe(EventType.audit)
        expect(message.metadata!.event.action).toBe(AuditEventAction.default)
      })

      it('should create an EventMessage with EventType.trace', () => {
        // Arrange
        // Act
        const message: EventMessage = new EventMessage({ id, type: 'application/json', content: {} })
        message.metadata = {
          event: {
            id,
            type: EventType.trace,
            action: TraceEventAction.span,
            createdAt: (new Date()).toISOString(),
            state: new EventStateMetadata(EventStatusType.success)
          },
          trace: new EventTraceMetadata({ service: "service_1" })
        } as TypeMessageMetadata

        // Assert
        expect(message.metadata!.event.type).toBe(EventType.trace)
        expect(message.metadata!.event.action).toBe(TraceEventAction.span)
      })

      it('should create an EventMessage with EventType.trace', () => {
        // Arrange
        // Act
        const message: EventMessage = new EventMessage({ id, type: 'application/json', content: {} })
        message.metadata = {
          event: {
            id,
            type: EventType.trace,
            action: TraceEventAction.span,
            createdAt: (new Date()).toISOString(),
            state: new EventStateMetadata(EventStatusType.success)
          },
          trace: new EventTraceMetadata({ service: "service_1" })
        } as TypeMessageMetadata

        // Assert
        expect(message.metadata!.event.type).toBe(EventType.trace)
        expect(message.metadata!.event.action).toBe(TraceEventAction.span)
      })

      it('should create an EventMessage with EventType.log', () => {
        // Arrange
        // Act
        const message: EventMessage = new EventMessage({ id, type: 'application/json', content: {} })
        message.metadata = {
          event: {
            id,
            type: EventType.log,
            action: LogEventAction.error,
            createdAt: (new Date()).toISOString(),
            state: new EventStateMetadata(EventStatusType.success)
          },
          trace: new EventTraceMetadata({ service: "service_1" })
        } as TypeMessageMetadata

        // Assert
        expect(message.metadata!.event.type).toBe(EventType.log)
        expect(message.metadata!.event.action).toBe(LogEventAction.error)
      })
    })

    it('should create an EventMetadata using Date as the createdAt type', async () => {
      // Arrange
      let createdAt = new Date()
      let id = 'a'

      // Act
      let { type, action } = new LogEventTypeAction(LogEventAction.debug)
      let state = new EventStateMetadata(EventStatusType.success)
      let meta = new EventMetadata({ id, type, action, createdAt, state })

      // Assert
      expect(meta.createdAt).toBe(createdAt.toISOString())
    })

    it('should create an EventTraceMetadata using Date as the createdAt type', async () => {
      // Arrange
      let startTimestamp = new Date()
      let service = 'a'
      
      // Act
      let meta = new EventTraceMetadata({ startTimestamp, service })

      // Assert
      expect(meta.startTimestamp).toBe(startTimestamp.toISOString())
    })

    it('should create LogResponses of of undefined status', async () => {
      // Arrange
      // Act
      const response = new LogResponse(LogResponseStatus.UNDEFINED)
      
      // Assert
      expect(response.status).toBe(LogResponseStatus.UNDEFINED)
    })

    it('should create LogResponses of of accepted status', async () => {
      // Arrange
      // Act
      const response = new LogResponse(LogResponseStatus.accepted)
      
      // Assert
      expect(response.status).toBe(LogResponseStatus.accepted)
    })

    it('should throw Error when creating an EventTraceMetadata with invalid trace id', async () => {
      // Arrange
      
      // Act
      const action = () => new EventTraceMetadata({ service: 'a', traceId: 'b' })
      
      // Assert
      expect(action).toThrowError()
    })

    it('should throw Error when creating an EventTraceMetadata with invalid span id', async () => {
      // Arrange
      
      // Act
      const action = () => new EventTraceMetadata({ service: 'a', spanId: 'b' })
      
      // Assert
      expect(action).toThrowError()
    })

    it('should throw Error when creating an EventTraceMetadata with invalid parentSpan id', async () => {
      // Arrange
      
      // Act
      const action = () => new EventTraceMetadata({ service: 'a', parentSpanId: 'b' })
      
      // Assert
      expect(action).toThrowError()
    })
  })

  describe('getContext', () => {
    it('should return the context', () => {
      // Arrange
      const context = {
        "startTimestamp": "2019-07-16T11:40:44.320Z",
        "service": "new-span",
        "traceId": "17cb38fa88cc98aa8d1aa15d230b7e6a",
        "spanId": "6ae55cdac0c97978",
        "tags": {}
      }
      
      // Act
      const trace = Tracer.createChildSpanFromContext(context.service, context)

      // Assert
      expect(trace.getContext().traceId).toBe(context.traceId)
    })
  })

})