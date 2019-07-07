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

'use strict'

import { finished } from "stream";

const crypto = require('crypto')
const Uuid = require('uuid4')

const TRACE_ID_REGEX = /^[0-9abcdef]{32}$/;
const SPAN_ID_REGEX = /^[0-9abcdef]{16}$/
/**
 * EventType represents the different types of events.
 * This enum should not be used directly; see `EventTypeAction` below.
 */
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
  span = "span"
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


enum EventStatusType {
  success = "success",
  failed = "failed"
}

// my code

type TAction = {
  action: EventAction
}

interface ITypeAction {
  type: EventType,
  action: EventAction
}

class TypeAction implements ITypeAction {
  readonly type: EventType
  readonly action: EventAction
  getType() {
    return this.type
  }
  getAction() {
    return this.action
  }
  constructor(typeAction: ITypeAction) {
    this.type = typeAction.type
    this.action = typeAction.action
  }
}

class LogEventTypeAction extends TypeAction {
  static readonly type: EventType = EventType.log
  static getType() {
    return LogEventTypeAction.type
  }
  constructor(actionParam: TAction | LogEventAction | NullEventAction = NullEventAction.undefined) {
    if (typeof actionParam === 'object' && 'action' in actionParam)
      super({ type: LogEventTypeAction.type, action: actionParam.action })
    else
      super({ type: LogEventTypeAction.type, action: actionParam })
  }
}

class AuditEventTypeAction extends TypeAction {
  static readonly type: EventType = EventType.audit
  static getType() {
    return AuditEventTypeAction.type
  }
  constructor(actionParam: TAction | AuditEventAction | NullEventAction = NullEventAction.undefined) {
    if (typeof actionParam === 'object' && 'action' in actionParam)
      super({ type: AuditEventTypeAction.type, action: actionParam.action })
    else
      super({ type: AuditEventTypeAction.type, action: actionParam })
  }
}

class ErrorEventTypeAction extends TypeAction {
  static readonly type: EventType = EventType.error
  static getType() {
    return ErrorEventTypeAction.type
  }
  constructor(actionParam: TAction | ErrorEventAction | NullEventAction = NullEventAction.undefined) {
    if (typeof actionParam === 'object' && 'action' in actionParam)
      super({ type: ErrorEventTypeAction.type, action: actionParam.action })
    else
      super({ type: ErrorEventTypeAction.type, action: actionParam })
  }
}

class TraceEventTypeAction extends TypeAction {
  static readonly type: EventType = EventType.trace
  static getType() {
    return TraceEventTypeAction.type
  }
  constructor(actionParam: TAction | TraceEventAction | NullEventAction = NullEventAction.undefined) {
    if (typeof actionParam === 'object' && 'action' in actionParam)
      super({ type: TraceEventTypeAction.type, action: actionParam.action })
    else
      super({ type: TraceEventTypeAction.type, action: actionParam })
  }
}

interface IEventTrace {
  service: string,
  traceId?: string,
  spanId?: string,
  parentSpanId?:	string,
  sampled?:	number,
  flags?:	number,
  startTimestamp?: string | Date,
  finishTimestamp?: string | Date,
  // finish?(timestamp?: string | Date): IEventTrace,
  // create?(): IEventTrace
}

class EventTraceMetadata implements IEventTrace {
  service: string
  traceId:	string
  spanId: string
  parentSpanId?:	string
  sampled?:	number
  flags?:	number
  startTimestamp?: string = (new Date()).toISOString() // ISO 8601
  finishTimestamp?: string

  constructor (traceContext: IEventTrace) {
    let { service, traceId = newTraceId(), spanId = newSpanId(), parentSpanId, sampled, flags, startTimestamp } = traceContext
    this.service = service
    if (!(TRACE_ID_REGEX.test(traceId))) {
      throw new Error(`Invalid traceId: ${traceId}`)
    }
    this.traceId = traceId
    if (!(SPAN_ID_REGEX.test(spanId))) {
      throw new Error(`Invalid spanId: ${spanId}`)
    }
    this.spanId = spanId
    if (parentSpanId && !(SPAN_ID_REGEX.test(parentSpanId))) {
      throw new Error(`Invalid parentSpanId: ${parentSpanId}`)
    }
    this.parentSpanId = parentSpanId
    this.sampled = sampled
    this.flags = flags
    if ( startTimestamp instanceof Date ) {
      this.startTimestamp = startTimestamp.toISOString() // ISO 8601
    } else if ( startTimestamp ) {
      this.startTimestamp = startTimestamp
    }
    return this
  }

  finish(finishTimestamp?: string | Date): EventTraceMetadata {
    if ( finishTimestamp instanceof Date ) {
      this.finishTimestamp = finishTimestamp.toISOString() // ISO 8601
    } else if ( !finishTimestamp ) {
      this.finishTimestamp = (new Date()).toISOString() // ISO 8601
    } else {
      this.finishTimestamp = finishTimestamp
    }
    return this
  }

  static getContext (traceContext: EventTraceMetadata): IEventTrace {
    let { service, traceId, spanId, parentSpanId, sampled, flags, startTimestamp, finishTimestamp } = traceContext
    return { service, traceId, spanId, parentSpanId, sampled, flags, startTimestamp, finishTimestamp }
  }

  static create(service: string): EventTraceMetadata {
    return new EventTraceMetadata({ service })    
  }
}

interface IEventStateMetadata {
  status: EventStatusType
  code?: number
  description?: string
}

class EventStateMetadata implements IEventStateMetadata {
  status: EventStatusType = EventStatusType.success
  code?: number
  description?: string 

  constructor(status: EventStatusType, code?: number, description?: string) {
    this.status = status
    this.code = code
    this.description = description
    return this
  }

  static success( code?: number, description?: string): IEventStateMetadata {
    return new EventStateMetadata(EventStatusType.success, code, description)
  }

  static failed( code?: number, description?: string): IEventStateMetadata {
    return new EventStateMetadata(EventStatusType.failed, code, description)
  }
}

interface IEventMetadata {
  id?: string,
  type?: EventType,
  action: EventAction,
  createdAt?: string | Date,
  state: IEventStateMetadata,
  responseTo?: string
}

class EventMetadata implements IEventMetadata {
  id: string = Uuid()
  readonly type: EventType = EventType.undefined
  readonly action: EventAction = NullEventAction.undefined
  createdAt: string // ISO 8601
  state: IEventStateMetadata
  responseTo?: string

  // static create(eventMetadata: IEventMetadata) : IEventMetadata {
  //     return new EventMetadata(eventMetadata)
  // }

  static log(eventMetadata: IEventMetadata) : IEventMetadata {
    let typeAction = new LogEventTypeAction({action: eventMetadata.action});
    return new EventMetadata(Object.assign(eventMetadata, typeAction));
  }

  static trace(eventMetadata: IEventMetadata) : IEventMetadata {
    let typeAction = new TraceEventTypeAction({action: eventMetadata.action});
    return new EventMetadata(Object.assign(eventMetadata, typeAction));
  }

  static audit(eventMetadata: IEventMetadata) : IEventMetadata {
    let typeAction = new AuditEventTypeAction({action: eventMetadata.action});
    let a = (Object.assign(eventMetadata, typeAction))
    return new EventMetadata(a);
  }

  static error(eventMetadata: IEventMetadata ) : IEventMetadata {
    let typeAction = new ErrorEventTypeAction({action: eventMetadata.action});
    return new EventMetadata(Object.assign(eventMetadata, typeAction));
  }

  constructor (eventMetadata: IEventMetadata) {
    let { createdAt = new Date().toISOString(), state, ...restParams } = eventMetadata
    if ( createdAt instanceof Date ) {
      this.createdAt = createdAt.toISOString() // ISO 8601
    } else {
      this.createdAt = createdAt
    }
    this.state = state
    Object.assign(this, restParams)
  }
}

interface IMessageMetadata {
  event: IEventMetadata,
  trace: IEventTrace
}

interface IEventMessage {
  type: string
  content: any
  id?: string
  from?: string
  to?: string
  pp?: string
  metadata?: IMessageMetadata
}

class EventMessage implements IEventMessage {
  type: string = ''
  content: any
  id: string = Uuid()
  from?: string
  to?: string
  pp?: string
  metadata?: IMessageMetadata

  constructor (eventMessageContent: IEventMessage) {
      return Object.assign(this, eventMessageContent)
    }
}

enum LogResponseStatus {
  UNDEFINED = 'undefined',
  pending = 'pending',
  accepted = 'accepted',
  error = 'error'
}

class LogResponse {
  status : LogResponseStatus = LogResponseStatus.UNDEFINED

  constructor ( status: LogResponseStatus ) {
    this.status = status
  }
}

function newTraceId() {
  return crypto.randomBytes(16).toString('hex');
}

function newSpanId() {
  return crypto.randomBytes(8).toString('hex');
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
  IMessageMetadata,
  EventMetadata,
  EventStateMetadata,
  EventTraceMetadata,
  LogResponseStatus,
  LogResponse,
  IEventMessage,
  IEventMetadata,
  IEventTrace,
  ITypeAction
}
