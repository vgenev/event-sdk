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
     * Log an event
     */
    log( event: EventMessage): Promise<any>;
    /**
     * Creates a new EventTraceMetadata, with new traceId and spanId
     * 
     * @param service Name of service producing trace. Example central-ledger-prepare-handler
     * @param sampled 
     * @param flags 
     * @param timestamp 
     */
    createTraceMetadata(service: string, sampled?: number, flags?: number, timestamp?: string | Date | undefined) : EventTraceMetadata;

    /**
     * Creates a new EventTraceMetadata, with the same traceId as the parent, and having the parent's spanId as parentSpanId
     * 
     * @param parentTraceMetadata EventTraceMetadata from which to take the traceId and spanId
     * @param service Name of service producing trace. Example central-ledger-prepare-handler
     * @param sampled 
     * @param flags 
     * @param timestamp 
     */
    createChildTraceMetadata(parentTraceMetadata: EventTraceMetadata, service: string, sampled?: number | undefined, flags?: number | undefined, timestamp?: string | Date | undefined): EventTraceMetadata;

    /**
     * Creates a new EventTraceMetadata, with the same traceId as the parent, and having a new spanId and no parentSpanId
     * 
     * @param parentTraceMetadata EventTraceMetadata from which to take the traceId
     * @param service Name of service producing trace. Example central-ledger-prepare-handler
     * @param sampled 
     * @param flags 
     * @param timestamp 
     */
    createSpanTraceMetadata(parentTraceMetadata: EventTraceMetadata, service: string, sampled?: number | undefined, flags?: number | undefined, timestamp?: string | Date | undefined): EventTraceMetadata;

    /**
     * Logs a new EventMessage with the messageEnvelope data and new EventTraceMetadata created as in createNewTraceMetadata
     * 
     * @param messageEnvelope A Message Envelope as defined in the Central Services Stream protocol
     * @param service 
     * @param sampled 
     * @param flags 
     * @param timestamp 
     */
    logTraceForMessageEnvelope(messageEnvelope: any, service: string, sampled?: number, flags?: number, timestamp?: string | Date | undefined): Promise<EventMessage>

    /**
     * Logs a new EventMessage with the messageEnvelope data and new EventTraceMetadata created as in createChildTraceMetadata
     * 
     * @param messageEnvelope  A Message Envelope as defined in the Central Services Stream protocol
     * @param parent 
     * @param service 
     * @param sampled 
     * @param flags 
     * @param timestamp 
     */
    logChildTraceForMessageEnvelope(messageEnvelope: any, parent: EventTraceMetadata | EventMessage, service: string, sampled?: number | undefined, flags?: number | undefined, timestamp?: string | Date | undefined ): Promise<EventMessage>

    /**
     * Logs a new EventMessage with the messageEnvelope data and new EventTraceMetadata created as in createChildTraceMetadata
     * 
     * @param messageEnvelope  A Message Envelope as defined in the Central Services Stream protocol
     * @param parent 
     * @param service 
     * @param sampled 
     * @param flags 
     * @param timestamp 
     */
    logSpanTraceForMessageEnvelope(messageEnvelope: any, parent: EventTraceMetadata | EventMessage, service: string, sampled?: number | undefined, flags?: number | undefined, timestamp?: string | Date | undefined ): Promise<EventMessage>
}


export {
    EventLogger
}
