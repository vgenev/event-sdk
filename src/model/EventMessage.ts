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

const Uuid = require('uuid4')


/**
 * EventType represents the different types of events.
 * This enum is not exported; see `EventTypeAction` below.
 */
// FIXME enum values should be ALL CAPS ( typescript style ) ?
enum EventType {
  undefined = "undefined",
  log = "log",
  audit = "audit",
  error = "error",
  trace = "trace",
}

enum LogEventAction {
  info = "info",
  debug = "debug",
  verbose = "verbose",
  perf = "perf",
}

enum AuditEventAction {
  default = "default"
}

enum ErrorEventAction {
  internal = "internal",
  external = "external"
}

enum TraceEventAction {
  start = "start",
  end = "end",
}

enum NullEventAction {
  undefined = "undefined",
}

/**
 * This `EventTypeAction` hierarchy models the restrictions between types and actions.
 * Each `EventType` can only have a specific set of `EventActions`
 * Each concrete subclass defines the EventType as the static readonly prop `type`,
 * and the `action` property is restricted to the specific enum type.
 * `EventTypeAction` is not exported, clients need to use the concrete subclasses.
 */
abstract class EventTypeAction {
  static readonly type: EventType = EventType.undefined
  action: AuditEventAction | ErrorEventAction | LogEventAction | TraceEventAction | NullEventAction = NullEventAction.undefined

  /**
   * Returns the `EventType` specific to each subclass.
   */
  abstract getType() : EventType
}

class LogEventTypeAction extends EventTypeAction {
  static readonly type: EventType = EventType.log
  action: LogEventAction | NullEventAction = NullEventAction.undefined
  getType() : EventType {
    return LogEventTypeAction.type
  }
  constructor (action: LogEventAction | NullEventAction ) {
    super();
    this.action = action
  }
}

class AuditEventTypeAction extends EventTypeAction {
  static readonly type: EventType = EventType.audit
  action: AuditEventAction | NullEventAction = NullEventAction.undefined
  getType() : EventType {
    return AuditEventTypeAction.type
  }
  constructor (action: AuditEventAction | NullEventAction ) {
    super();
    this.action = action
  }
}

class ErrorEventTypeAction extends EventTypeAction {
  static readonly type: EventType = EventType.error
  action: ErrorEventAction | NullEventAction = NullEventAction.undefined
  getType() : EventType {
    return ErrorEventTypeAction.type
  }
  constructor (action: ErrorEventAction | NullEventAction ) {
    super();
    this.action = action
  }
}

class TraceEventTypeAction extends EventTypeAction {
  static readonly type: EventType = EventType.trace
  action: TraceEventAction | NullEventAction = NullEventAction.undefined
  getType() : EventType {
    return TraceEventTypeAction.type
  }
  constructor (action: TraceEventAction | NullEventAction ) {
    super();
    this.action = action
  }
}

enum EventStatusType {
  success = "success",
  failed = "failed"
}

class EventTraceMetadata {
  service: string
  traceId:	string
  spanId: string
  parentSpanId?:	string
  sampled?:	number
  flags?:	number

  constructor (service: string, traceId: string, spanId: string) {
    this.service = service
    this.traceId = traceId
    this.spanId = spanId
  }
}

class EventStateMetadata {
  status: EventStatusType
  code?: number
  description?: string

  constructor ( status: EventStatusType ) {
    this.status = status
  }
}

class EventMetadata {
  id: string = Uuid()
  private type: EventType = EventType.undefined
  private action: AuditEventAction | ErrorEventAction | LogEventAction | TraceEventAction | NullEventAction = NullEventAction.undefined
  createdAt: string
  responseTo?: string
  state: EventStateMetadata

  constructor ( id: string, typeAction: EventTypeAction, createdAt: string, responseTo: string, state: EventStateMetadata ) {
    this.id = id
    this.type = typeAction.getType()
    this.action = typeAction.action
    this.createdAt = createdAt
    this.responseTo = responseTo
    this.state = state
  }
}

class MessageMetadata {
  event: EventMetadata
  trace: EventTraceMetadata

  constructor(event: EventMetadata, trace: EventTraceMetadata) {
    this.event = event
    this.trace = trace
  }
}

class EventMessage {
  id: string = Uuid()
  from?: string
  to?: string
  pp?: string
  metadata?: MessageMetadata
  type?: string
  content?: any
}

export {
  EventMessage,
  LogEventTypeAction,
  AuditEventTypeAction,
  TraceEventTypeAction,
  ErrorEventTypeAction,
  LogEventAction,
  AuditEventAction,
  TraceEventAction,
  ErrorEventAction,
  EventStatusType,
  MessageMetadata,
  EventMetadata,
  EventStateMetadata,
  EventTraceMetadata,

}
