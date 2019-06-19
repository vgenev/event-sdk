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
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const EventMessage_1 = require("./model/EventMessage");
const EventLoggingServiceClient_1 = require("./transport/EventLoggingServiceClient");
const Config = require('./lib/config');
const Uuid = require('uuid4');
/**
 * DefaultEventLogger sends all the EventLogger commands to the default EventLoggingServiceClient.
 * It provides null implementation of EventPreProcessor and EventPostProcessor.
 * It can be extended to implement some of these methods.
 *
*/
class DefaultEventLogger {
    constructor() {
        this.preProcess = (event) => {
            return event;
        };
        this.postProcess = (result) => {
            return result;
        };
        /**
         * Log an event
         */
        this.log = (event) => __awaiter(this, void 0, void 0, function* () {
            let updatedEvent = this.preProcess(event);
            let result = yield this.client.log(updatedEvent);
            return this.postProcess(result);
        });
        this.client = new EventLoggingServiceClient_1.EventLoggingServiceClient(Config.EVENT_LOGGER_SERVER_HOST, Config.EVENT_LOGGER_SERVER_PORT);
    }
    createNewTraceMetadata(service, sampled, flags, timestamp) {
        let newMeta = new EventMessage_1.EventTraceMetadata(service, new Uuid(), new Uuid(), undefined, sampled, flags, timestamp);
        return newMeta;
    }
    createChildTraceMetadata(parentTraceMetadata) {
        return new EventMessage_1.EventTraceMetadata(parentTraceMetadata.service, parentTraceMetadata.traceId, new Uuid(), parentTraceMetadata.spanId);
    }
    logNewTraceForMessageEnvelope(messageEnvelope, service, sampled, flags, timestamp) {
        let eventMessage = new EventMessage_1.EventMessage(messageEnvelope.id, messageEnvelope.type, messageEnvelope.content);
        eventMessage.from = messageEnvelope.from;
        eventMessage.to = messageEnvelope.to;
        eventMessage.pp = messageEnvelope.pp;
        if (!(messageEnvelope.metadata && messageEnvelope.metadata.event)) {
            throw new Error(`MessageEnvelope must have a metadata.event property ${messageEnvelope}`);
        }
        eventMessage.metadata = new EventMessage_1.MessageMetadata(messageEnvelope.metadata.event, this.createNewTraceMetadata(service, sampled, flags, timestamp));
        return eventMessage;
    }
    logChildTraceForMessageEnvelope(messageEnvelope, parentTraceMetadata) {
        let eventMessage = new EventMessage_1.EventMessage(messageEnvelope.id, messageEnvelope.type, messageEnvelope.content);
        eventMessage.from = messageEnvelope.from;
        eventMessage.to = messageEnvelope.to;
        eventMessage.pp = messageEnvelope.pp;
        eventMessage.metadata = new EventMessage_1.MessageMetadata(messageEnvelope.metadata.event, this.createChildTraceMetadata(parentTraceMetadata));
        return eventMessage;
    }
}
exports.DefaultEventLogger = DefaultEventLogger;
//# sourceMappingURL=DefaultEventLogger.js.map