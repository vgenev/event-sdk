import { TraceTags, EventTraceMetadata, EventMessage, TypeSpanContext } from "./model/EventMessage";

import _ from 'lodash';

import { Span, ContextOptions, Recorders } from "./Span"

/**
 * Describes Event SDK methods from Tracer perspective
 */

abstract class ATracer {
  static createSpan: (service: string, tags?: TraceTags, recorders?: Recorders, defaultTagsSetter?: Span['defaultTagsSetter']) => Span
  static createChildSpanFromContext: (service: string, context: TypeSpanContext, recorders?: Recorders) => {}
  static injectContextToMessage: (context: TypeSpanContext, message: { [key: string]: any }, path?: string) => { [key: string]: any }
  static extractContextFromMessage: (message: { [key: string]: any }, path?: string) => TypeSpanContext
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
    let outputContext = <TypeSpanContext>Object.assign({}, spanContext, { service, spanId: undefined, parentSpanId: spanContext.spanId, startTimestamp: undefined })
    return new Span(new EventTraceMetadata(outputContext), recorders) as Span
  }

  /**
   * Injects trace context into a carrier with optional path.
   * @param context span context to be injected
   * @param carrier any kind of message or other object with keys of type String.
   * @param injectOptions type and path of the carrier. Type is not implemented yet. Path is the path to the trace context.
   */
  static injectContextToMessage(context: TypeSpanContext, carrier: { [key: string]: any }, injectOptions: ContextOptions = {}): Promise<{ [key: string]: any }> {
    let result = _.cloneDeep(carrier)
    let { path } = injectOptions // type not implemented yet
    if (carrier instanceof EventMessage || (('metadata' in carrier))) path = 'metadata'
    else if (carrier instanceof EventTraceMetadata) return Promise.resolve(context)
    if (!path) Object.assign(result, { trace: context })
    else _.merge(_.get(result, path), { trace: context })
    return Promise.resolve(result)
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
}

export {
  Tracer
}