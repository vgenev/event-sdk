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
import Util from './lib/util'

type RecorderKeys = 'defaultRecorder' | 'logRecorder' | 'auditRecorder' | 'traceRecorder'

const defaultRecorder = Config.EVENT_LOGGER_SIDECAR_DISABLED
  ? new DefaultLoggerRecorder()
  : new DefaultSidecarRecorder(new EventLoggingServiceClient(Config.EVENT_LOGGER_SERVER_HOST, Config.EVENT_LOGGER_SERVER_PORT))


/**
 * A dict containing EventTypes which should be treated asynchronously
 * 
 */
const asyncOverrides = Util.eventAsyncOverrides(Config.ASYNC_OVERRIDE_EVENTS)

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
 * @param getTags Returns current tags
 * @param setTracestateTags Sets tags to configured vendor and passes them to the tracestate header as base64 encoded JSON
 * @param getTracestateTags Gets the tags stored into configured vendor tracestate as JSON
 * @param getTracestates Gets the tracestate as key value pairs as key is the vendor, and for the configured vendor, the value is another key value pairs list, decoded from the tracestate header 
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
  getTags: () => TraceTags
  setTracestateTags: (tags: TraceTags) => Span
  getTracestateTags: () => TraceTags
  getTracestates: () => { [key: string]: TraceTags | string }
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
    this.defaultTagsSetter = defaultTagsSetter ? defaultTagsSetter : this.defaultTagsSetter
    this.recorders = recorders ? recorders : { defaultRecorder }
    if (!!spanContext.tags && !!spanContext.tags.tracestate) {
      spanContext.tracestates = Util.getTracestateMap(Config.EVENT_LOGGER_VENDOR_PREFIX, spanContext.tags.tracestate).tracestates
      if (!spanContext.tracestates[Config.EVENT_LOGGER_VENDOR_PREFIX]) {
        spanContext.tracestates[Config.EVENT_LOGGER_VENDOR_PREFIX] = { spanId: spanContext.spanId }
      }
    }
    this.spanContext = spanContext
    this.defaultTagsSetter()
    this.spanContext = Object.freeze(this.spanContext)
    return this
  }

  /**
   * A method to set tags by default.
   * @param message the message which tags will be extracted from
   */

  defaultTagsSetter(message?: TypeOfMessage): Span {
    const w3cHeaders = getTracestate(this.spanContext)
    if (w3cHeaders) {
      this.setTags(Object.assign(this.spanContext.tags, w3cHeaders))
      if (!(Config.EVENT_LOGGER_VENDOR_PREFIX in this.getTracestates())) {
        this.setTracestates(Object.assign(this.spanContext.tracestates, Util.getTracestateMap(Config.EVENT_LOGGER_VENDOR_PREFIX, w3cHeaders.tracestate).tracestates))
      }
    }
    return this
  }

  setTracestates(tracestates: {[key: string]: TraceTags | string }): this {
    let newContext: TypeSpanContext = new EventTraceMetadata(this.getContext())
    for (let key in tracestates) {
      newContext.tracestates![key] = tracestates[key]
    }
    this.spanContext = Object.freeze(new EventTraceMetadata(newContext))
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
    else if (carrier instanceof EventTraceMetadata) {
      return Promise.resolve(this.spanContext)
    }
    if (!path) {
      Object.assign(result, { trace: this.spanContext })
    } else {
      _.merge(_.get(result, path), { trace: this.spanContext })
    }
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
      if (key === 'tracestate' || key === 'traceparent') continue
      newContext.tags![key] = tags[key]
    }
    this.spanContext = Object.freeze(new EventTraceMetadata(newContext))
    return this
  }

  private _setTagTracestate(tags: { ['tracestate']: string} ): this {
    let newContext: TypeSpanContext = new EventTraceMetadata(this.getContext())
    newContext.tags!.tracestate = tags.tracestate
    this.spanContext = Object.freeze(new EventTraceMetadata(newContext))
    return this
  }
  
  /**
   * Returns tags values
   */
  getTags(): TraceTags {
    const { tags } = this.getContext()
    return !!tags ? tags : {}
  }

  /**
   * Sets tags, persisted in the tracestate header as key value pairs as base64 encoded string
   * @param tags key-value pairs with tags
   */
  setTracestateTags(tags: TraceTags): this {
    this.spanContext.tracestates![Config.EVENT_LOGGER_VENDOR_PREFIX] = Object.assign(this.spanContext.tracestates![Config.EVENT_LOGGER_VENDOR_PREFIX], tags)
    const { ownTraceStateString, restTraceStateString } = encodeTracestate(this.spanContext)
    this._setTagTracestate({tracestate: `${ownTraceStateString}${restTraceStateString}`})
    return this
  }

  /**
   * Returns the tracestates object per vendor, as configured vendor tracestate is decoded key value pair with tags
   */
  getTracestates(): { [key: string]: TraceTags | string } {
    return this.spanContext.tracestates!
  }

  /**
   * Returns the tracestate tags for the configured vendor as key value pairs
   */
  getTracestateTags(): TraceTags {
    if (Config.EVENT_LOGGER_VENDOR_PREFIX in this.spanContext.tracestates!) {
      return this.spanContext.tracestates![Config.EVENT_LOGGER_VENDOR_PREFIX] as TraceTags
    } else {
      return {}
    }
  }


  /**
  * Finishes the current span and its trace and sends the data to the tracing framework.
  * @param message optional parameter for a message to be passed to the tracing framework.
  * @param finishTimestamp optional parameter for the finish time. If omitted, current time is used.
  */
  async finish(message?: TypeOfMessage, state?: EventStateMetadata, finishTimestamp?: string | Date): Promise<this> {
    if (this.spanContext.finishTimestamp) {
      return Promise.reject(new Error('span already finished'))
    }
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
    if (!message) {
      message = new EventMessage({
        type: 'application/json',
        content: spanContext
      })
    }
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
  async audit(message: TypeOfMessage, action: AuditEventAction = AuditEventAction.default, state?: EventStateMetadata): Promise<any> {
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

    if (Util.shouldOverrideEvent(asyncOverrides, type)) {
      //Don't wait for .record() to resolve, return straight away
      recorder.record(newEnvelope, Util.shouldLogToConsole(type, action))
      return true
    }

    const logResult = await recorder.record(newEnvelope, Util.shouldLogToConsole(type, action))

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
      const tracestate = headers.tracestate ? createW3CTracestate(context, headers.tracestate) : (context.tags && context.tags.tracestate) ? context.tags.tracestate : null
      return _.pickBy({
        ...headers,
        ...{
          traceparent: createW3Ctreaceparent(context),
          tracestate
        }
      }, _.identity)
    }
  }
}

const encodeTracestate = (context: TypeSpanContext): { ['ownTraceStateString']: string, ['restTraceStateString']: string } => {
  const { spanId } = context
  let tracestatesMap: { [key: string]: any } = {}
  tracestatesMap[Config.EVENT_LOGGER_VENDOR_PREFIX] = {}
  let ownTraceStateString = ''
  let restTraceStateString = ''

  if ((!!context.tags && !!context.tags.tracestate)) {
    const { tracestates, ownTraceState, restTraceState } = Util.getTracestateMap(Config.EVENT_LOGGER_VENDOR_PREFIX, context.tags.tracestate)
    tracestatesMap = tracestates
    ownTraceStateString = ownTraceState
    restTraceStateString = restTraceState
  }
  if (context.tracestates && context.tracestates[Config.EVENT_LOGGER_VENDOR_PREFIX]) tracestatesMap = context.tracestates
  const newOpaqueValueMap = ((typeof tracestatesMap[Config.EVENT_LOGGER_VENDOR_PREFIX]) === 'object')
    ? Object.assign(tracestatesMap[Config.EVENT_LOGGER_VENDOR_PREFIX], { spanId })
    : null
  let opaqueValue = newOpaqueValueMap ? JSON.stringify(newOpaqueValueMap) : `{"spanId":"${spanId}"}`
  
  return { ownTraceStateString: `${Config.EVENT_LOGGER_VENDOR_PREFIX}=${Buffer.from(opaqueValue).toString('base64')}`, restTraceStateString }
}

const createW3CTracestate = (spanContext: TypeSpanContext, tracestate?: string): string => {
  const newTracestate = encodeTracestate(spanContext).ownTraceStateString
  if (!tracestate && Config.EVENT_LOGGER_TRACESTATE_HEADER_ENABLED) {
    return newTracestate
  }
  let tracestateArray = (tracestate!.split(','))
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
    resultArray.unshift(newTracestate)
    result = resultArray.join(',')
  } else {
    tracestateArray.unshift(newTracestate)
    result = tracestateArray.join(',')
  }
  return result
}

const createW3Ctreaceparent = (spanContext: TypeSpanContext): string => {
  const { traceId, parentSpanId, spanId, flags, sampled } = spanContext
  const version = Buffer.alloc(1).fill(0)
  const flagsForBuff = (flags && sampled) ? (flags | sampled) : flags ? flags : sampled ? sampled : 0x00
  const flagsBuffer = Buffer.alloc(1).fill(flagsForBuff)
  const traceIdBuff = Buffer.from(traceId, 'hex')
  const spanIdBuff = Buffer.from(spanId, 'hex')
  const parentSpanIdBuff = parentSpanId && Buffer.from(parentSpanId, 'hex')

  let W3CHeaders = parentSpanIdBuff
    ? new TraceParent(Buffer.concat([version, traceIdBuff, spanIdBuff, flagsBuffer, parentSpanIdBuff]))
    : new TraceParent(Buffer.concat([version, traceIdBuff, spanIdBuff, flagsBuffer]))

  return W3CHeaders.toString()
}

const getTracestate = (spanContext: TypeSpanContext): TraceTags | false => {
  let tracestate
  if (!!Config.EVENT_LOGGER_TRACESTATE_HEADER_ENABLED || (!!spanContext.tags && !!spanContext.tags!.tracestate)) {
    let currentTracestate = undefined
    if (!!spanContext.tags && !!spanContext.tags.tracestate) currentTracestate = spanContext.tags.tracestate
    tracestate = createW3CTracestate(spanContext, currentTracestate)
    return { tracestate }
  }
  return false
}


export {
  Span,
  ContextOptions,
  Recorders,
  setHttpHeader,
  createW3CTracestate
}