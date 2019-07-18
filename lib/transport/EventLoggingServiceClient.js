"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const EventMessage_1 = require("../model/EventMessage");
const JsonToStructMapper_1 = require("./JsonToStructMapper");
const EventLoggerServiceLoader_1 = require("./EventLoggerServiceLoader");
const Logger = require('@mojaloop/central-services-shared').Logger;
const path = require('path');
const grpc = require('grpc');
class EventLoggingServiceClient {
    constructor(host, port) {
        /**
         * Log an event
         */
        this.log = (event) => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let wireEvent = Object.assign({}, event);
                if (!event.content) {
                    throw new Error('Invalid eventMessage: content is mandatory');
                }
                wireEvent.content = JsonToStructMapper_1.convertJsontoStruct(event.content);
                Logger.info(`EventLoggingServiceClient.log sending wireEvent: ${JSON.stringify(wireEvent, null, 2)}`);
                this.grpcClient.log(wireEvent, (error, response) => {
                    Logger.info(`EventLoggingServiceClient.log  received response: ${JSON.stringify(response, null, 2)}`);
                    if (error) {
                        reject(error);
                    }
                    resolve(response);
                });
            });
        });
        let eventLoggerService = EventLoggerServiceLoader_1.loadEventLoggerService();
        let client = new eventLoggerService(`${host}:${port}`, grpc.credentials.createInsecure());
        this.grpcClient = client;
    }
}
exports.EventLoggingServiceClient = EventLoggingServiceClient;
class SimpleLoggingServiceClient {
    constructor() {
        this.log = (message) => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    let result = Logger.info(JSON.stringify(message, null, 2));
                    let status = !result.exitOnError ? EventMessage_1.LogResponseStatus.accepted : EventMessage_1.LogResponseStatus.error;
                    resolve({ status });
                }
                catch (e) {
                    reject(e);
                }
            });
        });
        this.grpcClient = () => { };
    }
}
exports.SimpleLoggingServiceClient = SimpleLoggingServiceClient;
//# sourceMappingURL=EventLoggingServiceClient.js.map