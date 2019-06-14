'use strict'

import { EventMessage } from "../model/EventMessage";
import { EventLoggingServiceServer, EVENT_RECEIVED } from "../transport/EventLoggingServiceServer";
const Config = require('../config/default.json')


let server = new EventLoggingServiceServer(Config.SERVER_HOST, Config.SERVER_PORT)
server.on(EVENT_RECEIVED, (eventMessage : EventMessage) => {
  console.log('Received eventMessage: ', JSON.stringify(eventMessage, null, 2))
});
server.start();

