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

import { EventMessage, EventTraceMetadata } from "./model/EventMessage";

/**
 * EventLogger defines the methods used to log events in the Event SDK.
 * See DefaultEventLogger
 * 
*/
interface EventLogger {

  /**
   * Logs an event, usually sending it to a central logging processor.
   */
  log(event: EventMessage): Promise<any>;

  /**
   * Creates a TraceSpan with an EventMessage that wraps the messageEnvelope. The TraceSpan has new traceId and spanId.
   * The TraceSpan is not logged. See @logSpan 
   * 
   * @param messageEnvelope A Message Envelope as defined in the Central Services Stream protocol
   * @param service
   * @param options : SpanOptions 
   */
  createSpanForMessageEnvelope(messageEnvelope: any, service: string, spanOptions?: SpanOptions): Promise<TraceSpan>

  /**
   * Creates a child TraceSpan, with the messageEnvelope data, the same traceId as its parent, and its parentId as the parentSpanId
   * The TraceSpan is not logged. See @logSpan 
   * 
   * @param messageEnvelope  A Message Envelope as defined in the Central Services Stream protocol
   * @param parent 
   * @param service 
   * @param options : SpanOptions 
   */
  createChildSpanForMessageEnvelope(messageEnvelope: any, parent: EventTraceMetadata | EventMessage | TraceSpan, service: string, spanOptions?: SpanOptions): Promise<TraceSpan>

  /**
   * Logs a TraceSpan, sending it to the log destination
   * 
   * @param span The span to log. If it's not `finish()`ed, the EventLogger finishes it with the current timestamp before logging it
   */
  logSpan(span: TraceSpan): Promise<TraceSpan>
}

/**
 * A TraceSpan wraps an EventMessage, where the Trace metadata is stored. It provides a `start()` and `finish()` methods used to record the start and finish timestamp 
 */
interface TraceSpan {

  /**
   * eventMessage has the data, event metadata and Trace metadata
   */
  eventMessage: EventMessage

  /**
   * traceId 
   */
  readonly traceId: string

  /**
   * 
   */
  readonly spanId: string

  /**
   * 
   */
  readonly parentSpanId?: string

  /**
   * 
   */
  readonly startTimestamp?: string  // ISO8601

  /**
   * 
   */
  readonly finishTimestamp?: string // ISO8601

  /**
   * 
   * @param timestamp if null, the current timestamp will be used
   */
  finish(timestamp?: Date | string) : TraceSpan

}

class SpanOptions {
  sampled?: number
  flags?: number
  startTimestamp?: string | Date | undefined
}

export {
  EventLogger,
  TraceSpan,
  SpanOptions
}
