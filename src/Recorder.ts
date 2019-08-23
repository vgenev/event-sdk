import { EventType, LogEventAction, LogResponseStatus, TypeEventTypeAction, EventMessage } from "./model/EventMessage";
import { EventLoggingServiceClient } from "./transport/EventLoggingServiceClient";

const Logger = require('@mojaloop/central-services-shared').Logger

/**
 * Describes Event Recorder interface
 * @param recorder instance of EventLogingServiceClient or another recorder
 * @param preProcess preprocessing method with null implementation in the current release
 * @param postProcess postprocessing method with null implementation in the current release
 * @param record the method that records the event depending on the recorder implementation
 */

interface IEventRecorder {
  recorder: EventLoggingServiceClient | Function
  preProcess: (event: EventMessage) => EventMessage
  postProcess?: (result: any) => any
  record: (event: EventMessage, doLog?: boolean, callback?: (result: any) => void ) => Promise<any>
}

const logWithLevel = async (message: EventMessage): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      let type: TypeEventTypeAction['type']
      let action: TypeEventTypeAction['action']
      if (message.metadata && message.metadata.event) {
        type = message.metadata.event.type!
        action = message.metadata.event.action!
      } else {
        type = EventType.log
        action = LogEventAction.info
      }
      if (type === EventType.log && Object.values(LogEventAction).includes(action)) 
        Logger.log(action, JSON.stringify(message, null, 2))
      else 
        Logger.log(type, JSON.stringify(message, null, 2))
      resolve({ status: LogResponseStatus.accepted })
    } catch(e) {
      reject({status: LogResponseStatus.error, error: e})
    }
  })
}


class DefaultLoggerRecorder implements IEventRecorder {
  recorder: Function

  constructor(recorder?: EventLoggingServiceClient) {
    this.recorder = recorder ? recorder : Logger
    return this
  }

  preProcess = (event: EventMessage): EventMessage => {
    return event
  }

  postProcess = (result: any): any => {
    return result
  }

  async record(event: EventMessage): Promise<any> {
    let updatedEvent = this.preProcess(event)
    let result = await logWithLevel(updatedEvent)
    return this.postProcess(result)
  }
}

class DefaultSidecarRecorder implements IEventRecorder {
  recorder: EventLoggingServiceClient

  constructor(recorder: EventLoggingServiceClient) {
    this.recorder = recorder
    return this
  }

  preProcess = (event: EventMessage): EventMessage => {
    return event
  }

  postProcess = (result: any): any => {
    return result
  }

  async record(event: EventMessage, doLog: boolean = true): Promise<any> {
    doLog && await logWithLevel(event)
    let updatedEvent = this.preProcess(event)
    let result = await this.recorder.log(updatedEvent)
      return this.postProcess(result)
  }
}

class DefaultSidecarRecorderAsync implements IEventRecorder {
  recorder: EventLoggingServiceClient

  constructor(recorder: EventLoggingServiceClient) {
    this.recorder = recorder
    return this
  }

  preProcess = (event: EventMessage): EventMessage => {
    return event
  }

  async record(event: EventMessage, doLog: boolean = true, callback?: (result: any) => void): Promise<any> {
    doLog && logWithLevel(event)
    let updatedEvent = this.preProcess(event)
    let result = this.recorder.log(updatedEvent)
    if (callback) {
      return callback(result)
    } else {
      return result
    }
  }
}

export {
  DefaultLoggerRecorder,
  DefaultSidecarRecorder,
  DefaultSidecarRecorderAsync,
  IEventRecorder
}
