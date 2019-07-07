"use strict";
/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Ramiro González Maciel <ramiro@modusbox.com>

 --------------
 ******/
/**
 * Example showing how to use EventLogger from JavaScript, taken from
 * ml-api-adapter/src/domain/transfer/index.js
 *
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { DefaultEventLogger } = require('../../lib/DefaultEventLogger');
const prepare = (headers, message, dataUri) => __awaiter(this, void 0, void 0, function* () {
    Logger.debug('domain::transfer::prepare::start(%s, %s)', headers, message);
    try {
        const kafkaConfig = Utility.getKafkaConfig(Utility.ENUMS.PRODUCER, TRANSFER.toUpperCase(), PREPARE.toUpperCase());
        const messageProtocol = {
            id: message.transferId,
            to: message.payeeFsp,
            from: message.payerFsp,
            type: 'application/json',
            content: {
                headers: headers,
                payload: dataUri
            },
            metadata: {
                event: {
                    id: Uuid(),
                    type: 'prepare',
                    action: 'prepare',
                    createdAt: new Date(),
                    state: {
                        status: 'success',
                        code: 0
                    }
                }
            }
        };
        const topicConfig = Utility.createGeneralTopicConf(TRANSFER, PREPARE, message.transferId);
        Logger.debug(`domain::transfer::prepare::messageProtocol - ${messageProtocol}`);
        Logger.debug(`domain::transfer::prepare::topicConfig - ${topicConfig}`);
        Logger.debug(`domain::transfer::prepare::kafkaConfig - ${kafkaConfig}`);
        yield Kafka.Producer.produceMessage(messageProtocol, topicConfig, kafkaConfig);
        return true;
    }
    catch (err) {
        Logger.error(`domain::transfer::prepare::Kafka error:: ERROR:'${err}'`);
        throw err;
    }
});
prepare({}, { transferId: '1234', payeeFsp: 'DFSP1', payerFsp: 'DFSP2' }, 'http://data.uri.example')
    .then(result => {
    console.log(result);
})
    .catch(error => {
    console.error(error);
});
//# sourceMappingURL=protocol-mesage-example.js.map