import { AuditEventAction, TraceTags, TypeSpanContext, EventTraceMetadata, EventStateMetadata } from './model/EventMessage';
import { IEventRecorder } from './Recorder';
declare type PartialWithDefaultRecorder<T> = {
    [P in keyof T]?: T[P];
} & {
    defaultRecorder: IEventRecorder;
};
/**
 * Defines Recorders type.
 * @param defaultRecorder a recorder that will be used by default by the span if the others are not present.
 * @param logRecorder a recorder that will be used to log any logging level events
 * @param auditRecorder a recorder that will be used to log audit events
 * @param traceRecorder a recorder that will be used to log trace events
 */
declare type Recorders = PartialWithDefaultRecorder<{
    defaultRecorder: IEventRecorder;
    logRecorder?: IEventRecorder;
    auditRecorder?: IEventRecorder;
    traceRecorder?: IEventRecorder;
}>;
/**
 * Defines messages allowed to be sent to the Event framework
 */
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
/**
 * Defines Span interface operations
 * @param {TypeSpanContext} spanContext the context of the span
 * @param {Recorders} recorders object that holds span recorders which are going to be used for different operations. defaultRecorder is obligatory
 * @param info Defines a method to log at info level a message from the span perspective
 * @param debug Defines a method to log at debug level a message from the span perspective
 * @param verbose Defines a method to log at verbose level a message from the span perspective
 * @param performance Defines a method to log at performance level a message from the span perspective
 * @param warning Defines a method to log at warning level a message from the span perspective
 * @param error Defines a method to log at error level a message from the span perspective
 * @param audit Defines a method to send audit event to the auditing environment
 * @param defaultTagsSetter Defines a method to set default tags. Currently has null implementation
 * @param getContext Defines method to get the span context as JS object
 * @param finish Defines a method to finish the current span and send tracing information to the tracing environment
 * @param getChild Defines a method to get child span
 * @param setTags Defines a method to set tags to the span
 * @param injectContextToMessage Defnies a method to inject current span context into message carrier
 */
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
    defaultTagsSetter: (message?: TypeOfMessage) => Span;
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
    /**
     * Creates new span. Normally this is not used directly, but by a Tracer.createSpan method
     * @param spanContext context of the new span. Service is obligatory. Depending on the rest provided values, the new span will be created as a parent or child span
     * @param {Recorders} recorders different recorders to be used for different logging methods
     * @param defaultTagsSetter the tags setter method can be passed here
     */
    constructor(spanContext: EventTraceMetadata, recorders?: Recorders, defaultTagsSetter?: (message: TypeOfMessage) => any);
    /**
     * A method to set tags by default. Not implemented yet
     * @param message the message which tags will be extracted from
     */
    defaultTagsSetter(message?: TypeOfMessage): Span;
    /**
     * Gets trace context from the current span
     */
    getContext(): TypeSpanContext;
    /**
       * Creates and returns new child span of the current span and changes the span service name
       * @param service the name of the service of the new child span
       * @param recorders the recorders which are be set to the child span. If omitted, the recorders of the parent span are used
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
    * @param message optional parameter for a message to be passed to the tracing framework.
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
     * @param message
     * @param spanContext optional parameter. Can be used to trace previous span. If not set, the current span context is used.
     * @param action optional parameter for action. Defaults to 'span'
     * @param state optional parameter for state. Defaults to 'success'
     */
    private trace;
    /**
     * Sends audit type message to the event logging framework.
     * @param message message to be recorded as audit event
     * @param action optional parameter for action. Defaults to 'default'
     * @param state optional parameter for state. Defaults to 'success'
     */
    audit(message: TypeOfMessage, action?: AuditEventAction, state?: EventStateMetadata): Promise<any>;
    /**
     * Logs INFO type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     * @param state optional parameter for state. Defaults to 'success'
     */
    info(message: TypeOfMessage, state?: EventStateMetadata): Promise<any>;
    /**
     * Logs DEBUG type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     * @param state optional parameter for state. Defaults to 'success'
     */
    debug(message: TypeOfMessage, state?: EventStateMetadata): Promise<any>;
    /**
     * Logs VERBOSE type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     * @param state optional parameter for state. Defaults to 'success'
     */
    verbose(message: TypeOfMessage, state?: EventStateMetadata): Promise<any>;
    /**
     * Logs PERFORMANCE type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     * @param state optional parameter for state. Defaults to 'success'
     */
    performance(message: TypeOfMessage, state?: EventStateMetadata): Promise<any>;
    /**
     * Logs WARNING type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     * @param state optional parameter for state. Defaults to 'success'
     */
    warning(message: TypeOfMessage, state?: EventStateMetadata): Promise<any>;
    /**
     * Logs ERROR type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     * @param state optional parameter for state. Defaults to 'success'
     */
    error(message: TypeOfMessage, state?: EventStateMetadata): Promise<any>;
    /**
     * Sends Event message to recorders
     * @param message the Event message that needs to be recorded
     * @param type type of Event
     * @param action optional parameter for action. The default is based on type defaults
     * @param state optional parameter for state. Defaults to 'success'
     */
    private recordMessage;
    /**
     * Helper function to create event message, based on message and event types, action and state.
     */
    private createEventMessage;
}
export { Span, ContextOptions, Recorders };
