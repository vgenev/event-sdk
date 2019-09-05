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

/**
 * Actions for event type Log
 */

enum LogEventAction {
  info = "info",
  debug = "debug",
  verbose = "verbose",
  performance = "perf",
  warning = "warn",
  error = "error"
}


/**
 * Actions for event type Audit
 */

enum AuditEventAction {
  default = "default",
  start = "start",
  finish = "finish",
  ingress = "ingress",
  egress = "egress"
}


/**
 * Actions for event type trace
 */

enum TraceEventAction {
  span = "span"
}

enum NullEventAction {
  undefined = "undefined",
}


/**
 * Enum that represents the event status types
 */

enum EventStatusType {
  success = "success",
  failed = "failed"
}


enum HttpRequestOptions {
  w3c = 'w3c',
  xb3 = 'xb3'
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

/**
 * Describes object of type and action pairs
 */

type TypeEventTypeAction = {
  type: EventType,
  action: TypeEventAction["action"]
}

/**
 * Describes class for extracting types and their actions based on type input
 */

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

/**
 * Returns new `TypeEventTypeAction` object with type = 'log'
 */
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


/**
 * Returns new `TypeEventTypeAction` object with type = 'audit'
 */
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


/**
 * Returns new `TypeEventTypeAction` object with type = 'trace'
 */
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

/**
 * Describes tags type
 */
type TraceTags = { [key: string]: string }

/**
 * Describbes Span Context type
 * @param service name of the span service
 * @param traceId id of the trace. End-to-end transaction identifier. Many spans can have same traceId to represent single trace of operation with multiple steps (spans)
 * @param spanId id of the span. Each span represents individual unit of work
 * @param parentSpanId id of the parent span from which the current one was derived
 * @param sampled Indicator if event message should be included in the trace 1. If excluded it will be left the consumer to decide on sampling.
 * @param flags Indicator if event message should be included in the trace flow. ( Debug 1 - this will override the sampled value )
 * @param startTimestamp ISO 8601 with the following format yyyy-MM-dd'T'HH:mm:ss.SSSSSSz. If not included the current timestamp will be taken. Represents the start timestamp of a span.
 * @param finishTimestamp ISO 8601 with the following format yyyy-MM-dd'T'HH:mm:ss.SSSSSSz. If not included the current timestamp will be taken. Represents the finish timestamp of a span
 * @param tags optional tags of the span
 */

type TypeSpanContext = {
  readonly service: string,
  readonly traceId: string,
  readonly spanId: string,
  readonly sampled?: number,
  readonly flags?: number,
  readonly parentSpanId?: string,
  readonly startTimestamp?: string | Date,
  finishTimestamp?: string,
  tags?: TraceTags
}

// type requiredSampled = Required<{ readonly sampled: 0|1 }>

// type SpanContext = requiredSampled & Partial<TypeSpanContext>

class EventTraceMetadata implements TypeSpanContext {
  service: string
  traceId: string
  spanId: string
  sampled?: number  // = 0
  flags?: number // = 0
  parentSpanId?: string
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
    this.sampled = sampled // ? sampled : this.sampled
    this.flags = flags // ? flags : this.flags
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

/**
 * Defines the state metadata
 * @param status The id references the related message.
 * @param code optional error code
 * @param description Optional status description
 */
type TypeEventStateMetadata = {
  status: EventStatusType
  code?: number
  description?: string
}

class EventStateMetadata implements TypeEventStateMetadata {
  status: EventStatusType = EventStatusType.success
  code?: number
  description?: string

  /**
   * Creates new state object
   * @param status 
   * @param code 
   * @param description 
   */
  constructor(status: EventStatusType, code?: number, description?: string) {
    this.status = status
    this.code = code
    this.description = description
    return this
  }

  /**
   * Creates success state object
   * @param code
   * @param description
   */
  static success(code?: number, description?: string): TypeEventStateMetadata {
    return new EventStateMetadata(EventStatusType.success, code, description)
  }
  /**
   * Creates failed state object
   * @param code
   * @param description
   */
  static failed(code?: number, description?: string): TypeEventStateMetadata {
    return new EventStateMetadata(EventStatusType.failed, code, description)
  }
}

/**
 * Defines event object of the metadata
 * @param id Generated UUIDv4 representing the event.
 * @param type Event type
 * @param action type of action
 * @param createdAt ISO timestamp
 * @param state Object, describing the state - created by `EventStateMetadata`
 */
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

  /**
   * Creates log type event metadata 
   * @param eventMetadata 
   */
  static log(eventMetadata: TypeEventMetadata): TypeEventMetadata {
    let typeAction = new LogEventTypeAction({ action: eventMetadata.action });
    return new EventMetadata(Object.assign(eventMetadata, typeAction));
  }
  /**
   * Creates trace type event metadata 
   * @param eventMetadata 
   */
  static trace(eventMetadata: TypeEventMetadata): TypeEventMetadata {
    let typeAction = new TraceEventTypeAction({ action: eventMetadata.action });
    return new EventMetadata(Object.assign(eventMetadata, typeAction));
  }

  /**
   * Creates audit type event metadata 
   * @param eventMetadata 
   */  
  static audit(eventMetadata: TypeEventMetadata): TypeEventMetadata {
    let typeAction = new AuditEventTypeAction({ action: eventMetadata.action });
    let a = (Object.assign(eventMetadata, typeAction))
    return new EventMetadata(a);
  }

  /**
   * Creates metadata object based on the passed message
   * @param eventMetadata 
   */
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

/**
 * Defines metadata object
 * @param event `EventMetadata` object
 * @param trace `TraceEventMetadata` object
 */
type TypeMessageMetadata = {
  event: TypeEventMetadata,
  trace?: TypeSpanContext
}

/**
 * Defines Event Message
 * @param type MIME declaration of the content type of the message.
 * @param content The representation of the content.
 * @param id The id references the related message.
 * @param from If the value is not present in the destination, it means that the notification was generated by the connected node (server).
 * @param to Mandatory for the sender and optional in the destination. The sender can ommit the value of the domain.
 * @param pp Optional for the sender, when is considered the identity of the session. Is mandatory in the destination if the identity of the originator is different of the identity of the from property.
 * @param metadata The sender should avoid to use this property to transport any kind of content-related information, but merely data relevant to the context of the communication. Consider to define a new content type if there's a need to include more content information into the message.
 */

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

  /**
   * Creates event message
   * @param eventMessageContent message content based on the `TypeEventMessage`
   */
  constructor(eventMessageContent: TypeEventMessage) {
    return Object.assign(this, eventMessageContent)
  }
}

/**
 * Defines the log responses
 */
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
  TraceTags,
  HttpRequestOptions
}
