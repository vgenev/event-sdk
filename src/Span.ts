import serializeError from 'serialize-error';
import _ from 'lodash'
const TraceParent = require('traceparent')

import {
  NullEventAction,
  AuditEventAction,
  LogEventAction,
  TraceEventAction,
  LogResponseStatus,
  EventType,
  TraceTags,
  TypeEventMessage,
  TypeEventMetadata,
  TypeSpanContext,
  EventTraceMetadata,
  EventMessage,
  TypeEventTypeAction,
  EventStateMetadata,
  EventMetadata,
  TraceEventTypeAction,
  AuditEventTypeAction,
  LogEventTypeAction,
  TypeEventAction,
  HttpRequestOptions
} from './model/EventMessage'
import {
  IEventRecorder, DefaultLoggerRecorder, DefaultSidecarRecorder
} from './Recorder'
import { EventLoggingServiceClient } from './transport/EventLoggingServiceClient';
import Config from './lib/config'

type RecorderKeys = 'defaultRecorder' | 'logRecorder' | 'auditRecorder' | 'traceRecorder'

const defaultRecorder = Config.EVENT_LOGGER_SIDECAR_DISABLED
  ? new DefaultLoggerRecorder()
  : new DefaultSidecarRecorder(new EventLoggingServiceClient(Config.EVENT_LOGGER_SERVER_HOST, Config.EVENT_LOGGER_SERVER_PORT))


type PartialWithDefaultRecorder<T> = {
  [P in keyof T]?: T[P]
} & {
  defaultRecorder: IEventRecorder
}

/**
 * Defines Recorders type. 
 * @param defaultRecorder a recorder that will be used by default by the span if the others are not present.
 * @param logRecorder a recorder that will be used to log any logging level events
 * @param auditRecorder a recorder that will be used to log audit events
 * @param traceRecorder a recorder that will be used to log trace events
 */

type Recorders = PartialWithDefaultRecorder<{
  defaultRecorder: IEventRecorder
  logRecorder?: IEventRecorder,
  auditRecorder?: IEventRecorder,
  traceRecorder?: IEventRecorder
}>

/**
 * Defines messages allowed to be sent to the Event framework
 */
type TypeOfMessage = { [key: string]: NonNullable<any> } | string

/**
 * defines options to the injectContextToMessage and extractContextFromMessage
 * @param type the carrier type
 * @param path in the carrier where the trace context should be injected or extracted from
 */
type ContextOptions = {
  type?: string,
  path?: string
}

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
 * @param injectContextToHttpRequest Defnies a method to inject current span context into http request
 */

interface ISpan {
  spanContext: TypeSpanContext
  recorders: Recorders
  info: (message: TypeOfMessage) => Promise<any>
  debug: (message: TypeOfMessage) => Promise<any>
  verbose: (message: TypeOfMessage) => Promise<any>
  performance: (message: TypeOfMessage) => Promise<any>
  warning: (message: TypeOfMessage) => Promise<any>
  error: (message: TypeOfMessage) => Promise<any>
  audit: (message: TypeOfMessage) => Promise<any>
  // trace: (message: { [key: string]: any}) => Promise<any> // TODO need to findout is there an usecase for that 
  defaultTagsSetter: (message?: TypeOfMessage) => Span
  getContext: () => TypeSpanContext
  finish: (message?: TypeOfMessage, state?: EventStateMetadata, finishTimestamp?: TypeSpanContext["finishTimestamp"]) => Promise<any>
  getChild: (service: string, recorders?: Recorders) => ISpan
  setTags: (tags: TraceTags) => Span
  injectContextToMessage: (message: { [key: string]: any }, injectOptions: ContextOptions) => { [key: string]: any },
  injectContextToHttpRequest: (request: { [key: string]: any }, type?: HttpRequestOptions) => { [key: string]: any }

}

class Span implements Partial<ISpan> {
  spanContext: TypeSpanContext
  recorders: Recorders
  isFinished: boolean = false

  /**
   * Creates new span. Normally this is not used directly, but by a Tracer.createSpan method
   * @param spanContext context of the new span. Service is obligatory. Depending on the rest provided values, the new span will be created as a parent or child span
   * @param {Recorders} recorders different recorders to be used for different logging methods 
   * @param defaultTagsSetter the tags setter method can be passed here
   */
  constructor(
    spanContext: EventTraceMetadata,
    recorders?: Recorders,
    defaultTagsSetter?: (message: TypeOfMessage) => any) {
    this.spanContext = Object.freeze(spanContext)
    this.defaultTagsSetter = defaultTagsSetter ? defaultTagsSetter : this.defaultTagsSetter
    this.recorders = recorders ? recorders : { defaultRecorder }
    this.defaultTagsSetter()
    return this
  }

  /**
   * A method to set tags by default. Not implemented yet
   * @param message the message which tags will be extracted from
   */

  defaultTagsSetter(message?: TypeOfMessage): Span {
    return this
  }

  /**
   * Gets trace context from the current span
   */
  getContext(): TypeSpanContext {
    return Object.assign({}, this.spanContext, { tags: JSON.parse(JSON.stringify(this.spanContext.tags)) })
  }

  /**
     * Creates and returns new child span of the current span and changes the span service name
     * @param service the name of the service of the new child span
     * @param recorders the recorders which are be set to the child span. If omitted, the recorders of the parent span are used
     */
  getChild(service: string, recorders: Recorders = this.recorders): Span {
    try {
      let inputTraceContext: TypeSpanContext = this.getContext()
      return new Span(new EventTraceMetadata(Object.assign({},
        inputTraceContext, {
          service,
          spanId: undefined,
          startTimestamp: undefined,
          finishTimestamp: undefined,
          parentSpanId: inputTraceContext.spanId
        })), recorders, this.defaultTagsSetter)
    } catch (e) {
      throw (e)
    }
  }

  /**
   * Injects trace context into a carrier with optional path.
   * @param carrier any kind of message or other object with keys of type String.
   * @param injectOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
   */
  injectContextToMessage(carrier: { [key: string]: any }, injectOptions: ContextOptions = {}): { [key: string]: any } {
    let result = _.cloneDeep(carrier)
    let { path } = injectOptions // type not implemented yet
    if (carrier instanceof EventMessage || (('metadata' in carrier))) path = 'metadata'
    else if (carrier instanceof EventTraceMetadata) return Promise.resolve(this.spanContext)
    if (!path) Object.assign(result, { trace: this.spanContext })
    else _.merge(_.get(result, path), { trace: this.spanContext })
    return result
  }

  /**
   * Injects trace context into a http request headers.
   * @param request HTTP request.
   * @param type type of the headers that will be created - 'w3c' or 'xb3'.
   */

  injectContextToHttpRequest(request: { [key: string]: any }, type: HttpRequestOptions = HttpRequestOptions.w3c): { [key: string]: any } {
    let result = _.cloneDeep(request)
    result.headers = setHttpHeader(this.spanContext, type, result.headers)
    return result
  }

  /**
   * Sets tags to the current span. If child span is created, the tags are passed on.
   * @param tags key value pairs of tags. Tags can be changed on different child spans
   */
  setTags(tags: TraceTags): this {
    let newContext: TypeSpanContext = new EventTraceMetadata(this.getContext())
    for (let key in tags) {
      newContext.tags![key] = tags[key]
    }
    this.spanContext = Object.freeze(new EventTraceMetadata(newContext))
    return this
  }

  /**
  * Finishes the current span and its trace and sends the data to the tracing framework.
  * @param message optional parameter for a message to be passed to the tracing framework.
  * @param finishTimestamp optional parameter for the finish time. If omitted, current time is used.
  */
  async finish(message?: TypeOfMessage, state?: EventStateMetadata, finishTimestamp?: string | Date): Promise<this> {
    if (this.spanContext.finishTimestamp) return Promise.reject(new Error('span already finished'))
    let spanContext = this._finishSpan(finishTimestamp).getContext()
    await this.trace(message, spanContext, state)
    return Promise.resolve(this)
  }

  /**
   * Finishes the trace by adding finish timestamp to the current span.
   * @param finishTimestamp optional parameter for the finish time. If omitted, current time is used.
   */
  private _finishSpan(finishTimestamp?: string | Date): this {
    let newContext: TypeSpanContext = <TypeSpanContext>Object.assign({}, this.spanContext)
    if (finishTimestamp instanceof Date) {
      newContext.finishTimestamp = finishTimestamp.toISOString() // ISO 8601
    } else if (!finishTimestamp) {
      newContext.finishTimestamp = (new Date()).toISOString() // ISO 8601
    } else {
      newContext.finishTimestamp = finishTimestamp
    }
    this.spanContext = Object.freeze(new EventTraceMetadata(newContext))
    return this
  }


  /**
   * Sends trace message to the tracing framework
   * @param message 
   * @param spanContext optional parameter. Can be used to trace previous span. If not set, the current span context is used.
   * @param action optional parameter for action. Defaults to 'span'
   * @param state optional parameter for state. Defaults to 'success'
   */
  private async trace(message?: TypeOfMessage, spanContext: TypeSpanContext = this.spanContext, state?: EventStateMetadata, action?: TraceEventAction): Promise<any> {
    if (!message) message = new EventMessage({
      type: 'application/json',
      content: spanContext
    })
    try {
      await this.recordMessage(message, TraceEventTypeAction.getType(), action, state)
      this.isFinished = this.spanContext.finishTimestamp ? true : false
      return this
    } catch (e) {
      throw new Error(`Error when logging trace. ${JSON.stringify(e, null, 2)}`)
    }
  }

  /**
   * Sends audit type message to the event logging framework. 
   * @param message message to be recorded as audit event
   * @param action optional parameter for action. Defaults to 'default'
   * @param state optional parameter for state. Defaults to 'success'
   */
  async audit(message: TypeOfMessage, action?: AuditEventAction, state?: EventStateMetadata): Promise<any> {
    let result = await this.recordMessage(message, AuditEventTypeAction.getType(), action, state)
    return result
  }

  /**
   * Logs INFO type message.
   * @param message if message is a string, the message is added to a message property of context of an event message.
   * If message is not following the event framework message format, the message is added as it is to the context of an event message.
   * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created. 
   * @param state optional parameter for state. Defaults to 'success'
   */
  async info(message: TypeOfMessage, state?: EventStateMetadata): Promise<any> {
    let { action, type } = new LogEventTypeAction(LogEventAction.info)
    await this.recordMessage(message, type, action, state)
  }

  /**
   * Logs DEBUG type message.
   * @param message if message is a string, the message is added to a message property of context of an event message.
   * If message is not following the event framework message format, the message is added as it is to the context of an event message.
   * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created. 
   * @param state optional parameter for state. Defaults to 'success'
   */
  async debug(message: TypeOfMessage, state?: EventStateMetadata): Promise<any> {
    let { action, type } = new LogEventTypeAction(LogEventAction.debug)
    await this.recordMessage(message, type, action, state)
  }

  /**
   * Logs VERBOSE type message.
   * @param message if message is a string, the message is added to a message property of context of an event message.
   * If message is not following the event framework message format, the message is added as it is to the context of an event message.
   * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created. 
   * @param state optional parameter for state. Defaults to 'success'
   */
  async verbose(message: TypeOfMessage, state?: EventStateMetadata): Promise<any> {
    let { action, type } = new LogEventTypeAction(LogEventAction.verbose)
    await this.recordMessage(message, type, action, state)
  }

  /**
   * Logs PERFORMANCE type message.
   * @param message if message is a string, the message is added to a message property of context of an event message.
   * If message is not following the event framework message format, the message is added as it is to the context of an event message.
   * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created. 
   * @param state optional parameter for state. Defaults to 'success'
   */
  async performance(message: TypeOfMessage, state?: EventStateMetadata): Promise<any> {
    let { action, type } = new LogEventTypeAction(LogEventAction.performance)
    await this.recordMessage(message, type, action, state)
  }

  /**
   * Logs WARNING type message.
   * @param message if message is a string, the message is added to a message property of context of an event message.
   * If message is not following the event framework message format, the message is added as it is to the context of an event message.
   * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created. 
   * @param state optional parameter for state. Defaults to 'success'
   */
  async warning(message: TypeOfMessage, state?: EventStateMetadata): Promise<any> {
    let { action, type } = new LogEventTypeAction(LogEventAction.warning)
    await this.recordMessage(message, type, action, state)
  }

  /**
   * Logs ERROR type message.
   * @param message if message is a string, the message is added to a message property of context of an event message.
   * If message is not following the event framework message format, the message is added as it is to the context of an event message.
   * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created. 
   * @param state optional parameter for state. Defaults to 'success'
   */
  async error(message: TypeOfMessage, state?: EventStateMetadata): Promise<any> {
    let { action, type } = new LogEventTypeAction(LogEventAction.error)
    await this.recordMessage(message, type, action, state)
  }

  /**
   * Sends Event message to recorders
   * @param message the Event message that needs to be recorded
   * @param type type of Event
   * @param action optional parameter for action. The default is based on type defaults
   * @param state optional parameter for state. Defaults to 'success'
   */

  private async recordMessage(message: TypeOfMessage, type: TypeEventTypeAction['type'], action?: TypeEventTypeAction['action'], state?: EventStateMetadata) {
    if (this.isFinished) {
      throw new Error('span finished. no further actions allowed')
    }

    let newEnvelope = this.createEventMessage(message, type, action, state)
    let key = <RecorderKeys>`${type}Recorder`

    let recorder = this.recorders.defaultRecorder
    if (this.recorders[key]) {
      recorder = this.recorders[key]!
    }

    if (Config.ASYNC_OVERRIDE) {
      //Don't wait for .record() to resolve, return straight away
      recorder.record(newEnvelope, Config.EVENT_LOGGER_SIDECAR_WITH_LOGGER)
      return true
    }

    const logResult = await recorder.record(newEnvelope, Config.EVENT_LOGGER_SIDECAR_WITH_LOGGER)

    if (logResult.status !== LogResponseStatus.accepted) {
      throw new Error(`Error when recording ${type}-${action} event. status: ${logResult.status}`)
    }

    return logResult;
  }

  /**
   * Helper function to create event message, based on message and event types, action and state.
   */
  private createEventMessage = (
    message: TypeOfMessage,
    type: TypeEventTypeAction['type'],
    _action?: TypeEventTypeAction['action'],
    state: EventStateMetadata = EventStateMetadata.success()): EventMessage => {
    let defaults = getDefaults(type)
    let action = _action ? _action : defaults.action
    let messageToLog
    if (message instanceof Error) {
      // const callsites = ErrorCallsites(message)
      // message.__error_callsites = callsites
      messageToLog = new EventMessage({
        content: { error: serializeError(message) },
        type: 'application/json'
      })
    } else if (typeof message === 'string') {
      messageToLog = new EventMessage({
        content: { payload: message },
        type: 'application/json'
      })
    } else { // if ((typeof message === 'object') && (!(message.hasOwnProperty('content')) || !(message.hasOwnProperty('type')))) {
      messageToLog = new EventMessage({
        content: message,
        type: 'application/json'
      })
      // } else {
      //   messageToLog = new EventMessage(<TypeEventMessage>message)
    }
    return Object.assign(messageToLog, {
      metadata: {
        event: defaults.eventMetadataCreator({
          action,
          state
        }),
        trace: <TypeSpanContext>this.spanContext
      }
    })
  }
}

interface IDefaultActions {
  action: TypeEventAction['action'],
  eventMetadataCreator: (input: TypeEventMetadata) => TypeEventMetadata
}

const getDefaults = (type: EventType): IDefaultActions => {
  switch (type) {
    case EventType.audit: {
      return {
        action: AuditEventAction.default,
        eventMetadataCreator: EventMetadata.audit
      }
    }
    case EventType.trace: {
      return {
        action: TraceEventAction.span,
        eventMetadataCreator: EventMetadata.trace
      }
    }
    case EventType.log: {
      return {
        action: LogEventAction.info,
        eventMetadataCreator: EventMetadata.log
      }
    }
  }
  return {
    action: NullEventAction.undefined,
    eventMetadataCreator: EventMetadata.log
  }
}

const setHttpHeader = (context: TypeSpanContext, type: HttpRequestOptions, headers: { [key: string]: any }): { [key: string]: any } => {

  const createW3CTracestate = (tracestate: string, opaqueValue: string): string => {
    let tracestateArray = (tracestate.split(','))
    let resultMap = new Map()
    let resultArray = []
    let result
    for (let rawStates of tracestateArray) {
      let states = rawStates.trim()
      let [vendorRaw] = states.split('=')
      resultMap.set(vendorRaw.trim(), states)
    }

    if (resultMap.has(Config.EVENT_LOGGER_VENDOR_PREFIX)) {
      resultMap.delete(Config.EVENT_LOGGER_VENDOR_PREFIX)
      for (let entry of resultMap.values()) {
        resultArray.push(entry)
      }
      resultArray.unshift(`${Config.EVENT_LOGGER_VENDOR_PREFIX}=${opaqueValue}`)
      result = resultArray.join(',')
    } else {
      tracestateArray.unshift(`${Config.EVENT_LOGGER_VENDOR_PREFIX}=${opaqueValue}`)
      result = tracestateArray.join(',')
    }
    return result
  }

  const { traceId, parentSpanId, spanId, flags, sampled } = context

  switch (type) {

    case HttpRequestOptions.xb3: {
      let XB3headers = {
        'X-B3-TraceId': traceId,
        'X-B3-SpanId': spanId,
        'X-B3-Sampled': sampled,
        'X-B3-Flags': flags,
        'X-B3-Version': '0'
      }
      let result = parentSpanId ? Object.assign({ 'X-B3-ParentSpanId': parentSpanId }, XB3headers) : XB3headers
      return Object.assign(headers, result)
    }

    case HttpRequestOptions.w3c:
    default: {
      const version = Buffer.alloc(1).fill(0)
      const flagsForBuff = (flags && sampled) ? (flags | sampled) : flags ? flags : sampled ? sampled : 0x00
      const flagsBuffer = Buffer.alloc(1).fill(flagsForBuff)
      const traceIdBuff = Buffer.from(traceId, 'hex')
      const spanIdBuff = Buffer.from(spanId, 'hex')
      const parentSpanIdBuff = parentSpanId && Buffer.from(parentSpanId, 'hex')
      let result = {}
      let W3CHeaders = parentSpanIdBuff
        ? new TraceParent(Buffer.concat([version, traceIdBuff, spanIdBuff, flagsBuffer, parentSpanIdBuff]))
        : new TraceParent(Buffer.concat([version, traceIdBuff, spanIdBuff, flagsBuffer]))
      if (headers.tracestate) {
        return Object.assign({ traceparent: W3CHeaders.toString() }, { tracestate: createW3CTracestate(headers.tracestate, spanId), headers })
      }
      return Object.assign({ traceparent: W3CHeaders.toString() }, headers)
    }
  }
}

export {
  Span,
  ContextOptions,
  Recorders,
  setHttpHeader
}