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
 * This enum should not be used directly; see `EventTypeAction` below.
 */
// FIXME enum values should be ALL CAPS ( typescript style ) ?
enum EventType {
  undefined = "undefined",
  log = "log",
  audit = "audit",
  error = "error",
  trace = "trace",
}

type EventAction = AuditEventAction | ErrorEventAction | LogEventAction | TraceEventAction | NullEventAction

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
 * Each `EventType` can only have a specific set of `EventAction`s
 * Each concrete subclass defines the EventType as the static readonly prop `type`,
 * and the `action` property is restricted to the specific enum type.
 * `EventTypeAction` is not exported, clients need to use the concrete subclasses.
 */
abstract class EventTypeAction {
  static readonly type: EventType = EventType.undefined
  action: EventAction = NullEventAction.undefined

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
  timestamp?: string = (new Date()).toISOString() // ISO 8601

  constructor (service: string, traceId: string, spanId: string, parentSpanId?:	string, sampled?:	number, flags?:	number, timestamp?: string | Date) {
    this.service = service
    this.traceId = traceId
    this.spanId = spanId
    this.parentSpanId = parentSpanId
    this.sampled = sampled
    this.flags = flags
    if ( timestamp instanceof Date ) {
      this.timestamp = timestamp.toISOString() // ISO 8601
    } else {
      this.timestamp = timestamp
    }

  }
}

class EventStateMetadata {
  status: EventStatusType
  code?: number
  description?: string

  constructor ( status: EventStatusType, code?: number, description?: string ) {
    this.status = status
    this.code = code
    this.description = description
  }
}

class EventMetadata {
  id: string = Uuid()
  readonly type: EventType = EventType.undefined
  readonly action: EventAction = NullEventAction.undefined
  createdAt: string // ISO 8601
  state: EventStateMetadata
  responseTo?: string

  static create(id: string, typeAction: EventTypeAction, createdAt: string, state: EventStateMetadata, responseTo?: string ) : EventMetadata {
    return new EventMetadata(id, typeAction, createdAt, state, responseTo);
  }

  static log(id: string, action: LogEventAction, createdAt: string, state: EventStateMetadata, responseTo?: string ) : EventMetadata {
    let typeAction = new LogEventTypeAction(action);
    return new EventMetadata(id, typeAction, createdAt, state, responseTo);
  }

  static trace(id: string, action: TraceEventAction, createdAt: string, state: EventStateMetadata, responseTo?: string ) : EventMetadata {
    let typeAction = new TraceEventTypeAction(action);
    return new EventMetadata(id, typeAction, createdAt, state, responseTo);
  }

  static audit(id: string, action: AuditEventAction, createdAt: string, state: EventStateMetadata, responseTo?: string ) : EventMetadata {
    let typeAction = new AuditEventTypeAction(action);
    return new EventMetadata(id, typeAction, createdAt, state, responseTo);
  }

  static error(id: string, action: ErrorEventAction, createdAt: string, state: EventStateMetadata, responseTo?: string ) : EventMetadata {
    let typeAction = new ErrorEventTypeAction(action);
    return new EventMetadata(id, typeAction, createdAt, state, responseTo);
  }

  constructor ( id: string, typeAction: EventTypeAction, createdAt: string | Date, state: EventStateMetadata, responseTo?: string ) {
    this.id = id
    this.type = typeAction.getType()
    this.action = typeAction.action
    if ( createdAt instanceof Date ) {
      this.createdAt = createdAt.toISOString() // ISO 8601
    } else {
      this.createdAt = createdAt
    }
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

  constructor ( type?: string, content?: any) {
    this.type = type
    this.content = content
  }
}

export {
  EventMessage,
  EventType,
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
