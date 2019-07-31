"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventMessage_1 = require("./model/EventMessage");
const util_1 = require("./lib/util");
const Span_1 = require("./Span");
class ATracer {
}
class Tracer {
    static createSpan(service, tags, recorders, defaultTagsSetter) {
        return new Span_1.Span(new EventMessage_1.EventTraceMetadata({ service, tags }), recorders, defaultTagsSetter);
    }
    /**
     * Creates new child span from context with new service name
     * @param service the name of the service of the new child span
     * @param spanContext context of the previous span
     */
    static createChildSpanFromContext(service, spanContext, recorders) {
        let outputContext = Object.assign({}, spanContext, { service, spanId: undefined, parentSpanId: spanContext.spanId, startTimestamp: undefined });
        return new Span_1.Span(new EventMessage_1.EventTraceMetadata(outputContext), recorders);
    }
    /**
     * Injects trace context into a carrier with optional path.
     * @param carrier any kind of message or other object with keys of type String.
     * @param injectOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
     */
    static injectContextToMessage(context, carrier, injectOptions = {}) {
        let result = carrier;
        let { path } = injectOptions; // type not implemented yet
        if (carrier instanceof EventMessage_1.EventMessage || (('metadata' in carrier)))
            path = 'metadata.trace';
        else if (('trace' in carrier))
            path = 'trace';
        else if (carrier instanceof EventMessage_1.EventTraceMetadata)
            result.metadata.trace = context;
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
        result.trace = context;
        return Promise.resolve(carrier);
    }
    /**
     * Extracts trace context from a carrier (ex: kafka message, event message, metadata, trace)
     * with optional path for the trace context to be extracted.
     * @param carrier any kind of message or other object with keys of type String.
     * @param extractOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
     */
    static extractContextFromMessage(message, extractOptions = {}) {
        let spanContext;
        let { path } = extractOptions; // type not implemented yet
        if (message instanceof EventMessage_1.EventMessage || (('metadata' in message) && 'trace' in message.metadata)) {
            path = 'metadata.trace';
        }
        else if ('trace' in message) {
            path = 'trace';
        }
        spanContext = new EventMessage_1.EventTraceMetadata(util_1.getNestedObject(message, path));
        return spanContext;
    }
}
exports.Tracer = Tracer;
//# sourceMappingURL=Tracer.js.map