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

 - Ramiro González Maciel <ramiro@modusbox.com>

 --------------
 ******/

'use strict'

import { EventMessage, EventTraceMetadata, LogResponseStatus, EventTraceType, AuditEventAction, EventAction, LogEventAction, ErrorEventAction, NullEventAction } from "./model/EventMessage";
import { EventLoggingServiceClient } from "./transport/EventLoggingServiceClient";
import { EventLogger, ObjectWithKeys, LoggerOptions, TraceSpan } from './EventLogger';
import { EventPostProcessor } from './EventPostProcessor';
import { EventPreProcessor } from './EventPreProcessor';
const Config = require('./lib/config');
// import { DEFAULT_ECDH_CURVE } from "tls";
import { EventMetadata, TraceEventAction, EventStateMetadata, EventType } from "./model/EventMessage";
import { getNestedObject } from './lib/util'

const createTraceMetadataFromContext = (traceContext: EventTraceType): EventTraceMetadata => new EventTraceMetadata(traceContext)

/**
 * DefaultEventLogger sends all the EventLogger commands to the default EventLoggingServiceClient.
 * It provides null implementation of EventPreProcessor and EventPostProcessor.
 * It can be extended to implement some of these methods.
 * 
*/
class DefaultEventLogger implements EventLogger, EventPreProcessor, EventPostProcessor {
  client: EventLoggingServiceClient
  traceContext: TraceSpan

  constructor(client?: EventLoggingServiceClient) {
    this.client = client ? client : new EventLoggingServiceClient(Config.EVENT_LOGGER_SERVER_HOST, Config.EVENT_LOGGER_SERVER_PORT);
    this.traceContext = <TraceSpan>EventTraceMetadata.create('MUST_SET_SERVICE')
  }

  preProcess = (event: EventMessage): EventMessage => {
    return event
  }

  postProcess = (result: any): any => {
    return result
  }

  extractSpan(carrier: ObjectWithKeys, path?: string): Promise<TraceSpan> {
    let traceContext: any = { service: '' }
    if (carrier instanceof EventTraceMetadata) {
      traceContext = carrier
    } else if (carrier instanceof EventMessage) {
      traceContext = createTraceMetadataFromContext(getNestedObject(carrier, 'metadata.trace'))
    } else if (typeof carrier === 'object' && carrier.hasOwnProperty('trace')) {
      traceContext = createTraceMetadataFromContext(getNestedObject(carrier, 'trace'))
    } else if (path) {
      traceContext = createTraceMetadataFromContext(getNestedObject(carrier, path))
    }
    this.traceContext = <TraceSpan>traceContext
    return Promise.resolve(this.traceContext)
  }

  injectSpan(carrier: ObjectWithKeys, traceContext: TraceSpan = this.traceContext, path?: string): Promise<ObjectWithKeys> {
    let result: ObjectWithKeys = carrier
    if (carrier instanceof EventMessage) path = 'metadata.trace'
    else if (typeof carrier === 'object' && carrier.hasOwnProperty('trace')) path = 'trace'
    else if (carrier instanceof EventTraceMetadata) path = undefined
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
    result.trace = traceContext
    this.traceContext = <TraceSpan>traceContext
    return Promise.resolve(carrier)
  }

  createNewSpan(input: TraceSpan | string = this.traceContext): TraceSpan {
    let traceContext: EventTraceMetadata
    if (typeof input === 'string') {
      traceContext = EventTraceMetadata.create(input)
    } else {
      let inputTraceContext = EventTraceMetadata.getContext(input)
      if (!(inputTraceContext.traceId && inputTraceContext.spanId) && !(inputTraceContext.service)) {
        throw new Error('No Service or traceId or SpanId provided')
      }
      let { spanId } = inputTraceContext
      inputTraceContext.spanId = undefined
      inputTraceContext.parentSpanId = spanId
      traceContext = new EventTraceMetadata(inputTraceContext)
    }
    this.traceContext = <TraceSpan>traceContext
    return (this.traceContext)
  }

  async trace(traceContext: TraceSpan = this.traceContext, traceOptions: LoggerOptions = { action: TraceEventAction.span }): Promise<any> {
    let { state } = extractLoggerOptions(EventType.trace, traceOptions)
    let trace = new EventTraceMetadata(traceContext)
    if (trace.finishTimestamp == null && trace.finish) {
      trace.finish();
    }
    this.traceContext = <TraceSpan>trace
    if (!state) throw new Error('no valid state provided')
    let event = EventMetadata.trace({ action: TraceEventAction.span, state })
    let message = new EventMessage({
      type: 'trace',
      content: trace,
      metadata: {
        event,
        trace
      }
    })
    let logResult = await this.record(message);
    if (LogResponseStatus.accepted == logResult.status) {
      return logResult
    } else {
      throw new Error(`Error when logging trace. status: ${logResult.status}`)
    }
  }

  async audit(message: EventMessage, auditOptions: LoggerOptions = { action: AuditEventAction.default }): Promise<any> {
    let { action, state, traceContext } = extractLoggerOptions(EventType.audit, auditOptions)
    if (!action) throw new Error('no valid action provied')
    if (!state) throw new Error('no valid state provided')
    let newEnvelope = new EventMessage(Object.assign(message, {
      metadata: {
        event: EventMetadata.audit({
          action,
          state
        }),
        trace: traceContext ? createTraceMetadataFromContext(traceContext) : null
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
   * Log an event
   */

  async record(event: EventMessage): Promise<any> {
    let updatedEvent = this.preProcess(event);
    let result = await this.client.log(updatedEvent)
    return this.postProcess(result)
  }
}

const buildLoggerOptions = (actionDefault: EventAction, action?: EventAction, state?: EventStateMetadata, traceContext?: TraceSpan): LoggerOptions => {
  let result: LoggerOptions = {
    action, state, traceContext
  }
  result.action = action ? action
    : actionDefault ? actionDefault
      : NullEventAction.undefined
  result.state = state ? state : EventStateMetadata.success()
  return result
}

const extractLoggerOptions = (type: EventType, loggerOptions: LoggerOptions): LoggerOptions => {
  let { action, state, traceContext } = loggerOptions
  switch (type) {
    case EventType.audit: {
      return buildLoggerOptions(AuditEventAction.default, action, state, traceContext)
    }
    case EventType.trace: {
      return buildLoggerOptions(TraceEventAction.span, action, state, traceContext)
    }
    case EventType.log: {
      return buildLoggerOptions(LogEventAction.debug, action, state, traceContext)
    }
    case EventType.error: {
      return buildLoggerOptions(ErrorEventAction.internal, action, state, traceContext)
    }
    default: {
      return buildLoggerOptions(NullEventAction.undefined)
    }
  }
}

export {
  DefaultEventLogger
  // DefaultTraceSpan
}
