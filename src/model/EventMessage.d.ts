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
import { TraceSpan, ObjectWithKeys } from "../EventLogger";
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
    span = "span"
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
declare enum EventStatusType {
    success = "success",
    failed = "failed"
}
declare type TAction = {
    action: EventAction;
};
interface ITypeAction {
    type: EventType;
    action: EventAction;
}
declare class TypeAction implements ITypeAction {
    readonly type: EventType;
    readonly action: EventAction;
    getType(): EventType;
    getAction(): EventAction;
    constructor(typeAction: ITypeAction);
}
declare class LogEventTypeAction extends TypeAction {
    static readonly type: EventType;
    static getType(): EventType;
    constructor(actionParam?: TAction | LogEventAction | NullEventAction);
}
declare class AuditEventTypeAction extends TypeAction {
    static readonly type: EventType;
    static getType(): EventType;
    constructor(actionParam?: TAction | AuditEventAction | NullEventAction);
}
declare class ErrorEventTypeAction extends TypeAction {
    static readonly type: EventType;
    static getType(): EventType;
    constructor(actionParam?: TAction | ErrorEventAction | NullEventAction);
}
declare class TraceEventTypeAction extends TypeAction {
    static readonly type: EventType;
    static getType(): EventType;
    constructor(actionParam?: TAction | TraceEventAction | NullEventAction);
}
interface IEventTrace {
    service: string;
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
    sampled?: number;
    flags?: number;
    startTimestamp?: string | Date;
    finishTimestamp?: string | Date;
    tags?: {
        [key: string]: any;
    };
    finish?(timestamp?: string | Date): IEventTrace;
    setTags?(tags: ObjectWithKeys): EventTraceMetadata;
    setService?(service: string): EventTraceMetadata;
}
declare class EventTraceMetadata implements IEventTrace {
    service: string;
    traceId: string;
    spanId?: string;
    parentSpanId?: string;
    sampled?: number;
    flags?: number;
    startTimestamp?: string;
    finishTimestamp?: string;
    tags: {
        [key: string]: any;
    };
    constructor(traceContext: Partial<IEventTrace>);
    static create(service: string): EventTraceMetadata;
    finish(finishTimestamp?: string | Date): EventTraceMetadata;
    static getContext(traceContext: EventTraceMetadata | TraceSpan): IEventTrace;
    setTags(tag: ObjectWithKeys): EventTraceMetadata;
    setService(service: string): EventTraceMetadata;
}
interface IEventStateMetadata {
    status: EventStatusType;
    code?: number;
    description?: string;
}
declare class EventStateMetadata implements IEventStateMetadata {
    status: EventStatusType;
    code?: number;
    description?: string;
    constructor(status: EventStatusType, code?: number, description?: string);
    static success(code?: number, description?: string): IEventStateMetadata;
    static failed(code?: number, description?: string): IEventStateMetadata;
}
interface IEventMetadata {
    id?: string;
    type?: EventType;
    action: EventAction;
    createdAt?: string | Date;
    state: IEventStateMetadata;
    responseTo?: string;
}
declare class EventMetadata implements IEventMetadata {
    id: string;
    readonly type: EventType;
    readonly action: EventAction;
    createdAt: string;
    state: IEventStateMetadata;
    responseTo?: string;
    static log(eventMetadata: IEventMetadata): IEventMetadata;
    static trace(eventMetadata: IEventMetadata): IEventMetadata;
    static audit(eventMetadata: IEventMetadata): IEventMetadata;
    static error(eventMetadata: IEventMetadata): IEventMetadata;
    constructor(eventMetadata: IEventMetadata);
}
interface IMessageMetadata {
    event: IEventMetadata;
    trace: IEventTrace;
}
interface IEventMessage {
    type: string;
    content: any;
    id?: string;
    from?: string;
    to?: string;
    pp?: string;
    metadata?: IMessageMetadata;
}
declare class EventMessage implements IEventMessage {
    type: string;
    content: any;
    id: string;
    from?: string;
    to?: string;
    pp?: string;
    metadata?: IMessageMetadata;
    constructor(eventMessageContent: IEventMessage);
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
export { EventMessage, EventType, EventAction, LogEventTypeAction, AuditEventTypeAction, TraceEventTypeAction, ErrorEventTypeAction, LogEventAction, AuditEventAction, TraceEventAction, ErrorEventAction, NullEventAction, EventStatusType, IMessageMetadata, EventMetadata, EventStateMetadata, EventTraceMetadata, LogResponseStatus, LogResponse, IEventMessage, IEventMetadata, IEventTrace, ITypeAction };
