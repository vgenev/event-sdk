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
const Logger = require('@mojaloop/central-services-logger');
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
                try {
                    // wireEvent.content = convertJsontoStruct(event.content);
                    wireEvent.content = JsonToStructMapper_1.toAny(event.content, event.type);
                    let wireEventCopy = JSON.parse(JSON.stringify(wireEvent));
                    if (wireEventCopy.content.value.type === 'Buffer') {
                        wireEventCopy.content.value = `Buffer(${wireEventCopy.content.value.data.length})`;
                    }
                    Logger.debug(`EventLoggingServiceClient.log sending wireEvent: ${JSON.stringify(wireEventCopy, null, 2)}`);
                    this.grpcClient.log(wireEvent, (error, response) => {
                        Logger.debug(`EventLoggingServiceClient.log received response: ${JSON.stringify(response, null, 2)}`);
                        if (error) {
                            reject(error);
                        }
                        resolve(response);
                    });
                }
                catch (e) {
                    Logger.error(e);
                    reject(e);
                }
            });
        });
        let eventLoggerService = EventLoggerServiceLoader_1.loadEventLoggerService();
        let client = new eventLoggerService(`${host}:${port}`, grpc.credentials.createInsecure());
        this.grpcClient = client;
    }
}
exports.EventLoggingServiceClient = EventLoggingServiceClient;
//# sourceMappingURL=EventLoggingServiceClient.js.map