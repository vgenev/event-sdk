# event-sdk

**EXPERIMENTAL** Event SDK for Clients &amp; Server implementations


[![Git Commit](https://img.shields.io/github/last-commit/mojaloop/event-sdk.svg?style=flat)](https://github.com/mojaloop/event-sdk/commits/master)
[![Git Releases](https://img.shields.io/github/release/mojaloop/event-sdk.svg?style=flat)](https://github.com/mojaloop/event-sdk/releases)
[![Npm Version](https://img.shields.io/npm/v/@mojaloop/event-sdk.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/event-sdk)
[![NPM Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@mojaloop/event-sdk.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/event-sdk)
[![CircleCI](https://circleci.com/gh/mojaloop/event-sdk.svg?style=svg)](https://circleci.com/gh/mojaloop/event-sdk)

Mojaloop Event SDK provides a simple API to log different kind of messages ( trace, log, error, audit ) and publish them to a central logging infrastructure. 

The API is defined by the `EventRecorder` interface and the `EventMessage` type.
This library provides the following recorder implementations by default:

| Recorder | Behaviour |
| - | - |
| `DefaultLoggerRecorder` | Logs events to console | 
| `DefaultSidecarRecorder` | Logs events to [sidecar](https://github.com/mojaloop/event-sidecar) synchronously | 
| `DefaultSidecarRecorderAsync` | Logs events to [sidecar](https://github.com/mojaloop/event-sidecar) asynchronously |

The logging behaviour can be modified as defined in the interfaces `EventPreProcessor` and `EventPostProcessor` which allow to use an `EventRecorder` that processes `EventMessage`s before sending them and its response, respectively.

## Installation

```bash
npm install @mojaloop/event-sdk
```

## Configuration

Edit the file in `./config/default.json` to configure the logger, or set the following Environment variables:

| Environment variable | Description | Default | Available Values |
| --- | --- | --- | --- |
| `EVENT_SDK_ASYNC_OVERRIDE_EVENTS` | A comma-separated list of events that should return immediately instead of waiting for the promises to resolve in the `recorder.record()` function. | `''` | Any combination of: `log,audit,trace` |
|`EVENT_SDK_LOG_FILTER` | Comma deliminated List of `<eventType>`:`<eventAction>` key pairs that will be logged to the host console, as well as sent to the sidecar. Note `*:*` wildcard entry will print all logs, and if this field is empty ` ` then no logs will be printed. See [Current Supported Events](#current-supported-events) | `audit:*`, `log:info`, `log:error`, `log:warning` | `audit:*`, `log:info`, `log:error` |
|`EVENT_SDK_LOG_METADATA_ONLY` | This flag will only print the metadata portion of the event message, and exclude the content to minimise log verbosity. | `false` | `true`, `false` |
| `EVENT_SDK_SERVER_HOST` | The hostname for the gRPC server to bind to. | `localhost` | Any valid hostname |
| `EVENT_SDK_SERVER_PORT` | The port for the gRPC server to listen on. | `50055` | Any valid port value |
| `EVENT_SDK_SIDECAR_DISABLED` | Enables or disables the logging to event sidecar. | `true` | `true`, `false` |
| ~~`EVENT_SDK_SIDECAR_WITH_LOGGER`~~ | _DEPRECATED BY `EVENT_SDK_LOG_FILTER`_ - If true, the events will be logged to the host console, as well as sent to the sidecar. Only applicable if the event sidecar is enabled. | `false` | `true`, `false` |
| `EVENT_SDK_VENDOR_PREFIX` | Prefix for vendor specific tracestate handler. For more information refer to [w3c spec](https://github.com/w3c/trace-context/blob/master/spec/20-http_header_format.md#tracestate-header) | `acmevendor` | Any string |
| `EVENT_SDK_TRACESTATE_HEADER_ENABLED` | If enabled, the tracestate value is kept updated with every child and is inserted into the span tags. Otherwise, the tracestate is only updated if `injectContextToHttpRequest` is called and the `tracestate` is included into the request headers. | `false` | `true`, `false` |
| `EVENT_SDK_TRACEID_PER_VENDOR` | If enabled, when vendor of the parent span is different from the vendor set by `EVENT_SDK_VENDOR_PREFIX` the traceId will be new and the parent traceId will be stored as a tag: `corelationTraceId` . Otherwise, the traceId is persisted. | `false` | `true`, `false` |

## Current Supported Events

| eventType | eventAction | Description |
| --- | --- | --- |
| audit | default | Default audit action. Used when no action has been specified |
| audit | start | Used to create start audit event |
| audit | ingress | Used to create ingress audit event |
| audit | egress | Used to create egress audit event |
| audit | finish | Used to create finish audit event |
| log | info | Info log level |
| log | debug | Debug log level |
| log | error | Error log level |
| log | verbose | Verbose log level |
| log | warning | Warning log level |
| log | performance | Performance log level |
| span | trace | Used to create trace event. These events sent with `span.finish()` method and are used for traceability |

## Usage

Instrumented services should be part of a configuration which includes the [event sidecar](https://github.com/mojaloop/event-sidecar) and [event-streaming-processor](https://github.com/mojaloop/event-streaming-processor). Detailed architecture overview can be found [here](https://mojaloop.io/documentation/mojaloop-technical-overview/event-framework/)

Examples of usage of the SDK can be found in the `src/examples` directory of this repo: [Javascript example](src/examples/js_app.js) and [TypeScript example](src/examples/ts_app.ts).