/// <reference types="node" />
import events = require('events');
declare const EVENT_RECEIVED = "eventReceived";
declare class EventLoggingServiceServer extends events.EventEmitter {
    private server;
    private host;
    private port;
    constructor(host: string, port: number);
    start(): any;
    logEventReceivedHandler(call: any, callback: any): void;
}
export { EVENT_RECEIVED, EventLoggingServiceServer };
