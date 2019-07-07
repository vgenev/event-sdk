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

import { EventMessage, EventTraceMetadata, LogResponseStatus, IEventTrace, AuditEventAction } from "./model/EventMessage";
import { EventLoggingServiceClient } from "./transport/EventLoggingServiceClient";
import { EventLogger, ObjectWithKeys } from './EventLogger';
import { EventPostProcessor } from './EventPostProcessor';
import { EventPreProcessor } from './EventPreProcessor';
import * as Config from './lib/config';
// import { DEFAULT_ECDH_CURVE } from "tls";
import { EventMetadata, TraceEventAction, EventStateMetadata } from "./model/EventMessage";

const getNestedObject = (parent: any, path: string): any => {
  let child = { ...parent }
  let result: object | null = {}
  let id: string[] = path.split('.')
  for (let i = 0; i < id.length; i++) {
    if (i !== id.length - 1) {
      child = child[id[i]]
    }
    else {
      result = child[id[i]]
    }
  }
  return result || null
}

const createTraceMetadataFromContext = (traceContext: IEventTrace): EventTraceMetadata => new EventTraceMetadata(traceContext)

// class DefaultTraceSpan implements TraceSpan {
//   constructor(traceSpan: EventTraceMetadata) {
//     new EventTraceMetadata(traceSpan)
//   }

//   get service(): string {
//     return this.service
//   }
//   get startTimestamp(): string | undefined {
//     return this.startTimestamp
//   }

//   get finishTimestamp(): string | undefined {
//     return this.finishTimestamp

//   }

//   get traceId(): string {
//     return this.traceId
//   }

//   get spanId(): string {
//     return this.spanId
//   }

//   get parentSpanId(): string | undefined {
//     return this.parentSpanId
//   }

//   finish(timestamp?: string | Date): IEventTrace {
//     if (!timestamp) {
//       timestamp = new Date()
//     }
//     this.finish(timestamp)
//     return this
//   }
// }

/**
 * DefaultEventLogger sends all the EventLogger commands to the default EventLoggingServiceClient.
 * It provides null implementation of EventPreProcessor and EventPostProcessor.
 * It can be extended to implement some of these methods.
 * 
*/
class DefaultEventLogger implements EventLogger, EventPreProcessor, EventPostProcessor {
  client: EventLoggingServiceClient
  // traceContext: IEventTrace

  constructor(client?: EventLoggingServiceClient) {
    this.client = client ? client : new EventLoggingServiceClient(Config.EVENT_LOGGER_SERVER_HOST, Config.EVENT_LOGGER_SERVER_PORT);
    // this.traceContext = EventTraceMetadata.create('MUST_SET_SERVICE')
  }

  preProcess = (event: EventMessage): EventMessage => {
    return event
  }

  postProcess = (result: any): any => {
    return result
  }

  extract(carrier: ObjectWithKeys, path?: string): Promise<EventTraceMetadata> {
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
    // this.traceContext = traceContext
    return Promise.resolve(traceContext)
  }

  inject(carrier: ObjectWithKeys, traceContext: IEventTrace, path?: string): Promise<ObjectWithKeys> {
    let result: ObjectWithKeys = carrier
    if (path) {
      try {
        let pathArray: string[] = path.split('.')
        for (let i = 0; i < pathArray.length; i++) {
          result = result[pathArray[i]]
        }
        result.trace = traceContext
      } catch (e) {
        throw e
      }
    }
    result.trace = traceContext
    // this.traceContext = traceContext
    return Promise.resolve(carrier)
  }

  createNewTraceMetadata(traceContext: IEventTrace): EventTraceMetadata {
    let { traceId, spanId } = traceContext
    // if (service) this.traceContext.service = service
    if (!traceId) return createTraceMetadataFromContext(traceContext)
    if (spanId) {
      traceContext.spanId = undefined
      traceContext.parentSpanId = spanId
    }
    let newTraceContext = new EventTraceMetadata(traceContext)
    // this.traceContext = EventTraceMetadata.getContext(newTraceContext)    
    return newTraceContext
  }

  async trace(trace: EventTraceMetadata, state: EventStateMetadata = EventStateMetadata.success()): Promise<EventTraceMetadata> {
    if (trace.finishTimestamp == null) {
      trace.finish();
    }
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
      return trace
    } else {
      throw new Error(`Error when logging trace. status: ${logResult.status}`)
    }
  }

  async audit(message: EventMessage, action: AuditEventAction = AuditEventAction.default, state: EventStateMetadata = EventStateMetadata.success(), traceContext?: IEventTrace): Promise<any> {
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

export {
  DefaultEventLogger
  // DefaultTraceSpan
}
