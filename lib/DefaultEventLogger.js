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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const EventMessage_1 = require("./model/EventMessage");
const EventLoggingServiceClient_1 = require("./transport/EventLoggingServiceClient");
const Config = __importStar(require("./lib/config"));
// import { DEFAULT_ECDH_CURVE } from "tls";
const EventMessage_2 = require("./model/EventMessage");
const getNestedObject = (parent, path) => {
    let child = Object.assign({}, parent);
    let result = {};
    let id = path.split('.');
    for (let i = 0; i < id.length; i++) {
        if (i !== id.length - 1) {
            child = child[id[i]];
        }
        else {
            result = child[id[i]];
        }
    }
    return result || null;
};
const createTraceMetadataFromContext = (traceContext) => new EventMessage_1.EventTraceMetadata(traceContext);
// class DefaultTraceSpan implements TraceSpan {
//   constructor(traceSpan: EventTraceMetadata) {
//     new EventTraceMetadata(traceSpan)
//   }
//   get service(): string {
//     return this.service
//   }
//   get startTimestamp(): string | undefined {
//     return this.startTimestamp
//   }
//   get finishTimestamp(): string | undefined {
//     return this.finishTimestamp
//   }
//   get traceId(): string {
//     return this.traceId
//   }
//   get spanId(): string {
//     return this.spanId
//   }
//   get parentSpanId(): string | undefined {
//     return this.parentSpanId
//   }
//   finish(timestamp?: string | Date): IEventTrace {
//     if (!timestamp) {
//       timestamp = new Date()
//     }
//     this.finish(timestamp)
//     return this
//   }
// }
/**
 * DefaultEventLogger sends all the EventLogger commands to the default EventLoggingServiceClient.
 * It provides null implementation of EventPreProcessor and EventPostProcessor.
 * It can be extended to implement some of these methods.
 *
*/
class DefaultEventLogger {
    // traceContext: IEventTrace
    constructor(client) {
        this.preProcess = (event) => {
            return event;
        };
        this.postProcess = (result) => {
            return result;
        };
        this.client = client ? client : new EventLoggingServiceClient_1.EventLoggingServiceClient(Config.EVENT_LOGGER_SERVER_HOST, Config.EVENT_LOGGER_SERVER_PORT);
        // this.traceContext = EventTraceMetadata.create('MUST_SET_SERVICE')
    }
    extract(carrier, path) {
        let traceContext = { service: '' };
        if (carrier instanceof EventMessage_1.EventTraceMetadata) {
            traceContext = carrier;
        }
        else if (carrier instanceof EventMessage_1.EventMessage) {
            traceContext = createTraceMetadataFromContext(getNestedObject(carrier, 'metadata.trace'));
        }
        else if (typeof carrier === 'object' && carrier.hasOwnProperty('trace')) {
            traceContext = createTraceMetadataFromContext(getNestedObject(carrier, 'trace'));
        }
        else if (path) {
            traceContext = createTraceMetadataFromContext(getNestedObject(carrier, path));
        }
        // this.traceContext = traceContext
        return Promise.resolve(traceContext);
    }
    inject(carrier, traceContext, path) {
        let result = carrier;
        if (path) {
            try {
                let pathArray = path.split('.');
                for (let i = 0; i < pathArray.length; i++) {
                    result = result[pathArray[i]];
                }
                result.trace = traceContext;
            }
            catch (e) {
                throw e;
            }
        }
        result.trace = traceContext;
        // this.traceContext = traceContext
        return Promise.resolve(carrier);
    }
    createNewTraceMetadata(traceContext) {
        let { traceId, spanId } = traceContext;
        // if (service) this.traceContext.service = service
        if (!traceId)
            return createTraceMetadataFromContext(traceContext);
        if (spanId) {
            traceContext.spanId = undefined;
            traceContext.parentSpanId = spanId;
        }
        let newTraceContext = new EventMessage_1.EventTraceMetadata(traceContext);
        // this.traceContext = EventTraceMetadata.getContext(newTraceContext)    
        return newTraceContext;
    }
    trace(trace, state = EventMessage_2.EventStateMetadata.success()) {
        return __awaiter(this, void 0, void 0, function* () {
            if (trace.finishTimestamp == null) {
                trace.finish();
            }
            let event = EventMessage_2.EventMetadata.trace({ action: EventMessage_2.TraceEventAction.span, state });
            let message = new EventMessage_1.EventMessage({
                type: 'trace',
                content: trace,
                metadata: {
                    event,
                    trace
                }
            });
            let logResult = yield this.record(message);
            if (EventMessage_1.LogResponseStatus.accepted == logResult.status) {
                return trace;
            }
            else {
                throw new Error(`Error when logging trace. status: ${logResult.status}`);
            }
        });
    }
    audit(message, action = EventMessage_1.AuditEventAction.default, state = EventMessage_2.EventStateMetadata.success(), traceContext) {
        return __awaiter(this, void 0, void 0, function* () {
            let newEnvelope = new EventMessage_1.EventMessage(Object.assign(message, {
                metadata: {
                    event: EventMessage_2.EventMetadata.audit({
                        action,
                        state
                    }),
                    trace: traceContext ? createTraceMetadataFromContext(traceContext) : null
                }
            }));
            let logResult = yield this.record(newEnvelope);
            if (EventMessage_1.LogResponseStatus.accepted == logResult.status) {
                return logResult;
            }
            else {
                throw new Error(`Error when logging trace. status: ${logResult.status}`);
            }
        });
    }
    /**
     * Log an event
     */
    record(event) {
        return __awaiter(this, void 0, void 0, function* () {
            let updatedEvent = this.preProcess(event);
            let result = yield this.client.log(updatedEvent);
            return this.postProcess(result);
        });
    }
}
exports.DefaultEventLogger = DefaultEventLogger;
//# sourceMappingURL=DefaultEventLogger.js.map