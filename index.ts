'use strict';
import * as Alexa from "ask-sdk";
import { IntentRequest } from "ask-sdk-model";
import * as _ from "lodash";

const APP_ID = "amzn1.ask.skill.f35f4e73-39b6-4631-af07-824fecad3215";

const resources = require("./resources");
import { GetRandomEntryFromRedditTable } from "./reddit";

const slotOrDefault = (input: Alexa.HandlerInput, slotName: string, defaultValue: string): string => {
    const request = input.requestEnvelope.request as IntentRequest;
    const slots = request.intent.slots;
    if (slots === undefined) {
        return defaultValue;
    }
    const slot = slots.slotName;
    if (slot && slot.value && slot.value !== "?") {
        return slot.value;
    }
    return defaultValue;
}

const rollDice = (howMany: number, dieSize: number, modifier: number) => {
    let sum = 0;
    for (let i = 0; i < howMany; i++) {
        sum += _.random(1, dieSize);
    }
    return sum + modifier;
}

const RollDiceIntentHandler: Alexa.RequestHandler = {
    canHandle: (handlerInput) => {
        const requestType = handlerInput.requestEnvelope.request as IntentRequest;
        return _.includes(["LaunchRequest", "RollDiceIntent"], requestType.intent.name);
    },
    handle: (handlerInput) => {
        const howMany = parseInt(slotOrDefault(handlerInput, "HowMany", "1"));
        const dieSize = parseInt(slotOrDefault(handlerInput, "DieSize", "6"));
        const modifier = parseInt(slotOrDefault(handlerInput, "Modifier", "0"));

        const total = rollDice(howMany, dieSize, modifier);

        let output = "";
        if (modifier) {
            output = `I rolled ${howMany} d ${dieSize} plus ${modifier} for a total of ${total}`;
        } else {
            output = `I rolled ${howMany} d ${dieSize} for a total of ${total}`;
        }

        return handlerInput.responseBuilder
            .speak(output)
            .withSimpleCard("Rolled Dice", output)
            .getResponse();
    }
}

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        RollDiceIntentHandler)
    .lambda();

const handlers: any = {
    'LaunchRequest': function () {
        this.emit('RollDiceIntent');
    },

    'RollDiceIntent': function () {
        const howMany = parseInt(slotOrDefault(this, "HowMany", "1"));
        const dieSize = parseInt(slotOrDefault(this, "DieSize", "6"));
        const modifier = parseInt(slotOrDefault(this, "Modifier", "0"));

        const total = rollDice(howMany, dieSize, modifier);

        let output = "";
        if (modifier) {
            output = this.t("ROLLED_WITH_MODIFIER", howMany, dieSize, modifier, total);
        } else {
            output = this.t("ROLLED", howMany, dieSize, total);
        }

        this.emit(':tellWithCard', output, this.t("DICE_CARD_TITLE"), output);
    },

    'NameIntent': function () {
        const namesByRace = this.t("NAMES");
        let race = slotOrDefault(this, "Race", "?").toUpperCase();
        let output = "";

        if (!namesByRace[race]) {
            output += this.t("RACE_NOT_FOUND", race);
            race = "HUMAN";
        }

        const names = _.shuffle(namesByRace[race]);

        const name = names[0];

        output += this.t("SUGGEST_NAME", race, name);
        this.emit(':tellWithCard', output, this.t("NAME_CARD_TITLE"), output);
    },

    'SearchForTableIntent': function () {
        const searchTerm = slotOrDefault(this, "SearchTerm", "");
        if (!searchTerm.length) {
            this.emit('RollDiceIntent');
        }

        GetRandomEntryFromRedditTable(searchTerm)
            .then(result => {
                if (result === undefined) {
                    return;
                }

                const allRolls = result.rollResults.map(r => `${r.rollPrompt}:\n${r.rollResult}`).join(`\n\n`);
                this.emit(':tellWithCard',
                    this.t("ROLLED_ON_TABLE_SPEECH", result.postTitle, allRolls),
                    result.postTitle,
                    this.t("ROLLED_ON_TABLE_CARD", result.postUrl, allRolls)
                );
            });

    },

    'WishIntent': function () {
        this.emit(":tell", this.t("WISH_JOKE"));
    },

    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t("HELP_MESSAGE");
        const reprompt = this.t("HELP_MESSAGE");
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    }
};