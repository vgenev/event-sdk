import { NullEventAction, EventType, LogEventAction, LogResponseStatus, TypeEventTypeAction, EventMessage } from "./model/EventMessage";
import { EventLoggingServiceClient } from "./transport/EventLoggingServiceClient";

const Logger = require('@mojaloop/central-services-shared').Logger

interface IEventRecorder {
  recorder: EventLoggingServiceClient | Function
  preProcess: (event: EventMessage) => EventMessage
  postProcess: (result: any) => any
  record: (event: EventMessage) => Promise<any>
}

class DefaultLoggerRecorder implements IEventRecorder {
  recorder: Function = Logger

  preProcess = (event: EventMessage): EventMessage => {
    return event
  }

  postProcess = (result: any): any => {
    return result
  }

  async record(event: EventMessage): Promise<any> {
    let updatedEvent = this.preProcess(event)
    let result = await this._log(updatedEvent)
    return this.postProcess(result)
  }

  private async _log (message: EventMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        let type: TypeEventTypeAction['type']
        let action: TypeEventTypeAction['action']
        if (message.metadata && message.metadata.event) {
          type = message.metadata.event.type || EventType.undefined
          action = message.metadata.event.action || NullEventAction.undefined
        } else {
          type = EventType.log
          action = LogEventAction.info
        }
        let result
        if (type === EventType.log && Object.values(LogEventAction).includes(action)) 
          result = Logger.log(action, JSON.stringify(message, null, 2))
        else if (type === EventType.audit || type === EventType.trace) 
          result = Logger.log(type, JSON.stringify(message, null, 2))
        else result = Logger.error('The event message is not following the format')  
          let status = !result.exitOnError ? LogResponseStatus.accepted : LogResponseStatus.error
        resolve({ status })
      } catch(e) {
        reject(e)
      }
    })
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

  async record(event: EventMessage): Promise<any> {
    let updatedEvent = this.preProcess(event)
    let result = await this.recorder.log(updatedEvent)
      return this.postProcess(result)
  }
}

export {
  DefaultLoggerRecorder,
  DefaultSidecarRecorder,
  IEventRecorder
}
