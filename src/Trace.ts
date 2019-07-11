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

import { EventMessage, EventTraceMetadata, IEventTrace, IMessageMetadata, IEventMessage } from "./model/EventMessage";
import { getNestedObject } from './lib/util'

/**
 * EventLogger defines the methods used to log events in the Event SDK.
 * See DefaultEventLogger
 * 
*/

type TraceContext = Readonly<{
  service: string,
  traceId: string,
  spanId?: string,
  parentSpanId?: string,
  sampled?: number,
  flags?: number,
  startTimestamp?: string,
  finishTimestamp?: string,
  tags?: { [key: string]: any },
}>


interface IContextOptions {
  type?: string,
  path?: string
}

const createTraceMetadataFromContext = (traceContext: IEventTrace): EventTraceMetadata => new EventTraceMetadata(traceContext)

interface ITrace {
  getContext(): TraceContext
  getChild(service: string): Trace
  injectContextToMessage(carrier: { [key: string]: any }, injectOptions: IContextOptions): Promise<{ [key: string]: any }>
  // extractContextFromMessage(carrier: {[key: string]: any }, extractOptions: IContextOptions): TraceContext
  // createSpan(service: string): Trace
}

class Trace implements ITrace {
  private _traceContext: TraceContext
  service?: string = (this._traceContext && this._traceContext.service) || undefined
  traceId?: string = (this._traceContext && this._traceContext.traceId) || undefined
  spanId?: string = (this._traceContext && this._traceContext.spanId) || undefined
  parentSpanId?: string = (this._traceContext && this._traceContext.parentSpanId) || undefined
  sampled?: number = this._traceContext && this._traceContext.sampled || undefined
  flags?: number = (this._traceContext && this._traceContext.flags) || undefined
  startTimestamp?: string = (this._traceContext && this._traceContext.startTimestamp) || undefined
  finishTimestamp?: string = (this._traceContext && this._traceContext.finishTimestamp) || undefined
  tags?: { [key: string]: any } = (this._traceContext && this._traceContext.tags) || undefined

  private _updateContext = () => {
    this.service = (this._traceContext && this._traceContext.service) || undefined
    this.traceId = (this._traceContext && this._traceContext.traceId) || undefined
    this.spanId = (this._traceContext && this._traceContext.spanId) || undefined
    this.parentSpanId = (this._traceContext && this._traceContext.parentSpanId) || undefined
    this.sampled = this._traceContext && this._traceContext.sampled || undefined
    this.flags = (this._traceContext && this._traceContext.flags) || undefined
    this.startTimestamp = (this._traceContext && this._traceContext.startTimestamp) || undefined
    this.finishTimestamp = (this._traceContext && this._traceContext.finishTimestamp) || undefined
    this.tags = (this._traceContext && JSON.parse(JSON.stringify(this._traceContext.tags))) || undefined
  }

  constructor(traceContext: EventTraceMetadata) {
    this._traceContext = Object.freeze(traceContext)
    this._updateContext()
    return this
  }
  static createSpan(service: string): Trace {
    let newTrace = EventTraceMetadata.create(service)
    return new Trace(newTrace)
  }

  // get tags():{ [key: string]: any } {
  //   return JSON.parse(JSON.stringify(this._tags))
  // }

  getContext(): TraceContext {
    return Object.assign({}, this._traceContext, {tags: JSON.parse(JSON.stringify(this.tags))})
  }

  getChild(service: string): Trace {
    if (this._traceContext.finishTimestamp) throw new Error('Finished trace cannot have a child span')
    let inputTraceContext: IEventTrace = <IEventTrace>this.getContext()
    if (!(inputTraceContext.traceId && inputTraceContext.spanId) && !(inputTraceContext.service)) {
      throw new Error('No Service or traceId or SpanId provided')
    }
    return new Trace(new EventTraceMetadata(Object.assign({},
      inputTraceContext, {
        service,
        spanId: undefined,
        parentSpanId: inputTraceContext.spanId
      })))
  }

  injectContextToMessage(carrier: { [key: string]: any }, injectOptions: IContextOptions = {}): Promise<{ [key: string]: any }> {
    let result = carrier
    let { path } = injectOptions // type not implemented yet
    if (carrier instanceof EventMessage || (('metadata' in carrier) && 'trace' in carrier.metadata)) path = 'metadata.trace'
    else if (('trace' in carrier)) path = 'trace'
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
    result.trace = this._traceContext
    return Promise.resolve(carrier)
  }

  setTags(tags: { [key: string]: any }): this {
    let newContext: IEventTrace = new EventTraceMetadata(this.getContext())
    if (!newContext.tags) {
      newContext.tags = tags
    } else {
      for (let key in tags) {
        newContext.tags[key] = tags[key]
      }
    }
    this._traceContext = Object.freeze(new EventTraceMetadata(newContext))
    this._updateContext()
    return this
  }

  finish(finishTimestamp?: string | Date): this {
    let newContext: IEventTrace = <IEventTrace>Object.assign({}, this._traceContext)
    if (finishTimestamp instanceof Date) {
      newContext.finishTimestamp = finishTimestamp.toISOString() // ISO 8601
    } else if (!finishTimestamp) {
      newContext.finishTimestamp = (new Date()).toISOString() // ISO 8601
    } else {
      newContext.finishTimestamp = finishTimestamp
    }
    this._traceContext = Object.freeze(new EventTraceMetadata(newContext))
    this._updateContext()
    return this
  }
  /**
   * Extracts trace context from a carrier (ex: kafka message, event message, metadata, trace) with optional path for the trace context to be extracted.
    *
    * @param carrier any kind of message or other object with keys of type String.
    * @param extractOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
    */

  static extractContextFromMessage(carrier: { [key: string]: any }, extractOptions: IContextOptions = {}): TraceContext {
    let traceContext
    let { path } = extractOptions // type not implemented yet
    if (carrier instanceof EventMessage || (('metadata' in carrier) && 'trace' in carrier.metadata)) {
      path = 'metadata.trace'
    } else if ('trace' in carrier) {
      path = 'trace'
    }
    traceContext = createTraceMetadataFromContext(<IEventTrace>getNestedObject(carrier, path))
    return <TraceContext>traceContext
  }

  static createChildSpanFromContext(service: string, traceContext: TraceContext): Trace {
    let outputContext = <IEventTrace>Object.assign({}, traceContext, { service, spanId: undefined, parentSpanId: traceContext.spanId })
    return new Trace(new EventTraceMetadata(outputContext))
  }
}

export { Trace }
