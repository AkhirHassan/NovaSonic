#!/bin/bash

# Create Lex V2 bot for Nova Assistant
echo "Creating Lex bot NovaAssistant..."

# Create the bot
aws lexv2-models create-bot \
  --bot-name "NovaAssistant" \
  --description "AI Assistant bot for Amazon Connect integration" \
  --role-arn "arn:aws:iam::207529100869:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots_LEXV2ROLE" \
  --data-privacy '{"childDirected": false}' \
  --idle-session-ttl-in-seconds 300 \
  --region ap-southeast-2

# Wait for bot creation
echo "Waiting for bot to be created..."
sleep 10

# Get bot ID
BOT_ID=$(aws lexv2-models list-bots --region ap-southeast-2 --query "botSummaries[?botName=='NovaAssistant'].botId" --output text)
echo "Bot ID: $BOT_ID"

# Create bot locale
aws lexv2-models create-bot-locale \
  --bot-id $BOT_ID \
  --bot-version "DRAFT" \
  --locale-id "en_US" \
  --description "English US locale" \
  --nlu-intent-confidence-threshold 0.40 \
  --voice-settings '{"voiceId": "Joanna"}' \
  --region ap-southeast-2

echo "Waiting for locale creation..."
sleep 10

# Create catch-all intent
aws lexv2-models create-intent \
  --bot-id $BOT_ID \
  --bot-version "DRAFT" \
  --locale-id "en_US" \
  --intent-name "CatchAllIntent" \
  --description "Catches all user input" \
  --sample-utterances '[
    {"utterance": "help me"},
    {"utterance": "hello"},
    {"utterance": "what can you do"},
    {"utterance": "I need assistance"},
    {"utterance": "{UserInput}"}
  ]' \
  --region ap-southeast-2

echo "Building bot..."
aws lexv2-models build-bot-locale \
  --bot-id $BOT_ID \
  --bot-version "DRAFT" \
  --locale-id "en_US" \
  --region ap-southeast-2

echo "Bot creation complete. Bot ID: $BOT_ID"
echo "Please wait 2-3 minutes for the bot to finish building before testing."