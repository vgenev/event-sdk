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

import { MessageType } from "./model/MessageType";
const path = require('path');

/**
 * SDK Client - NOT FINAL
*/
class EventLogger {
    client : any

    constructor() {
      let PROTO_PATH = path.join(__dirname,'./protos/message_type.proto');

      let grpc = require('grpc')
      let protoLoader = require('@grpc/proto-loader')
      let packageDefinition = protoLoader.loadSync(
        PROTO_PATH,
        { keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true
        })
      let protoDescriptor = grpc.loadPackageDefinition(packageDefinition)
      // The protoDescriptor object has the full package hierarchy
      let EventLogger = protoDescriptor.mojaloop.events.EventLogger
        
      let client = new EventLogger('localhost:50051',
        grpc.credentials.createInsecure())
      this.client = client
      }
    /**
     * Log an event
     */
    log = async ( event: MessageType): Promise<any> => {
      return new Promise((resolve, reject) => {
        this.client.log(event, (error: any, event: any) => {
          if ( error ) {reject(error); }
          resolve(event);
        })
      })
    }
}

export {
    EventLogger
}
