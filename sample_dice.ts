module.exports = {
  "session": {
    "new": false,
    "sessionId": "amzn1.echo-api.session.[unique-value-here]",
    "attributes": {},
    "user": {
      "userId": "amzn1.ask.account.[unique-value-here]"
    },
    "application": {
      "applicationId": "amzn1.ask.skill.f35f4e73-39b6-4631-af07-824fecad3215"
    }
  },
  "version": "1.0",
  "request": {
    "locale": "en-US",
    "timestamp": "2016-10-27T21:06:28Z",
    "type": "IntentRequest",
    "requestId": "amzn1.echo-api.request.[unique-value-here]",
    "intent": {
      "slots": {
        "HowMany": {
          "name": "HowMany",
          "value": "1"
        },
        "DieSize": {
          "name": "DieSize",
          "value": "6"
        },
        "Modifier": {
          "name": "Modifier",
          "value": "2"
        }
      },
      "name": "RollDiceIntent"
    }
  },
  "context": {
    "AudioPlayer": {
      "playerActivity": "IDLE"
    },
    "System": {
      "device": {
        "supportedInterfaces": {
          "AudioPlayer": {}
        }
      },
      "application": {
        "applicationId": "amzn1.ask.skill.f35f4e73-39b6-4631-af07-824fecad3215"
      },
      "user": {
        "userId": "amzn1.ask.account.[unique-value-here]"
      }
    }
  }
}