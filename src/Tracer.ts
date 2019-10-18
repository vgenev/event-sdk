import { TraceTags, EventTraceMetadata, EventMessage, TypeSpanContext, HttpRequestOptions } from "./model/EventMessage";

import { Span, ContextOptions, Recorders, setHttpHeader } from "./Span"

const _ = require('lodash');

const TraceParent = require('traceparent')

/**
 * Describes Event SDK methods from Tracer perspective
 */

abstract class ATracer {
  static createSpan: (service: string, tags?: TraceTags, recorders?: Recorders, defaultTagsSetter?: Span['defaultTagsSetter']) => Span
  static createChildSpanFromContext: (service: string, context: TypeSpanContext, recorders?: Recorders) => {}
  static injectContextToMessage: (context: TypeSpanContext, message: { [key: string]: any }, path?: string) => { [key: string]: any }
  static injectContextToHttpRequest: (context: TypeSpanContext, request: { [key: string]: any }, type?: HttpRequestOptions) => { [key: string]: any }
  static extractContextFromMessage: (message: { [key: string]: any }, path?: string) => TypeSpanContext
  static extractContextFromHttpRequest: (request: any, type?: HttpRequestOptions) => TypeSpanContext | undefined
}

class Tracer implements ATracer {

  /**
   * Creates new span from new trace
   * @param service name of the service which will be asociated with the newly created span
   * @param tags optional tags for the span
   * @param recorders optional recorders. Defaults to defaultRecorder, which is either logger or sidecar client, based on default.json DISABLE_SIDECAR value
   * @param defaultTagsSetter optional default tags setter method.
   */
  static createSpan(service: string, tags?: TraceTags, recorders?: Recorders, defaultTagsSetter?: Span['defaultTagsSetter']): Span {
    return new Span(new EventTraceMetadata({ service, tags }), recorders, defaultTagsSetter)
  }

  /**
   * Creates new child span from context with new service name
   * @param service the name of the service of the new child span
   * @param spanContext context of the previous span
   * @param recorders optional recorders. Defaults to defaultRecorder, which is either logger or sidecar client, based on default.json DISABLE_SIDECAR value
   */
  static createChildSpanFromContext(service: string, spanContext: TypeSpanContext, recorders?: Recorders): Span {
    let outputContext = <TypeSpanContext>Object.assign({}, spanContext, {
      service,
      spanId: undefined,
      parentSpanId: spanContext.spanId,
      startTimestamp: undefined,
      finishTimestamp: undefined
    })
    return new Span(new EventTraceMetadata(outputContext), recorders) as Span
  }

  /**
   * Injects trace context into a carrier with optional path.
   * @param context span context to be injected
   * @param carrier any kind of message or other object with keys of type String.
   * @param injectOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
   */
  static injectContextToMessage(context: TypeSpanContext, carrier: { [key: string]: any }, injectOptions: ContextOptions = {}): { [key: string]: any } {
    let result = _.cloneDeep(carrier)
    let { path } = injectOptions // type not implemented yet
    if (carrier instanceof EventMessage || (('metadata' in carrier))) path = 'metadata'
    else if (carrier instanceof EventTraceMetadata) return Promise.resolve(context)
    if (!path) Object.assign(result, { trace: context })
    else _.merge(_.get(result, path), { trace: context })
    return result
  }
  /**
   * Injects trace context into a http request headers.
   * @param context span context to be injected
   * @param request HTTP request.
   * @param type type of the headers that will be created - 'w3c' or 'xb3'.
   */

  static injectContextToHttpRequest(context: TypeSpanContext, request: { [key: string]: any }, type: HttpRequestOptions = HttpRequestOptions.w3c): { [key: string]: any } {
    let result = _.cloneDeep(request)
    result.headers = setHttpHeader(context, type, result.headers)
    return result
  }

  /**
   * Extracts trace context from a carrier (ex: kafka message, event message, metadata, trace)
   * with optional path for the trace context to be extracted.
   * @param carrier any kind of message or other object with keys of type String.
   * @param extractOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
   */
  static extractContextFromMessage(carrier: { [key: string]: any }, extractOptions: ContextOptions = {}): TypeSpanContext {
    let spanContext
    let { path } = extractOptions // type not implemented yet
    if (carrier instanceof EventMessage || (('metadata' in carrier) && 'trace' in carrier.metadata)) {
      path = 'metadata.trace'
    } else if ('trace' in carrier) {
      path = 'trace'
    }
    spanContext = new EventTraceMetadata(<TypeSpanContext>_.get(carrier, path!, carrier))
    return <TypeSpanContext>spanContext
  }

  static extractContextFromHttpRequest(request: { [key: string] : any }, type: HttpRequestOptions = HttpRequestOptions.w3c): TypeSpanContext | undefined {
    let spanContext
    switch (type) {
      case HttpRequestOptions.xb3: {
        let result:{ [key: string]: string } = {}
        const requestHasXB3headers = !!request.headers && Object.keys(request.headers).some(key => !!key.toLowerCase().match(/x-b3-/))
        if (!requestHasXB3headers) return undefined
        for (let [ key, value ] of Object.entries(request.headers)) {
          let keyLowerCase = key.toLowerCase()
          if (keyLowerCase.startsWith('x-b3-')) {
            let resultKey: string = key.replace('x-b3-', '')
            result[resultKey] = <string>value
          }
        }
        spanContext = new EventTraceMetadata(result)
        return <TypeSpanContext>spanContext
      }
      case HttpRequestOptions.w3c:
      default: {
        if (!request.headers || !request.headers.traceparent) return undefined
        let context = TraceParent.fromString(request.headers.traceparent)
        let sampled: number = context.flags ? context.flags & 0x01 : 0
        spanContext = new EventTraceMetadata({
          traceId: context.traceId,
          spanId: context.id,
          flags: context.flags,
          parentSpanId: context.parentId,
          sampled: sampled
        })
        return <TypeSpanContext>spanContext
      }
    }
  }

}

export {
  Tracer
}