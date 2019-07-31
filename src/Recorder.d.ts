import { EventMessage } from "./model/EventMessage";
import { EventLoggingServiceClient } from "./transport/EventLoggingServiceClient";
interface IEventRecorder {
    recorder: EventLoggingServiceClient | Function;
    preProcess: (event: EventMessage) => EventMessage;
    postProcess: (result: any) => any;
    record: (event: EventMessage) => Promise<any>;
}
declare class DefaultLoggerRecorder implements IEventRecorder {
    recorder: Function;
    preProcess: (event: EventMessage) => EventMessage;
    postProcess: (result: any) => any;
    record(event: EventMessage): Promise<any>;
    private _log;
}
declare class DefaultSidecarRecorder implements IEventRecorder {
    recorder: EventLoggingServiceClient;
    constructor(recorder: EventLoggingServiceClient);
    preProcess: (event: EventMessage) => EventMessage;
    postProcess: (result: any) => any;
    record(event: EventMessage): Promise<any>;
}
export { DefaultLoggerRecorder, DefaultSidecarRecorder, IEventRecorder };
