const { Tracer } = require('./lib/Tracer')

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

const main = async () => {
  let parentSpan = Tracer.createSpan('service 1')
  await parentSpan.info('parentSpan')
  let IIChildSpan = parentSpan.getChild('service 2')
  await IIChildSpan.audit({ content: message })
  IIChildSpan.setTags({ one: 'two' })
  let messageWithContext = await IIChildSpan.injectContextToMessage(message)
  await parentSpan.finish()
  let contextFromMessage = Tracer.extractContextFromMessage(messageWithContext)
  let ChildTheIII = Tracer.createChildSpanFromContext('service 4', contextFromMessage)
  ChildTheIII.trace()
}

main()
