/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Valentin Genev <valentin.genev@modusbox.com>

 --------------
 ******/

'use strict'

import { Trace, TraceContext } from "./Trace";
import { EventLoggingServiceClient, SimpleLoggingServiceClient } from "./transport/EventLoggingServiceClient";
import { EventType, NullEventAction, AuditEventAction, LogEventAction, TraceEventAction, EventMessage, EventTraceMetadata, IEventTrace, IEventMessage, EventAction, EventStateMetadata, EventMetadata, LogResponseStatus } from "./model/EventMessage";

const Config = require('./lib/config');

/**
 * Logger Options sets the interface for the different logger options, which might be passed to the logger for different actions
 */
interface LoggerOptions {
  action?: EventAction,
  state?: EventStateMetadata
}

/**
 * Implements the methods for user to work with tracing and logging. Sends all messages to the EventLoggingServiceClient.
 * It provides null implementation of EventPreProcessor and EventPostProcessor.
 * It can be extended to implement some of these methods.
 */
class Tracer extends Trace {
  client: EventLoggingServiceClient | SimpleLoggingServiceClient

  /**
   * Creates new Trace and its first span with given service name
   * @param service the name of the service of the new span
   */
  static createSpan(service: string, config?: any, client?: EventLoggingServiceClient): Tracer {
    return new Tracer({ service }, config, client)
  }

  constructor(traceContext: TraceContext, config: any = Config, client?: EventLoggingServiceClient) {
    super(new EventTraceMetadata(traceContext))
    if (!config.SIDECAR_DISABLED)
      this.client = client ? client : new EventLoggingServiceClient(config.EVENT_LOGGER_SERVER_HOST, config.EVENT_LOGGER_SERVER_PORT)
    else this.client = new SimpleLoggingServiceClient()
  }

  preProcess = (event: EventMessage): EventMessage => {
    return event
  }

  postProcess = (result: any): any => {
    return result
  }

  /**
   * Finishes the current span and its trace and sends the data to the tracing framework.
   * @param finishTimestamp optional parameter for the finish time. If omitted, current time is used.
   */
  async finish(finishTimestamp?: string | Date): Promise<this> {
    if (this._traceContext.finishTimestamp) return Promise.reject(new Error('span already finished'))
    let traceContext = super.finishSpan(finishTimestamp).getContext()
    await this.trace(traceContext)
    return Promise.resolve(this)
  }

  /**
   * Creates and returns new child span of the current span and changes the span service name
   * @param service the name of the service of the new child span
   */
  getChild(service: string): Tracer {
    let traceContext = super.getChildSpan(service)
    return new Tracer(traceContext)
  }

  static createChildSpanFromContext(service: string, traceContext: TraceContext): Tracer {
    let newTraceContext: Trace = Trace.createChildSpanFromExtractedContext(service, traceContext)
    return new Tracer(newTraceContext)
  }

  /**
   * Sends trace message to the tracing framework
   * @param traceContext optional parameter. Can be used to trace previous span. If not set, the current span context is used.
   * @param traceOptions options for status and event action. Default action is 'span' and status is success
   */
  async trace(traceContext: TraceContext = this._traceContext, traceOptions: LoggerOptions = { action: TraceEventAction.span }): Promise<any> {
    let { state } = extractLoggerOptions(EventType.trace, traceOptions)
    if (!state) throw new Error('no valid state provided')
    let event = EventMetadata.trace({ action: TraceEventAction.span, state })
    let message = new EventMessage({
      type: 'trace',
      content: traceContext,
      metadata: {
        event,
        trace: <IEventTrace>traceContext
      }
    })
    let logResult = await this.record(message);
    if (LogResponseStatus.accepted == logResult.status) {
      return logResult
    } else {
      throw new Error(`Error when logging trace. status: ${logResult.status}`)
    }
  }

  /**
   * Sends audit type message to the event logging framework. 
   * @param message message to be recorded as audit event
   * @param auditOptions Logger options object.
   */
  async audit(message: EventMessage, auditOptions: LoggerOptions = { action: AuditEventAction.default }): Promise<any> {
    let { action, state } = extractLoggerOptions(EventType.audit, auditOptions)
    if (!action) throw new Error('no valid action provied')
    if (!state) throw new Error('no valid state provided')
    let newEnvelope = new EventMessage(Object.assign(message, {
      metadata: {
        event: EventMetadata.audit({
          action,
          state
        }),
        trace: this._traceContext
      }
    }))
    let logResult = await this.record(newEnvelope);
    if (LogResponseStatus.accepted == logResult.status) {
      return logResult
    } else {
      throw new Error(`Error when logging trace. status: ${logResult.status}`)
    }
  }

  /**
   * Logs INFO type message.
   * @param message if message is a string, the message is added to a message property of context of an event message.
   * If message is not following the event framework message format, the message is added as it is to the context of an event message.
   * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created. 
   */
  async info(message: string | { [key: string]: NonNullable<any> }): Promise<any> {
    let loggerOptions: LoggerOptions = { action: LogEventAction.info }
    await this.logWithAction(message, loggerOptions)
  }

  /**
   * Logs DEBUG type message.
   * @param message if message is a string, the message is added to a message property of context of an event message.
   * If message is not following the event framework message format, the message is added as it is to the context of an event message.
   * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created. 
   */
  async debug(message: string | { [key: string]: any }): Promise<any> {
    let loggerOptions: LoggerOptions = { action: LogEventAction.debug }
    await this.logWithAction(message, loggerOptions)
  }

  /**
   * Logs VERBOSE type message.
   * @param message if message is a string, the message is added to a message property of context of an event message.
   * If message is not following the event framework message format, the message is added as it is to the context of an event message.
   * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created. 
   */
  async verbose(message: string | { [key: string]: any }): Promise<any> {
    let loggerOptions: LoggerOptions = { action: LogEventAction.verbose }
    return this.logWithAction(message, loggerOptions)
  }

  /**
   * Logs PERFORMANCE type message.
   * @param message if message is a string, the message is added to a message property of context of an event message.
   * If message is not following the event framework message format, the message is added as it is to the context of an event message.
   * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created. 
   */
  async performance(message: string | { [key: string]: any }): Promise<any> {
    let loggerOptions: LoggerOptions = { action: LogEventAction.performance }
    return this.logWithAction(message, loggerOptions)
  }

  /**
   * Logs WARNING type message.
   * @param message if message is a string, the message is added to a message property of context of an event message.
   * If message is not following the event framework message format, the message is added as it is to the context of an event message.
   * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created. 
   */
  async warning(message: string | { [key: string]: any }): Promise<any> {
    let loggerOptions: LoggerOptions = { action: LogEventAction.warning }
    return this.logWithAction(message, loggerOptions)
  }

  /**
   * Logs ERROR type message.
   * @param message if message is a string, the message is added to a message property of context of an event message.
   * If message is not following the event framework message format, the message is added as it is to the context of an event message.
   * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created. 
   */
  async error(message: string | { [key: string]: any }): Promise<any> {
    let loggerOptions: LoggerOptions = { action: LogEventAction.error }
    return this.logWithAction(message, loggerOptions)
  }

  /**
 * Sends an event message to the event logging framework
 */
  async record(event: EventMessage): Promise<any> {
    let updatedEvent = this.preProcess(event)
    let result = await this.client.log(updatedEvent)
    return this.postProcess(result)
  }


  private async logWithAction(message: string | { [key: string]: NonNullable<any> }, loggerOptions: LoggerOptions) {
    if (!message) throw new Error('no message to provided')
    if (this._traceContext.finishTimestamp) throw new Error('span finished. no further actions allowed')
    let { state, action = LogEventAction.info } = extractLoggerOptions(EventType.log, loggerOptions)
    let messageToLog
    if (!state) throw new Error('no valid state provided')
    if (typeof message === 'string') {
      messageToLog = new EventMessage({
        content: {
          message
        },
        type: 'log'
      })
    } else if ((typeof message === 'object') && (!(message.hasOwnProperty('content')) || !(message.hasOwnProperty('type')))) {
      messageToLog = new EventMessage({
        content: message,
        type: 'log'
      })
    } else {
      messageToLog = new EventMessage(<IEventMessage>message)
    }
    let newEnvelope = Object.assign(messageToLog, {
      metadata: {
        event: EventMetadata.log({
          action,
          state
        }),
        trace: <IEventTrace>this._traceContext
      }
    })

    // Logger.info(JSON.stringify(messageToLog))
    let logResult = await this.record(newEnvelope);
    if (LogResponseStatus.accepted == logResult.status) {
      return logResult
    } else {
      throw new Error(`Error when logging trace. status: ${logResult.status}`)
    }
  }
}

const buildLoggerOptions = (actionDefault: EventAction, action: EventAction, state?: EventStateMetadata): LoggerOptions => {
  let result: LoggerOptions = {
    action, state
  }
  result.action = action ? action : actionDefault
  result.state = state ? state : EventStateMetadata.success()
  return result
}

const extractLoggerOptions = (type: EventType, loggerOptions: LoggerOptions): LoggerOptions => {
  let { action = NullEventAction.undefined, state } = loggerOptions
  switch (type) {
    case EventType.audit: {
      return buildLoggerOptions(AuditEventAction.default, action, state)
    }
    case EventType.trace: {
      return buildLoggerOptions(TraceEventAction.span, action, state)
    }
    case EventType.log: {
      return buildLoggerOptions(LogEventAction.info, action, state)
    }
    default: {
      return buildLoggerOptions(NullEventAction.undefined, NullEventAction.undefined)
    }
  }
}

export { Tracer }