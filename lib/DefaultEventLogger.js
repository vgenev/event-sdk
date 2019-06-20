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
        this.client = new EventLoggingServiceClient_1.EventLoggingServiceClient(Config.EVENT_LOGGER_SERVER_HOST, Config.EVENT_LOGGER_SERVER_PORT);
    }
    createTraceMetadata(service, sampled, flags, timestamp) {
        let newMeta = new EventMessage_1.EventTraceMetadata(service, EventMessage_1.newTraceId(), EventMessage_1.newSpanId(), undefined, sampled, flags, timestamp);
        return newMeta;
    }
    createChildTraceMetadata(parentTraceMetadata, service, sampled, flags, timestamp) {
        return new EventMessage_1.EventTraceMetadata(service, parentTraceMetadata.traceId, EventMessage_1.newSpanId(), parentTraceMetadata.spanId, sampled, flags, timestamp);
    }
    createSpanTraceMetadata(parentTraceMetadata, service, sampled, flags, timestamp) {
        return new EventMessage_1.EventTraceMetadata(service, parentTraceMetadata.traceId, EventMessage_1.newSpanId(), undefined, sampled, flags, timestamp);
    }
    logTraceForMessageEnvelope(messageEnvelope, service, sampled, flags, timestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._logTraceForMessageEnvelope(messageEnvelope, this.createTraceMetadata(service, sampled, flags, timestamp), service, sampled, flags, timestamp);
        });
    }
    logChildTraceForMessageEnvelope(messageEnvelope, parent, service, sampled, flags, timestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            let parentTraceMetadata;
            if (parent instanceof EventMessage_1.EventMessage && parent.metadata) {
                parentTraceMetadata = parent.metadata.trace;
            }
            else if (parent instanceof EventMessage_1.EventTraceMetadata) {
                parentTraceMetadata = parent;
            }
            else {
                throw new Error('Invalid parent type');
            }
            return this._logTraceForMessageEnvelope(messageEnvelope, this.createChildTraceMetadata(parentTraceMetadata, service, sampled, flags, timestamp), service, sampled, flags, timestamp);
        });
    }
    logSpanTraceForMessageEnvelope(messageEnvelope, parent, service, sampled, flags, timestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            let parentTraceMetadata;
            if (parent instanceof EventMessage_1.EventMessage && parent.metadata) {
                parentTraceMetadata = parent.metadata.trace;
            }
            else if (parent instanceof EventMessage_1.EventTraceMetadata) {
                parentTraceMetadata = parent;
            }
            else {
                throw new Error('Invalid parent type');
            }
            return this._logTraceForMessageEnvelope(messageEnvelope, this.createSpanTraceMetadata(parentTraceMetadata, service, sampled, flags, timestamp), service, sampled, flags, timestamp);
        });
    }
    _logTraceForMessageEnvelope(messageEnvelope, traceMetadata, service, sampled, flags, timestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            let eventMessage = new EventMessage_1.EventMessage(messageEnvelope.id, messageEnvelope.type, messageEnvelope.content);
            eventMessage.from = messageEnvelope.from;
            eventMessage.to = messageEnvelope.to;
            eventMessage.pp = messageEnvelope.pp;
            eventMessage.metadata = new EventMessage_1.MessageMetadata(messageEnvelope.metadata.event, traceMetadata);
            let logResult = yield this.log(eventMessage);
            if (EventMessage_1.LogResponseStatus.accepted == logResult.status) {
                return eventMessage;
            }
            else {
                throw new Error(`Error when logging trace. status: ${logResult.status}`);
            }
        });
    }
    /**
     * Log an event
     */
    log(event) {
        return __awaiter(this, void 0, void 0, function* () {
            let updatedEvent = this.preProcess(event);
            let result = yield this.client.log(updatedEvent);
            return this.postProcess(result);
        });
    }
}
exports.DefaultEventLogger = DefaultEventLogger;
//# sourceMappingURL=DefaultEventLogger.js.map