// FIXME Refactor. Create class EventLoggingServiceClient which is an EventEmitter

const path = require('path')
let PROTO_PATH = path.join(__dirname, '../../protos/message_type.proto')
let grpc = require('grpc')
let protoLoader = require('@grpc/proto-loader')
// Suggested options for similarity to existing grpc.load behavior
let packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  { keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  })
let protoDescriptor = grpc.loadPackageDefinition(packageDefinition)
// The protoDescriptor object has the full package hierarchy
let EventLoggerService = protoDescriptor.mojaloop.events.EventLoggerService

function logEventReceived (call, callback) {
  let event = call.request
  // We're on plain JavaScript, so although this *should* be a EventMessage sin gRPC is typed, let's be sure
  if (!event.id) {
    callback(new Error(`Couldn't parse message parameter. It doesn't have an id property. parameter: ${event}`))
  }
  console.log('Server.logEvent: ', JSON.stringify(event, null, 2))

  // Convert content wich is an Struct to a plan object
  if (event.content) {
    event.content = structToJson(event.content.fields)
  }
  // Emit event
  console.log('Server.logEvent content parsed:: ', JSON.stringify(event, null, 2))

  // send response
  // FIXME WIP will return a success|error response. See proto file
  callback(null, event)
}

function protoValueToJs (val) {
  var kind = val.kind
  var value = val[kind]
  if (kind === 'listValue') { // FIXME not checked
    return value.values.map(function (value) {
      return protoValueToJs(value)
    })
  } else if (kind === 'structValue') {
    return structToJson(value.fields)
  } else {
    return value
  }
}

function structToJson (struct) {
  var result = {}
  Object.keys(struct).forEach(function (key) {
    result[key] = protoValueToJs(struct[key])
  })
  return result
}

function getServer () {
  var server = new grpc.Server()
  server.addService(EventLoggerService.service, {
    log: logEventReceived
  })
  return server
}

var routeServer = getServer()
routeServer.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure())
routeServer.start()
console.log('Server listening')
