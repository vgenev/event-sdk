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
'use strict'
var __assign = (this && this.__assign) || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i]
      for (var p in s) {
        if (Object.prototype.hasOwnProperty.call(s, p)) { t[p] = s[p] }
      }
    }
    return t
  }
  return __assign.apply(this, arguments)
}
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled (value) { try { step(generator.next(value)) } catch (e) { reject(e) } }
    function rejected (value) { try { step(generator['throw'](value)) } catch (e) { reject(e) } }
    function step (result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value) }).then(fulfilled, rejected) }
    step((generator = generator.apply(thisArg, _arguments || [])).next())
  })
}
var __generator = (this && this.__generator) || function (thisArg, body) {
  var _ = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1] }, trys: [], ops: [] }; var f; var y; var t; var g
  return g = { next: verb(0), 'throw': verb(1), 'return': verb(2) }, typeof Symbol === 'function' && (g[Symbol.iterator] = function () { return this }), g
  function verb (n) { return function (v) { return step([n, v]) } }
  function step (op) {
    if (f) throw new TypeError('Generator is already executing.')
    while (_) {
      try {
        if (f = 1, y && (t = op[0] & 2 ? y['return'] : op[0] ? y['throw'] || ((t = y['return']) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t
        if (y = 0, t) op = [op[0] & 2, t.value]
        switch (op[0]) {
          case 0: case 1: t = op; break
          case 4: _.label++; return { value: op[1], done: false }
          case 5: _.label++; y = op[1]; op = [0]; continue
          case 7: op = _.ops.pop(); _.trys.pop(); continue
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue }
            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break }
            if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break }
            if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break }
            if (t[2]) _.ops.pop()
            _.trys.pop(); continue
        }
        op = body.call(thisArg, _)
      } catch (e) { op = [6, e]; y = 0 } finally { f = t = 0 }
    }
    if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true }
  }
}
exports.__esModule = true
var EventMessage_1 = require('./model/EventMessage')
var EventLoggingServiceClient_1 = require('./transport/EventLoggingServiceClient')
var Config = require('./lib/config')
var EventMessage_2 = require('./model/EventMessage')
var getNestedObject = function (parent, path) {
  var child = __assign({}, parent)
  var result = {}
  var id = path.split('.')
  for (var i = 0; i < id.length; i++) {
    if (i !== id.length - 1) {
      child = child[id[i]]
    } else {
      result = child[id[i]]
    }
  }
  return result || null
}
var createTraceMetadataFromContext = function (traceContext) { return new EventMessage_1.EventTraceMetadata(traceContext) }
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
var DefaultEventLogger = /** @class */ (function () {
  // traceContext: IEventTrace
  function DefaultEventLogger (client) {
    this.preProcess = function (event) {
      return event
    }
    this.postProcess = function (result) {
      return result
    }
    this.client = client || new EventLoggingServiceClient_1.EventLoggingServiceClient(Config.EVENT_LOGGER_SERVER_HOST, Config.EVENT_LOGGER_SERVER_PORT)
    // this.traceContext = EventTraceMetadata.create('MUST_SET_SERVICE')
  }
  DefaultEventLogger.prototype.extract = function (carrier, path) {
    var traceContext = { service: '' }
    if (carrier instanceof EventMessage_1.EventTraceMetadata) {
      traceContext = carrier
    } else if (carrier instanceof EventMessage_1.EventMessage) {
      traceContext = createTraceMetadataFromContext(getNestedObject(carrier, 'metadata.trace'))
    } else if (typeof carrier === 'object' && carrier.hasOwnProperty('trace')) {
      traceContext = createTraceMetadataFromContext(getNestedObject(carrier, 'trace'))
    } else if (path) {
      traceContext = createTraceMetadataFromContext(getNestedObject(carrier, path))
    }
    // this.traceContext = traceContext
    return Promise.resolve(traceContext)
  }
  DefaultEventLogger.prototype.inject = function (carrier, traceContext, path) {
    var result = carrier
    if (path) {
      try {
        var pathArray = path.split('.')
        for (var i = 0; i < pathArray.length; i++) {
          result = result[pathArray[i]]
        }
        result.trace = traceContext
      } catch (e) {
        throw e
      }
    }
    result.trace = traceContext
    // this.traceContext = traceContext
    return Promise.resolve(carrier)
  }
  DefaultEventLogger.prototype.createNewTraceMetadata = function (traceContext) {
    var traceId = traceContext.traceId; var spanId = traceContext.spanId
    // if (service) this.traceContext.service = service
    if (!traceId) { return createTraceMetadataFromContext(traceContext) }
    if (spanId) {
      traceContext.spanId = undefined
      traceContext.parentSpanId = spanId
    }
    var newTraceContext = new EventMessage_1.EventTraceMetadata(traceContext)
    // this.traceContext = EventTraceMetadata.getContext(newTraceContext)
    return newTraceContext
  }
  DefaultEventLogger.prototype.trace = function (trace, state) {
    if (state === void 0) { state = EventMessage_2.EventStateMetadata.success() }
    return __awaiter(this, void 0, void 0, function () {
      var event, message, logResult
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (trace.finishTimestamp == null) {
              trace.finish()
            }
            event = EventMessage_2.EventMetadata.trace({ action: EventMessage_2.TraceEventAction.span, state: state })
            message = new EventMessage_1.EventMessage({
              type: 'trace',
              content: trace,
              metadata: {
                event: event,
                trace: trace
              }
            })
            return [4 /* yield */, this.record(message)]
          case 1:
            logResult = _a.sent()
            if (EventMessage_1.LogResponseStatus.accepted == logResult.status) {
              return [2 /* return */, trace]
            } else {
              throw new Error('Error when logging trace. status: ' + logResult.status)
            }
            return [2 /* return */]
        }
      })
    })
  }
  DefaultEventLogger.prototype.audit = function (message, action, state, traceContext) {
    if (action === void 0) { action = EventMessage_1.AuditEventAction['default'] }
    if (state === void 0) { state = EventMessage_2.EventStateMetadata.success() }
    return __awaiter(this, void 0, void 0, function () {
      var newEnvelope, logResult
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            newEnvelope = new EventMessage_1.EventMessage(Object.assign(message, {
              metadata: {
                event: EventMessage_2.EventMetadata.audit({
                  action: action,
                  state: state
                }),
                trace: traceContext ? createTraceMetadataFromContext(traceContext) : null
              }
            }))
            return [4 /* yield */, this.record(newEnvelope)]
          case 1:
            logResult = _a.sent()
            if (EventMessage_1.LogResponseStatus.accepted == logResult.status) {
              return [2 /* return */, logResult]
            } else {
              throw new Error('Error when logging trace. status: ' + logResult.status)
            }
            return [2 /* return */]
        }
      })
    })
  }
  /**
     * Log an event
     */
  DefaultEventLogger.prototype.record = function (event) {
    return __awaiter(this, void 0, void 0, function () {
      var updatedEvent, result
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            updatedEvent = this.preProcess(event)
            return [4 /* yield */, this.client.log(updatedEvent)]
          case 1:
            result = _a.sent()
            return [2 /* return */, this.postProcess(result)]
        }
      })
    })
  }
  return DefaultEventLogger
}())
exports.DefaultEventLogger = DefaultEventLogger
