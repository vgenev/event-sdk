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
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const Uuid = require('uuid4');
/**
 * EventType represents the different types of events.
 * This enum is not exported; see `EventTypeAction` below.
 */
// FIXME enum values should be ALL CAPS ( typescript style ) ?
var EventType;
(function (EventType) {
    EventType["undefined"] = "undefined";
    EventType["log"] = "log";
    EventType["audit"] = "audit";
    EventType["error"] = "error";
    EventType["trace"] = "trace";
})(EventType || (EventType = {}));
var LogEventAction;
(function (LogEventAction) {
    LogEventAction["info"] = "info";
    LogEventAction["debug"] = "debug";
    LogEventAction["verbose"] = "verbose";
    LogEventAction["perf"] = "perf";
})(LogEventAction || (LogEventAction = {}));
exports.LogEventAction = LogEventAction;
var AuditEventAction;
(function (AuditEventAction) {
    AuditEventAction["default"] = "default";
})(AuditEventAction || (AuditEventAction = {}));
exports.AuditEventAction = AuditEventAction;
var ErrorEventAction;
(function (ErrorEventAction) {
    ErrorEventAction["internal"] = "internal";
    ErrorEventAction["external"] = "external";
})(ErrorEventAction || (ErrorEventAction = {}));
exports.ErrorEventAction = ErrorEventAction;
var TraceEventAction;
(function (TraceEventAction) {
    TraceEventAction["start"] = "start";
    TraceEventAction["end"] = "end";
})(TraceEventAction || (TraceEventAction = {}));
exports.TraceEventAction = TraceEventAction;
var NullEventAction;
(function (NullEventAction) {
    NullEventAction["undefined"] = "undefined";
})(NullEventAction || (NullEventAction = {}));
/**
 * This `EventTypeAction` hierarchy models the restrictions between types and actions.
 * Each `EventType` can only have a specific set of `EventAction`s
 * Each concrete subclass defines the EventType as the static readonly prop `type`,
 * and the `action` property is restricted to the specific enum type.
 * `EventTypeAction` is not exported, clients need to use the concrete subclasses.
 */
class EventTypeAction {
    constructor() {
        this.action = NullEventAction.undefined;
    }
}
EventTypeAction.type = EventType.undefined;
class LogEventTypeAction extends EventTypeAction {
    constructor(action) {
        super();
        this.action = NullEventAction.undefined;
        this.action = action;
    }
    getType() {
        return LogEventTypeAction.type;
    }
}
LogEventTypeAction.type = EventType.log;
exports.LogEventTypeAction = LogEventTypeAction;
class AuditEventTypeAction extends EventTypeAction {
    constructor(action) {
        super();
        this.action = NullEventAction.undefined;
        this.action = action;
    }
    getType() {
        return AuditEventTypeAction.type;
    }
}
AuditEventTypeAction.type = EventType.audit;
exports.AuditEventTypeAction = AuditEventTypeAction;
class ErrorEventTypeAction extends EventTypeAction {
    constructor(action) {
        super();
        this.action = NullEventAction.undefined;
        this.action = action;
    }
    getType() {
        return ErrorEventTypeAction.type;
    }
}
ErrorEventTypeAction.type = EventType.error;
exports.ErrorEventTypeAction = ErrorEventTypeAction;
class TraceEventTypeAction extends EventTypeAction {
    constructor(action) {
        super();
        this.action = NullEventAction.undefined;
        this.action = action;
    }
    getType() {
        return TraceEventTypeAction.type;
    }
}
TraceEventTypeAction.type = EventType.trace;
exports.TraceEventTypeAction = TraceEventTypeAction;
var EventStatusType;
(function (EventStatusType) {
    EventStatusType["success"] = "success";
    EventStatusType["failed"] = "failed";
})(EventStatusType || (EventStatusType = {}));
exports.EventStatusType = EventStatusType;
class EventTraceMetadata {
    constructor(service, traceId, spanId) {
        this.service = service;
        this.traceId = traceId;
        this.spanId = spanId;
    }
}
exports.EventTraceMetadata = EventTraceMetadata;
class EventStateMetadata {
    constructor(status) {
        this.status = status;
    }
}
exports.EventStateMetadata = EventStateMetadata;
class EventMetadata {
    constructor(id, typeAction, createdAt, responseTo, state) {
        this.id = Uuid();
        this.type = EventType.undefined;
        this.action = NullEventAction.undefined;
        this.id = id;
        this.type = typeAction.getType();
        this.action = typeAction.action;
        this.createdAt = createdAt;
        this.responseTo = responseTo;
        this.state = state;
    }
}
exports.EventMetadata = EventMetadata;
class MessageMetadata {
    constructor(event, trace) {
        this.event = event;
        this.trace = trace;
    }
}
exports.MessageMetadata = MessageMetadata;
class EventMessage {
    constructor() {
        this.id = Uuid();
    }
}
exports.EventMessage = EventMessage;
//# sourceMappingURL=EventMessage.js.map