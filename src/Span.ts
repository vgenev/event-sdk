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
  TypeEventAction
} from './model/EventMessage'

import {
  IEventRecorder, DefaultLoggerRecorder, DefaultSidecarRecorder
} from './Recorder'

import { EventLoggingServiceClient } from './transport/EventLoggingServiceClient';

const Config = require('./lib/config')

type RecorderOptions = {
  action?: TypeEventTypeAction['action'],
  state?: EventStateMetadata
}

type RecorderKeys = 'defaultRecorder' | 'logRecorder' | 'auditRecorder' | 'traceRecorder'

const defaultRecorder = Config.SIDECAR_DISABLED
  ? new DefaultLoggerRecorder()
  : new DefaultSidecarRecorder(new EventLoggingServiceClient(Config.EVENT_LOGGER_SERVER_HOST, Config.EVENT_LOGGER_SERVER_PORT))


type PartialWithDefaultRecorder<T> = {
  [P in keyof T]?: T[P]
} & {
  defaultRecorder: IEventRecorder
}

type Recorders = PartialWithDefaultRecorder<{
  defaultRecorder: IEventRecorder
  logRecorder?: IEventRecorder,
  auditRecorder?: IEventRecorder,
  traceRecorder?: IEventRecorder
}>


// -===- SPAN -===-

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

interface ISpan { // TODO abstract class
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
  defaultTagsSetter: (message: TypeOfMessage) => Span
  getContext: () => TypeSpanContext
  finish: (message?: TypeOfMessage, finishTimestamp?: TypeSpanContext["finishTimestamp"]) => Promise<any>
  getChild: (service: string, recorders?: Recorders) => ISpan
  setTags: (tags: TraceTags) => Span
  injectContextToMessage: (message: { [key: string]: any }, injectOptions: ContextOptions) => { [key: string]: any }
}

class Span implements ISpan {
  spanContext: TypeSpanContext
  recorders: Recorders
  private _finished: boolean = false

  constructor(
    spanContext: EventTraceMetadata,
    recorders?: Recorders,
    defaultTagsSetter?: (message: TypeOfMessage) => any) {
    this.spanContext = Object.freeze(spanContext)
    this.defaultTagsSetter = defaultTagsSetter ? defaultTagsSetter : this.defaultTagsSetter
    this.recorders = recorders ? recorders : { defaultRecorder }
    return this
  }

  defaultTagsSetter(message: TypeOfMessage): Span {
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
     */
  getChild(service: string, recorders: Recorders = this.recorders): Span {
    if (this._finished) throw new Error('Finished trace cannot have a child span')
    let inputTraceContext: TypeSpanContext = this.getContext()
    if (!(inputTraceContext.traceId && inputTraceContext.spanId) && !(inputTraceContext.service)) {
      throw new Error('No Service or traceId or SpanId provided')
    }
    return new Span(new EventTraceMetadata(Object.assign({},
      inputTraceContext, {
        service,
        spanId: undefined,
        startTimestamp: undefined,
        parentSpanId: inputTraceContext.spanId
      })), recorders, this.defaultTagsSetter)
  }

  /**
   * Injects trace context into a carrier with optional path.
   * @param carrier any kind of message or other object with keys of type String.
   * @param injectOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
   */
  injectContextToMessage(carrier: { [key: string]: any }, injectOptions: ContextOptions = {}): Promise<{ [key: string]: any }> {
    let result = carrier
    let { path } = injectOptions // type not implemented yet
    if (carrier instanceof EventMessage || (('metadata' in carrier))) path = 'metadata.trace'
    else if (('trace' in carrier)) path = 'trace'
    else if (carrier instanceof EventTraceMetadata) result.metadata.trace = this.spanContext
    if (path) {
      try {
        let pathArray: string[] = path.split('.')
        for (let i = 0; i < pathArray.length - 1; i++) {
          if (!result[pathArray[i]]) {
            if (i < pathArray.length) {
              let o: any = {}
              o[pathArray[i + 1]] = {}
              result[pathArray[i]] = o
            }
          }
          result = result[pathArray[i]]
        }
      } catch (e) {
        throw e
      }
    }
    result.trace = this.spanContext
    return Promise.resolve(carrier)
  }

  /**
   * Sets tags to the current span. If child span is created, the tags are passed on.
   * @param tags key value pairs of tags. Tags can be changed on different child spans
   */
  setTags(tags: TraceTags): this {
    let newContext: TypeSpanContext = new EventTraceMetadata(this.getContext())
    if (!newContext.tags) {
      newContext.tags = tags
    } else {
      for (let key in tags) {
        newContext.tags[key] = tags[key]
      }
    }
    this.spanContext = Object.freeze(new EventTraceMetadata(newContext))
    return this
  }

  /**
* Finishes the current span and its trace and sends the data to the tracing framework.
* @param finishTimestamp optional parameter for the finish time. If omitted, current time is used.
*/
  async finish(message?: TypeOfMessage, finishTimestamp?: string | Date): Promise<this> {
    if (this.spanContext.finishTimestamp) return Promise.reject(new Error('span already finished'))
    let spanContext = this._finishSpan(finishTimestamp).getContext()
    await this.trace(message, spanContext)
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
   * @param spanContext optional parameter. Can be used to trace previous span. If not set, the current span context is used.
   * @param traceOptions options for status and event action. Default action is 'span' and status is success
   */
  private async trace(message?: TypeOfMessage, spanContext: TypeSpanContext = this.spanContext, action?: TraceEventAction, state?: EventStateMetadata): Promise<any> {
    if (!message) message = new EventMessage({
      type: 'trace',
      content: spanContext
    })
    try {
      await this.recordMessage(message, TraceEventTypeAction.getType(), action, state)
      this._finished = this.spanContext.finishTimestamp ? true : false
      return this
    } catch (e) {
      throw new Error(`Error when logging trace. ${e}`)
    }
  }

  /**
   * Sends audit type message to the event logging framework. 
   * @param message message to be recorded as audit event
   * @param auditOptions Logger options object.
   */
  async audit(message: TypeOfMessage, action?: AuditEventAction, state?: EventStateMetadata): Promise<any> {
    await this.recordMessage(message, AuditEventTypeAction.getType(), action, state)
  }

  private async log(message: TypeOfMessage, state?: EventStateMetadata): Promise<any> {
    let { action, type } = new LogEventTypeAction(LogEventAction.info)
    await this.recordMessage(message, type, action, state)
  }

  

  /**
   * Logs INFO type message.
   * @param message if message is a string, the message is added to a message property of context of an event message.
   * If message is not following the event framework message format, the message is added as it is to the context of an event message.
   * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created. 
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
   */
  async error(message: TypeOfMessage, state?: EventStateMetadata): Promise<any> {
    let { action, type } = new LogEventTypeAction(LogEventAction.error)
    await this.recordMessage(message, type, action, state)
  }

  private async recordMessage(message: TypeOfMessage, type: TypeEventTypeAction['type'], action?: TypeEventTypeAction['action'], state?: EventStateMetadata) {
    if (!message) throw new Error('no message provided')
    if (this._finished) throw new Error('span finished. no further actions allowed')
    let newEnvelope = this.createEventMessage(message, type, action, state)
    let logResult
    let key = <RecorderKeys>`${type}Recorder`
    if (this.recorders[key]) logResult = await this.recorders[key]!.record(newEnvelope)
    else logResult = await this.recorders.defaultRecorder.record(newEnvelope)
    if (LogResponseStatus.accepted == logResult.status) {
      return logResult
    } else {
      throw new Error(`Error when recording ${type}-${action} event. status: ${logResult.status}`)
    }
  }

  private createEventMessage = (
    message: TypeOfMessage,
    type: TypeEventTypeAction['type'],
    _action?: TypeEventTypeAction['action'],
    state: EventStateMetadata = EventStateMetadata.success()): EventMessage => {
    let defaults = getDefaults(type)
    let action = _action ? _action : defaults.action
    let messageToLog
    if (!state) throw new Error('no valid state provided')
    if (typeof message === 'string') {
      messageToLog = new EventMessage({
        content: { payload: { message } },
        type
      })
    } else if ((typeof message === 'object') && (!(message.hasOwnProperty('content')) || !(message.hasOwnProperty('type')))) {
      messageToLog = new EventMessage({
        content: { payload: { message } },
        type
      })
    } else {
      messageToLog = new EventMessage(<TypeEventMessage>message)
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

export {
  Span,
  ContextOptions,
  Recorders
}