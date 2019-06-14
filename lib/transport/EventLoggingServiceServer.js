"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JsonToStructMapper_1 = require("./JsonToStructMapper");
const EventLoggerServiceLoader_1 = require("./EventLoggerServiceLoader");
const events = require("events");
const grpc = require('grpc');
const EVENT_RECEIVED = 'eventReceived';
exports.EVENT_RECEIVED = EVENT_RECEIVED;
class EventLoggingServiceServer extends events.EventEmitter {
    constructor(host, port) {
        super();
        let eventLoggerService = EventLoggerServiceLoader_1.loadEventLoggerService();
        var server = new grpc.Server();
        server.addService(eventLoggerService.service, {
            log: this.logEventReceivedHandler.bind(this)
        });
        this.server = server;
        this.host = host;
        this.port = port;
    }
    start() {
        this.server.bind(`${this.host}:${this.port}`, grpc.ServerCredentials.createInsecure());
        this.server.start();
        console.log('Server listening');
    }
    logEventReceivedHandler(call, callback) {
        let event = call.request;
        // We're on plain JavaScript, so although this *should* be a EventMessage since gRPC is typed, let's be sure
        if (!event.id) {
            callback(new Error(`Couldn't parse message parameter. It doesn't have an id property. parameter: ${event}`));
        }
        console.log('Server.logEventReceivedHandler event: ', JSON.stringify(event, null, 2));
        // Convert it to a EventMessage
        let eventMessage = Object.assign({}, event);
        // Convert the event.content wich is an Struct to a plan object
        if (eventMessage.content) {
            eventMessage.content = JsonToStructMapper_1.convertStructToJson(eventMessage.content.fields);
        }
        this.emit(EVENT_RECEIVED, eventMessage);
        // FIXME Build the response.
        // {
        //   status: [pending|accepted],
        //   // ???
        // }
        // send response
        // FIXME WIP will return a success|error response. See proto file
        callback(null, event);
    }
}
exports.EventLoggingServiceServer = EventLoggingServiceServer;
//# sourceMappingURL=EventLoggingServiceServer.js.map