import { TraceTags, TypeSpanContext } from "./model/EventMessage";
import { Span, ContextOptions, Recorders } from "./Span";
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
    static createSpan(service: string, tags?: TraceTags, recorders?: Recorders, defaultTagsSetter?: Span['defaultTagsSetter']): Span;
    /**
     * Creates new child span from context with new service name
     * @param service the name of the service of the new child span
     * @param spanContext context of the previous span
     */
    static createChildSpanFromContext(service: string, spanContext: TypeSpanContext, recorders?: Recorders): Span;
    /**
     * Injects trace context into a carrier with optional path.
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
    static extractContextFromMessage(message: {
        [key: string]: any;
    }, extractOptions?: ContextOptions): TypeSpanContext;
}
export { Tracer };
