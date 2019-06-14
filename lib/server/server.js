'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const EventLoggingServiceServer_1 = require("../transport/EventLoggingServiceServer");
const Config = require('../config/default.json');
let server = new EventLoggingServiceServer_1.EventLoggingServiceServer(Config.SERVER_HOST, Config.SERVER_PORT);
server.on(EventLoggingServiceServer_1.EVENT_RECEIVED, (eventMessage) => {
    console.log('Received eventMessage: ', JSON.stringify(eventMessage, null, 2));
});
server.start();
//# sourceMappingURL=server.js.map