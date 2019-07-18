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
import { EventLoggingServiceClient, SimpleLoggingServiceClient } from "./transport/EventLoggingServiceClient";
import { EventMessage, EventAction, EventStateMetadata } from "./model/EventMessage";
/**
 * Logger Options sets the interface for the different logger options, which might be passed to the logger for different actions
 */
interface LoggerOptions {
    action?: EventAction;
    state?: EventStateMetadata;
}
/**
 * Implements the methods for user to work with tracing and logging. Sends all messages to the EventLoggingServiceClient.
 * It provides null implementation of EventPreProcessor and EventPostProcessor.
 * It can be extended to implement some of these methods.
 */
declare class Tracer extends Trace {
    client: EventLoggingServiceClient | SimpleLoggingServiceClient;
    finished: boolean;
    /**
     * Creates new Trace and its first span with given service name
     * @param service the name of the service of the new span
     */
    static createSpan(service: string, config?: any, client?: EventLoggingServiceClient): Tracer;
    constructor(traceContext: TraceContext, config?: any, client?: EventLoggingServiceClient);
    preProcess: (event: EventMessage) => EventMessage;
    postProcess: (result: any) => any;
    /**
     * Finishes the current span and its trace and sends the data to the tracing framework.
     * @param finishTimestamp optional parameter for the finish time. If omitted, current time is used.
     */
    finish(finishTimestamp?: string | Date): Promise<this>;
    /**
     * Creates and returns new child span of the current span and changes the span service name
     * @param service the name of the service of the new child span
     */
    getChild(service: string): Tracer;
    static createChildSpanFromContext(service: string, traceContext: TraceContext): Tracer;
    /**
     * Sends trace message to the tracing framework
     * @param traceContext optional parameter. Can be used to trace previous span. If not set, the current span context is used.
     * @param traceOptions options for status and event action. Default action is 'span' and status is success
     */
    trace(traceContext?: TraceContext, traceOptions?: LoggerOptions): Promise<any>;
    /**
     * Sends audit type message to the event logging framework.
     * @param message message to be recorded as audit event
     * @param auditOptions Logger options object.
     */
    audit(message: EventMessage, auditOptions?: LoggerOptions): Promise<any>;
    /**
     * Logs INFO type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    info(message: string | {
        [key: string]: NonNullable<any>;
    }): Promise<any>;
    /**
     * Logs DEBUG type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    debug(message: string | {
        [key: string]: any;
    }): Promise<any>;
    /**
     * Logs VERBOSE type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    verbose(message: string | {
        [key: string]: any;
    }): Promise<any>;
    /**
     * Logs PERFORMANCE type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    performance(message: string | {
        [key: string]: any;
    }): Promise<any>;
    /**
     * Logs WARNING type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    warning(message: string | {
        [key: string]: any;
    }): Promise<any>;
    /**
     * Logs ERROR type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    error(message: string | {
        [key: string]: any;
    }): Promise<any>;
    /**
   * Sends an event message to the event logging framework
   */
    record(event: EventMessage): Promise<any>;
    private logWithAction;
}
export { Tracer };
