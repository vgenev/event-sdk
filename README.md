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
| `EVENT_SDK_VENDOR_PREFIX` | Prefix for vendor specific tracestate handler. More info [here](##event-sdk-host-service-configuration) | `acmevendor` | Any string |
| `EVENT_SDK_TRACESTATE_HEADER_ENABLED` | If enabled, the tracestate value is kept updated with every child span. Else is only updated if the request be modified has `tracestate` header. More info [here](#event-sdk-host-service-configuration) || `false` | `true`, `false` |
| `EVENT_SDK_TRACEID_PER_VENDOR` | Make *true* only if you want to differentiate traceIds per vendor or want to isolate services. More info [here](##event-sdk-host-service-configuration). | `false` | `true`, `false` |

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
| span | trace | Used to create trace event. These events sent with `span.finish()` method and are used for **traceability** |

## Usage
Instrumented services should be part of a configuration which includes the [event sidecar](https://github.com/mojaloop/event-sidecar) and [event-streaming-processor](https://github.com/mojaloop/event-streaming-processor). Detailed architecture overview can be found [here](https://mojaloop.io/documentation/mojaloop-technical-overview/event-framework/)

## W3C Trace headers handling

W3C headers are used and should be used as per [W3C Recommendation](https://www.w3.org/TR/trace-context/).
If Event SDK is used for tracing, you can follow these [suggestions](#create-trace-headers-using-event-sdk)

### Event SDK host service configuration

1. How the trace headers will be handled across the services depends on the [configuration](#configuration) of 3 variables:
   * **EVENT_SDK_VENDOR_PREFIX** - sets the vendor name for the tracestate header. If the configured vendor is one of the vendors in the incoming header, the tracestate value of the vendor is updated. If its not present, the vendor information is added.
   * **EVENT_SDK_TRACESTATE_HEADER_ENABLED** - If enabled (*true*), the tracestates value is kept updated with every child span and is inserted into the span tags, as well. If not enabled (*false*), the tracestate is only updated or created if `injectContextToHttpRequest` is called and the `tracestate` is included into the updated request headers
   * **EVENT_SDK_TRACEID_PER_VENDOR** - When vendor of the parent span is different from the vendor set by EVENT_SDK_VENDOR_PREFIX the traceId will be new and the parent traceId will be stored as a tag: `corelationTraceId` . Otherwise, the traceId is persisted. Make *true* only if you want to differentiate traceIds per vendor or want to isolate services traces. *not tested thoroughly*

### Tracestate format
Tracestate header can be used to preserve vendor specific information across various connected systems in multivendor setup. The  format is according to the [w3c specifications](https://www.w3.org/TR/trace-context/#tracestate-header).

_Note: From version [v9.4.1](https://github.com/mojaloop/event-sdk/releases/tag/v9.4.1)Event SDK support tags in the tracestate value. Since [v9.5.2](https://github.com/mojaloop/event-sdk/releases/tag/v9.5.2) tracestate is base64 encoded string. To be able to use the tracestate correctly accross all services, they should have same version of event-sdk and [central-services-shared](https://github.com/mojaloop/central-services-shared) librarires._


Tracestate header example value: `acmevendor=eyJzcGFuSWQiOiI2Njg2Nzk1MDBiMGUzYzQwIiwgInRyYW5zZmVyX3R4X21zOjE1OTA0MDc0NjUifQ==`, where the vendor is `acmevendor` and the value is base64 encoded key value pair as `spanId` key is set automatically. When decoded:  `{"spanId":"668679500b0e3c40", "transfer_tx_ms:1590407465"}`

### Methods to access the tracestate and tags:
*Note: tracestate is also a key in the trace tags*

* setTracestateTags - sets user tags into the tracestate
* getTracestates - Returns the tracestates object per vendor, as configured vendor tracestate is decoded key value pair with tags
* getTracestateTags - Returns the tracestate tags for the configured vendor as key value pairs

Examples of usage of the SDK can be found at `src/examples`:
  * [Javascript example](src/examples/js_app.js) 
  * [TypeScript example](src/examples/ts_app.ts)

### Create trace headers using Event SDK

Trace headers are injected into request from a span.

1. A span can either be from new trace, or a child of a previous span from existing trace.

Examples:

* Creating a new span
   ```js
    const { Tracer } = require('../../dist/index')

    const parentSpan = Tracer.createSpan('parent service') // creates new trace with first span
    const ChildSpan = parentSpan.getChild('child service') // creates child of an existing span
  ```

* If the parent span is from another service, the child should be created from the context of the parent span either from http request or a message:

  ```js
  const request = {
  headers: {
    traceparent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
    tracestate: 'acmevendor=eyJzcGFuSWQiOiIyMDNmODljMjM3NDhjZmIxIiwidGltZUFwaVByZXBhcmUiOiIyMjgzMjMyIiwidGltZUFwaUZ1bGZpbCI6IjI4MjMyMjMyIn0'
    }
  } // A request object with nested headers object. If the incoming request is with another structure, this won't work correctly.

  const parentContext = Tracer.extractContextFromHttpRequest(request)
  const childSpan = Tracer.createChildSpanFromContext('child service', parentContext)

  const message = {
    "id": "aa398930-f210-4dcd-8af0-7c769cea1660",
    "content": {
      "headers": {
        "content-type": "application/vnd.interoperability.transfers+json;version=1.0",
        "date": "2019-05-28T16:34:41.000Z",
      },
      "payload": "data:application/vnd.interoperability.transfers+json;version=1.0;base64,SVRURUQiCn0"
    },
    "type": "application/json",
    "trace": {
      "startTimestamp": "2020-06-02T11:58:30.947Z",
      "service": "child fin service",
      "traceId": "220be0d853ee5aa10efbbb9605be712d",
      "spanId": "2c4115ce9a5caa0c",
      "parentSpanId": "3726ad458761fdda",
      "tags": {
        "tracestate": "acmevendor=eyJzcGFuSWQiOiIyYzQxMTVjZTlhNWNhYTBjIn0="
      },
      "tracestates": {
        "acmevendor": {
          "spanId": "2c4115ce9a5caa0c"
        }
      }
    }
  }

  const anotherChildSpan = Tracer.extractContextFromMessage(message)
  ```

  2. When the span is created as a new trace or as a child of a parent, before sending out HTTP request, the traceparent and tracestate headers

  ```js
  
  const parentSpan = Tracer.createSpan('parent service') // creates new trace with first span

  const outgoingRequest = {
    headers: {
      host: 'localhost:4000',
      'user-agent': 'curl/7.59.0',
      accept: '*/*'
    }
  }

  const requestWithTrace = await parentSpan.injectContextToHttpRequest(outgoingRequest)

  // send the requestWithTrace now
  ```
