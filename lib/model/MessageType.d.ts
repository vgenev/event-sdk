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
declare enum EnEventType {
    log = "log",
    audit = "audit",
    error = "error",
    trace = "trace"
}
declare enum EnEventTypeAction {
    start = "start",
    end = "end",
    info = "info",
    debug = "debug",
    verbose = "verbose",
    perf = "perf",
    internal = "internal",
    external = "external"
}
declare enum EnEventStatus {
    success = "success",
    failed = "failed"
}
declare class ObTraceType {
    service: string;
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    sampled?: number;
    flags?: number;
    constructor(service: string, traceId: string, spanId: string);
}
declare class ObStateType {
    status: EnEventStatus;
    code?: number;
    description?: string;
    constructor(status: EnEventStatus);
}
declare class ObEventType {
    id: string;
    type: EnEventType;
    action: EnEventTypeAction;
    createdAt: string;
    responseTo?: string;
    state: ObStateType;
    constructor(id: string, type: EnEventType, action: EnEventTypeAction, createdAt: string, state: ObStateType);
}
declare class ObMetadataType {
    event: ObEventType;
    trace: ObTraceType;
    constructor(event: ObEventType, trace: ObTraceType);
}
declare class MessageType {
    id: string;
    from?: string;
    to?: string;
    pp?: string;
    metadata?: ObMetadataType;
    type?: string;
    content?: any;
}
export { MessageType, EnEventType, EnEventTypeAction, EnEventStatus, ObMetadataType, ObEventType, ObStateType, ObTraceType };
