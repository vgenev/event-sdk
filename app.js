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
  traceContext.setService('service 2')
  let child = logger.createNewSpan()
  console.log(JSON.stringify(child, null, 2), '\n = child =============\n')
  let newMessage = await logger.injectSpan(message)
  console.log(JSON.stringify(newMessage, null, 2), '\n = injected ==============\n')
  // await logger.record(newMessage)
  let extracted = await logger.extractSpan(newMessage)
  console.log(JSON.stringify(extracted, null, 2), '\n= extracted =============\n')
  extracted.setService('service 3')
  let final = logger.createNewSpan(extracted)
  console.log(JSON.stringify(final, null, 2), '\n= final =============\n')
  await logger.trace(extracted)
}

main()
