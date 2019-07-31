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
/**
 * EventType represents the different types of events.
 */
declare enum EventType {
    undefined = "undefined",
    log = "log",
    audit = "audit",
    trace = "trace"
}
declare enum LogEventAction {
    info = "info",
    debug = "debug",
    verbose = "verbose",
    performance = "perf",
    warning = "warn",
    error = "error"
}
declare enum AuditEventAction {
    default = "default"
}
declare enum TraceEventAction {
    span = "span"
}
declare enum NullEventAction {
    undefined = "undefined"
}
declare enum EventStatusType {
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
declare type TypeEventAction = {
    action: AuditEventAction | LogEventAction | TraceEventAction | NullEventAction;
};
declare type TypeEventTypeAction = {
    type: EventType;
    action: TypeEventAction["action"];
};
declare abstract class TypeAction implements TypeEventTypeAction {
    readonly type: TypeEventTypeAction["type"];
    readonly action: TypeEventTypeAction["action"];
    getType(): EventType;
    getAction(): AuditEventAction | LogEventAction | TraceEventAction | NullEventAction;
    constructor(typeAction: TypeEventTypeAction);
}
declare class LogEventTypeAction extends TypeAction {
    static readonly type: TypeEventTypeAction["type"];
    static getType(): EventType;
    constructor(actionParam?: TypeEventAction | LogEventAction | NullEventAction);
}
declare class AuditEventTypeAction extends TypeAction {
    static readonly type: EventType;
    static getType(): EventType;
    constructor(actionParam?: TypeEventAction | AuditEventAction | NullEventAction);
}
declare class TraceEventTypeAction extends TypeAction {
    static readonly type: EventType;
    static getType(): EventType;
    constructor(actionParam?: TypeEventAction | TraceEventAction | NullEventAction);
}
declare type TraceTags = {
    [key: string]: string;
};
declare type TypeSpanContext = {
    readonly service: string;
    readonly traceId: string;
    readonly spanId: string;
    readonly parentSpanId?: string;
    readonly sampled?: number;
    readonly flags?: number;
    readonly startTimestamp?: string | Date;
    finishTimestamp?: string;
    tags?: TraceTags;
};
declare class EventTraceMetadata implements TypeSpanContext {
    service: string;
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    sampled?: number;
    flags?: number;
    startTimestamp?: string;
    finishTimestamp?: string;
    tags?: {
        [key: string]: string;
    };
    constructor(spanContext: Partial<TypeSpanContext>);
    static create(service: string): EventTraceMetadata;
}
declare type TypeEventStateMetadata = {
    status: EventStatusType;
    code?: number;
    description?: string;
};
declare class EventStateMetadata implements TypeEventStateMetadata {
    status: EventStatusType;
    code?: number;
    description?: string;
    constructor(status: EventStatusType, code?: number, description?: string);
    static success(code?: number, description?: string): TypeEventStateMetadata;
    static failed(code?: number, description?: string): TypeEventStateMetadata;
}
declare type TypeEventMetadata = {
    id?: string;
    type?: TypeEventTypeAction["type"];
    action: TypeEventTypeAction["action"];
    createdAt?: string | Date;
    state: TypeEventStateMetadata;
    responseTo?: string;
};
declare class EventMetadata implements TypeEventMetadata {
    id: string;
    readonly type: TypeEventTypeAction["type"];
    readonly action: TypeEventAction["action"];
    createdAt: string;
    state: TypeEventStateMetadata;
    responseTo?: string;
    static log(eventMetadata: TypeEventMetadata): TypeEventMetadata;
    static trace(eventMetadata: TypeEventMetadata): TypeEventMetadata;
    static audit(eventMetadata: TypeEventMetadata): TypeEventMetadata;
    constructor(eventMetadata: TypeEventMetadata);
}
declare type TypeMessageMetadata = {
    event: TypeEventMetadata;
    trace?: TypeSpanContext;
};
declare type TypeEventMessage = {
    type: string;
    content: any;
    id?: string;
    from?: string;
    to?: string;
    pp?: string;
    metadata?: TypeMessageMetadata;
};
declare class EventMessage implements TypeEventMessage {
    type: string;
    content: any;
    id: string;
    from?: string;
    to?: string;
    pp?: string;
    metadata?: TypeMessageMetadata;
    constructor(eventMessageContent: TypeEventMessage);
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
export { EventMessage, EventType, TypeEventAction, LogEventTypeAction, AuditEventTypeAction, TraceEventTypeAction, LogEventAction, AuditEventAction, TraceEventAction, NullEventAction, EventStatusType, TypeMessageMetadata, EventMetadata, EventStateMetadata, EventTraceMetadata, LogResponseStatus, LogResponse, TypeEventMessage, TypeEventMetadata, TypeSpanContext, TypeEventTypeAction, TraceTags };
