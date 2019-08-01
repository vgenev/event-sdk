"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EventMessage_1 = require("./model/EventMessage");
const lodash_1 = __importDefault(require("lodash"));
const Span_1 = require("./Span");
/**
 * Describes Event SDK methods from Tracer perspective
 */
class ATracer {
}
class Tracer {
    /**
     * Creates new span from new trace
     * @param service name of the service which will be asociated with the newly created span
     * @param tags optional tags for the span
     * @param recorders optional recorders. Defaults to defaultRecorder, which is either logger or sidecar client, based on default.json DISABLE_SIDECAR value
     * @param defaultTagsSetter optional default tags setter method.
     */
    static createSpan(service, tags, recorders, defaultTagsSetter) {
        return new Span_1.Span(new EventMessage_1.EventTraceMetadata({ service, tags }), recorders, defaultTagsSetter);
    }
    /**
     * Creates new child span from context with new service name
     * @param service the name of the service of the new child span
     * @param spanContext context of the previous span
     * @param recorders optional recorders. Defaults to defaultRecorder, which is either logger or sidecar client, based on default.json DISABLE_SIDECAR value
     */
    static createChildSpanFromContext(service, spanContext, recorders) {
        let outputContext = Object.assign({}, spanContext, { service, spanId: undefined, parentSpanId: spanContext.spanId, startTimestamp: undefined });
        return new Span_1.Span(new EventMessage_1.EventTraceMetadata(outputContext), recorders);
    }
    /**
     * Injects trace context into a carrier with optional path.
     * @param context span context to be injected
     * @param carrier any kind of message or other object with keys of type String.
     * @param injectOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
     */
    static injectContextToMessage(context, carrier, injectOptions = {}) {
        let result = lodash_1.default.cloneDeep(carrier);
        let { path } = injectOptions; // type not implemented yet
        if (carrier instanceof EventMessage_1.EventMessage || (('metadata' in carrier)))
            path = 'metadata';
        else if (carrier instanceof EventMessage_1.EventTraceMetadata)
            return Promise.resolve(context);
        if (!path)
            Object.assign(result, { trace: context });
        else
            lodash_1.default.merge(lodash_1.default.get(result, path), { trace: context });
        return Promise.resolve(result);
    }
    /**
     * Extracts trace context from a carrier (ex: kafka message, event message, metadata, trace)
     * with optional path for the trace context to be extracted.
     * @param carrier any kind of message or other object with keys of type String.
     * @param extractOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
     */
    static extractContextFromMessage(carrier, extractOptions = {}) {
        let spanContext;
        let { path } = extractOptions; // type not implemented yet
        if (carrier instanceof EventMessage_1.EventMessage || (('metadata' in carrier) && 'trace' in carrier.metadata)) {
            path = 'metadata.trace';
        }
        else if ('trace' in carrier) {
            path = 'trace';
        }
        spanContext = new EventMessage_1.EventTraceMetadata(lodash_1.default.get(carrier, path, carrier));
        return spanContext;
    }
}
exports.Tracer = Tracer;
//# sourceMappingURL=Tracer.js.map