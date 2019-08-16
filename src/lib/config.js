const RC = require('parse-strings-in-object')(require('rc')('EVENT_SDK', require('../../config/default.json')))

module.exports = {
  EVENT_LOGGER_SERVER_HOST: RC.SERVER_HOST,
  EVENT_LOGGER_SERVER_PORT: RC.SERVER_PORT,
  EVENT_LOGGER_SIDECAR_DISABLED: RC.DISABLE_SIDECAR
}
