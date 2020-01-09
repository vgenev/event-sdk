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
import { EventMessage, LogResponse } from "../model/EventMessage";
import { toAny } from "./MessageMapper";
import { loadEventLoggerService } from "./EventLoggerServiceLoader";

const Logger = require('../lib/logger')
const grpc = require('grpc')

class EventLoggingServiceClient {
  grpcClient : any;

  constructor(host: string, port: number) {
    let eventLoggerService = loadEventLoggerService();

    let client = new eventLoggerService(`${host}:${port}`, grpc.credentials.createInsecure())
    this.grpcClient = client
  }
  
  /**
   * Log an event
   */
  log = async (event: EventMessage): Promise<LogResponse> => {
    return new Promise((resolve, reject) => {
      let wireEvent: any = Object.assign({}, event);
      if (!event.content) {
        throw new Error('Invalid eventMessage: content is mandatory');
      }

      try {
        wireEvent.content = toAny(event.content, event.type);

        let wireEventCopy: any = JSON.parse(JSON.stringify(wireEvent));
        if (wireEventCopy.content.value.type === 'Buffer') {
          wireEventCopy.content.value = `Buffer(${wireEventCopy.content.value.data.length})`
        }
        Logger.debug(`EventLoggingServiceClient.log sending wireEvent: ${JSON.stringify(wireEventCopy, null, 2)}`);
        this.grpcClient.log(wireEvent, (error: any, response: LogResponse) => {
          Logger.debug(`EventLoggingServiceClient.log received response: ${JSON.stringify(response, null, 2)}`);
          if (error) {
            reject(error); 
          }
          resolve(response);
        })
      } catch (e) {
        Logger.error(e)
        reject(e)
      }
    })
  }
}

export {
  EventLoggingServiceClient
}