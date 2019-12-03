# event-sdk

**EXPERIMENTAL** Event SDK for Clients &amp; Server implementations


[![Git Commit](https://img.shields.io/github/last-commit/mojaloop/event-sdk.svg?style=flat)](https://github.com/mojaloop/event-sdk/commits/master)
[![Git Releases](https://img.shields.io/github/release/mojaloop/event-sdk.svg?style=flat)](https://github.com/mojaloop/event-sdk/releases)
[![Npm Version](https://img.shields.io/npm/v/@mojaloop/event-sdk.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/event-sdk)
[![NPM Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@mojaloop/event-sdk.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/event-sdk)
[![CircleCI](https://circleci.com/gh/mojaloop/event-sdk.svg?style=svg)](https://circleci.com/gh/mojaloop/event-sdk)

Mojaloop Event SDK provides a simple API to log different kind of messages ( trace, log, error, audit ) and publish them to a central logging infrastructure. 

The API is defined by the `EventLogger` interface and the `EventMessage` type. This library provides a default implementation `DefaultEventLogger` which sends all the messages to a logging sidecar.

The logging behaviour can be modified as defined in the interfaces `EventPreProcessor` and `EventPostProcessor` which allow to use an `EventLogger` that processes `EventMessage`s before sending them and its response, respectively.

## Installation

```bash
npm install @mojaloop/event-sdk
```

## Configuration

Edit the file in `./config/default.json` to configure the logger, or set the following Environment variables:

| Environment variable | Description | Default | Available Values |
| --- | --- | --- | --- |
| `EVENT_SDK_ASYNC_OVERRIDE` | If `true`, logging calls will return immediately, without waiting for the `recorder.record()` function to resolve. | `false` | `true`, `false` |
| `EVENT_SDK_SERVER_HOST` | The hostname for the gRPC server to bind to. | `localhost` | Any valid hostname |
| `EVENT_SDK_SERVER_PORT` | The port for the gRPC server to listen on. | `50055` | Any valid port value |
| `EVENT_SDK_SIDECAR_DISABLED` | Enables or disables the event sidecar. If disabled, the events will be logged to the host console only. | `true` | `true`, `false` |
| `EVENT_SDK_SIDECAR_WITH_LOGGER` | If true, the events will be logged to the host console, as well as sent to the sidecar. Only applicable if the event sidecar is enabled. | `false` | `true`, `false` |
| `EVENT_SDK_VENDOR_PREFIX` | Prefix for vendor specific tracestate handler. For more information refer to [w3c spec](https://github.com/w3c/trace-context/blob/master/spec/20-http_header_format.md#tracestate-header) | `acmevendor` | Any string |

## Usage


Import library:

```javascript
import { DefaultEventLogger } from "@mojaloop/event-sdk"`
```

Create a Logger:

```javascript
const logger = new DefaultEventLogger()`
```

Send an `EventMessage`

```javascript
let result = await logger.log(event);
```

