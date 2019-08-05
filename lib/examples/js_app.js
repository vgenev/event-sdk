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
 - Valentin Genev <valentin.genev@modusbox.com>

 --------------
 ******/
/**
 * Example showing how to use Tracer from JavaScript
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
const { Tracer } = require('../../lib/index');
const { DefaultLoggerRecorder } = require('../../lib/index');
function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
const event = {
    from: 'noresponsepayeefsp',
    to: 'payerfsp',
    id: 'aa398930-f210-4dcd-8af0-7c769cea1660',
    content: {
        headers: {
            'content-type': 'application/vnd.interoperability.transfers+json;version=1.0',
            date: '2019-05-28T16:34:41.000Z',
            'fspiop-source': 'noresponsepayeefsp',
            'fspiop-destination': 'payerfsp',
            priority: 100,
            blocking: false
        },
        payload: 'data:application/vnd.interoperability.transfers+json;version=1.0;base64,ewogICJmdWxmaWxtZW50IjogIlVObEo5OGhaVFlfZHN3MGNBcXc0aV9VTjN2NHV0dDdDWkZCNHlmTGJWRkEiLAogICJjb21wbGV0ZWRUaW1lc3RhbXAiOiAiMjAxOS0wNS0yOVQyMzoxODozMi44NTZaIiwKICAidHJhbnNmZXJTdGF0ZSI6ICJDT01NSVRURUQiCn0'
    },
    type: 'application/json'
};
const main = () => __awaiter(this, void 0, void 0, function* () {
    // Creates a new parent span for given service
    // this sets new traceId and new spanId.
    let parentSpan = Tracer.createSpan('parent service');
    // Logs message with logging level info from the parent span
    yield parentSpan.info(event);
    yield parentSpan.warning('event');
    yield parentSpan.error('event');
    yield parentSpan.debug('message');
    yield parentSpan.verbose('message');
    yield parentSpan.performance('message');
    yield parentSpan.audit('message');
    // Logs message with logging level debug from the parent span
    yield parentSpan.debug('this is debug log');
    // Creates child span from the parent span with new service name.
    // The traceId remains the same. The spanId is new and the parentSpanId is the spanId of the parent.
    let IIChildSpan = parentSpan.getChild('child II service');
    // Creates audit event message
    yield IIChildSpan.audit({ content: event });
    // Set tags to the span
    IIChildSpan.setTags({ one: 'two' });
    // Creates error log event from the IIChildSpan
    yield IIChildSpan.error({ content: { message: 'error appeared' } });
    // Creates audit event message
    yield parentSpan.audit(event);
    // Finish the span. This also sends the trace context to the tracing platform. All further operations are forbidden after the span is finished.
    // await parentSpan.finish(event)
    // Injects trace context to a message carrier. When the trace is carried across few services, the trace context can be injects in the carrier that transports the data.
    let messageWithContext = yield IIChildSpan.injectContextToMessage(event);
    // await sleep(2000)
    // Extracts trace context from message carrier. When the message is received from different service, the trace context is extracted by that method.
    let contextFromMessage = Tracer.extractContextFromMessage(messageWithContext);
    // Creates child span from extracted trace context.
    let IIIChild = Tracer.createChildSpanFromContext('child III service', contextFromMessage, { defaultRecorder: new DefaultLoggerRecorder() });
    yield sleep(500);
    IIChildSpan.finish();
    IIIChild.finish();
    yield sleep(1000);
});
main();
//# sourceMappingURL=js_app.js.map