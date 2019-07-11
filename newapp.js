const { Trace } = require('./lib/Trace')

let message = {
  type: 'test',
  content: {
    header: 'jeader', payload: 'payload'
  },
  metadata: {
    event: {
      a: '1'
    },
    trace: {}
  },
  from: 'd',
  to: 'f',
  pp: ''
}

const log = (message) => console.log(JSON.stringify(message, null, 2))

const anotherMain = async () => {
  let parentSpan = Trace.createSpan('service 1')
  log(parentSpan)
  parentSpan._traceContext.traceId = 'v'
  parentSpan.traceId = 'v'
  // parentSpan.info('something')
  // let childSpan = Trace.createSpan('service 2', parentSpan) // !no!
  let childChildSpan = parentSpan.getChild('service 2')
  log(childChildSpan)
  let childIIContext = childChildSpan.getContext()
  log(childIIContext)
  childChildSpan.setTags({ one: 'two' })
  let messageWithContext = await childChildSpan.injectContextToMessage(message)
  log(messageWithContext)
  parentSpan.finish()
  log(parentSpan)
  // new service
  let contextFromMessage = Trace.extractContextFromMessage(messageWithContext)
  log(contextFromMessage)
  // let excistingParentSpan = Trace.extractSpanFromContext(contextFromMessage) //its not possible
  // let childTheIII = excistingParentSpan.getChild('service 3') // not possible

  let ChildTheIII = Trace.createChildSpanFromContext('service 4', contextFromMessage)
  log(ChildTheIII)
  log(ChildTheIII.getContext())
  // what to do if no span is active
  // create span with service name =
  //

  // excistingSpanFromContext.info() -> should error
  // childSpan.info()
  // await childSpan.audit()
  // childSpan.finish() -> trace

  // childSpan.info() // should throw
}

anotherMain()
