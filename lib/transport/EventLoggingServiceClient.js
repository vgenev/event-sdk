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
const JsonToStructMapper_1 = require("./JsonToStructMapper");
const EventLoggerServiceLoader_1 = require("./EventLoggerServiceLoader");
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
                wireEvent.content = JsonToStructMapper_1.convertJsontoStruct(event.content);
                console.log('EventLoggingServiceClient.log sending wireEvent: ', JSON.stringify(wireEvent, null, 2));
                this.grpcClient.log(wireEvent, (error, response) => {
                    console.log('EventLoggingServiceClient.log  received response: ', JSON.stringify(response, null, 2));
                    if (error) {
                        reject(error);
                    }
                    let eventMessage = Object.assign({}, response);
                    // FIXME This is very specific, since we know that content is a Struct in this method.
                    // To make it more generic, and be able to use it in other methods, we could also check if there's a "fields" property and "kind", and assume its a Struct and then convert it
                    if (eventMessage.content != null && eventMessage.content.fields != null) {
                        eventMessage.content = JsonToStructMapper_1.convertStructToJson(eventMessage.content.fields);
                    }
                    resolve(eventMessage);
                });
            });
        });
        let eventLoggerService = EventLoggerServiceLoader_1.loadEventLoggerService();
        let client = new eventLoggerService(`${host}:${port}`, grpc.credentials.createInsecure());
        this.grpcClient = client;
    }
}
exports.EventLoggingServiceClient = EventLoggingServiceClient;
//# sourceMappingURL=EventLoggingServiceClient.js.map