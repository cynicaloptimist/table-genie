'use strict';
const Alexa = require('alexa-sdk');
const _ = require('lodash');
const APP_ID = "amzn1.ask.skill.f35f4e73-39b6-4631-af07-824fecad3215";  // TODO replace with your app ID (OPTIONAL).

const resources = require('./resources.js');

exports.handler = function(event, context, callback) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.resources = resources;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const slotOrDefault = (context, slotName, defaultValue) => {
    const slot = context.event.request.intent.slots[slotName];
    if (slot && slot.value && slot.value !== "?") {
        return slot.value;
    }
    return defaultValue;
}

const rollDice = (howMany, dieSize, modifier) => {
    let sum = 0;
    for (let i = 0; i < howMany; i++) {
        sum += _.random(1, dieSize);
    }
    return sum + modifier;
}

const handlers = {
    'LaunchRequest': function() {
        this.emit('RollDiceIntent');
    },

    'RollDiceIntent': function() {
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
        //console.log(namesByRace);
        const race = slotOrDefault(this, "Race", "human").toUpperCase();
        //console.log(race);

        let names = [""];
        if (namesByRace[race]) {
            names = _(namesByRace[race]).shuffle().value();
        }
        else {
            names = _(namesByRace["HUMAN"]).shuffle().value();
        }
        //console.log(names);

        const name = names[0];

        const output = this.t("SUGGEST_NAME", name);
        this.emit(':tellWithCard', output, this.t("NAME_CARD_TITLE"), output);
    },

    'AMAZON.HelpIntent': function() {
        const speechOutput = this.t("HELP_MESSAGE");
        const reprompt = this.t("HELP_MESSAGE");
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function() {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'AMAZON.StopIntent': function() {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    }
};