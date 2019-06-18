"use strict";
const RC = require('rc')('EVENT_SDK', require('../../config/default.json'));
console.log('RC: ', JSON.stringify(RC, null, 2));
module.exports = {
    EVENT_LOGGER_SERVER_HOST: RC.SERVER_HOST,
    EVENT_LOGGER_SERVER_PORT: RC.SERVER_PORT
};
//# sourceMappingURL=config.js.map