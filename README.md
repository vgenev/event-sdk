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

## Usage


Import library:

```javascript
import { DefaultEventLogger } from "../DefaultEventLogger"`
```

Create a Logger:

```javascript
const logger = new DefaultEventLogger()`
```

Send an `EventMessage`

```javascript
let result = await logger.log(event);
```

