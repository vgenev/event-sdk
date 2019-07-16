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
 * EventLogger defines the methods used to log events in the Event SDK.
 * See DefaultEventLogger
 *
*/
declare type TraceContext = Partial<Readonly<IEventTrace>>;
interface IContextOptions {
    type?: string;
    path?: string;
}
declare const createTraceMetadataFromContext: (traceContext: IEventTrace) => EventTraceMetadata;
interface ITrace extends TraceContext {
    getContext(): TraceContext;
    getChildSpan(service: string): Trace;
    injectContextToMessage(carrier: {
        [key: string]: any;
    }, injectOptions: IContextOptions): Promise<{
        [key: string]: any;
    }>;
}
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
    static createSpan(service: string): Trace;
    getContext(): TraceContext;
    getChildSpan(service: string): Trace;
    injectContextToMessage(carrier: {
        [key: string]: any;
    }, injectOptions?: IContextOptions): Promise<{
        [key: string]: any;
    }>;
    setTags(tags: {
        [key: string]: any;
    }): this;
    finishSpan(finishTimestamp?: string | Date): this;
    static extractContextFromMessage(carrier: {
        [key: string]: any;
    }, extractOptions?: IContextOptions): TraceContext;
    static createChildSpanFromContext(service: string, traceContext: TraceContext): Trace;
}
export { Trace, TraceContext, createTraceMetadataFromContext };
