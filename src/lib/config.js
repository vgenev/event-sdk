const RC = require('rc')('EVENT_SDK', require('../../config/default.json'))

module.exports = {
  EVENT_LOGGER_SERVER_HOST: RC.SERVER_HOST,
  EVENT_LOGGER_SERVER_PORT: RC.SERVER_PORT,
  SIDECAR_DISABLED: RC.DISABLE_SIDECAR
}
