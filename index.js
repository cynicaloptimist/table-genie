'use strict';
var Alexa = require('alexa-sdk');
var APP_ID = "amzn1.ask.skill.f35f4e73-39b6-4631-af07-824fecad3215";  // TODO replace with your app ID (OPTIONAL).

var resources = require('resources.js');

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.resources = resources;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const slotOrDefault = (context, slotName, defaultValue) => {
    const slot = context.event.request.intent.slots[slotName];
    if (slot && slot.value) {
        return slot.value;
    }
    return defaultValue;
}

const rollDice = (howMany, dieSize, modifier) => {
    let sum = 0;
    for (let i = 0; i < howMany; i++) {
        sum += Math.ceil(Math.random() * dieSize);
    }
    return sum + modifier;
}

var handlers = {
    'LaunchRequest': () => {
        this.emit('RollDiceIntent');
    },
    'RollDiceIntent': () => {
        const howMany = parseInt(slotOrDefault(this, "HowMany", "1"));
        const dieSize = parseInt(slotOrDefault(this, "DieSize", "6"));
        const modifier = parseInt(slotOrDefault(this, "Modifier", "0"));
        
        const total = rollDice(howMany, dieSize, modifier);

        let output = "";
        if (modifier) {
            const output = this.t("ROLLED_WITH_MODIFIER", howMany, dieSize, modifier, total);
        } else {
            const output = this.t("ROLLED", howMany, dieSize, total);
        }

        this.emit(':tellWithCard', output, this.t("DICE_CARD_TITLE"), output);
    },

    'AMAZON.HelpIntent': () => {
        var speechOutput = this.t("HELP_MESSAGE");
        var reprompt = this.t("HELP_MESSAGE");
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': () => {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'AMAZON.StopIntent': () => {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    }
};