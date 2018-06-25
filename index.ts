'use strict';
import * as Alexa from "ask-sdk";
import { Request, IntentRequest, Response } from "ask-sdk-model";
import * as _ from "lodash";

const APP_ID = "amzn1.ask.skill.f35f4e73-39b6-4631-af07-824fecad3215";

import { GetRandomEntryFromRedditTable } from "./reddit";
import { AlexaForBusiness } from "aws-sdk";

const slotOrDefault = (input: Alexa.HandlerInput, slotName: string, defaultValue: string): string => {
    const slotValue = _.get(input, `requestEnvelope.request.intent.slots.${slotName}.value`, defaultValue);
    if(slotValue === "?") {
        return defaultValue;
    }
    return slotValue;    
}

const rollDice = (howMany: number, dieSize: number, modifier: number) => {
    let sum = 0;
    for (let i = 0; i < howMany; i++) {
        sum += _.random(1, dieSize);
    }
    return sum + modifier;
}

function isIntentRequest(request: Request): request is IntentRequest {
    return request.type === "IntentRequest";
}

const inputRequestIsOfType = (handlerInput: Alexa.HandlerInput, intentTypes: string[]) => {
    const request = handlerInput.requestEnvelope.request;
    if(_.includes(intentTypes, request.type)){
        return true;
    }
    
    if(!isIntentRequest(request)) {
        return false;
    }

    return _.includes(intentTypes, request.intent.name);
}

const RollDiceIntentHandler: Alexa.RequestHandler = {
    canHandle: (handlerInput) => {
        return inputRequestIsOfType(handlerInput, ["LaunchRequest", "RollDiceIntent"]);
    },
    handle: (handlerInput) => {
        const howMany = parseInt(slotOrDefault(handlerInput, "HowMany", "1"));
        const dieSize = parseInt(slotOrDefault(handlerInput, "DieSize", "6"));
        const modifier = parseInt(slotOrDefault(handlerInput, "Modifier", "0"));

        const total = rollDice(howMany, dieSize, modifier);

        let modifierPhrase = "";
        if (modifier > 0) {
            modifierPhrase = `plus ${modifier}`;
        }
        if (modifier < 0) {
            modifierPhrase = `minus ${-modifier}`;
        }
        const output = `I rolled ${howMany} d ${dieSize} ${modifierPhrase} for a total of ${total}`;

        return handlerInput.responseBuilder
            .speak(output)
            .withSimpleCard("Rolled Dice", output)
            .getResponse();
    }
}

const SearchForTableIntentHandler: Alexa.RequestHandler = {
    canHandle: (handlerInput) => {
        return inputRequestIsOfType(handlerInput, ["SearchForTableIntent"]);
    },
    handle: (handlerInput) => {
        const searchTerm = slotOrDefault(handlerInput, "SearchTerm", "");

        const entry = GetRandomEntryFromRedditTable(searchTerm)
            .then(result => {
                if (result === undefined) {
                    return;
                }

                const allRolls = result.rollResults.map(r => `${r.rollPrompt}:\n${r.rollResult}`).join(`\n\n`);

                return handlerInput.responseBuilder
                    .speak(`I rolled from ${result.postTitle} and got ${allRolls}`)
                    .withSimpleCard(result.postTitle, `Post URL: ${result.postUrl}\n\n${allRolls}`)
                    .getResponse();
            }) as Promise<Response>;

        return entry;
    }
}

const WishIntentHandler: Alexa.RequestHandler = {
    canHandle: (handlerInput) => {
        return inputRequestIsOfType(handlerInput, ["WishIntent"]);
    },
    handle: (handlerInput) => {
        return handlerInput.responseBuilder
            .speak(`I'm not <emphasis level="strong">that</emphasis> kind of genie!`)
            .getResponse();
    }
}

const HelpIntentHandler: Alexa.RequestHandler = {
    canHandle: (handlerInput) => {
        return inputRequestIsOfType(handlerInput, ["AMAZON.HelpIntent"]);
    },
    handle: (handlerInput) => {
        return handlerInput.responseBuilder
            .speak("You can say roll me one d six plus one, or, you can ask for something random, like a random quest or a random potion. What would you like?")
            .getResponse();
    }
}

const StopIntentHandler: Alexa.RequestHandler = {
    canHandle: (handlerInput) => {
        return inputRequestIsOfType(handlerInput, ["AMAZON.CancelIntent", "AMAZON.StopIntent"]);
    },
    handle: (handlerInput) => {
        return handlerInput.responseBuilder
            .speak("Goodbye!")
            .getResponse();
    }
}

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        RollDiceIntentHandler,
        SearchForTableIntentHandler,
        WishIntentHandler,
        HelpIntentHandler,
        StopIntentHandler)
    .lambda();
