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
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const EventMessage_1 = require("./model/EventMessage");
const util_1 = require("./lib/util");
const createTraceMetadataFromContext = (traceContext) => new EventMessage_1.EventTraceMetadata(traceContext);
exports.createTraceMetadataFromContext = createTraceMetadataFromContext;
/**
 * Trace defines the methods used to create traces and spans across multiservice system.
 * The class is extedned by Tracer, which adds the logging methods and settings to the SDK. Normally, only the Tracer should be used.
*/
class Trace {
    constructor(traceContext) {
        this.service = (this._traceContext && this._traceContext.service) || undefined;
        this.traceId = (this._traceContext && this._traceContext.traceId) || undefined;
        this.spanId = (this._traceContext && this._traceContext.spanId) || undefined;
        this.parentSpanId = (this._traceContext && this._traceContext.parentSpanId) || undefined;
        this.sampled = this._traceContext && this._traceContext.sampled || undefined;
        this.flags = (this._traceContext && this._traceContext.flags) || undefined;
        this.startTimestamp = (this._traceContext && this._traceContext.startTimestamp) || undefined;
        this.finishTimestamp = (this._traceContext && this._traceContext.finishTimestamp) || undefined;
        this.tags = (this._traceContext && this._traceContext.tags) || undefined;
        this._updateContext = () => {
            this.service = (this._traceContext && this._traceContext.service) || undefined;
            this.traceId = (this._traceContext && this._traceContext.traceId) || undefined;
            this.spanId = (this._traceContext && this._traceContext.spanId) || undefined;
            this.parentSpanId = (this._traceContext && this._traceContext.parentSpanId) || undefined;
            this.sampled = this._traceContext && this._traceContext.sampled || undefined;
            this.flags = (this._traceContext && this._traceContext.flags) || undefined;
            this.startTimestamp = (this._traceContext && this._traceContext.startTimestamp) || undefined;
            this.finishTimestamp = (this._traceContext && this._traceContext.finishTimestamp) || undefined;
            this.tags = (this._traceContext && JSON.parse(JSON.stringify(this._traceContext.tags))) || undefined;
        };
        this._traceContext = Object.freeze(traceContext);
        this._updateContext();
        return this;
    }
    /**
     * Creates new Trace and its first span with given service name
     * @param service the name of the service of the new span
     */
    static createSpan(service) {
        let newTrace = EventMessage_1.EventTraceMetadata.create(service);
        return new Trace(newTrace);
    }
    /**
     * Gets trace context from the current span
     */
    getContext() {
        return Object.assign({}, this._traceContext, { tags: JSON.parse(JSON.stringify(this.tags)) });
    }
    /**
     * Creates and returns new child span of the current span and changes the span service name
     * @param service the name of the service of the new child span
     */
    getChildSpan(service) {
        if (this._traceContext.finishTimestamp)
            throw new Error('Finished trace cannot have a child span');
        let inputTraceContext = this.getContext();
        if (!(inputTraceContext.traceId && inputTraceContext.spanId) && !(inputTraceContext.service)) {
            throw new Error('No Service or traceId or SpanId provided');
        }
        return new Trace(new EventMessage_1.EventTraceMetadata(Object.assign({}, inputTraceContext, {
            service,
            spanId: undefined,
            parentSpanId: inputTraceContext.spanId
        })));
    }
    /**
     * Injects trace context into a carrier with optional path.
     * @param carrier any kind of message or other object with keys of type String.
     * @param injectOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
     */
    injectContextToMessage(carrier, injectOptions = {}) {
        let result = carrier;
        let { path } = injectOptions; // type not implemented yet
        if (carrier instanceof EventMessage_1.EventMessage || (('metadata' in carrier)))
            path = 'metadata.trace';
        else if (('trace' in carrier))
            path = 'trace';
        else if (carrier instanceof EventMessage_1.EventTraceMetadata)
            result.metadata.trace = this._traceContext;
        if (path) {
            try {
                let pathArray = path.split('.');
                for (let i = 0; i < pathArray.length - 1; i++) {
                    if (!result[pathArray[i]]) {
                        if (i < pathArray.length) {
                            let o = {};
                            o[pathArray[i + 1]] = {};
                            result[pathArray[i]] = o;
                        }
                    }
                    result = result[pathArray[i]];
                }
            }
            catch (e) {
                throw e;
            }
        }
        result.trace = this._traceContext;
        return Promise.resolve(carrier);
    }
    /**
     * Sets tags to the current span. If child span is created, the tags are passed on.
     * @param tags key value pairs of tags. Tags can be changed on different child spans
     */
    setTags(tags) {
        let newContext = new EventMessage_1.EventTraceMetadata(this.getContext());
        if (!newContext.tags) {
            newContext.tags = tags;
        }
        else {
            for (let key in tags) {
                newContext.tags[key] = tags[key];
            }
        }
        this._traceContext = Object.freeze(new EventMessage_1.EventTraceMetadata(newContext));
        this._updateContext();
        return this;
    }
    /**
     * Finishes the trace by adding finish timestamp to the current span.
     * @param finishTimestamp optional parameter for the finish time. If omitted, current time is used.
     */
    finishSpan(finishTimestamp) {
        let newContext = Object.assign({}, this._traceContext);
        if (finishTimestamp instanceof Date) {
            newContext.finishTimestamp = finishTimestamp.toISOString(); // ISO 8601
        }
        else if (!finishTimestamp) {
            newContext.finishTimestamp = (new Date()).toISOString(); // ISO 8601
        }
        else {
            newContext.finishTimestamp = finishTimestamp;
        }
        this._traceContext = Object.freeze(new EventMessage_1.EventTraceMetadata(newContext));
        this._updateContext();
        return this;
    }
    /**
     * Extracts trace context from a carrier (ex: kafka message, event message, metadata, trace)
     * with optional path for the trace context to be extracted.
     * @param carrier any kind of message or other object with keys of type String.
     * @param extractOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
     */
    static extractContextFromMessage(carrier, extractOptions = {}) {
        let traceContext;
        let { path } = extractOptions; // type not implemented yet
        if (carrier instanceof EventMessage_1.EventMessage || (('metadata' in carrier) && 'trace' in carrier.metadata)) {
            path = 'metadata.trace';
        }
        else if ('trace' in carrier) {
            path = 'trace';
        }
        traceContext = createTraceMetadataFromContext(util_1.getNestedObject(carrier, path));
        return traceContext;
    }
    /**
     * Creates new child span from context with new service name
     * @param service the name of the service of the new child span
     * @param traceContext context of the previous span
     */
    static createChildSpanFromExtractedContext(service, traceContext) {
        let outputContext = Object.assign({}, traceContext, { service, spanId: undefined, parentSpanId: traceContext.spanId });
        return new Trace(new EventMessage_1.EventTraceMetadata(outputContext));
    }
}
exports.Trace = Trace;
//# sourceMappingURL=Trace.js.map