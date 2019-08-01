import { TraceTags, TypeSpanContext } from "./model/EventMessage";
import { Span, ContextOptions, Recorders } from "./Span";
/**
 * Describes Event SDK methods from Tracer perspective
 */
declare abstract class ATracer {
    static createSpan: (service: string, tags?: TraceTags, recorders?: Recorders, defaultTagsSetter?: Span['defaultTagsSetter']) => Span;
    static createChildSpanFromContext: (service: string, context: TypeSpanContext, recorders?: Recorders) => {};
    static injectContextToMessage: (context: TypeSpanContext, message: {
        [key: string]: any;
    }, path?: string) => {
        [key: string]: any;
    };
    static extractContextFromMessage: (message: {
        [key: string]: any;
    }, path?: string) => TypeSpanContext;
}
declare class Tracer implements ATracer {
    /**
     * Creates new span from new trace
     * @param service name of the service which will be asociated with the newly created span
     * @param tags optional tags for the span
     * @param recorders optional recorders. Defaults to defaultRecorder, which is either logger or sidecar client, based on default.json DISABLE_SIDECAR value
     * @param defaultTagsSetter optional default tags setter method.
     */
    static createSpan(service: string, tags?: TraceTags, recorders?: Recorders, defaultTagsSetter?: Span['defaultTagsSetter']): Span;
    /**
     * Creates new child span from context with new service name
     * @param service the name of the service of the new child span
     * @param spanContext context of the previous span
     * @param recorders optional recorders. Defaults to defaultRecorder, which is either logger or sidecar client, based on default.json DISABLE_SIDECAR value
     */
    static createChildSpanFromContext(service: string, spanContext: TypeSpanContext, recorders?: Recorders): Span;
    /**
     * Injects trace context into a carrier with optional path.
     * @param context span context to be injected
     * @param carrier any kind of message or other object with keys of type String.
     * @param injectOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
     */
    static injectContextToMessage(context: TypeSpanContext, carrier: {
        [key: string]: any;
    }, injectOptions?: ContextOptions): Promise<{
        [key: string]: any;
    }>;
    /**
     * Extracts trace context from a carrier (ex: kafka message, event message, metadata, trace)
     * with optional path for the trace context to be extracted.
     * @param carrier any kind of message or other object with keys of type String.
     * @param extractOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
     */
    static extractContextFromMessage(carrier: {
        [key: string]: any;
    }, extractOptions?: ContextOptions): TypeSpanContext;
}
export { Tracer };
