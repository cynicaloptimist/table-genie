'use strict';
var Alexa = require('alexa-sdk');
var APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

var languageStrings = {
    "en": {
        "translation": {
            "NAMES": {
                "HUMAN": [
                    "Gregorr"
                ],
                "ELF": [
                    "Ellumyr"
                ],
                "DWARF": [
                    "Shem"
                ],
                "HALFLING": [
                    "Underfoot"
                ],
            },
            "LOOT": [
                "A rusty nail",
                "A tear stained handkerchief"
            ],
            "ROLLED": "I rolled %s",
            "SKILL_NAME" : "Roll Me",
            "HELP_MESSAGE" : "You can say roll me one d six plus one, or, you can say roll me an elf name, or roll me some loot. What would you like?",
            "HELP_REPROMPT" : "What would you like me to roll you?",
            "STOP_MESSAGE" : "Goodbye!"
        }
    }
};

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const rollDice = function (howMany, dieSize, modifier) {
    let sum = 0;
    for (let i = 0; i < howMany; i++) {
        sum += Math.ceil(Math.random() * dieSize);
    }
    return sum + modifier;
}

var handlers = {
    'LaunchRequest': function () {
        this.emit('RollDiceIntent');
    },
    'RollDiceIntent': function () {
        var slots = this.event.request.intent.slots;
        var total = rollDice(slots.HowMany || 1, slots.DieSize || 6, slots.Modifier || 0);
        this.emit(':tell', this.t("ROLLED", total))
    },

    'AMAZON.HelpIntent': function () {
        var speechOutput = this.t("HELP_MESSAGE");
        var reprompt = this.t("HELP_MESSAGE");
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    }
};