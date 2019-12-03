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

 * ModusBox
 - Ramiro González Maciel <ramiro@modusbox.com>

 * Crosslake
 - Lewis Daly <lewisd@crosslaketech.com>

 --------------
 ******/

import { DefaultLoggerRecorder, DefaultSidecarRecorderAsync, DefaultSidecarRecorder } from "../../src/Recorder"
import * as EventSdk from "../../src/index"
import { EventLoggingServiceClient } from "../../src/transport/EventLoggingServiceClient";

describe('Recorder', () => {
  it('records a message with the DefaultLoggerRecorder', async () => {
    // Arrange
    const message = {
      id: "xyz1234",
      to: "DFSP1",
      from: "DFSP1",
      type: 'application/json',
      content: {
        headers: {},
        payload: "http://example.com/v1/go"
      }
    }
    const recorder = new DefaultLoggerRecorder()

    // Act
    const result = await recorder.record(message)
    // defaultRecorder = recorder
    // Assert
    expect(result).toStrictEqual({ status: 'accepted' })
  })

  it('records a message with the DefaultSidecarRecorderAsync', async () => {
    // Arrange
    const message = {
      id: "xyz1234",
      to: "DFSP1",
      from: "DFSP1",
      type: 'application/json',
      content: {
        headers: {},
        payload: "http://example.com/v1/go"
      },
      metadata: {
        event: {
          type: EventSdk.EventType.log,
          action: EventSdk.LogEventAction.warning,
          state: {
            status: EventSdk.EventStatusType.success
          }
        }
      }
    }

    const configWithSidecar = {
      EVENT_LOGGER_SIDECAR_DISABLED: true,
      EVENT_LOGGER_SERVER_HOST: 'localhost',
      EVENT_LOGGER_SERVER_PORT: 50051
    }
    jest.mock('../../src/transport/EventLoggingServiceClient', () => {
      return jest.fn().mockImplementation(() => {
        return { log: () => { }, grpcClient: () => { } };
      })
    })

    const grpcClient = new EventLoggingServiceClient(configWithSidecar.EVENT_LOGGER_SERVER_HOST, configWithSidecar.EVENT_LOGGER_SERVER_PORT)
    jest.spyOn(grpcClient.grpcClient, 'log').mockImplementation((wireEvent: any, cb: any) => {
      return cb(null, new EventSdk.LogResponse(EventSdk.LogResponseStatus.accepted))
    })

    const recorder = new DefaultSidecarRecorderAsync(grpcClient)

    // Act
    const result = await recorder.record(message)

    // Assert
    expect(grpcClient.grpcClient.log).toHaveBeenCalled();
    expect(result).toEqual(<EventSdk.LogResponse>{ status: 'accepted' })
  })

  it('records a message with the DefaultSidecarRecorderAsync', async () => {
    // Arrange
    const message = {
      id: "xyz1234",
      to: "DFSP1",
      from: "DFSP1",
      type: 'application/json',
      content: {
        headers: {},
        payload: "http://example.com/v1/go"
      },
      metadata: {
        event: {
          type: EventSdk.EventType.audit,
          action: EventSdk.AuditEventAction.default,
          state: {
            status: EventSdk.EventStatusType.success
          }
        }
      }
    }

    const configWithSidecar = {
      EVENT_LOGGER_SIDECAR_DISABLED: true,
      EVENT_LOGGER_SERVER_HOST: 'localhost',
      EVENT_LOGGER_SERVER_PORT: 50051
    }
    jest.mock('../../src/transport/EventLoggingServiceClient', () => {
      return jest.fn().mockImplementation(() => {
        return { log: () => { }, grpcClient: () => { } };
      })
    })

    const grpcClient = new EventLoggingServiceClient(configWithSidecar.EVENT_LOGGER_SERVER_HOST, configWithSidecar.EVENT_LOGGER_SERVER_PORT)
    jest.spyOn(grpcClient.grpcClient, 'log').mockImplementation((wireEvent: any, cb: any) => {
      return cb(null, new EventSdk.LogResponse(EventSdk.LogResponseStatus.accepted))
    })

    const recorder = new DefaultSidecarRecorderAsync(grpcClient)

    // Act
    const result = await recorder.record(message, true, () => {})

    // Assert
    expect(grpcClient.grpcClient.log).toHaveBeenCalled();
    expect(result).resolves
  })

  it('records a message with the DefaultSidecarRecorderAsync', async () => {
    // Arrange
    const message = {
      id: "xyz1234",
      to: "DFSP1",
      from: "DFSP1",
      type: 'application/json',
      content: {
        headers: {},
        payload: "http://example.com/v1/go"
      },
      metadata: {
        event: {
          type: EventSdk.EventType.audit,
          action: EventSdk.AuditEventAction.default,
          state: {
            status: EventSdk.EventStatusType.success
          }
        }
      }
    }

    const configWithSidecar = {
      EVENT_LOGGER_SIDECAR_DISABLED: true,
      EVENT_LOGGER_SERVER_HOST: 'localhost',
      EVENT_LOGGER_SERVER_PORT: 50051
    }
    jest.mock('../../src/transport/EventLoggingServiceClient', () => {
      return jest.fn().mockImplementation(() => {
        return { log: () => { }, grpcClient: () => { } };
      })
    })

    const grpcClient = new EventLoggingServiceClient(configWithSidecar.EVENT_LOGGER_SERVER_HOST, configWithSidecar.EVENT_LOGGER_SERVER_PORT)
    jest.spyOn(grpcClient.grpcClient, 'log').mockImplementation((wireEvent: any, cb: any) => {
      return cb(null, new EventSdk.LogResponse(EventSdk.LogResponseStatus.accepted))
    })

    const recorder = new DefaultSidecarRecorderAsync(grpcClient)

    // Act
    const result = await recorder.record(message)

    // Assert
    expect(grpcClient.grpcClient.log).toHaveBeenCalled();
    expect(result).resolves
  })

})