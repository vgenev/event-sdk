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
Object.defineProperty(exports, '__esModule', { value: true })
const Uuid = require('uuid4')
var EventType;
(function (EventType) {
  EventType['undefined'] = 'undefined'
  EventType['log'] = 'log'
  EventType['audit'] = 'audit'
  EventType['error'] = 'error'
  EventType['trace'] = 'trace'
})(EventType || (EventType = {}))
exports.EventType = EventType
class EventAction {
  constructor () {
    this.type = EventType.undefined
    this.action = 'undefined'
  }
}
class EventActionLog extends EventAction {
  constructor () {
    super(...arguments)
    this.type = EventType.log
    this.action = EventTypeActionLog.undefined
  }
}
exports.EventActionLog = EventActionLog
class EventActionAudit extends EventAction {
  constructor () {
    super(...arguments)
    this.type = EventType.audit
    this.action = EventTypeActionAudit.undefined
  }
}
exports.EventActionAudit = EventActionAudit
class EventActionError extends EventAction {
  constructor () {
    super(...arguments)
    this.type = EventType.error
    this.action = EventTypeActionError.undefined
  }
}
exports.EventActionError = EventActionError
class EventActionTrace extends EventAction {
  constructor () {
    super(...arguments)
    this.type = EventType.trace
    this.action = EventTypeActionTrace.undefined
  }
}
exports.EventActionTrace = EventActionTrace
var EventTypeActionLog;
(function (EventTypeActionLog) {
  EventTypeActionLog['undefined'] = 'undefined'
  EventTypeActionLog['info'] = 'info'
  EventTypeActionLog['debug'] = 'debug'
  EventTypeActionLog['verbose'] = 'verbose'
  EventTypeActionLog['perf'] = 'perf'
})(EventTypeActionLog || (EventTypeActionLog = {}))
exports.EventTypeActionLog = EventTypeActionLog
var EventTypeActionAudit;
(function (EventTypeActionAudit) {
  EventTypeActionAudit['undefined'] = 'undefined'
})(EventTypeActionAudit || (EventTypeActionAudit = {}))
exports.EventTypeActionAudit = EventTypeActionAudit
var EventTypeActionError;
(function (EventTypeActionError) {
  EventTypeActionError['undefined'] = 'undefined'
  EventTypeActionError['internal'] = 'internal'
  EventTypeActionError['external'] = 'external'
})(EventTypeActionError || (EventTypeActionError = {}))
exports.EventTypeActionError = EventTypeActionError
var EventTypeActionTrace;
(function (EventTypeActionTrace) {
  EventTypeActionTrace['undefined'] = 'undefined'
  EventTypeActionTrace['start'] = 'start'
  EventTypeActionTrace['end'] = 'end'
})(EventTypeActionTrace || (EventTypeActionTrace = {}))
exports.EventTypeActionTrace = EventTypeActionTrace
var EventTypeAction;
(function (EventTypeAction) {
  EventTypeAction['start'] = 'start'
  EventTypeAction['end'] = 'end'
  EventTypeAction['info'] = 'info'
  EventTypeAction['debug'] = 'debug'
  EventTypeAction['verbose'] = 'verbose'
  EventTypeAction['perf'] = 'perf'
  EventTypeAction['internal'] = 'internal'
  EventTypeAction['external'] = 'external'
})(EventTypeAction || (EventTypeAction = {}))
var EventStatusType;
(function (EventStatusType) {
  EventStatusType['success'] = 'success'
  EventStatusType['failed'] = 'failed'
})(EventStatusType || (EventStatusType = {}))
exports.EventStatusType = EventStatusType
class EventTraceMetadata {
  constructor (service, traceId, spanId) {
    this.service = service
    this.traceId = traceId
    this.spanId = spanId
  }
}
exports.EventTraceMetadata = EventTraceMetadata
class EventStateMetadata {
  constructor (status) {
    this.status = status
  }
}
exports.EventStateMetadata = EventStateMetadata
class EventMetadata {
  constructor (id, typeAction, createdAt, state) {
    this.id = Uuid()
    this.id = id
    this.type = typeAction.type
    this.action = typeAction.action
    this.createdAt = createdAt
    this.state = state
  }
}
exports.EventMetadata = EventMetadata
class MessageMetadata {
  constructor (event, trace) {
    this.event = event
    this.trace = trace
  }
}
exports.MessageMetadata = MessageMetadata
class EventMessage {
  constructor () {
    this.id = Uuid()
  }
}
exports.EventMessage = EventMessage
// # sourceMappingURL=MessageType.js.map
