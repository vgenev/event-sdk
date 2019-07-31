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
const EventMessage_1 = require("./model/EventMessage");
const Logger = require('@mojaloop/central-services-shared').Logger;
class DefaultLoggerRecorder {
    constructor() {
        this.recorder = Logger;
        this.preProcess = (event) => {
            return event;
        };
        this.postProcess = (result) => {
            return result;
        };
    }
    record(event) {
        return __awaiter(this, void 0, void 0, function* () {
            let updatedEvent = this.preProcess(event);
            let result = yield this._log(updatedEvent);
            return this.postProcess(result);
        });
    }
    _log(message) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    let type;
                    let action;
                    if (message.metadata && message.metadata.event) {
                        type = message.metadata.event.type || EventMessage_1.EventType.undefined;
                        action = message.metadata.event.action || EventMessage_1.NullEventAction.undefined;
                    }
                    else {
                        type = EventMessage_1.EventType.log;
                        action = EventMessage_1.LogEventAction.info;
                    }
                    let result;
                    if (type === EventMessage_1.EventType.log && Object.values(EventMessage_1.LogEventAction).includes(action))
                        result = Logger.log(action, JSON.stringify(message, null, 2));
                    else if (type === EventMessage_1.EventType.audit || type === EventMessage_1.EventType.trace)
                        result = Logger.log(type, JSON.stringify(message, null, 2));
                    else
                        result = Logger.error('The event message is not following the format');
                    let status = !result.exitOnError ? EventMessage_1.LogResponseStatus.accepted : EventMessage_1.LogResponseStatus.error;
                    resolve({ status });
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
}
exports.DefaultLoggerRecorder = DefaultLoggerRecorder;
class DefaultSidecarRecorder {
    constructor(recorder) {
        this.preProcess = (event) => {
            return event;
        };
        this.postProcess = (result) => {
            return result;
        };
        this.recorder = recorder;
        return this;
    }
    record(event) {
        return __awaiter(this, void 0, void 0, function* () {
            let updatedEvent = this.preProcess(event);
            let result = yield this.recorder.log(updatedEvent);
            return this.postProcess(result);
        });
    }
}
exports.DefaultSidecarRecorder = DefaultSidecarRecorder;
//# sourceMappingURL=Recorder.js.map