const { BedrockRuntimeClient, ConverseStreamCommand } = require('@aws-sdk/client-bedrock-runtime');

const client = new BedrockRuntimeClient({ region: 'ap-southeast-2' });

exports.handler = async (event) => {
    console.log('=== LEX NOVA SONIC INTEGRATION START ===');
    console.log('Full Lex Event:', JSON.stringify(event, null, 2));
    
    try {
        // Extract user input from Lex event
        const userInput = event.inputTranscript || event.currentIntent?.slots?.UserInput || 'Hello';
        console.log('User input:', userInput);
        
        // Prepare Nova Sonic request
        const request = {
            modelId: 'amazon.nova-sonic-v1:0',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            text: userInput
                        }
                    ]
                }
            ],
            system: [
                {
                    text: 'You are a helpful AI assistant. Keep responses conversational and under 100 words.'
                }
            ],
            inferenceConfig: {
                maxTokens: 200,
                temperature: 0.7
            }
        };
        
        console.log('Sending request to Nova Sonic...');
        const command = new ConverseStreamCommand(request);
        const response = await client.send(command);
        
        let aiResponse = '';
        for await (const chunk of response.stream) {
            if (chunk.contentBlockDelta?.delta?.text) {
                aiResponse += chunk.contentBlockDelta.delta.text;
            }
        }
        
        console.log('Nova Sonic response:', aiResponse);
        
        // Return Lex response format
        return {
            sessionAttributes: event.sessionAttributes || {},
            dialogAction: {
                type: 'Close',
                fulfillmentState: 'Fulfilled',
                message: {
                    contentType: 'PlainText',
                    content: aiResponse || 'I understand. How else can I help you?'
                }
            }
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            sessionAttributes: event.sessionAttributes || {},
            dialogAction: {
                type: 'Close',
                fulfillmentState: 'Failed',
                message: {
                    contentType: 'PlainText',
                    content: 'Sorry, I encountered an error. Please try again.'
                }
            }
        };
    }
};