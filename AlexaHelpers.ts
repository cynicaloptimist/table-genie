import * as Alexa from "ask-sdk";
import { Request, IntentRequest } from "ask-sdk-model";
import _ = require("lodash");

export const slotOrDefault = (input: Alexa.HandlerInput, slotName: string, defaultValue: string): string => {
    const slotValue = _.get(input, `requestEnvelope.request.intent.slots.${slotName}.value`, defaultValue);
    if (slotValue === "?") {
        return defaultValue;
    }
    return slotValue;
}

function isIntentRequest(request: Request): request is IntentRequest {
    return request.type === "IntentRequest";
}

export const inputRequestIsOfType = (handlerInput: Alexa.HandlerInput, intentTypes: string[]) => {
    const request = handlerInput.requestEnvelope.request;
    if (_.includes(intentTypes, request.type)) {
        return true;
    }

    if (!isIntentRequest(request)) {
        return false;
    }

    return _.includes(intentTypes, request.intent.name);
}
