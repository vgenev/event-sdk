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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled (value) { try { step(generator.next(value)) } catch (e) { reject(e) } }
    function rejected (value) { try { step(generator['throw'](value)) } catch (e) { reject(e) } }
    function step (result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value) }).then(fulfilled, rejected) }
    step((generator = generator.apply(thisArg, _arguments || [])).next())
  })
}
Object.defineProperty(exports, '__esModule', { value: true })
const path = require('path')
/**
 * SDK Client - NOT FINAL
 *
 * FIXME: Split in two, EventLogger with hooks to enrich/encrypt the message, and EventLoggingServiceClient who has the gRPC client code
*/
class EventLogger {
  constructor () {
    /**
         * Log an event
         */
    this.log = (event) => __awaiter(this, void 0, void 0, function * () {
      return new Promise((resolve, reject) => {
        let wireEvent = Object.assign({}, event)
        wireEvent.content = convertJSONtoStruct(event.content)
        console.log('Sending wireEvent: ', JSON.stringify(wireEvent, null, 2))
        this.client.log(wireEvent, (error, response) => {
          if (error) {
            reject(error)
          }
          resolve(response)
        })
      })
    })
    let PROTO_PATH = path.join(__dirname, '../protos/message_type.proto')
    let grpc = require('grpc')
    let protoLoader = require('@grpc/proto-loader')
    let packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    })
    let protoDescriptor = grpc.loadPackageDefinition(packageDefinition)
    // The protoDescriptor object has the full package hierarchy
    let EventLoggerService = protoDescriptor.mojaloop.events.EventLoggerService
    let client = new EventLoggerService('localhost:50051', grpc.credentials.createInsecure())
    this.client = client
  }
}
exports.EventLogger = EventLogger
function convertJSONtoStruct (data) {
  var toString = Object.prototype.toString
  var result = {}
  Object.keys(data).forEach(function (key) {
    var valueRep = {}
    var value = data[key]
    var typeString = toString.call(value)
    switch (typeString) {
      case '[object Null]':
      case '[object Undefined]':
        valueRep.nullValue = 0
        break
      case '[object Object]':
        valueRep.structValue = convertJSONtoStruct(value)
        break
      case '[object Array]':
        var typed = convertJSONtoStruct(value)
        var values = Object.keys(typed).map(function (key) {
          return typed[key]
        })
        valueRep.listValue = values
        break
      case '[object Number]':
        valueRep.numberValue = value
        break
      case '[object Boolean]':
        valueRep.boolValue = value
        break
      case '[object String]':
        valueRep.stringValue = value
        break
      case '[object Date]':
        valueRep.stringValue = value
        break
      default:
        throw new Error('Unsupported type: ' + typeString)
    }
    result[key] = valueRep
  })
  return {
    fields: result
  }
}
// # sourceMappingURL=eventLogger.js.map
