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
// import { DEFAULT_ECDH_CURVE } from "tls";
const EventMessage_2 = require("./model/EventMessage");
const util_1 = require("./lib/util");
const createTraceMetadataFromContext = (traceContext) => new EventMessage_1.EventTraceMetadata(traceContext);
/**
 * DefaultEventLogger sends all the EventLogger commands to the default EventLoggingServiceClient.
 * It provides null implementation of EventPreProcessor and EventPostProcessor.
 * It can be extended to implement some of these methods.
 *
*/
class DefaultEventLogger {
    constructor(client) {
        this.preProcess = (event) => {
            return event;
        };
        this.postProcess = (result) => {
            return result;
        };
        this.client = client ? client : new EventLoggingServiceClient_1.EventLoggingServiceClient(Config.EVENT_LOGGER_SERVER_HOST, Config.EVENT_LOGGER_SERVER_PORT);
        this.traceContext = EventMessage_1.EventTraceMetadata.create('MUST_SET_SERVICE');
    }
    extractSpan(carrier, path) {
        let traceContext = { service: '' };
        if (carrier instanceof EventMessage_1.EventTraceMetadata) {
            traceContext = carrier;
        }
        else if (carrier instanceof EventMessage_1.EventMessage) {
            traceContext = createTraceMetadataFromContext(util_1.getNestedObject(carrier, 'metadata.trace'));
        }
        else if (typeof carrier === 'object' && carrier.hasOwnProperty('trace')) {
            traceContext = createTraceMetadataFromContext(util_1.getNestedObject(carrier, 'trace'));
        }
        else if (path) {
            traceContext = createTraceMetadataFromContext(util_1.getNestedObject(carrier, path));
        }
        this.traceContext = traceContext;
        return Promise.resolve(this.traceContext);
    }
    injectSpan(carrier, traceContext = this.traceContext, path) {
        let result = carrier;
        if (carrier instanceof EventMessage_1.EventMessage)
            path = 'metadata.trace';
        else if (typeof carrier === 'object' && carrier.hasOwnProperty('trace'))
            path = 'trace';
        else if (carrier instanceof EventMessage_1.EventTraceMetadata)
            path = undefined;
        if (path) {
            try {
                let pathArray = path.split('.');
                for (let i = 0; i < pathArray.length - 1; i++) {
                    if (!result[pathArray[i]]) {
                        if (i < pathArray.length) {
                            let o = {};
                            o[pathArray[i + 1]] = {};
                            result[pathArray[i]] = o;
                        }
                    }
                    result = result[pathArray[i]];
                }
            }
            catch (e) {
                throw e;
            }
        }
        result.trace = traceContext;
        this.traceContext = traceContext;
        return Promise.resolve(carrier);
    }
    createNewSpan(input = this.traceContext) {
        let traceContext;
        if (typeof input === 'string') {
            traceContext = EventMessage_1.EventTraceMetadata.create(input);
        }
        else {
            let inputTraceContext = EventMessage_1.EventTraceMetadata.getContext(input);
            if (!(inputTraceContext.traceId && inputTraceContext.spanId) && !(inputTraceContext.service)) {
                throw new Error('No Service or traceId or SpanId provided');
            }
            let { spanId } = inputTraceContext;
            inputTraceContext.spanId = undefined;
            inputTraceContext.parentSpanId = spanId;
            traceContext = new EventMessage_1.EventTraceMetadata(inputTraceContext);
        }
        this.traceContext = traceContext;
        return Object.freeze(this.traceContext);
    }
    trace(traceContext = this.traceContext, traceOptions = { action: EventMessage_2.TraceEventAction.span }) {
        return __awaiter(this, void 0, void 0, function* () {
            let { state } = extractLoggerOptions(EventMessage_2.EventType.trace, traceOptions);
            let trace = new EventMessage_1.EventTraceMetadata(traceContext);
            if (trace.finishTimestamp == null && trace.finish) {
                trace.finish();
            }
            this.traceContext = trace;
            if (!state)
                throw new Error('no valid state provided');
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
                return logResult;
            }
            else {
                throw new Error(`Error when logging trace. status: ${logResult.status}`);
            }
        });
    }
    audit(message, auditOptions = { action: EventMessage_1.AuditEventAction.default }) {
        return __awaiter(this, void 0, void 0, function* () {
            let { action, state, traceContext } = extractLoggerOptions(EventMessage_2.EventType.audit, auditOptions);
            if (!action)
                throw new Error('no valid action provied');
            if (!state)
                throw new Error('no valid state provided');
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
const buildLoggerOptions = (actionDefault, action, state, traceContext) => {
    let result = {
        action, state, traceContext
    };
    result.action = action ? action
        : actionDefault ? actionDefault
            : EventMessage_1.NullEventAction.undefined;
    result.state = state ? state : EventMessage_2.EventStateMetadata.success();
    return result;
};
const extractLoggerOptions = (type, loggerOptions) => {
    let { action, state, traceContext } = loggerOptions;
    switch (type) {
        case EventMessage_2.EventType.audit: {
            return buildLoggerOptions(EventMessage_1.AuditEventAction.default, action, state, traceContext);
        }
        case EventMessage_2.EventType.trace: {
            return buildLoggerOptions(EventMessage_2.TraceEventAction.span, action, state, traceContext);
        }
        case EventMessage_2.EventType.log: {
            return buildLoggerOptions(EventMessage_1.LogEventAction.debug, action, state, traceContext);
        }
        case EventMessage_2.EventType.error: {
            return buildLoggerOptions(EventMessage_1.ErrorEventAction.internal, action, state, traceContext);
        }
        default: {
            return buildLoggerOptions(EventMessage_1.NullEventAction.undefined);
        }
    }
};
//# sourceMappingURL=DefaultEventLogger.js.map