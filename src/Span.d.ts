import { AuditEventAction, TraceTags, TypeSpanContext, EventTraceMetadata, EventStateMetadata } from './model/EventMessage';
import { IEventRecorder } from './Recorder';
declare type PartialWithDefaultRecorder<T> = {
    [P in keyof T]?: T[P];
} & {
    defaultRecorder: IEventRecorder;
};
declare type Recorders = PartialWithDefaultRecorder<{
    defaultRecorder: IEventRecorder;
    logRecorder?: IEventRecorder;
    auditRecorder?: IEventRecorder;
    traceRecorder?: IEventRecorder;
}>;
declare type TypeOfMessage = {
    [key: string]: NonNullable<any>;
} | string;
/**
 * defines options to the injectContextToMessage and extractContextFromMessage
 * @param type the carrier type
 * @param path in the carrier where the trace context should be injected or extracted from
 */
declare type ContextOptions = {
    type?: string;
    path?: string;
};
interface ISpan {
    spanContext: TypeSpanContext;
    recorders: Recorders;
    info: (message: TypeOfMessage) => Promise<any>;
    debug: (message: TypeOfMessage) => Promise<any>;
    verbose: (message: TypeOfMessage) => Promise<any>;
    performance: (message: TypeOfMessage) => Promise<any>;
    warning: (message: TypeOfMessage) => Promise<any>;
    error: (message: TypeOfMessage) => Promise<any>;
    audit: (message: TypeOfMessage) => Promise<any>;
    defaultTagsSetter: (message: TypeOfMessage) => Span;
    getContext: () => TypeSpanContext;
    finish: (message?: TypeOfMessage, finishTimestamp?: TypeSpanContext["finishTimestamp"]) => Promise<any>;
    getChild: (service: string, recorders?: Recorders) => ISpan;
    setTags: (tags: TraceTags) => Span;
    injectContextToMessage: (message: {
        [key: string]: any;
    }, injectOptions: ContextOptions) => {
        [key: string]: any;
    };
}
declare class Span implements Partial<ISpan> {
    spanContext: TypeSpanContext;
    recorders: Recorders;
    private _finished;
    constructor(spanContext: EventTraceMetadata, recorders?: Recorders, defaultTagsSetter?: (message: TypeOfMessage) => any);
    defaultTagsSetter(message: TypeOfMessage): Span;
    /**
     * Gets trace context from the current span
     */
    getContext(): TypeSpanContext;
    /**
       * Creates and returns new child span of the current span and changes the span service name
       * @param service the name of the service of the new child span
       */
    getChild(service: string, recorders?: Recorders): Span;
    /**
     * Injects trace context into a carrier with optional path.
     * @param carrier any kind of message or other object with keys of type String.
     * @param injectOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
     */
    injectContextToMessage(carrier: {
        [key: string]: any;
    }, injectOptions?: ContextOptions): Promise<{
        [key: string]: any;
    }>;
    /**
     * Sets tags to the current span. If child span is created, the tags are passed on.
     * @param tags key value pairs of tags. Tags can be changed on different child spans
     */
    setTags(tags: TraceTags): this;
    /**
  * Finishes the current span and its trace and sends the data to the tracing framework.
  * @param finishTimestamp optional parameter for the finish time. If omitted, current time is used.
  */
    finish(message?: TypeOfMessage, finishTimestamp?: string | Date): Promise<this>;
    /**
     * Finishes the trace by adding finish timestamp to the current span.
     * @param finishTimestamp optional parameter for the finish time. If omitted, current time is used.
     */
    private _finishSpan;
    /**
     * Sends trace message to the tracing framework
     * @param spanContext optional parameter. Can be used to trace previous span. If not set, the current span context is used.
     * @param traceOptions options for status and event action. Default action is 'span' and status is success
     */
    private trace;
    /**
     * Sends audit type message to the event logging framework.
     * @param message message to be recorded as audit event
     * @param auditOptions Logger options object.
     */
    audit(message: TypeOfMessage, action?: AuditEventAction, state?: EventStateMetadata): Promise<any>;
    /**
     * Logs INFO type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    info(message: TypeOfMessage, state?: EventStateMetadata): Promise<any>;
    /**
     * Logs DEBUG type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    debug(message: TypeOfMessage, state?: EventStateMetadata): Promise<any>;
    /**
     * Logs VERBOSE type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    verbose(message: TypeOfMessage, state?: EventStateMetadata): Promise<any>;
    /**
     * Logs PERFORMANCE type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    performance(message: TypeOfMessage, state?: EventStateMetadata): Promise<any>;
    /**
     * Logs WARNING type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    warning(message: TypeOfMessage, state?: EventStateMetadata): Promise<any>;
    /**
     * Logs ERROR type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    error(message: TypeOfMessage, state?: EventStateMetadata): Promise<any>;
    private recordMessage;
    private createEventMessage;
}
export { Span, ContextOptions, Recorders };
