#!/bin/bash

# Create Lex V1 bot for Amazon Connect compatibility
echo "Creating Lex V1 bot NovaAssistant..."

# Create intent
aws lex-models put-intent \
  --name "CatchAllIntent" \
  --description "Catches all user input" \
  --sample-utterances "help me" "hello" "what can you do" "I need assistance" \
  --fulfillment-activity '{"type": "ReturnIntent"}' \
  --region ap-southeast-2

echo "Waiting for intent creation..."
sleep 5

# Create bot
aws lex-models put-bot \
  --name "NovaAssistant" \
  --description "AI Assistant bot for Amazon Connect" \
  --intents '[{"intentName": "CatchAllIntent", "intentVersion": "$LATEST"}]' \
  --data-privacy '{"childDirected": false}' \
  --idle-session-ttl-in-seconds 300 \
  --voice-id "Joanna" \
  --locale "en-US" \
  --clarification-prompt '{"messages": [{"contentType": "PlainText", "content": "Sorry, can you please repeat that?"}], "maxAttempts": 2}' \
  --abort-statement '{"messages": [{"contentType": "PlainText", "content": "Sorry, I could not understand. Goodbye."}]}' \
  --region ap-southeast-2

echo "Building bot..."
aws lex-models put-bot \
  --name "NovaAssistant" \
  --description "AI Assistant bot for Amazon Connect" \
  --intents '[{"intentName": "CatchAllIntent", "intentVersion": "$LATEST"}]' \
  --data-privacy '{"childDirected": false}' \
  --idle-session-ttl-in-seconds 300 \
  --voice-id "Joanna" \
  --locale "en-US" \
  --clarification-prompt '{"messages": [{"contentType": "PlainText", "content": "Sorry, can you please repeat that?"}], "maxAttempts": 2}' \
  --abort-statement '{"messages": [{"contentType": "PlainText", "content": "Sorry, I could not understand. Goodbye."}]}' \
  --process-behavior "BUILD" \
  --region ap-southeast-2

echo "Lex V1 bot creation complete."