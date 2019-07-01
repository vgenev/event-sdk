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

import { EventMessage, EventTraceMetadata, MessageMetadata, newTraceId, newSpanId, LogResponseStatus } from "./model/EventMessage";
import { EventLoggingServiceClient } from "./transport/EventLoggingServiceClient";
import { EventLogger, TraceSpan, SpanOptions } from './EventLogger';
import { EventPostProcessor } from './EventPostProcessor';
import { EventPreProcessor } from './EventPreProcessor';

const Config = require('./lib/config')

class DefaultTraceSpan implements TraceSpan {

  eventMessage: EventMessage;

  constructor(eventMessage: EventMessage) {
    if ( !(eventMessage && eventMessage.metadata && eventMessage.metadata.trace)) {
      throw new Error('Can not create TraceSpan: no eventMessage.metadata.trace')
    }
    this.eventMessage = eventMessage
  }

  get startTimestamp(): string | undefined{
    if ( !(this.eventMessage && this.eventMessage.metadata && this.eventMessage.metadata.trace)) {
      throw new Error('Invalid TraceSpan: no eventMessage.metadata.trace')
    }
    return this.eventMessage.metadata.trace.startTimestamp
  }

  get finishTimestamp(): string | undefined {
    if ( !(this.eventMessage && this.eventMessage.metadata && this.eventMessage.metadata.trace)) {
      throw new Error('Invalid TraceSpan: no eventMessage.metadata.trace')
    }
    return this.eventMessage.metadata.trace.finishTimestamp
    
  }

  get traceId(): string {
    if ( !(this.eventMessage && this.eventMessage.metadata && this.eventMessage.metadata.trace)) {
      throw new Error('Invalid TraceSpan: no eventMessage.metadata.trace')
    }
    return this.eventMessage.metadata.trace.traceId
  }

  get spanId(): string {
    if ( !(this.eventMessage && this.eventMessage.metadata && this.eventMessage.metadata.trace)) {
      throw new Error('Invalid TraceSpan: no eventMessage.metadata.trace')
    }
    return this.eventMessage.metadata.trace.spanId
  }

  get parentSpanId(): string | undefined {
    if ( !(this.eventMessage && this.eventMessage.metadata && this.eventMessage.metadata.trace)) {
      throw new Error('Invalid TraceSpan: no eventMessage.metadata.trace')
    }
    return this.eventMessage.metadata.trace.parentSpanId
  }

  finish(timestamp?: string | Date): TraceSpan {
    if ( !(this.eventMessage && this.eventMessage.metadata && this.eventMessage.metadata.trace)) {
      throw new Error('Invalid TraceSpan: no eventMessage.metadata.trace')
    }
    if ( !timestamp ) {
      timestamp = new Date();
    }
    this.eventMessage.metadata.trace.finish(timestamp)
    return this;
  }
}

/**
 * DefaultEventLogger sends all the EventLogger commands to the default EventLoggingServiceClient.
 * It provides null implementation of EventPreProcessor and EventPostProcessor.
 * It can be extended to implement some of these methods.
 * 
*/
class DefaultEventLogger implements EventLogger, EventPreProcessor, EventPostProcessor {
    client : EventLoggingServiceClient

    constructor(client? : EventLoggingServiceClient) {
      this.client = client ? client : new EventLoggingServiceClient(Config.EVENT_LOGGER_SERVER_HOST, Config.EVENT_LOGGER_SERVER_PORT);
    }
    
    preProcess = (event: EventMessage): EventMessage => {
      return event
    }

    postProcess = (result: any): any => {
      return result
    }

    createTraceMetadata(service: string, traceId?: string, sampled?: number | undefined, flags?: number | undefined, timestamp?: string | Date | undefined): EventTraceMetadata {
      let newMeta = new EventTraceMetadata(service, traceId ? traceId : newTraceId(), newSpanId(), undefined, sampled, flags, timestamp);
      return newMeta;
    }

    createChildTraceMetadata(parentTraceMetadata: EventTraceMetadata, service: string, sampled?: number | undefined, flags?: number | undefined, timestamp?: string | Date | undefined): EventTraceMetadata {
      return new EventTraceMetadata(service, parentTraceMetadata.traceId, newSpanId(), parentTraceMetadata.spanId, sampled, flags, timestamp)
    }

    async createSpanForMessageEnvelope(messageEnvelope: any, service: string, traceId?: string, spanOptions: SpanOptions = {}): Promise<TraceSpan> {
    // add an extra optional traceId parameter so we can create a new span on another service for the same traceId we're creating here
        // ADD messageProtocol.metadata.trace = rootSpan.eventMessage.metadata.trace. This will be done on the Central Logger
      // document it in the interface because we're modifying a parameter
      let traceMetadata = this.createTraceMetadata(service, traceId, spanOptions.sampled, spanOptions.flags, spanOptions.startTimestamp);

      let eventMessage = new EventMessage(messageEnvelope.id, messageEnvelope.type, messageEnvelope.content);
      eventMessage.from = messageEnvelope.from;
      eventMessage.to = messageEnvelope.to;
      eventMessage.pp = messageEnvelope.pp;
      eventMessage.metadata = new MessageMetadata(messageEnvelope.metadata.event, traceMetadata); // FIXME Copy the messageEnvelope.metadata.event in a new Object

      messageEnvelope.metadata.trace =eventMessage.metadata.trace;

      let traceSpan = new DefaultTraceSpan(eventMessage)
      return traceSpan;
    }

    async createChildSpanForMessageEnvelope(messageEnvelope: any, parent: EventTraceMetadata | EventMessage | TraceSpan, service: string, spanOptions: SpanOptions = {}): Promise<TraceSpan> {
    let parentTraceMetadata : EventTraceMetadata;
      if ( parent instanceof EventMessage ) {
        if ( !parent.metadata ) {
          throw new Error('parent EventMessage must have metadata');
        }
        parentTraceMetadata = parent.metadata.trace
      } else if ( parent instanceof EventTraceMetadata ) {
        parentTraceMetadata = parent
      } else if ( parent instanceof DefaultTraceSpan ) {
        if ( !parent.eventMessage.metadata ) {
          throw new Error('parent EventMessage must have metadata');
        }
        parentTraceMetadata = parent.eventMessage.metadata.trace
      } else {
        throw new Error(`Invalid parent type: ${JSON.stringify(parent, null, 2)}`);
      }
      let traceMetadata = this.createChildTraceMetadata(parentTraceMetadata, service, spanOptions.sampled, spanOptions.flags, spanOptions.startTimestamp);

      let eventMessage = new EventMessage(messageEnvelope.id, messageEnvelope.type, messageEnvelope.content);
      eventMessage.from = messageEnvelope.from;
      eventMessage.to = messageEnvelope.to;
      eventMessage.pp = messageEnvelope.pp;
      eventMessage.metadata = new MessageMetadata(messageEnvelope.metadata.event, traceMetadata);

      messageEnvelope.metadata.trace =eventMessage.metadata.trace;

      let traceSpan = new DefaultTraceSpan(eventMessage)
      return traceSpan;
    }

    async logSpan(span: TraceSpan): Promise<TraceSpan> {
      if ( span.finishTimestamp == null ) {
        span.finish();
      }
      let logResult = await this.log(span.eventMessage);
      if (LogResponseStatus.accepted == logResult.status) {
        return span
      } else {
        throw new Error(`Error when logging trace. status: ${logResult.status}`)
      }
    }

    /**
     * Log an event
     */
    async log( event: EventMessage): Promise<any> {
      let updatedEvent = this.preProcess(event);
      let result = await this.client.log(updatedEvent)
      return this.postProcess(result)
    }
}


export {
  DefaultEventLogger,
  DefaultTraceSpan
}
