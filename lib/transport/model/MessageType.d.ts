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
declare enum EventType {
    undefined = "undefined",
    log = "log",
    audit = "audit",
    error = "error",
    trace = "trace"
}
declare abstract class EventAction {
    type: EventType;
    action: string;
}
declare class EventActionLog extends EventAction {
    type: EventType;
    action: EventTypeActionLog;
}
declare class EventActionAudit extends EventAction {
    type: EventType;
    action: EventTypeActionAudit;
}
declare class EventActionError extends EventAction {
    type: EventType;
    action: EventTypeActionError;
}
declare class EventActionTrace extends EventAction {
    type: EventType;
    action: EventTypeActionTrace;
}
declare enum EventTypeActionLog {
    undefined = "undefined",
    info = "info",
    debug = "debug",
    verbose = "verbose",
    perf = "perf"
}
declare enum EventTypeActionAudit {
    undefined = "undefined"
}
declare enum EventTypeActionError {
    undefined = "undefined",
    internal = "internal",
    external = "external"
}
declare enum EventTypeActionTrace {
    undefined = "undefined",
    start = "start",
    end = "end"
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
    constructor(service: string, traceId: string, spanId: string);
}
declare class EventStateMetadata {
    status: EventStatusType;
    code?: number;
    description?: string;
    constructor(status: EventStatusType);
}
declare class EventMetadata {
    id: string;
    type: EventType;
    action: string;
    createdAt: string;
    responseTo?: string;
    state: EventStateMetadata;
    constructor(id: string, typeAction: EventAction, createdAt: string, state: EventStateMetadata);
}
declare class MessageMetadata {
    event: EventMetadata;
    trace: EventTraceMetadata;
    constructor(event: EventMetadata, trace: EventTraceMetadata);
}
declare class EventMessage {
    id: string;
    from?: string;
    to?: string;
    pp?: string;
    metadata?: MessageMetadata;
    type?: string;
    content?: any;
}
export { EventMessage, EventType, EventActionLog, EventActionAudit, EventActionTrace, EventActionError, EventTypeActionLog, EventTypeActionAudit, EventTypeActionTrace, EventTypeActionError, EventStatusType, MessageMetadata, EventMetadata, EventStateMetadata, EventTraceMetadata, };
