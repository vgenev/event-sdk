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
import { EventLogger } from './EventLogger';
import { EventPostProcessor } from './EventPostProcessor';
import { EventPreProcessor } from './EventPreProcessor';

const Config = require('./lib/config')

/**
 * DefaultEventLogger sends all the EventLogger commands to the default EventLoggingServiceClient.
 * It provides null implementation of EventPreProcessor and EventPostProcessor.
 * It can be extended to implement some of these methods.
 * 
*/
class DefaultEventLogger implements EventLogger, EventPreProcessor, EventPostProcessor {
    client : EventLoggingServiceClient

    constructor() {
      this.client = new EventLoggingServiceClient(Config.EVENT_LOGGER_SERVER_HOST, Config.EVENT_LOGGER_SERVER_PORT);
    }
    
    preProcess = (event: EventMessage): EventMessage => {
      return event
    }

    postProcess = (result: any): any => {
      return result
    }

    createTraceMetadata(service: string, sampled?: number | undefined, flags?: number | undefined, timestamp?: string | Date | undefined): EventTraceMetadata {
      let newMeta = new EventTraceMetadata(service, newTraceId(), newSpanId(), undefined, sampled, flags, timestamp);
      return newMeta;
    }

    createChildTraceMetadata(parentTraceMetadata: EventTraceMetadata, service: string, sampled?: number | undefined, flags?: number | undefined, timestamp?: string | Date | undefined): EventTraceMetadata {
      return new EventTraceMetadata(service, parentTraceMetadata.traceId, newSpanId(), parentTraceMetadata.spanId, sampled, flags, timestamp)
    }

    createSpanTraceMetadata(parentTraceMetadata: EventTraceMetadata, service: string, sampled?: number | undefined, flags?: number | undefined, timestamp?: string | Date | undefined): EventTraceMetadata {
      return new EventTraceMetadata(service, parentTraceMetadata.traceId, newSpanId(), undefined, sampled, flags, timestamp)
    }

    async logTraceForMessageEnvelope(messageEnvelope: any, service: string, sampled?: number | undefined, flags?: number | undefined, timestamp?: string | Date | undefined): Promise<EventMessage> {
      return this._logTraceForMessageEnvelope(messageEnvelope, this.createTraceMetadata(service, sampled, flags, timestamp), service, sampled, flags, timestamp);
    }

    async logChildTraceForMessageEnvelope(messageEnvelope: any, parent: EventTraceMetadata | EventMessage, service: string, sampled?: number | undefined, flags?: number | undefined, timestamp?: string | Date | undefined ): Promise<EventMessage> {
      let parentTraceMetadata : EventTraceMetadata;
      if ( parent instanceof EventMessage && parent.metadata ) {
        parentTraceMetadata = parent.metadata.trace
      } else if ( parent instanceof EventTraceMetadata ) {
        parentTraceMetadata = parent
      } else {
        throw new Error('Invalid parent type');
      }
      return this._logTraceForMessageEnvelope(messageEnvelope, this.createChildTraceMetadata(parentTraceMetadata, service, sampled, flags, timestamp), service, sampled, flags, timestamp);
    }
  
    async logSpanTraceForMessageEnvelope(messageEnvelope: any, parent: EventTraceMetadata | EventMessage, service: string, sampled?: number | undefined, flags?: number | undefined, timestamp?: string | Date | undefined ): Promise<EventMessage> {
      let parentTraceMetadata : EventTraceMetadata;
      if ( parent instanceof EventMessage && parent.metadata ) {
        parentTraceMetadata = parent.metadata.trace
      } else if ( parent instanceof EventTraceMetadata ) {
        parentTraceMetadata = parent
      } else {
        throw new Error('Invalid parent type');
      }
      return this._logTraceForMessageEnvelope(messageEnvelope, this.createSpanTraceMetadata(parentTraceMetadata, service, sampled, flags, timestamp), service, sampled, flags, timestamp);
    }
  
    async _logTraceForMessageEnvelope(messageEnvelope: any, traceMetadata: EventTraceMetadata, service: string, sampled?: number | undefined, flags?: number | undefined, timestamp?: string | Date | undefined ): Promise<EventMessage> {
      let eventMessage = new EventMessage(messageEnvelope.id, messageEnvelope.type, messageEnvelope.content);
      eventMessage.from = messageEnvelope.from;
      eventMessage.to = messageEnvelope.to;
      eventMessage.pp = messageEnvelope.pp;
      eventMessage.metadata = new MessageMetadata(messageEnvelope.metadata.event, traceMetadata);
      let logResult = await this.log(eventMessage);
      if (LogResponseStatus.accepted == logResult.status) {
        return eventMessage
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
  DefaultEventLogger
}
