'use strict';
import * as Alexa from "ask-sdk";
import * as _ from "lodash";

const APP_ID = "amzn1.ask.skill.f35f4e73-39b6-4631-af07-824fecad3215";

import { GetRedditTableFromSearchTerm, GenerateRollResultsFromPost, RedditPost, RollResult } from "./reddit";
import { inputRequestIsOfType, slotOrDefault } from "./AlexaHelpers";

interface SessionAttributes {
    lastPost: RedditPost;
    lastResult: RollResult[];
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
        return inputRequestIsOfType(handlerInput, ["RollDiceIntent"]);
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

function RollOnTable(table: RedditPost, handlerInput: Alexa.HandlerInput) {
    const rollableHtml = _.unescape(table.selftext_html);
    const rollResults = GenerateRollResultsFromPost(rollableHtml);
    const session: SessionAttributes = {
        lastPost: table,
        lastResult: rollResults
    };
    handlerInput.attributesManager.setSessionAttributes(session);
    const allRolls = rollResults.map(r => `${r.rollPrompt}:\n${r.rollResult}`).join(`\n\n`);
    console.log("Post title: " + table.title);
    console.log("Post url: " + table.url);
    return handlerInput.responseBuilder
        .speak(`I rolled from ${table.title} and got ${allRolls}`)
        .withSimpleCard(table.title, `Post URL: ${table.url}\n\n${allRolls}`)
        .speak("Would you to roll another?")
        .reprompt(`Would you like to roll another entry from ${table.title}?`)
        .getResponse();
}

const SearchForTableIntentHandler: Alexa.RequestHandler = {
    canHandle: (handlerInput) => {
        return inputRequestIsOfType(handlerInput, ["SearchForTableIntent"]);
    },
    handle: async (handlerInput) => {
        const searchTerm = slotOrDefault(handlerInput, "SearchTerm", "");

        console.log("Search Term: " + searchTerm);

        const table = await GetRedditTableFromSearchTerm(searchTerm);
        if (table === undefined) {
            return handlerInput.responseBuilder
                .speak(`There was a problem rolling on a table for ${searchTerm}.`)
                .getResponse();
        }

        return RollOnTable(table, handlerInput);
    }
}

const RerollOnTableIntentHandler: Alexa.RequestHandler = {
    canHandle: (handlerInput) => inputRequestIsOfType(handlerInput, ["AMAZON.YesIntent"]),
    handle: (handlerInput) => {
        const session = handlerInput.attributesManager.getSessionAttributes() as SessionAttributes;
        if (!(session && session.lastPost)) {
            return handlerInput.responseBuilder.speak("Couldn't read session.").getResponse();
        }

        return RollOnTable(session.lastPost, handlerInput);

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
        return inputRequestIsOfType(handlerInput, ["LaunchRequest", "AMAZON.HelpIntent"]);
    },
    handle: (handlerInput) => {
        return handlerInput.responseBuilder
            .speak("Welcome to Table Genie! I can roll on a table to generate random content for fantasy RPGs, like a village quest or a mysterious potion. Try saying, Ask Table Genie for a random trinket.")
            .getResponse();
    }
}

const StopIntentHandler: Alexa.RequestHandler = {
    canHandle: (handlerInput) => {
        return inputRequestIsOfType(handlerInput, ["SessionEndedRequest", "AMAZON.CancelIntent", "AMAZON.StopIntent",]);
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
        RerollOnTableIntentHandler,
        WishIntentHandler,
        HelpIntentHandler,
        StopIntentHandler)
    .lambda();
