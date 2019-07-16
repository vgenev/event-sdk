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
import { EventMessage, EventTraceMetadata, IEventTrace, IMessageMetadata, EventStateMetadata, EventAction } from "./model/EventMessage";
/**
 * EventLogger defines the methods used to log events in the Event SDK.
 * See DefaultEventLogger
 *
*/
declare type ObjectWithKeys = {
    [key: string]: any;
};
/**
 * Logger Options sets the interface for the different logger options, which might be passed to the logger for different actions
 *
 */
interface LoggerOptions {
    action?: EventAction;
    state?: EventStateMetadata;
    traceContext?: IEventTrace;
}
/**
 * EventLogger defines the methods used to log events in the Event SDK.
 * See DefaultEventLogger
 *
*/
interface EventLogger {
    /**
     * Extracts trace context from a carrier (ex: kafka message, event message, metadata, trace) with optional path for the trace context to be extracted.
     *
     * @param carrier any kind of message or other object with keys of type String.
     * @param path where in the carrier hierarchy the trace context can be found
     */
    extractSpan(carrier: ObjectWithKeys | IEventTrace | EventTraceMetadata | EventMessage | IMessageMetadata, path?: string): Promise<TraceSpan>;
    /**
     * Injects trace context into a carrier with optional path.
     * @param carrier any kind of message or other object with keys of type String.
     * @param traceContext trace context
     * @param path where in the carrier hierarchy the trace context should be injected
     */
    injectSpan(carrier: ObjectWithKeys, traceContext?: TraceSpan, path?: string): Promise<ObjectWithKeys>;
    /**
     * Creates new Trace or Child Span, based on the input.
     * Depending on the traceContext a new trace or a new child span is created. It case of a new trace, the traceContext might be only a service name as a string.
     * Also the service of the new child span can be changed by changing the service of the traceContext.
     *
     * @param traceContext a service as String or the trace context with obligatory service and optional values for traceId, spanId, etc. If no trace context was provided, the latest trace is used to create a child.
     */
    createNewSpan(traceContext: TraceSpan | string): TraceSpan;
    /**
     * Sends trace message to the event logging framework. If the provided trace is not finished, its finished automatically prior its logging.
     * @param trace Object of type EventTraceMetadata.
     * @param traceOptions Logger options where only status and action are taken into consideration
     */
    trace(trace: TraceSpan, traceOptions?: LoggerOptions): Promise<TraceSpan>;
    /**
     * Sends audit type message to the event logging framework.
     * @param message message to be recorded as audit event
     * @param auditOptions Logger options object. If traceContext is provided, it is also added to the audit message metadata.
     */
    audit(message: ObjectWithKeys, auditOptions?: LoggerOptions): Promise<any>;
    /**
     * Logs an event, usually sending it to a central logging processor.
     * @param event EventMessage
     */
    record(event: EventMessage): Promise<any>;
    traceContext: TraceSpan;
}
declare type TraceSpan = Readonly<IEventTrace>;
interface SpanOptions {
    sampled?: number;
    flags?: number;
    startTimestamp?: string | Date | undefined;
}
export { EventLogger, TraceSpan, LoggerOptions, SpanOptions, ObjectWithKeys };
