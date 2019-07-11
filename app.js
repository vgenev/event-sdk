// const { DefaultEventLogger } = require('./lib/DefaultEventLogger')
// const EventSDK = require('./lib/index')
const { logger } = require('./lib/index')
// let logger = new DefaultEventLogger()

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
  let traceContext = logger.createNewSpan('service 1')
  traceContext.setTags({ tag: 'value' })
  console.log(JSON.stringify(traceContext, null, 2), '\n= no 1 ==============\n')
  // await logger.trace()
  traceContext.setService('service 2') // no if new service should be new child span
  let child = logger.createNewSpan({}) // !no!
  console.log(JSON.stringify(child, null, 2), '\n = child =============\n')
  let newMessage = await logger.injectSpan(message, traceContext)
  console.log(JSON.stringify(newMessage, null, 2), '\n = injected ==============\n')
  // await logger.record(newMessage)
  let extracted = await logger.extractSpan(newMessage)
  console.log(JSON.stringify(extracted, null, 2), '\n= extracted =============\n')
  let postExtracted = logger.createNewSpan()
  console.log(JSON.stringify(postExtracted, null, 2), '\n= post extracted =============\n')
  postExtracted.setService('service 3')
  let final = logger.createNewSpan(postExtracted)
  console.log(JSON.stringify(final, null, 2), '\n= final =============\n')
  await logger.trace(final)
}

main()
