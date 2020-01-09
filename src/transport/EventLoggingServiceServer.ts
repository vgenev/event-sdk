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
import { EventMessage, LogResponse, LogResponseStatus } from "../model/EventMessage";
import { fromAny } from "./MessageMapper";
import { loadEventLoggerService } from "./EventLoggerServiceLoader";

import events = require('events');

const grpc = require('grpc')
const Logger = require('@mojaloop/central-services-logger')

const EVENT_RECEIVED = 'eventReceived';


class EventLoggingServiceServer extends events.EventEmitter {

  private server: any;
  private host : string;
  private port: number;

  constructor(host : string, port: number ) {
    super();
    let eventLoggerService = loadEventLoggerService();

    var server = new grpc.Server()
    server.addService(eventLoggerService.service, {
      log: this.logEventReceivedHandler.bind(this)
    })

    this.server = server;
    this.host = host;
    this.port = port;
  }

  start() : any {
    this.server.bind(`${this.host}:${this.port}`, grpc.ServerCredentials.createInsecure())
    this.server.start()
    Logger.info(`Server listening on ${this.host}:${this.port}...`)
  }

  logEventReceivedHandler (call: any, callback: any) {
    let event = call.request
    // We're on plain JavaScript, so although this *should* be a EventMessage since gRPC is typed, let's be sure
    if (!event.id) {
      callback(new Error(`Couldn't parse message parameter. It doesn't have an id property. parameter: ${event}`))
      //TODO: should this return here? Otherwise callback is called twice
    }

    Logger.debug(`Server.logEventReceivedHandler event: ${JSON.stringify(event, null, 2)}`)
    
    let response: LogResponse;

    try {
      // Convert it to a EventMessage
      const eventMessage: EventMessage = Object.assign({}, event);
      // Convert the event.content which is a Struct to a plain object
      if (eventMessage.content) {
        eventMessage.content = fromAny(eventMessage.content)
      }

      this.emit(EVENT_RECEIVED, eventMessage);
    
      response = new LogResponse(LogResponseStatus.accepted)
    } catch (error) {
      response = new LogResponse(LogResponseStatus.error)
    }

    callback(null, response)
  } 
}

export {
  EVENT_RECEIVED,
  EventLoggingServiceServer
}