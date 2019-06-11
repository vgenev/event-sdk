const path = require('path')
let PROTO_PATH = path.join(__dirname, '../protos/message_type.proto')
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
let EventLogger = protoDescriptor.mojaloop.events.EventLogger
console.log(EventLogger)

function logEvent (call, callback) {
  let event = call.request
  console.log('Server.logEvent: ', JSON.stringify(event, null, 2));
  callback(null, event)
}
function getServer () {
  var server = new grpc.Server()
  server.addProtoService(EventLogger.service, {
    log: logEvent
  })
  return server
}
var routeServer = getServer()
routeServer.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure())
routeServer.start()
