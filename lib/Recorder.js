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
const logWithLevel = (message) => __awaiter(this, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        try {
            let type;
            let action;
            if (message.metadata && message.metadata.event) {
                type = message.metadata.event.type;
                action = message.metadata.event.action;
            }
            else {
                type = EventMessage_1.EventType.log;
                action = EventMessage_1.LogEventAction.info;
            }
            if (type === EventMessage_1.EventType.log && Object.values(EventMessage_1.LogEventAction).includes(action))
                Logger.log(action, JSON.stringify(message, null, 2));
            else
                Logger.log(type, JSON.stringify(message, null, 2));
            resolve({ status: EventMessage_1.LogResponseStatus.accepted });
        }
        catch (e) {
            reject({ status: EventMessage_1.LogResponseStatus.error, error: e });
        }
    });
});
class DefaultLoggerRecorder {
    constructor(recorder) {
        this.preProcess = (event) => {
            return event;
        };
        this.postProcess = (result) => {
            return result;
        };
        this.recorder = recorder ? recorder : Logger;
        return this;
    }
    record(event) {
        return __awaiter(this, void 0, void 0, function* () {
            let updatedEvent = this.preProcess(event);
            let result = yield logWithLevel(updatedEvent);
            return this.postProcess(result);
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
    record(event, doLog = true) {
        return __awaiter(this, void 0, void 0, function* () {
            doLog && (yield logWithLevel(event));
            let updatedEvent = this.preProcess(event);
            let result = yield this.recorder.log(updatedEvent);
            return this.postProcess(result);
        });
    }
}
exports.DefaultSidecarRecorder = DefaultSidecarRecorder;
class DefaultSidecarRecorderAsync {
    constructor(recorder) {
        this.preProcess = (event) => {
            return event;
        };
        this.recorder = recorder;
        return this;
    }
    record(event, doLog = true, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            doLog && logWithLevel(event);
            let updatedEvent = this.preProcess(event);
            let result = this.recorder.log(updatedEvent);
            if (callback) {
                return callback(result);
            }
            else {
                return result;
            }
        });
    }
}
exports.DefaultSidecarRecorderAsync = DefaultSidecarRecorderAsync;
//# sourceMappingURL=Recorder.js.map