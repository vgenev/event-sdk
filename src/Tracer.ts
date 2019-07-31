import { TraceTags, EventTraceMetadata, EventMessage, TypeSpanContext } from "./model/EventMessage";

import { getNestedObject } from "./lib/util";

import { Span, ContextOptions, Recorders } from "./Span"

abstract class ATracer { // TODO consider should we move those to index.js for the API
  static createSpan: (service: string, tags?: TraceTags, recorders?: Recorders, defaultTagsSetter?: Span['defaultTagsSetter']) => Span
  static createChildSpanFromContext: (service: string, context: TypeSpanContext, recorders?: Recorders) => {}
  static injectContextToMessage: (context: TypeSpanContext, message: { [key: string]: any }, path?: string) => { [key: string]: any }
  static extractContextFromMessage: (message: { [key: string]: any }, path?: string) => TypeSpanContext
}

class Tracer implements ATracer {

  static createSpan(service: string, tags?: TraceTags, recorders?: Recorders, defaultTagsSetter?: Span['defaultTagsSetter']): Span {
    return new Span(new EventTraceMetadata({ service, tags }), recorders, defaultTagsSetter)
  }

  /**
   * Creates new child span from context with new service name
   * @param service the name of the service of the new child span
   * @param spanContext context of the previous span
   */
  static createChildSpanFromContext(service: string, spanContext: TypeSpanContext, recorders?: Recorders): Span {
    let outputContext = <TypeSpanContext>Object.assign({}, spanContext, { service, spanId: undefined, parentSpanId: spanContext.spanId, startTimestamp: undefined })
    return new Span(new EventTraceMetadata(outputContext), recorders) as Span
  }

  /**
   * Injects trace context into a carrier with optional path.
   * @param carrier any kind of message or other object with keys of type String.
   * @param injectOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
   */
  static injectContextToMessage(context: TypeSpanContext, carrier: { [key: string]: any }, injectOptions: ContextOptions = {}): Promise<{ [key: string]: any }> {
    let result = carrier
    let { path } = injectOptions // type not implemented yet
    if (carrier instanceof EventMessage || (('metadata' in carrier))) path = 'metadata.trace'
    else if (('trace' in carrier)) path = 'trace'
    else if (carrier instanceof EventTraceMetadata) return Promise.resolve(context)
    if (path) {
      let pathArray: string[] = path.split('.')
      for (let i = 0; i < pathArray.length - 1; i++) {
        if (!result[pathArray[i]]) {
          if (i < pathArray.length) {
            let o: any = {}
            o[pathArray[i + 1]] = {}
            result[pathArray[i]] = o
          }
        }
        result = result[pathArray[i]]
      }
    }
    result.trace = context
    return Promise.resolve(carrier)
  }

  /**
   * Extracts trace context from a carrier (ex: kafka message, event message, metadata, trace)
   * with optional path for the trace context to be extracted.
   * @param carrier any kind of message or other object with keys of type String.
   * @param extractOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
   */
  static extractContextFromMessage(message: { [key: string]: any }, extractOptions: ContextOptions = {}): TypeSpanContext {
    let spanContext
    let { path } = extractOptions // type not implemented yet
    if (message instanceof EventMessage || (('metadata' in message) && 'trace' in message.metadata)) {
      path = 'metadata.trace'
    } else if ('trace' in message) {
      path = 'trace'
    }
    spanContext = new EventTraceMetadata(<TypeSpanContext>getNestedObject(message, path))
    return <TypeSpanContext>spanContext
  }
}

export {
  Tracer
}