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
var __extends = (this && this.__extends) || (function () {
  var extendStatics = function (d, b) {
    extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p] }
    return extendStatics(d, b)
  }
  return function (d, b) {
    extendStatics(d, b)
    function __ () { this.constructor = d }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __())
  }
})()
var __rest = (this && this.__rest) || function (s, e) {
  var t = {}
  for (var p in s) {
    if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) { t[p] = s[p] }
  }
  if (s != null && typeof Object.getOwnPropertySymbols === 'function') {
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) { t[p[i]] = s[p[i]] }
    }
  }
  return t
}
exports.__esModule = true
var crypto = require('crypto')
var Uuid = require('uuid4')
var TRACE_ID_REGEX = /^[0-9abcdef]{32}$/
var SPAN_ID_REGEX = /^[0-9abcdef]{16}$/
/**
 * EventType represents the different types of events.
 * This enum should not be used directly; see `EventTypeAction` below.
 */
var EventType;
(function (EventType) {
  EventType['undefined'] = 'undefined'
  EventType['log'] = 'log'
  EventType['audit'] = 'audit'
  EventType['error'] = 'error'
  EventType['trace'] = 'trace'
})(EventType || (EventType = {}))
exports.EventType = EventType
var LogEventAction;
(function (LogEventAction) {
  LogEventAction['info'] = 'info'
  LogEventAction['debug'] = 'debug'
  LogEventAction['verbose'] = 'verbose'
  LogEventAction['perf'] = 'perf'
})(LogEventAction || (LogEventAction = {}))
exports.LogEventAction = LogEventAction
var AuditEventAction;
(function (AuditEventAction) {
  AuditEventAction['default'] = 'default'
})(AuditEventAction || (AuditEventAction = {}))
exports.AuditEventAction = AuditEventAction
var ErrorEventAction;
(function (ErrorEventAction) {
  ErrorEventAction['internal'] = 'internal'
  ErrorEventAction['external'] = 'external'
})(ErrorEventAction || (ErrorEventAction = {}))
exports.ErrorEventAction = ErrorEventAction
var TraceEventAction;
(function (TraceEventAction) {
  TraceEventAction['span'] = 'span'
})(TraceEventAction || (TraceEventAction = {}))
exports.TraceEventAction = TraceEventAction
var NullEventAction;
(function (NullEventAction) {
  NullEventAction['undefined'] = 'undefined'
})(NullEventAction || (NullEventAction = {}))
/**
 * This `EventTypeAction` hierarchy models the restrictions between types and actions.
 * Each `EventType` can only have a specific set of `EventAction`s
 * Each concrete subclass defines the EventType as the static readonly prop `type`,
 * and the `action` property is restricted to the specific enum type.
 * `EventTypeAction` is not exported, clients need to use the concrete subclasses.
 */
var EventStatusType;
(function (EventStatusType) {
  EventStatusType['success'] = 'success'
  EventStatusType['failed'] = 'failed'
})(EventStatusType || (EventStatusType = {}))
exports.EventStatusType = EventStatusType
var TypeAction = /** @class */ (function () {
  function TypeAction (typeAction) {
    this.type = typeAction.type
    this.action = typeAction.action
  }
  TypeAction.prototype.getType = function () {
    return this.type
  }
  TypeAction.prototype.getAction = function () {
    return this.action
  }
  return TypeAction
}())
var LogEventTypeAction = /** @class */ (function (_super) {
  __extends(LogEventTypeAction, _super)
  function LogEventTypeAction (actionParam) {
    if (actionParam === void 0) { actionParam = NullEventAction.undefined }
    var _this = this
    if (typeof actionParam === 'object' && 'action' in actionParam) { _this = _super.call(this, { type: LogEventTypeAction.type, action: actionParam.action }) || this } else { _this = _super.call(this, { type: LogEventTypeAction.type, action: actionParam }) || this }
    return _this
  }
  LogEventTypeAction.getType = function () {
    return LogEventTypeAction.type
  }
  LogEventTypeAction.type = EventType.log
  return LogEventTypeAction
}(TypeAction))
exports.LogEventTypeAction = LogEventTypeAction
var AuditEventTypeAction = /** @class */ (function (_super) {
  __extends(AuditEventTypeAction, _super)
  function AuditEventTypeAction (actionParam) {
    if (actionParam === void 0) { actionParam = NullEventAction.undefined }
    var _this = this
    if (typeof actionParam === 'object' && 'action' in actionParam) { _this = _super.call(this, { type: AuditEventTypeAction.type, action: actionParam.action }) || this } else { _this = _super.call(this, { type: AuditEventTypeAction.type, action: actionParam }) || this }
    return _this
  }
  AuditEventTypeAction.getType = function () {
    return AuditEventTypeAction.type
  }
  AuditEventTypeAction.type = EventType.audit
  return AuditEventTypeAction
}(TypeAction))
exports.AuditEventTypeAction = AuditEventTypeAction
var ErrorEventTypeAction = /** @class */ (function (_super) {
  __extends(ErrorEventTypeAction, _super)
  function ErrorEventTypeAction (actionParam) {
    if (actionParam === void 0) { actionParam = NullEventAction.undefined }
    var _this = this
    if (typeof actionParam === 'object' && 'action' in actionParam) { _this = _super.call(this, { type: ErrorEventTypeAction.type, action: actionParam.action }) || this } else { _this = _super.call(this, { type: ErrorEventTypeAction.type, action: actionParam }) || this }
    return _this
  }
  ErrorEventTypeAction.getType = function () {
    return ErrorEventTypeAction.type
  }
  ErrorEventTypeAction.type = EventType.error
  return ErrorEventTypeAction
}(TypeAction))
exports.ErrorEventTypeAction = ErrorEventTypeAction
var TraceEventTypeAction = /** @class */ (function (_super) {
  __extends(TraceEventTypeAction, _super)
  function TraceEventTypeAction (actionParam) {
    if (actionParam === void 0) { actionParam = NullEventAction.undefined }
    var _this = this
    if (typeof actionParam === 'object' && 'action' in actionParam) { _this = _super.call(this, { type: TraceEventTypeAction.type, action: actionParam.action }) || this } else { _this = _super.call(this, { type: TraceEventTypeAction.type, action: actionParam }) || this }
    return _this
  }
  TraceEventTypeAction.getType = function () {
    return TraceEventTypeAction.type
  }
  TraceEventTypeAction.type = EventType.trace
  return TraceEventTypeAction
}(TypeAction))
exports.TraceEventTypeAction = TraceEventTypeAction
var EventTraceMetadata = /** @class */ (function () {
  function EventTraceMetadata (traceContext) {
    this.startTimestamp = (new Date()).toISOString() // ISO 8601
    var service = traceContext.service; var _a = traceContext.traceId; var traceId = _a === void 0 ? newTraceId() : _a; var _b = traceContext.spanId; var spanId = _b === void 0 ? newSpanId() : _b; var parentSpanId = traceContext.parentSpanId; var sampled = traceContext.sampled; var flags = traceContext.flags; var startTimestamp = traceContext.startTimestamp
    this.service = service
    if (!(TRACE_ID_REGEX.test(traceId))) {
      throw new Error('Invalid traceId: ' + traceId)
    }
    this.traceId = traceId
    if (!(SPAN_ID_REGEX.test(spanId))) {
      throw new Error('Invalid spanId: ' + spanId)
    }
    this.spanId = spanId
    if (parentSpanId && !(SPAN_ID_REGEX.test(parentSpanId))) {
      throw new Error('Invalid parentSpanId: ' + parentSpanId)
    }
    this.parentSpanId = parentSpanId
    this.sampled = sampled
    this.flags = flags
    if (startTimestamp instanceof Date) {
      this.startTimestamp = startTimestamp.toISOString() // ISO 8601
    } else if (startTimestamp) {
      this.startTimestamp = startTimestamp
    }
    return this
  }
  EventTraceMetadata.prototype.finish = function (finishTimestamp) {
    if (finishTimestamp instanceof Date) {
      this.finishTimestamp = finishTimestamp.toISOString() // ISO 8601
    } else if (!finishTimestamp) {
      this.finishTimestamp = (new Date()).toISOString() // ISO 8601
    } else {
      this.finishTimestamp = finishTimestamp
    }
    return this
  }
  EventTraceMetadata.getContext = function (traceContext) {
    var service = traceContext.service; var traceId = traceContext.traceId; var spanId = traceContext.spanId; var parentSpanId = traceContext.parentSpanId; var sampled = traceContext.sampled; var flags = traceContext.flags; var startTimestamp = traceContext.startTimestamp; var finishTimestamp = traceContext.finishTimestamp
    return { service: service, traceId: traceId, spanId: spanId, parentSpanId: parentSpanId, sampled: sampled, flags: flags, startTimestamp: startTimestamp, finishTimestamp: finishTimestamp }
  }
  EventTraceMetadata.create = function (service) {
    return new EventTraceMetadata({ service: service })
  }
  return EventTraceMetadata
}())
exports.EventTraceMetadata = EventTraceMetadata
var EventStateMetadata = /** @class */ (function () {
  function EventStateMetadata (status, code, description) {
    this.status = EventStatusType.success
    this.status = status
    this.code = code
    this.description = description
    return this
  }
  EventStateMetadata.success = function (code, description) {
    return new EventStateMetadata(EventStatusType.success, code, description)
  }
  EventStateMetadata.failed = function (code, description) {
    return new EventStateMetadata(EventStatusType.failed, code, description)
  }
  return EventStateMetadata
}())
exports.EventStateMetadata = EventStateMetadata
var EventMetadata = /** @class */ (function () {
  function EventMetadata (eventMetadata) {
    this.id = Uuid()
    this.type = EventType.undefined
    this.action = NullEventAction.undefined
    var _a = eventMetadata.createdAt; var createdAt = _a === void 0 ? new Date().toISOString() : _a; var state = eventMetadata.state; var restParams = __rest(eventMetadata, ['createdAt', 'state'])
    if (createdAt instanceof Date) {
      this.createdAt = createdAt.toISOString() // ISO 8601
    } else {
      this.createdAt = createdAt
    }
    this.state = state
    Object.assign(this, restParams)
  }
  // static create(eventMetadata: IEventMetadata) : IEventMetadata {
  //     return new EventMetadata(eventMetadata)
  // }
  EventMetadata.log = function (eventMetadata) {
    var typeAction = new LogEventTypeAction({ action: eventMetadata.action })
    return new EventMetadata(Object.assign(eventMetadata, typeAction))
  }
  EventMetadata.trace = function (eventMetadata) {
    var typeAction = new TraceEventTypeAction({ action: eventMetadata.action })
    return new EventMetadata(Object.assign(eventMetadata, typeAction))
  }
  EventMetadata.audit = function (eventMetadata) {
    var typeAction = new AuditEventTypeAction({ action: eventMetadata.action })
    var a = (Object.assign(eventMetadata, typeAction))
    return new EventMetadata(a)
  }
  EventMetadata.error = function (eventMetadata) {
    var typeAction = new ErrorEventTypeAction({ action: eventMetadata.action })
    return new EventMetadata(Object.assign(eventMetadata, typeAction))
  }
  return EventMetadata
}())
exports.EventMetadata = EventMetadata
var EventMessage = /** @class */ (function () {
  function EventMessage (eventMessageContent) {
    this.type = ''
    this.id = Uuid()
    return Object.assign(this, eventMessageContent)
  }
  return EventMessage
}())
exports.EventMessage = EventMessage
var LogResponseStatus;
(function (LogResponseStatus) {
  LogResponseStatus['UNDEFINED'] = 'undefined'
  LogResponseStatus['pending'] = 'pending'
  LogResponseStatus['accepted'] = 'accepted'
  LogResponseStatus['error'] = 'error'
})(LogResponseStatus || (LogResponseStatus = {}))
exports.LogResponseStatus = LogResponseStatus
var LogResponse = /** @class */ (function () {
  function LogResponse (status) {
    this.status = LogResponseStatus.UNDEFINED
    this.status = status
  }
  return LogResponse
}())
exports.LogResponse = LogResponse
function newTraceId () {
  return crypto.randomBytes(16).toString('hex')
}
function newSpanId () {
  return crypto.randomBytes(8).toString('hex')
}
var newTrace = EventTraceMetadata.create('service')
console.log((newTrace.finish()))
