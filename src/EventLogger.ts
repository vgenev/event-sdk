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

import { EventMessage, EventTraceMetadata, IEventTrace, IMessageMetadata, EventStateMetadata } from "./model/EventMessage";
import { AuditEventAction } from "../lib/model/EventMessage";

/**
 * EventLogger defines the methods used to log events in the Event SDK.
 * See DefaultEventLogger
 * 
*/

type ObjectWithKeys = {[key: string]: any}

// type TraceContextCarrier = ObjectWithKeys | EventTraceMetadata | IMessageMetadata | EventMessage 
interface EventLogger {
  /**
   * Logs an event, usually sending it to a central logging processor.
   */

  extract(carrier: ObjectWithKeys | IEventTrace | EventTraceMetadata | EventMessage | IMessageMetadata, path?: string): Promise<EventTraceMetadata>;

  inject(carrier: ObjectWithKeys, traceContext: EventTraceMetadata, path?: string): Promise<ObjectWithKeys>;

  createNewTraceMetadata(traceContext: IEventTrace ): EventTraceMetadata;
  trace(trace: EventTraceMetadata, state?: EventStateMetadata): Promise<EventTraceMetadata>;
  record(event: EventMessage): Promise<any>;
  audit(message: ObjectWithKeys, action: AuditEventAction, state?: EventStateMetadata, traceContext?: IEventTrace): Promise<any>;
  // error()
}
// interface TraceSpan extends IEventTrace {

//   /**
//    * eventMessage has the data, event metadata and Trace metadata
//    */
//   // eventMessage: EventMessage

//   /**
//    * service name
//    */

//   readonly service: string
  
//   /**
//    * traceId 
//    */
//   readonly traceId: string

//   /**
//    * 
//    */
//   readonly spanId: string

//   /**
//    * 
//    */
//   readonly parentSpanId?: string

//   /**
//    * 
//    */
//   readonly startTimestamp?: string  // ISO8601

//   /**
//    * 
//    */
//   readonly finishTimestamp?: string // ISO8601

//   /**
//    * 
//    * @param timestamp if null, the current timestamp will be used
//    */
//   finish(timestamp?: Date | string) : IEventTrace

// }

interface SpanOptions {
  sampled?: number
  flags?: number
  startTimestamp?: string | Date | undefined
}

export {
  EventLogger,
  // TraceSpan,
  SpanOptions,
  ObjectWithKeys
}
