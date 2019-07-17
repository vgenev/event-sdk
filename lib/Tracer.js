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

 - Valentin Genev <valentin.genev@modusbox.com>

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
const Trace_1 = require("./Trace");
const EventLoggingServiceClient_1 = require("./transport/EventLoggingServiceClient");
const EventMessage_1 = require("./model/EventMessage");
const Config = require('./lib/config');
/**
 * Implements the methods for user to work with tracing and logging. Sends all messages to the EventLoggingServiceClient.
 * It provides null implementation of EventPreProcessor and EventPostProcessor.
 * It can be extended to implement some of these methods.
 */
class Tracer extends Trace_1.Trace {
    constructor(traceContext, config = Config, client) {
        super(new EventMessage_1.EventTraceMetadata(traceContext));
        this.preProcess = (event) => {
            return event;
        };
        this.postProcess = (result) => {
            return result;
        };
        if (!config.SIDECAR_DISABLED)
            this.client = client ? client : new EventLoggingServiceClient_1.EventLoggingServiceClient(config.EVENT_LOGGER_SERVER_HOST, config.EVENT_LOGGER_SERVER_PORT);
        else
            this.client = new EventLoggingServiceClient_1.SimpleLoggingServiceClient();
    }
    /**
     * Creates new Trace and its first span with given service name
     * @param service the name of the service of the new span
     */
    static createSpan(service, config, client) {
        return new Tracer({ service }, config, client);
    }
    /**
     * Finishes the current span and its trace and sends the data to the tracing framework.
     * @param finishTimestamp optional parameter for the finish time. If omitted, current time is used.
     */
    finish(finishTimestamp) {
        const _super = Object.create(null, {
            finishSpan: { get: () => super.finishSpan }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (this._traceContext.finishTimestamp)
                return Promise.reject(new Error('span already finished'));
            let traceContext = _super.finishSpan.call(this, finishTimestamp).getContext();
            yield this.trace(traceContext);
            return Promise.resolve(this);
        });
    }
    /**
     * Creates and returns new child span of the current span and changes the span service name
     * @param service the name of the service of the new child span
     */
    getChild(service) {
        let traceContext = super.getChildSpan(service);
        return new Tracer(traceContext);
    }
    static createChildSpanFromContext(service, traceContext) {
        let newTraceContext = Trace_1.Trace.createChildSpanFromExtractedContext(service, traceContext);
        return new Tracer(newTraceContext);
    }
    /**
     * Sends trace message to the tracing framework
     * @param traceContext optional parameter. Can be used to trace previous span. If not set, the current span context is used.
     * @param traceOptions options for status and event action. Default action is 'span' and status is success
     */
    trace(traceContext = this._traceContext, traceOptions = { action: EventMessage_1.TraceEventAction.span }) {
        return __awaiter(this, void 0, void 0, function* () {
            let { state } = extractLoggerOptions(EventMessage_1.EventType.trace, traceOptions);
            if (!state)
                throw new Error('no valid state provided');
            let event = EventMessage_1.EventMetadata.trace({ action: EventMessage_1.TraceEventAction.span, state });
            let message = new EventMessage_1.EventMessage({
                type: 'trace',
                content: traceContext,
                metadata: {
                    event,
                    trace: traceContext
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
    /**
     * Sends audit type message to the event logging framework.
     * @param message message to be recorded as audit event
     * @param auditOptions Logger options object.
     */
    audit(message, auditOptions = { action: EventMessage_1.AuditEventAction.default }) {
        return __awaiter(this, void 0, void 0, function* () {
            let { action, state } = extractLoggerOptions(EventMessage_1.EventType.audit, auditOptions);
            if (!action)
                throw new Error('no valid action provied');
            if (!state)
                throw new Error('no valid state provided');
            let newEnvelope = new EventMessage_1.EventMessage(Object.assign(message, {
                metadata: {
                    event: EventMessage_1.EventMetadata.audit({
                        action,
                        state
                    }),
                    trace: this._traceContext
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
     * Logs INFO type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    info(message) {
        return __awaiter(this, void 0, void 0, function* () {
            let loggerOptions = { action: EventMessage_1.LogEventAction.info };
            return this.logWithAction(message, loggerOptions);
        });
    }
    /**
     * Logs DEBUG type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    debug(message) {
        return __awaiter(this, void 0, void 0, function* () {
            let loggerOptions = { action: EventMessage_1.LogEventAction.debug };
            return this.logWithAction(message, loggerOptions);
        });
    }
    /**
     * Logs VERBOSE type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    verbose(message) {
        return __awaiter(this, void 0, void 0, function* () {
            let loggerOptions = { action: EventMessage_1.LogEventAction.verbose };
            return this.logWithAction(message, loggerOptions);
        });
    }
    /**
     * Logs PERFORMANCE type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    performance(message) {
        return __awaiter(this, void 0, void 0, function* () {
            let loggerOptions = { action: EventMessage_1.LogEventAction.performance };
            return this.logWithAction(message, loggerOptions);
        });
    }
    /**
     * Logs WARNING type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    warning(message) {
        return __awaiter(this, void 0, void 0, function* () {
            let loggerOptions = { action: EventMessage_1.LogEventAction.warning };
            return this.logWithAction(message, loggerOptions);
        });
    }
    /**
     * Logs ERROR type message.
     * @param message if message is a string, the message is added to a message property of context of an event message.
     * If message is not following the event framework message format, the message is added as it is to the context of an event message.
     * If message follows the event framework message format, only the metadata is updated and if message lacks an UUID it is created.
     */
    error(message) {
        return __awaiter(this, void 0, void 0, function* () {
            let loggerOptions = { action: EventMessage_1.LogEventAction.error };
            return this.logWithAction(message, loggerOptions);
        });
    }
    /**
   * Sends an event message to the event logging framework
   */
    record(event) {
        return __awaiter(this, void 0, void 0, function* () {
            let updatedEvent = this.preProcess(event);
            let result = yield this.client.log(updatedEvent);
            return this.postProcess(result);
        });
    }
    logWithAction(message, loggerOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message)
                throw new Error('no message to provided');
            if (this._traceContext.finishTimestamp)
                throw new Error('span finished. no further actions allowed');
            let { state, action = EventMessage_1.LogEventAction.info } = extractLoggerOptions(EventMessage_1.EventType.log, loggerOptions);
            let messageToLog;
            if (!state)
                throw new Error('no valid state provided');
            if (typeof message === 'string') {
                messageToLog = new EventMessage_1.EventMessage({
                    content: {
                        message
                    },
                    type: 'log'
                });
            }
            else if ((typeof message === 'object') && (!(message.hasOwnProperty('content')) || !(message.hasOwnProperty('type')))) {
                messageToLog = new EventMessage_1.EventMessage({
                    content: message,
                    type: 'log'
                });
            }
            else {
                messageToLog = new EventMessage_1.EventMessage(message);
            }
            let newEnvelope = Object.assign(messageToLog, {
                metadata: {
                    event: EventMessage_1.EventMetadata.log({
                        action,
                        state
                    }),
                    trace: this._traceContext
                }
            });
            // Logger.info(JSON.stringify(messageToLog))
            let logResult = yield this.record(newEnvelope);
            if (EventMessage_1.LogResponseStatus.accepted == logResult.status) {
                return logResult;
            }
            else {
                throw new Error(`Error when logging trace. status: ${logResult.status}`);
            }
        });
    }
}
exports.Tracer = Tracer;
const buildLoggerOptions = (actionDefault, action, state) => {
    let result = {
        action, state
    };
    result.action = action ? action : actionDefault;
    result.state = state ? state : EventMessage_1.EventStateMetadata.success();
    return result;
};
const extractLoggerOptions = (type, loggerOptions) => {
    let { action = EventMessage_1.NullEventAction.undefined, state } = loggerOptions;
    switch (type) {
        case EventMessage_1.EventType.audit: {
            return buildLoggerOptions(EventMessage_1.AuditEventAction.default, action, state);
        }
        case EventMessage_1.EventType.trace: {
            return buildLoggerOptions(EventMessage_1.TraceEventAction.span, action, state);
        }
        case EventMessage_1.EventType.log: {
            return buildLoggerOptions(EventMessage_1.LogEventAction.info, action, state);
        }
        default: {
            return buildLoggerOptions(EventMessage_1.NullEventAction.undefined, EventMessage_1.NullEventAction.undefined);
        }
    }
};
//# sourceMappingURL=Tracer.js.map