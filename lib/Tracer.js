"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventMessage_1 = require("./model/EventMessage");
const Span_1 = require("./Span");
const _ = require('lodash');
const TraceParent = require('traceparent');
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
        let result = _.cloneDeep(carrier);
        let { path } = injectOptions; // type not implemented yet
        if (carrier instanceof EventMessage_1.EventMessage || (('metadata' in carrier)))
            path = 'metadata';
        else if (carrier instanceof EventMessage_1.EventTraceMetadata)
            return Promise.resolve(context);
        if (!path)
            Object.assign(result, { trace: context });
        else
            _.merge(_.get(result, path), { trace: context });
        return result;
    }
    /**
     * Injects trace context into a http request headers.
     * @param context span context to be injected
     * @param request HTTP request.
     * @param type type of the headers that will be created - 'w3c' or 'xb3'.
     */
    static injectContextToHttpRequest(context, request, type = EventMessage_1.HttpRequestOptions.w3c) {
        let result = _.cloneDeep(request);
        result.headers = Span_1.setHttpHeader(context, type, result.headers);
        return result;
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
        spanContext = new EventMessage_1.EventTraceMetadata(_.get(carrier, path, carrier));
        return spanContext;
    }
    static extractContextFromHttpRequest(request, type = EventMessage_1.HttpRequestOptions.w3c) {
        let spanContext;
        switch (type) {
            case EventMessage_1.HttpRequestOptions.xb3: {
                let result = {};
                const requestHasXB3headers = !!request.headers && Object.keys(request.headers).some(key => !!key.toLowerCase().match(/x-b3-/));
                if (!requestHasXB3headers)
                    return undefined;
                for (let [key, value] of Object.entries(request.headers)) {
                    let keyLowerCase = key.toLowerCase();
                    if (keyLowerCase.startsWith('x-b3-')) {
                        let resultKey = key.replace('x-b3-', '');
                        result[resultKey] = value;
                    }
                }
                spanContext = new EventMessage_1.EventTraceMetadata(result);
                return spanContext;
            }
            case EventMessage_1.HttpRequestOptions.w3c:
            default: {
                if (!request.headers || !request.headers.traceparent)
                    return undefined;
                let context = TraceParent.fromString(request.headers.traceparent);
                let sampled = context.flags ? context.flags & 0x01 : 0;
                spanContext = new EventMessage_1.EventTraceMetadata({
                    traceId: context.traceId,
                    spanId: context.id,
                    flags: context.flags,
                    parentSpanId: context.parentId,
                    sampled: sampled
                });
                return spanContext;
            }
        }
    }
}
exports.Tracer = Tracer;
//# sourceMappingURL=Tracer.js.map