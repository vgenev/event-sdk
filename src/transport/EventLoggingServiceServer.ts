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
import { EventMessage } from "../model/EventMessage";
import { convertStructToJson } from "./JsonToStructMapper";
import { loadEventLoggerService } from "./EventLoggerServiceLoader";

import events = require('events');

const grpc = require('grpc')

const EVENT_RECEIVED = 'eventReceived';


class EventLoggingServiceServer extends events.EventEmitter{

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
    console.log('this.on: ', this.on);
  }

  start() : any {
    this.server.bind(`${this.host}:${this.port}`, grpc.ServerCredentials.createInsecure())
    this.server.start()
    console.log('Server listening')
  }

  logEventReceivedHandler (call: any, callback: any) {
    let event = call.request
    // We're on plain JavaScript, so although this *should* be a EventMessage since gRPC is typed, let's be sure
    if (!event.id) {
      callback(new Error(`Couldn't parse message parameter. It doesn't have an id property. parameter: ${event}`))
    }
    console.log('Server.logEvent: ', JSON.stringify(event, null, 2))
  
    // Convert the event.content wich is an Struct to a plan object
    if (event.content) {
      event.content = convertStructToJson(event.content.fields)
    }

    // Convert it to a EventMessage

    let eventMessage : EventMessage = event;
    console.log(this);
    this.emit(EVENT_RECEIVED, eventMessage);
    console.log('Server.logEvent content parsed:: ', JSON.stringify(event, null, 2))
  
    // FIXME Build the response.
      // {
      //   status: [pending|accepted],
      //   // ???
      // }
  
    
  
    // send response
    // FIXME WIP will return a success|error response. See proto file
    callback(null, event)
  }
  
}

export {
  EVENT_RECEIVED,
  EventLoggingServiceServer
}