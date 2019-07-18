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
import { EventTraceMetadata, IEventTrace } from "./model/EventMessage";
/**
 * defines options to the injectContextToMessage and extractContextFromMessage
 * @param type the carrier type
 * @param path in the carrier where the trace context should be injected or extracted from
 */
interface IContextOptions {
    type?: string;
    path?: string;
}
declare type TraceContext = Partial<Readonly<IEventTrace>>;
declare const createTraceMetadataFromContext: (traceContext: IEventTrace) => EventTraceMetadata;
interface ITrace extends TraceContext {
    getContext(): TraceContext;
    getChildSpan(service: string): Trace;
    injectContextToMessage(carrier: {
        [key: string]: any;
    }, injectOptions: IContextOptions): Promise<{
        [key: string]: any;
    }>;
    setTags(tags: {
        [key: string]: any;
    }): TraceContext;
    finishSpan(finishTimestamp?: string | Date): TraceContext;
}
/**
 * Trace defines the methods used to create traces and spans across multiservice system.
 * The class is extedned by Tracer, which adds the logging methods and settings to the SDK. Normally, only the Tracer should be used.
*/
declare class Trace implements ITrace {
    _traceContext: TraceContext;
    service?: string;
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
    sampled?: number;
    flags?: number;
    startTimestamp?: string | Date;
    finishTimestamp?: string;
    tags?: {
        [key: string]: any;
    };
    private _updateContext;
    constructor(traceContext: EventTraceMetadata);
    /**
     * Creates new Trace and its first span with given service name
     * @param service the name of the service of the new span
     */
    static createSpan(service: string): Trace;
    /**
     * Gets trace context from the current span
     */
    getContext(): TraceContext;
    /**
     * Creates and returns new child span of the current span and changes the span service name
     * @param service the name of the service of the new child span
     */
    getChildSpan(service: string): Trace;
    /**
     * Injects trace context into a carrier with optional path.
     * @param carrier any kind of message or other object with keys of type String.
     * @param injectOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
     */
    injectContextToMessage(carrier: {
        [key: string]: any;
    }, injectOptions?: IContextOptions): Promise<{
        [key: string]: any;
    }>;
    /**
     * Sets tags to the current span. If child span is created, the tags are passed on.
     * @param tags key value pairs of tags. Tags can be changed on different child spans
     */
    setTags(tags: {
        [key: string]: any;
    }): this;
    /**
     * Finishes the trace by adding finish timestamp to the current span.
     * @param finishTimestamp optional parameter for the finish time. If omitted, current time is used.
     */
    finishSpan(finishTimestamp?: string | Date): this;
    /**
     * Extracts trace context from a carrier (ex: kafka message, event message, metadata, trace)
     * with optional path for the trace context to be extracted.
     * @param carrier any kind of message or other object with keys of type String.
     * @param extractOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
     */
    static extractContextFromMessage(carrier: {
        [key: string]: any;
    }, extractOptions?: IContextOptions): TraceContext;
    /**
     * Creates new child span from context with new service name
     * @param service the name of the service of the new child span
     * @param traceContext context of the previous span
     */
    static createChildSpanFromExtractedContext(service: string, traceContext: TraceContext): Trace;
}
export { Trace, TraceContext, createTraceMetadataFromContext };
