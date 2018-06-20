'use strict';
import * as Alexa from "alexa-sdk";
import * as _ from "lodash";

const APP_ID = "amzn1.ask.skill.f35f4e73-39b6-4631-af07-824fecad3215";

import * as resources from "./resources";
import { GetRandomEntryFromRedditTable } from "./reddit";

export default {
    handler: function (event: Alexa.RequestBody<Alexa.Request>, context: Alexa.Context, callback: () => void) {
        const alexa = Alexa.handler(event, context);
        alexa.appId = APP_ID;
        alexa.resources = resources;
        alexa.registerHandlers(handlers);
        alexa.execute();
    }
};

const slotOrDefault = (context: any, slotName: string, defaultValue: string): string => {
    const slot = context.event.request.intent.slots[slotName];
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

        const names = _(namesByRace[race]).shuffle().value();

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
                this.emit(':tell', `I rolled on a table of random ${searchTerm} and got this: ${result}`)
            });

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