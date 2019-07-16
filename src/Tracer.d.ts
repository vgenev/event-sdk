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

 - Valentin Genev <valentin.genev@modusbox.com>

 --------------
 ******/
import { Trace, TraceContext } from "./Trace";
import { EventLoggingServiceClient } from "./transport/EventLoggingServiceClient";
import { EventMessage, EventAction, EventStateMetadata } from "./model/EventMessage";
/**
 * Logger Options sets the interface for the different logger options, which might be passed to the logger for different actions
 *
 */
interface LoggerOptions {
    action?: EventAction;
    state?: EventStateMetadata;
}
declare class Tracer extends Trace {
    client: EventLoggingServiceClient;
    static createSpan(service: string): Trace;
    constructor(traceContext: TraceContext, client?: EventLoggingServiceClient);
    preProcess: (event: EventMessage) => EventMessage;
    postProcess: (result: any) => any;
    finish(finishTimestamp?: string | Date): Promise<this>;
    getChild(service: string): Tracer;
    trace(traceContext?: TraceContext, traceOptions?: LoggerOptions): Promise<any>;
    audit(message: EventMessage, auditOptions?: LoggerOptions): Promise<any>;
    info(message: string | {
        [key: string]: NonNullable<any>;
    }): Promise<any>;
    debug(message: string | {
        [key: string]: any;
    }): Promise<any>;
    verbose(message: string | {
        [key: string]: any;
    }): Promise<any>;
    performance(message: string | {
        [key: string]: any;
    }): Promise<any>;
    warning(message: string | {
        [key: string]: any;
    }): Promise<any>;
    error(message: string | {
        [key: string]: any;
    }): Promise<any>;
    /**
   * Log an event
   */
    record(event: EventMessage): Promise<any>;
    private logWithAction;
}
export { Tracer };
