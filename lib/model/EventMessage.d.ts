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
/**
 * EventType represents the different types of events.
 * This enum should not be used directly; see `EventTypeAction` below.
 */
declare enum EventType {
    undefined = "undefined",
    log = "log",
    audit = "audit",
    error = "error",
    trace = "trace"
}
declare type EventAction = AuditEventAction | ErrorEventAction | LogEventAction | TraceEventAction | NullEventAction;
declare enum LogEventAction {
    info = "info",
    debug = "debug",
    verbose = "verbose",
    perf = "perf"
}
declare enum AuditEventAction {
    default = "default"
}
declare enum ErrorEventAction {
    internal = "internal",
    external = "external"
}
declare enum TraceEventAction {
    start = "start",
    end = "end"
}
declare enum NullEventAction {
    undefined = "undefined"
}
/**
 * This `EventTypeAction` hierarchy models the restrictions between types and actions.
 * Each `EventType` can only have a specific set of `EventAction`s
 * Each concrete subclass defines the EventType as the static readonly prop `type`,
 * and the `action` property is restricted to the specific enum type.
 * `EventTypeAction` is not exported, clients need to use the concrete subclasses.
 */
declare abstract class EventTypeAction {
    static readonly type: EventType;
    action: EventAction;
    /**
     * Returns the `EventType` specific to each subclass.
     */
    abstract getType(): EventType;
}
declare class LogEventTypeAction extends EventTypeAction {
    static readonly type: EventType;
    action: LogEventAction | NullEventAction;
    getType(): EventType;
    constructor(action: LogEventAction | NullEventAction);
}
declare class AuditEventTypeAction extends EventTypeAction {
    static readonly type: EventType;
    action: AuditEventAction | NullEventAction;
    getType(): EventType;
    constructor(action: AuditEventAction | NullEventAction);
}
declare class ErrorEventTypeAction extends EventTypeAction {
    static readonly type: EventType;
    action: ErrorEventAction | NullEventAction;
    getType(): EventType;
    constructor(action: ErrorEventAction | NullEventAction);
}
declare class TraceEventTypeAction extends EventTypeAction {
    static readonly type: EventType;
    action: TraceEventAction | NullEventAction;
    getType(): EventType;
    constructor(action: TraceEventAction | NullEventAction);
}
declare enum EventStatusType {
    success = "success",
    failed = "failed"
}
declare class EventTraceMetadata {
    service: string;
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    sampled?: number;
    flags?: number;
    timestamp?: string;
    constructor(service: string, traceId: string, spanId: string, parentSpanId?: string, sampled?: number, flags?: number, timestamp?: string | Date);
}
declare class EventStateMetadata {
    status: EventStatusType;
    code?: number;
    description?: string;
    constructor(status: EventStatusType, code?: number, description?: string);
}
declare class EventMetadata {
    id: string;
    readonly type: EventType;
    readonly action: EventAction;
    createdAt: string;
    state: EventStateMetadata;
    responseTo?: string;
    static create(id: string, typeAction: EventTypeAction, createdAt: string, state: EventStateMetadata, responseTo?: string): EventMetadata;
    static log(id: string, action: LogEventAction, createdAt: string, state: EventStateMetadata, responseTo?: string): EventMetadata;
    static trace(id: string, action: TraceEventAction, createdAt: string, state: EventStateMetadata, responseTo?: string): EventMetadata;
    static audit(id: string, action: AuditEventAction, createdAt: string, state: EventStateMetadata, responseTo?: string): EventMetadata;
    static error(id: string, action: ErrorEventAction, createdAt: string, state: EventStateMetadata, responseTo?: string): EventMetadata;
    constructor(id: string, typeAction: EventTypeAction, createdAt: string | Date, state: EventStateMetadata, responseTo?: string);
}
declare class MessageMetadata {
    event: EventMetadata;
    trace: EventTraceMetadata;
    constructor(event: EventMetadata, trace: EventTraceMetadata);
}
declare class EventMessage {
    id: string;
    type: string;
    content: any;
    from?: string;
    to?: string;
    pp?: string;
    metadata?: MessageMetadata;
    constructor(id: string, type: string, content: any);
}
declare enum LogResponseStatus {
    UNDEFINED = "undefined",
    pending = "pending",
    accepted = "accepted",
    error = "error"
}
declare class LogResponse {
    status: LogResponseStatus;
    constructor(status: LogResponseStatus);
}
export { EventMessage, EventType, LogEventTypeAction, AuditEventTypeAction, TraceEventTypeAction, ErrorEventTypeAction, LogEventAction, AuditEventAction, TraceEventAction, ErrorEventAction, EventStatusType, MessageMetadata, EventMetadata, EventStateMetadata, EventTraceMetadata, LogResponseStatus, LogResponse };
