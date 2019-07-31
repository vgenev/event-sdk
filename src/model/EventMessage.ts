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

const crypto = require('crypto')
const Uuid = require('uuid4')

const TRACE_ID_REGEX = /^[0-9abcdef]{32}$/;
const SPAN_ID_REGEX = /^[0-9abcdef]{16}$/
/**
 * EventType represents the different types of events.
 */
enum EventType {
  undefined = "undefined",
  log = "log",
  audit = "audit",
  trace = "trace",
}

enum LogEventAction {
  info = "info",
  debug = "debug",
  verbose = "verbose",
  performance = "perf",
  warning = "warn",
  error = "error"
}

enum AuditEventAction {
  default = "default"
}

enum TraceEventAction {
  span = "span"
}

enum NullEventAction {
  undefined = "undefined",
}

enum EventStatusType {
  success = "success",
  failed = "failed"
}

/**
 * This `TypeEventAction` hierarchy models the restrictions between types and actions.
 * Each `EventType` can only have a specific set of `EventAction`s
 * Each concrete subclass defines the EventType as the static readonly prop `type`,
 * and the `action` property is restricted to the specific enum type.
 * `TypeEventAction` is not exported, clients need to use the concrete subclasses.
 */

type TypeEventAction = {
  action: AuditEventAction | LogEventAction | TraceEventAction | NullEventAction
}

type TypeEventTypeAction = {
  type: EventType,
  action: TypeEventAction["action"]
}

abstract class TypeAction implements TypeEventTypeAction {
  readonly type: TypeEventTypeAction["type"]
  readonly action: TypeEventTypeAction["action"]
  getType() {
    return this.type
  }
  getAction() {
    return this.action
  }
  constructor(typeAction: TypeEventTypeAction) {
    this.type = typeAction.type
    this.action = typeAction.action
  }
}

class LogEventTypeAction extends TypeAction {
  static readonly type: TypeEventTypeAction["type"] = EventType.log
  static getType() {
    return LogEventTypeAction.type
  }
  constructor(actionParam: TypeEventAction | LogEventAction | NullEventAction = NullEventAction.undefined) {
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
  constructor(actionParam: TypeEventAction | AuditEventAction | NullEventAction = NullEventAction.undefined) {
    if (typeof actionParam === 'object' && 'action' in actionParam)
      super({ type: AuditEventTypeAction.type, action: actionParam.action })
    else
      super({ type: AuditEventTypeAction.type, action: actionParam })
  }
}

class TraceEventTypeAction extends TypeAction {
  static readonly type: EventType = EventType.trace
  static getType() {
    return TraceEventTypeAction.type
  }
  constructor(actionParam: TypeEventAction | TraceEventAction | NullEventAction = NullEventAction.undefined) {
    if (typeof actionParam === 'object' && 'action' in actionParam)
      super({ type: TraceEventTypeAction.type, action: actionParam.action })
    else
      super({ type: TraceEventTypeAction.type, action: actionParam })
  }
}

type TraceTags = { [key: string]: string }

type TypeSpanContext = {
  readonly service: string,
  readonly traceId: string,
  readonly spanId: string,
  readonly parentSpanId?: string,
  readonly sampled?: number,
  readonly flags?: number,
  readonly startTimestamp?: string | Date,
  finishTimestamp?: string,
  tags?: TraceTags
}

class EventTraceMetadata implements TypeSpanContext {
  service: string
  traceId: string
  spanId: string
  parentSpanId?: string
  sampled?: number
  flags?: number
  startTimestamp?: string = (new Date()).toISOString() // ISO 8601
  finishTimestamp?: string
  tags?: { [key: string]: string }

  constructor(spanContext: Partial<TypeSpanContext>) {
    let {
      service = '',
      traceId = newTraceId(),
      spanId = newSpanId(),
      parentSpanId,
      sampled,
      flags,
      startTimestamp,
      tags = {},
      finishTimestamp
    } = spanContext
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
    this.tags = tags
    if (startTimestamp instanceof Date) {
      this.startTimestamp = startTimestamp.toISOString() // ISO 8601
    } else if (startTimestamp) {
      this.startTimestamp = startTimestamp
    }
    this.finishTimestamp = finishTimestamp
    return this
  }

  static create(service: string): EventTraceMetadata {
    return new EventTraceMetadata({ service })
  }
}

type TypeEventStateMetadata = {
  status: EventStatusType
  code?: number
  description?: string
}

class EventStateMetadata implements TypeEventStateMetadata {
  status: EventStatusType = EventStatusType.success
  code?: number
  description?: string

  constructor(status: EventStatusType, code?: number, description?: string) {
    this.status = status
    this.code = code
    this.description = description
    return this
  }

  static success(code?: number, description?: string): TypeEventStateMetadata {
    return new EventStateMetadata(EventStatusType.success, code, description)
  }

  static failed(code?: number, description?: string): TypeEventStateMetadata {
    return new EventStateMetadata(EventStatusType.failed, code, description)
  }
}

type TypeEventMetadata = {
  id?: string,
  type?: TypeEventTypeAction["type"],
  action: TypeEventTypeAction["action"],
  createdAt?: string | Date,
  state: TypeEventStateMetadata,
  responseTo?: string
}

class EventMetadata implements TypeEventMetadata {
  id: string = Uuid()
  readonly type: TypeEventTypeAction["type"] = EventType.undefined
  readonly action: TypeEventAction["action"] = NullEventAction.undefined
  createdAt: string // ISO 8601
  state: TypeEventStateMetadata
  responseTo?: string

  static log(eventMetadata: TypeEventMetadata): TypeEventMetadata {
    let typeAction = new LogEventTypeAction({ action: eventMetadata.action });
    return new EventMetadata(Object.assign(eventMetadata, typeAction));
  }

  static trace(eventMetadata: TypeEventMetadata): TypeEventMetadata {
    let typeAction = new TraceEventTypeAction({ action: eventMetadata.action });
    return new EventMetadata(Object.assign(eventMetadata, typeAction));
  }

  static audit(eventMetadata: TypeEventMetadata): TypeEventMetadata {
    let typeAction = new AuditEventTypeAction({ action: eventMetadata.action });
    let a = (Object.assign(eventMetadata, typeAction))
    return new EventMetadata(a);
  }

  constructor(eventMetadata: TypeEventMetadata) {
    let { createdAt = new Date().toISOString(), state, ...restParams } = eventMetadata
    if (createdAt instanceof Date) {
      this.createdAt = createdAt.toISOString() // ISO 8601
    } else {
      this.createdAt = createdAt
    }
    this.state = state
    Object.assign(this, restParams)
  }
}

type TypeMessageMetadata = {
  event: TypeEventMetadata,
  trace?: TypeSpanContext
}

type TypeEventMessage = {
  type: string
  content: any
  id?: string
  from?: string
  to?: string
  pp?: string
  metadata?: TypeMessageMetadata
}

class EventMessage implements TypeEventMessage {
  type: string = ''
  content: any
  id: string = Uuid()
  from?: string
  to?: string
  pp?: string
  metadata?: TypeMessageMetadata

  constructor(eventMessageContent: TypeEventMessage) {
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
  status: LogResponseStatus = LogResponseStatus.UNDEFINED

  constructor(status: LogResponseStatus) {
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
  TypeEventAction,
  LogEventTypeAction,
  AuditEventTypeAction,
  TraceEventTypeAction,
  LogEventAction,
  AuditEventAction,
  TraceEventAction,
  NullEventAction,
  EventStatusType,
  TypeMessageMetadata,
  EventMetadata,
  EventStateMetadata,
  EventTraceMetadata,
  LogResponseStatus,
  LogResponse,
  TypeEventMessage,
  TypeEventMetadata,
  TypeSpanContext,
  TypeEventTypeAction,
  TraceTags
}
